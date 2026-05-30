"use strict";
/**
 * TUERCHA 公益站渠道 —— 纯逻辑层（无 DOM / 无实例依赖，可独立单元测试）
 *
 * 仅负责：内部状态 -> TUERCHA(NewAPI) 内层 drawParams 的映射、参数校验、响应解析。
 * 网络请求与实例 helper 编排放在 tuercha-channel-patch.js。
 *
 * 文档依据：API接入文档-20260527.md（§5~§13、§20）。
 */

// TUERCHA 文档允许的采样器（§9）
export const TUERCHA_SAMPLERS = ["k_euler", "k_euler_ancestral", "k_dpm_2", "k_dpm_2_ancestral", "k_dpmpp_2m", "k_dpmpp_2s_ancestral", "k_dpmpp_sde", "ddim"];
// TUERCHA 文档允许的 noise schedule（§9）
export const TUERCHA_NOISE_SCHEDULES = ["karras", "exponential", "polyexponential"];
// 角色坐标格式 [A-E][1-5]（§7.2）
const POSITION_RE = /^[A-E][1-5]$/;
// CJK 与全角符号检测（§8）：中文/日文假名/韩文/全角符号
const CJK_RE = /[\u3000-\u303F\u3040-\u30FF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uFF00-\uFFEF]/;
// 响应解析正则（§13）
const IMG_RE = /!\[[^\]]*\]\((data:image\/[^;)]+;base64,[^)]+)\)/;
const SEED_RE = /<!--\s*seeds:(\[.*?\])\s*-->/;
const VIBE_CACHE_RE = /<!--\s*vibe_cache_ids:(\[.*?\])\s*-->/;

/**
 * 断言提示词不含 CJK / 全角符号，否则抛错（fail-fast，§8）。
 * @param {string} text 待校验文本
 * @param {string} field 出错时提示的字段名
 */
export function assertNoCJK(text, field) {
  // 空值无需校验，直接放行；真实非法字符必须暴露而非静默清洗
  if (text && CJK_RE.test(text)) {
    throw new Error("TUERCHA 渠道要求 " + field + " 必须为英文，不能包含中文/日文/韩文/全角符号");
  }
}

/**
 * 校验尺寸：必须为正整数、64 的倍数，且不超过 TUERCHA 上限（§6）。
 * 上限：竖图 [832,1216]、横图 [1216,832]、方图 [1024,1024]，统一约束为 W≤1216 且 H≤1216 且 W*H≤832*1216 的等价硬边界。
 * 这里按文档直接逐条硬判，非法即抛错（fail-fast），不做静默裁剪。
 * @param {number} width
 * @param {number} height
 * @returns {[number, number]}
 */
export function validateSize(width, height) {
  const w = Number(width);
  const h = Number(height);
  // 必须是正整数
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) {
    throw new Error("TUERCHA size 必须为正整数数组 [宽, 高]，当前为 [" + width + ", " + height + "]");
  }
  // 必须是 64 的倍数
  if (w % 64 !== 0 || h % 64 !== 0) {
    throw new Error("TUERCHA size 的宽高必须是 64 的倍数，当前为 [" + w + ", " + h + "]");
  }
  // 按文档三类上限逐条判定：竖图/横图/方图
  const isPortraitOk = w <= 832 && h <= 1216;
  const isLandscapeOk = w <= 1216 && h <= 832;
  const isSquareOk = w <= 1024 && h <= 1024;
  if (!(isPortraitOk || isLandscapeOk || isSquareOk)) {
    throw new Error("TUERCHA size 超过上限（竖图≤[832,1216] / 横图≤[1216,832] / 方图≤[1024,1024]），当前为 [" + w + ", " + h + "]");
  }
  return [w, h];
}

