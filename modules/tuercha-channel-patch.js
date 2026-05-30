"use strict";
/**
 * TUERCHA 公益站渠道补丁
 *
 * 背景：NovelAI 模式原本只有 official(官方) 与 proxy(第三方代理) 两个渠道，二者都走 NovelAI 原生
 * 请求格式。TUERCHA 是 NewAPI / OpenAI 兼容网关，请求/响应格式与前两者完全不同：
 *   - 端点 POST {base}/v1/chat/completions，鉴权 Authorization: Bearer KEY
 *   - 绘图参数序列化为字符串放进 messages[0].content，外层 model 为权威模型名
 *   - 响应在 choices[0].message.content 中以 markdown data URI 形式返回图片
 *
 * 由于 modules/image-gen.js 是混淆产物无法安全直接编辑，本补丁以"原型包装"方式介入：
 * 只在 settings.nai.channel === "tuercha" 时接管 generateWithNAI，其余渠道原样委托原方法，
 * 因此对 official / proxy / SD / ComfyUI / Other 等既有流程零影响。
 *
 * 本文件同时导出若干纯函数（buildTuerchaDrawParams / parseTuerchaResponse / 各校验函数），
 * 它们不依赖 DOM 与实例状态，便于独立单元测试。
 */

import { ImageGenerator } from "./image-gen.js";
import { MultiCharacterParser } from "./multi-character-parser.js";
import { buildTuerchaDrawParams, parseTuerchaResponse } from "./tuercha-draw-params.js";

/**
 * 规范化 TUERCHA base URL：去尾斜杠；以 /chat/completions 结尾原样；以 /v1 结尾补 /chat/completions；
 * 否则补 /v1/chat/completions。空值直接抛错（fail-fast）。
 * @param {string} rawUrl 用户在「API 地址 (URL)」填写的 base URL
 * @returns {string} 最终请求 URL
 */
function resolveTuerchaUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error("TUERCHA 渠道需要在「API 地址 (URL)」填写 NewAPI base URL");
  }
  const url = rawUrl.trim().replace(/\/+$/, "");
  if (url.endsWith("/chat/completions")) return url;
  if (url.endsWith("/v1")) return url + "/chat/completions";
  return url + "/v1/chat/completions";
}

/**
 * 在 ImageGenerator 实例上执行 TUERCHA 生成。
 * 复用实例已有 helper 完成提示词构建 / 触发词覆盖 / 图像转 base64，
 * 仅实现 TUERCHA 专属的 drawParams 映射、请求发送与响应解析。
 * 签名与原 generateWithNAI(positivePrompt, negativePrompt, options) 保持一致。
 * @this {ImageGenerator}
 */
