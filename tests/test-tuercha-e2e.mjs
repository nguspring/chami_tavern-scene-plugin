"use strict";
/**
 * TUERCHA 端到端 QA harness
 * 目标：用 mock fetch 验证"真实请求体结构"与"响应解析"端到端打通：
 *   - URL 拼接为 {base}/v1/chat/completions
 *   - headers 含 Authorization: Bearer KEY 与 Content-Type
 *   - body = { model, messages:[{role:"user", content: JSON.stringify(drawParams)}], stream:false, max_tokens }
 *   - messages[0].content 反序列化后是合法 drawParams（size 数组 / steps / characters / i2i 等）
 *   - 响应 markdown data URI 被正确解析为 dataUrl
 *
 * 说明：tuercha-channel-patch.js 顶部静态 import 了 image-gen.js（依赖 SillyTavern 运行时），
 * node 无法直接加载。故本 harness 复用 patch 模块同款的纯逻辑导出（buildTuerchaDrawParams /
 * parseTuerchaResponse），并按 patch 模块完全一致的 URL/body/headers 组装方式复现编排，
 * 用 mock fetch 捕获并断言"上游真正会收到什么"。
 */
import { buildTuerchaDrawParams, parseTuerchaResponse } from "../modules/tuercha-draw-params.js";

// 与 tuercha-channel-patch.js 的 resolveTuerchaUrl 完全相同的实现（同源复制以独立运行）
function resolveTuerchaUrl(rawUrl) {
  const url = rawUrl.trim().replace(/\/+$/, "");
  if (url.endsWith("/chat/completions")) return url;
  if (url.endsWith("/v1")) return url + "/chat/completions";
  return url + "/v1/chat/completions";
}

let pass = 0, fail = 0;
const ok = (n, c) => { c ? (pass++, console.log("PASS  " + n)) : (fail++, console.log("FAIL  " + n)); };

// —— mock fetch：捕获请求，返回 TUERCHA 真实格式响应 ——
let captured = null;
const mockFetch = async (url, init) => {
  captured = { url, init };
  const content = "![image_0](data:image/png;base64,iVBORw0KGgoMOCK)\n<!-- seeds:[987654321] -->";
  return {
    ok: true,
    status: 200,
    async json() { return { choices: [{ message: { role: "assistant", content } }] }; },
    async text() { return ""; }
  };
};

// —— 复现 patch 模块 generateWithTuercha 的网络编排部分（提示词/图像已由实例 helper 处理，此处给定结果）——
async function sendTuercha(nai, src, fetchImpl) {
  const drawParams = buildTuerchaDrawParams(src);
  const url = resolveTuerchaUrl(nai.proxyUrl);
  const body = {
    model: src.model,
    messages: [{ role: "user", content: JSON.stringify(drawParams) }],
    stream: false,
    max_tokens: 100000
  };
  const resp = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + nai.apiKey },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error("err " + resp.status);
  const parsed = parseTuerchaResponse(await resp.json());
  // 复现 patch 模块返回契约：必须与原 generateWithNAI 一致 { success, imageUrl, finalPositive, finalNegative }
  return { success: true, imageUrl: parsed.dataUrl, finalPositive: src.prompt, finalNegative: src.negativePrompt, _parsed: parsed };
}

// —— 场景：完整多角色 + i2i 请求 ——
const nai = { proxyUrl: "https://tuercha.example.com", apiKey: "sk-test-KEY" };
const src = {
  prompt: "2girls, masterpiece", negativePrompt: "lowres",
  width: 1216, height: 832, steps: 23, scale: 5, sampler: "k_euler_ancestral",
  seed: 42, model: "nai-diffusion-4-5-full", useCoords: true,
  characters: [{ prompt: "blue hair", position: "B2" }, { prompt: "red hair", position: "D4" }],
  i2i: { image: "BASE64IMG", strength: 0.6, noise: 0.1 }
};

const result = await sendTuercha(nai, src, mockFetch);

// 断言请求结构
ok("URL = base + /v1/chat/completions", captured.url === "https://tuercha.example.com/v1/chat/completions");
ok("method POST", captured.init.method === "POST");
ok("Authorization Bearer header", captured.init.headers.Authorization === "Bearer sk-test-KEY");
ok("Content-Type json", captured.init.headers["Content-Type"] === "application/json");
const sentBody = JSON.parse(captured.init.body);
ok("outer model authoritative", sentBody.model === "nai-diffusion-4-5-full");
ok("stream false", sentBody.stream === false);
ok("max_tokens", sentBody.max_tokens === 100000);
ok("messages shape", Array.isArray(sentBody.messages) && sentBody.messages[0].role === "user");
const inner = JSON.parse(sentBody.messages[0].content);
ok("inner.size array", JSON.stringify(inner.size) === "[1216,832]");
ok("inner.seed", inner.seed === 42);
ok("inner.n_samples=1", inner.n_samples === 1);
ok("inner.image_format=png", inner.image_format === "png");
ok("inner.characters", inner.characters.length === 2 && inner.characters[0].position === "B2");
ok("inner.use_coords", inner.use_coords === true);
ok("inner.i2i mapped", inner.i2i.image === "BASE64IMG" && inner.i2i.strength === 0.6);

// 断言响应解析
ok("response dataUrl parsed", result._parsed.dataUrl === "data:image/png;base64,iVBORw0KGgoMOCK");
ok("response seeds parsed", result._parsed.seeds.length === 1 && result._parsed.seeds[0] === 987654321);
// 断言返回契约（与原 generateWithNAI 一致，否则酒馆 UI 收不到图）
ok("return contract success=true", result.success === true);
ok("return contract imageUrl is dataURI", result.imageUrl === "data:image/png;base64,iVBORw0KGgoMOCK");

// 落盘 artifact 供人工核对
import { writeFileSync } from "node:fs";
writeFileSync(new URL("./tuercha-e2e-artifact.json", import.meta.url),
  JSON.stringify({ requestUrl: captured.url, requestHeaders: captured.init.headers, requestBody: JSON.parse(captured.init.body), innerDrawParams: inner, parsedResult: result }, null, 2));

console.log("\n==== TUERCHA e2e: " + pass + " passed, " + fail + " failed ====");
process.exit(fail === 0 ? 0 : 1);