/**
 * 把内部归一化状态映射为 TUERCHA 内层 drawParams（§5、§7、§11、§20）。
 * 纯数据转换：不读 DOM、不发请求、不依赖实例。所有图片字段调用方需提前解析为 base64/data URI 字符串。
 *
 * @param {object} src 源参数：
 *   {string}  prompt            必填，最终正向提示词（英文）
 *   {string}  negativePrompt    最终反向提示词
 *   {number}  width,height      尺寸
 *   {number}  steps             步数（>28 自动 clamp 到 28）
 *   {number}  scale             引导强度
 *   {string}  sampler           采样器
 *   {number}  seed              种子（-1 表示随机，转为省略）
 *   {boolean} variety           对应 variety_boost
 *   {number}  cfgRescale        cfg_rescale
 *   {string}  noiseSchedule     noise_schedule（非法值归一为 karras）
 *   {boolean} useCoords         多角色坐标模式
 *   {Array}   characters        [{prompt,negativePrompt,position}]，仅多角色时传入
 *   {object}  i2i               {image, strength, noise} 或 null
 *   {object}  inpaint           {image, mask, strength} 或 null
 *   {Array}   controlnet        [{image, info_extracted, strength}]（vibe 模式）或 null
 *   {object}  characterRef      {image, type, fidelity, strength}（director 模式）或 null
 * @returns {object} TUERCHA 内层 drawParams
 */
export function buildTuerchaDrawParams(src) {
  if (!src || !src.prompt || !String(src.prompt).trim()) {
    throw new Error("TUERCHA 渠道 prompt 不能为空");
  }
  // 提示词英文校验（§8）
  assertNoCJK(src.prompt, "prompt");
  assertNoCJK(src.negativePrompt, "negative_prompt");

  // 尺寸校验（§6）
  const size = validateSize(src.width, src.height);

  const draw = {
    prompt: String(src.prompt).trim(),
    size: size,
    // steps 超过 28 直接 clamp（§5：最大 28），属文档明确上限的安全收敛
    steps: Math.min(Number(src.steps) || 23, 28),
    // n_samples 文档当前只允许 1（§5），固定写死
    n_samples: 1,
    // 输出格式固定 png（§11），UI 无对应开关
    image_format: "png"
  };
  if (src.negativePrompt && String(src.negativePrompt).trim()) {
    draw.negative_prompt = String(src.negativePrompt).trim();
  }
  if (src.scale !== undefined && src.scale !== null && !Number.isNaN(Number(src.scale))) {
    draw.scale = Number(src.scale);
  }
  if (src.sampler) {
    // 采样器非法时回退默认，避免上游 400
    draw.sampler = TUERCHA_SAMPLERS.includes(src.sampler) ? src.sampler : "k_euler_ancestral";
  }
  // seed：-1 / 未定义表示随机 -> 省略字段
  if (src.seed !== undefined && src.seed !== null && Number(src.seed) !== -1) {
    draw.seed = Number(src.seed);
  }
  if (src.variety === true) {
    draw.variety_boost = true;
  }
  if (src.cfgRescale !== undefined && src.cfgRescale !== null && Number(src.cfgRescale) > 0) {
    draw.cfg_rescale = Number(src.cfgRescale);
  }
  if (src.noiseSchedule) {
    // 非法 noise_schedule 归一为 karras（§9）
    draw.noise_schedule = TUERCHA_NOISE_SCHEDULES.includes(src.noiseSchedule) ? src.noiseSchedule : "karras";
  }

  // —— 多角色（§7）——
  if (Array.isArray(src.characters) && src.characters.length > 0) {
    const characters = src.characters.map((c, idx) => {
      // 角色正向提示词必填且英文
      if (!c || !c.prompt || !String(c.prompt).trim()) {
        throw new Error("TUERCHA 多角色第 " + (idx + 1) + " 个角色缺少 prompt");
      }
      assertNoCJK(c.prompt, "characters[" + idx + "].prompt");
      assertNoCJK(c.negativePrompt, "characters[" + idx + "].negative_prompt");
      const entry = { prompt: String(c.prompt).trim() };
      if (c.negativePrompt && String(c.negativePrompt).trim()) {
        entry.negative_prompt = String(c.negativePrompt).trim();
      }
      // 坐标模式下校验 position 格式；非坐标模式（自动布局）省略 position
      if (src.useCoords === true) {
        const pos = (c.position || "").toUpperCase();
        if (!POSITION_RE.test(pos)) {
          throw new Error("TUERCHA 坐标模式要求角色 position 形如 [A-E][1-5]，当前第 " + (idx + 1) + " 个为 \"" + c.position + "\"");
        }
        entry.position = pos;
      }
      return entry;
    });
    draw.characters = characters;
    draw.use_coords = src.useCoords === true;
    // 有多角色时按顺序排序（§7.1）
    draw.use_order = true;
  }

  // —— i2i / inpaint 互斥（§20）——
  if (src.i2i && src.inpaint) {
    throw new Error("TUERCHA i2i 与 inpaint 互斥，不能同时使用");
  }
  if (src.i2i) {
    if (!src.i2i.image) {
      throw new Error("TUERCHA i2i 缺少 image");
    }
    draw.i2i = { image: src.i2i.image };
    if (src.i2i.strength !== undefined && src.i2i.strength !== null) draw.i2i.strength = Number(src.i2i.strength);
    if (src.i2i.noise !== undefined && src.i2i.noise !== null) draw.i2i.noise = Number(src.i2i.noise);
  }
  if (src.inpaint) {
    if (!src.inpaint.image || !src.inpaint.mask) {
      throw new Error("TUERCHA inpaint 需要同时提供 image 与 mask");
    }
    draw.inpaint = { image: src.inpaint.image, mask: src.inpaint.mask };
    if (src.inpaint.strength !== undefined && src.inpaint.strength !== null) draw.inpaint.strength = Number(src.inpaint.strength);
  }

  // —— controlnet(Vibe) / character_references 互斥（§20）——
  const hasControlnet = Array.isArray(src.controlnet) && src.controlnet.length > 0;
  const hasCharRef = !!src.characterRef;
  if (hasControlnet && hasCharRef) {
    throw new Error("TUERCHA controlnet(Vibe) 与 character_references 互斥，不能同时使用");
  }
  if (hasControlnet) {
    if (src.controlnet.length > 4) {
      throw new Error("TUERCHA controlnet 参考图最多 4 张，当前 " + src.controlnet.length + " 张");
    }
    draw.controlnet = {
      strength: 1,
      images: src.controlnet.map(img => {
        if (!img || !img.image) {
          throw new Error("TUERCHA controlnet 每张参考图必须包含 image");
        }
        return {
          image: img.image,
          info_extracted: img.info_extracted !== undefined ? Number(img.info_extracted) : 0.7,
          strength: img.strength !== undefined ? Number(img.strength) : 0.6
        };
      })
    };
  }
  if (hasCharRef) {
    if (!src.characterRef.image) {
      throw new Error("TUERCHA character_references 缺少 image");
    }
    draw.character_references = [{
      image: src.characterRef.image,
      type: src.characterRef.type || "character&style",
      fidelity: src.characterRef.fidelity !== undefined ? Number(src.characterRef.fidelity) : 1,
      strength: src.characterRef.strength !== undefined ? Number(src.characterRef.strength) : 1
    }];
  }

  return draw;
}