async function generateWithTuercha(positivePrompt, negativePrompt, options = {}) {
  const ctx = this.ctx;
  let nai = this.settings.nai;
  const { skipPresets } = options;

  // 1) 复刻原 generateWithNAI 前置：触发词处理（与原方法同源，保证提示词一致）
  const triggerProcessor = ctx.getModule("triggerProcessor");
  if (triggerProcessor) {
    positivePrompt = await triggerProcessor.processTriggers(positivePrompt);
    if (negativePrompt) negativePrompt = await triggerProcessor.processTriggers(negativePrompt);
  }
  nai = await this._applyNaiTriggerOverrides(positivePrompt, nai);

  // 2) i2i / inpaint 状态来源与原方法一致：来自 options
  const { i2iEnabled, i2iImage, i2iMask, naiI2iStrength, naiI2iNoise, naiInpaintStrength, customParams } = options;
  if (naiI2iStrength !== undefined) nai.i2iStrength = naiI2iStrength;
  if (naiI2iNoise !== undefined) nai.i2iNoise = naiI2iNoise;
  if (naiInpaintStrength !== undefined) nai.inpaintStrength = naiInpaintStrength;
  const isImg2Img = i2iEnabled && i2iImage;
  const isInpaint = isImg2Img && i2iMask;

  // 3) 构建最终正负提示词（复用实例方法）
  let finalPositive = await this._buildPositivePrompt(positivePrompt, skipPresets);
  let finalNegative = await this._buildNegativePrompt(negativePrompt, skipPresets);

  // 4) 多角色解析：仅在开启多角色且命中语法时构建 characters[]
  let characters = null;
  const multiOn = nai.multiRoleEnabled === true && MultiCharacterParser.isMultiCharacterPrompt(positivePrompt);
  if (multiOn) {
    const scene = MultiCharacterParser.parseScene(positivePrompt);
    const sceneComposition = scene["Scene Composition"] || "";
    if (sceneComposition) {
      finalPositive = await this._buildPositivePrompt(sceneComposition, skipPresets);
    }
    characters = [];
    for (let i = 1; i <= 4; i++) {
      const cp = scene["Character " + i + " Prompt"];
      if (!cp) continue;
      characters.push({
        prompt: cp,
        negativePrompt: scene["Character " + i + " UC"] || "",
        position: (scene["Character " + i + " centers"] || "").toUpperCase()
      });
    }
    if (characters.length === 0) characters = null;
  } else if (nai.multiRoleEnabled === false && MultiCharacterParser.isMultiCharacterPrompt(positivePrompt)) {
    // 未开多角色但有语法：平铺为普通 tags（与原方法行为一致）
    finalPositive = await this._buildPositivePrompt(MultiCharacterParser.flattenMultiCharacterPrompt(positivePrompt), skipPresets);
  }

  // 5) seed / size / model 解析（与原方法同源优先级：customParams > 设置 > 默认）
  const randomSeed = Math.floor(Math.random() * 10000000000);
  let seed;
  if (customParams?.seed !== undefined && customParams?.seed !== -1) seed = Number(customParams.seed);
  else seed = nai.seed === -1 ? randomSeed : Number(nai.seed);
  const width = Number(options.buttonEl?.dataset?.width) || Number(customParams?.width) || Number(nai.width) || 832;
  const height = Number(options.buttonEl?.dataset?.height) || Number(customParams?.height) || Number(nai.height) || 1216;
  const model = customParams?.model || nai.model || "nai-diffusion-3";

  // 6) 组装纯映射源
  const src = {
    prompt: finalPositive,
    negativePrompt: finalNegative,
    width, height, seed, model,
    steps: customParams?.steps || nai.steps,
    scale: customParams?.scale || nai.scale,
    sampler: customParams?.sampler || nai.sampler,
    noiseSchedule: customParams?.noiseSchedule || nai.noiseSchedule,
    variety: nai.variety === true,
    cfgRescale: nai.cfgRescale,
    useCoords: nai.useCoords === true,
    characters
  };

  // i2i / inpaint（base64 由实例 _extractBase64 提取）
  if (isInpaint) {
    src.inpaint = {
      image: this._extractBase64(i2iImage),
      mask: this._extractBase64(i2iMask),
      strength: Number(nai.inpaintStrength ?? 1)
    };
  } else if (isImg2Img) {
    src.i2i = {
      image: this._extractBase64(i2iImage),
      strength: Number(nai.i2iStrength ?? 0.7),
      noise: Number(nai.i2iNoise ?? 0)
    };
  }

  // 参考图：vibe -> controlnet；director -> character_references（单值 referenceMode 天然保证互斥）
  if (nai.vibeEnabled && nai.vibeImages?.length > 0) {
    if (nai.referenceMode === "director") {
      const first = nai.vibeImages[0];
      const raw = first.image || first.base64 || "";
      const dataUrl = await this._resolveImageToDataURL(raw);
      if (dataUrl) {
        const processed = await this._processDirectorImage(dataUrl);
        src.characterRef = {
          image: this._extractBase64(processed),
          type: first.mode || "character",
          fidelity: 1,
          strength: first.strength ?? 1
        };
      }
    } else {
      const images = [];
      for (const v of nai.vibeImages) {
        if (v.type === "vibeFile") continue; // TUERCHA 用原图，不支持 .naiv4vibe 编码
        const raw = v.image || v.base64 || "";
        const dataUrl = await this._resolveImageToDataURL(raw);
        if (dataUrl) {
          images.push({
            image: this._extractBase64(dataUrl),
            info_extracted: v.infoExtracted ?? 1,
            strength: v.strength ?? 0.6
          });
        }
      }
      if (images.length > 0) src.controlnet = images;
    }
  }

  // 7) 纯映射 -> drawParams（含全部校验，失败 fail-fast）
  const drawParams = buildTuerchaDrawParams(src);

  // 8) 组装 NewAPI 外层 body 并发送
  const url = resolveTuerchaUrl(nai.proxyUrl);
  if (!nai.apiKey) {
    throw new Error("TUERCHA 渠道需要在「密钥 (Key)」填写 API Key");
  }
  const body = {
    model,
    messages: [{ role: "user", content: JSON.stringify(drawParams) }],
    stream: false,
    max_tokens: 100000
  };
  ctx.log("image-gen", "TUERCHA 请求: URL=" + url + ", model=" + model);

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + nai.apiKey },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error("TUERCHA API 错误 (" + resp.status + "): " + errText);
  }
  const json = await resp.json();
  const parsed = parseTuerchaResponse(json);
  ctx.log("image-gen", "TUERCHA 出图成功, seeds=" + JSON.stringify(parsed.seeds));
  // 返回契约必须与原 generateWithNAI 一致：调用方读取 result.imageUrl，返回裸字符串会导致酒馆收不到图
  return {
    success: true,
    imageUrl: parsed.dataUrl,
    finalPositive: src.prompt,
    finalNegative: src.negativePrompt
  };
}

// —— 原型包装：仅 tuercha 渠道接管，其余委托原方法 ——
if (ImageGenerator && ImageGenerator.prototype && !ImageGenerator.prototype.__tuerchaPatched) {
  const _originalGenerateWithNAI = ImageGenerator.prototype.generateWithNAI;
  ImageGenerator.prototype.generateWithNAI = async function (...args) {
    // 仅当当前 NAI 渠道为 tuercha 时介入，其余渠道（official/proxy）完全走原始已运行代码
    const channel = this?.settings?.nai?.channel;
    if (channel !== "tuercha") {
      return _originalGenerateWithNAI.apply(this, args);
    }
    return generateWithTuercha.apply(this, args);
  };
  ImageGenerator.prototype.__tuerchaPatched = true;
}
