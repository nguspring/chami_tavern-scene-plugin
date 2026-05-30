"use strict";
/**
 * TUERCHA 纯逻辑层单元测试（无外部依赖，node 直接跑）
 * 覆盖：基础映射 / CJK 拒绝 / size 校验 / steps clamp / 多角色 / i2i·inpaint 互斥 /
 *       controlnet·character_ref 互斥 / 响应解析 / 错误信封。
 */
import {
  buildTuerchaDrawParams,
  parseTuerchaResponse,
  validateSize,
  assertNoCJK
} from "../modules/tuercha-draw-params.js";

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name); }
}
function throws(name, fn, msgIncludes) {
  try { fn(); fail++; console.log("FAIL  " + name + "  (expected throw, got none)"); }
  catch (e) {
    if (!msgIncludes || e.message.includes(msgIncludes)) { pass++; console.log("PASS  " + name); }
    else { fail++; console.log("FAIL  " + name + "  (wrong msg: " + e.message + ")"); }
  }
}

// —— 场景1 Happy path：基础绘图参数映射 ——
const base = buildTuerchaDrawParams({
  prompt: "1girl, solo, masterpiece", negativePrompt: "lowres, bad anatomy",
  width: 832, height: 1216, steps: 23, scale: 5, sampler: "k_euler_ancestral",
  seed: 12345, variety: true, cfgRescale: 0.5, noiseSchedule: "karras"
});
ok("base.prompt", base.prompt === "1girl, solo, masterpiece");
ok("base.negative_prompt", base.negative_prompt === "lowres, bad anatomy");
ok("base.size array", Array.isArray(base.size) && base.size[0] === 832 && base.size[1] === 1216);
ok("base.steps", base.steps === 23);
ok("base.n_samples=1", base.n_samples === 1);
ok("base.image_format=png", base.image_format === "png");
ok("base.scale", base.scale === 5);
ok("base.sampler", base.sampler === "k_euler_ancestral");
ok("base.seed", base.seed === 12345);
ok("base.variety_boost", base.variety_boost === true);
ok("base.cfg_rescale", base.cfg_rescale === 0.5);
ok("base.noise_schedule", base.noise_schedule === "karras");

// —— 场景2 Edge：steps>28 clamp，seed=-1 省略，非法 sampler/noise 回退 ——
const clamp = buildTuerchaDrawParams({ prompt: "x", width: 1024, height: 1024, steps: 50, seed: -1, sampler: "bogus", noiseSchedule: "bogus" });
ok("steps clamp to 28", clamp.steps === 28);
ok("seed=-1 omitted", clamp.seed === undefined);
ok("invalid sampler fallback", clamp.sampler === "k_euler_ancestral");
ok("invalid noise fallback", clamp.noise_schedule === "karras");

// —— 场景3 Edge：空 prompt / CJK 拒绝（fail-fast）——
throws("empty prompt throws", () => buildTuerchaDrawParams({ prompt: "", width: 832, height: 1216 }), "prompt 不能为空");
throws("CJK prompt throws", () => buildTuerchaDrawParams({ prompt: "一个女孩", width: 832, height: 1216 }), "必须为英文");
throws("CJK negative throws", () => buildTuerchaDrawParams({ prompt: "1girl", negativePrompt: "全角，", width: 832, height: 1216 }), "必须为英文");
ok("assertNoCJK passes English", (() => { assertNoCJK("1girl, white dress", "prompt"); return true; })());

// —— 场景4 Edge：size 校验（64倍数 / 上限 / 整数）——
ok("validateSize valid portrait", JSON.stringify(validateSize(832, 1216)) === "[832,1216]");
ok("validateSize valid landscape", JSON.stringify(validateSize(1216, 832)) === "[1216,832]");
ok("validateSize valid square", JSON.stringify(validateSize(1024, 1024)) === "[1024,1024]");
throws("size not multiple of 64", () => validateSize(800, 1200), "64 的倍数");
throws("size over limit", () => validateSize(1216, 1216), "超过上限");
throws("size non-integer", () => validateSize(832.5, 1216), "正整数");