/**
 * 解析 TUERCHA 响应（§12、§13、§20.3.1）。
 * 从 choices[0].message.content 提取首张图片 data URI，并尽力解析 seeds 与 vibe_cache_ids。
 * @param {object} json chat.completions 响应 JSON
 * @returns {{dataUrl: string, seeds: Array, vibeCacheIds: Array}}
 */
export function parseTuerchaResponse(json) {
  // 上游错误信封（§17）
  if (json && json.error) {
    const e = json.error;
    throw new Error("TUERCHA 错误 (" + (e.code || e.type || "") + "): " + (e.message || JSON.stringify(e)));
  }
  const content = json?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("TUERCHA 响应缺少 choices[0].message.content");
  }
  const imgMatch = content.match(IMG_RE);
  if (!imgMatch) {
    throw new Error("TUERCHA 响应未找到图片 data URI");
  }
  const result = { dataUrl: imgMatch[1], seeds: [], vibeCacheIds: [] };
  const seedMatch = content.match(SEED_RE);
  if (seedMatch) {
    try { result.seeds = JSON.parse(seedMatch[1]); } catch { /* 容忍 seed 注释格式异常，不影响出图 */ }
  }
  const vibeMatch = content.match(VIBE_CACHE_RE);
  if (vibeMatch) {
    try { result.vibeCacheIds = JSON.parse(vibeMatch[1]); } catch { /* 容忍 vibe_cache_ids 注释格式异常 */ }
  }
  return result;
}