// —— 场景5：多角色（坐标模式 position 校验）——
const mc = buildTuerchaDrawParams({
  prompt: "2girls", width: 1216, height: 832, useCoords: true,
  characters: [
    { prompt: "blue hair girl", negativePrompt: "white hair", position: "b2" },
    { prompt: "white hair girl", position: "D4" }
  ]
});
ok("characters length", mc.characters.length === 2);
ok("position uppercased", mc.characters[0].position === "B2");
ok("character negative", mc.characters[0].negative_prompt === "white hair");
ok("use_coords true", mc.use_coords === true);
ok("use_order true", mc.use_order === true);
throws("bad position throws", () => buildTuerchaDrawParams({
  prompt: "x", width: 832, height: 1216, useCoords: true,
  characters: [{ prompt: "a", position: "Z9" }]
}), "[A-E][1-5]");
// 非坐标模式：position 省略
const mcAuto = buildTuerchaDrawParams({ prompt: "2girls", width: 832, height: 1216, useCoords: false, characters: [{ prompt: "a" }, { prompt: "b" }] });
ok("auto layout omits position", mcAuto.characters[0].position === undefined && mcAuto.use_coords === false);

// —— 场景6：i2i / inpaint 互斥与映射 ——
const i2i = buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, i2i: { image: "data:image/png;base64,AAA", strength: 0.5, noise: 0.1 } });
ok("i2i mapped", i2i.i2i.image === "data:image/png;base64,AAA" && i2i.i2i.strength === 0.5 && i2i.i2i.noise === 0.1);
const inp = buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, inpaint: { image: "data:image/png;base64,AAA", mask: "data:image/png;base64,BBB", strength: 1 } });
ok("inpaint mapped", inp.inpaint.image && inp.inpaint.mask === "data:image/png;base64,BBB" && inp.inpaint.strength === 1);
throws("i2i+inpaint mutual exclusion", () => buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, i2i: { image: "a" }, inpaint: { image: "b", mask: "c" } }), "互斥");
throws("inpaint missing mask", () => buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, inpaint: { image: "a" } }), "image 与 mask");

// —— 场景7：controlnet(Vibe) / character_references 互斥与映射 ——
const cn = buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, controlnet: [{ image: "img1", info_extracted: 0.7, strength: 0.6 }, { image: "img2" }] });
ok("controlnet images", cn.controlnet.images.length === 2 && cn.controlnet.images[1].info_extracted === 0.7 && cn.controlnet.images[1].strength === 0.6);
ok("controlnet strength", cn.controlnet.strength === 1);
throws("controlnet >4 throws", () => buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, controlnet: [{ image: "1" }, { image: "2" }, { image: "3" }, { image: "4" }, { image: "5" }] }), "最多 4 张");
const cr = buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, characterRef: { image: "ref", type: "character", fidelity: 0.8, strength: 0.9 } });
ok("character_references mapped", cr.character_references[0].image === "ref" && cr.character_references[0].type === "character" && cr.character_references[0].fidelity === 0.8);
throws("controlnet+charRef mutual exclusion", () => buildTuerchaDrawParams({ prompt: "x", width: 832, height: 1216, controlnet: [{ image: "1" }], characterRef: { image: "ref" } }), "互斥");

// —— 场景8 Happy path：响应解析（data URI + seeds + vibe_cache_ids）——
const resp = {
  choices: [{ message: { content: "![image_0](data:image/png;base64,iVBORw0KGgo)\n<!-- seeds:[123456789] -->\n<!-- vibe_cache_ids:[{\"index\":0,\"cache_id\":\"AbCdEf\"}] -->" } }]
};
const parsed = parseTuerchaResponse(resp);
ok("parse dataUrl", parsed.dataUrl === "data:image/png;base64,iVBORw0KGgo");
ok("parse seeds", parsed.seeds.length === 1 && parsed.seeds[0] === 123456789);
ok("parse vibeCacheIds", parsed.vibeCacheIds.length === 1 && parsed.vibeCacheIds[0].cache_id === "AbCdEf");
// webp 也应识别
const respWebp = { choices: [{ message: { content: "![x](data:image/webp;base64,QQQ)" } }] };
ok("parse webp dataUrl", parseTuerchaResponse(respWebp).dataUrl === "data:image/webp;base64,QQQ");

// —— 场景9 Edge：响应错误信封 / 缺图 ——
throws("error envelope throws", () => parseTuerchaResponse({ error: { message: "prompt is required", code: "REQUEST_VALIDATION_ERROR" } }), "REQUEST_VALIDATION_ERROR");
throws("missing content throws", () => parseTuerchaResponse({ choices: [{ message: {} }] }), "缺少 choices");
throws("no image in content throws", () => parseTuerchaResponse({ choices: [{ message: { content: "no image here" } }] }), "未找到图片");

console.log("\n==== TUERCHA unit tests: " + pass + " passed, " + fail + " failed ====");
process.exit(fail === 0 ? 0 : 1);
