"use strict";
/**
 * TUERCHA UI 纯逻辑测试。
 * 覆盖：render 注入第三渠道、tuercha 初始状态、渠道切换后的 proxy stream 显隐、默认 URL 选择。
 */
import {
  TUERCHA_CHANNEL_VALUE,
  deriveChannelUiState,
  patchNaiSettingsRenderHtml
} from "../modules/tuercha-ui-patch-helpers.js";

let pass = 0;
let fail = 0;

function ok(name, cond) {
  if (cond) {
    pass += 1;
    console.log("PASS  " + name);
  } else {
    fail += 1;
    console.log("FAIL  " + name);
  }
}

const instance = {
  DEFAULT_OFFICIAL_URL: "https://image.novelai.net/ai/generate-image",
  DEFAULT_PROXY_URL: "1",
  _getSettings() {
    return this._settings;
  }
};

const baseHtml = `
<select id="nai-channel">
  <option value="official">官方 (Official)</option>
  <option value="proxy" selected>第三方代理 (Proxy)</option>
</select>
<input id="nai-api-url" value="1">
<div id="nai-proxy-stream-group" style="display:block"></div>
`;

instance._settings = { channel: "proxy", proxyUrl: "1" };
const proxyHtml = patchNaiSettingsRenderHtml(baseHtml, instance);
ok("injects tuercha option", proxyHtml.includes(`value="${TUERCHA_CHANNEL_VALUE}"`));
ok("keeps proxy selected when channel is proxy", proxyHtml.includes('<option value="proxy" selected>'));
ok("keeps proxy stream visible for proxy", proxyHtml.includes('id="nai-proxy-stream-group" style="display:block"'));

instance._settings = { channel: TUERCHA_CHANNEL_VALUE, proxyUrl: "https://api.example.com" };
const tuerchaHtml = patchNaiSettingsRenderHtml(baseHtml, instance);
ok("marks tuercha selected", tuerchaHtml.includes('<option value="tuercha" selected>'));
ok("hides proxy stream for tuercha", tuerchaHtml.includes('id="nai-proxy-stream-group" style="display:none"'));
ok("writes tuercha api url", tuerchaHtml.includes('value="https://api.example.com"'));

const officialState = deriveChannelUiState(instance, "official", "1");
ok("official hides proxy stream", officialState.proxyDisplay === "none");
ok("official defaults url", officialState.nextUrl === instance.DEFAULT_OFFICIAL_URL);

const proxyState = deriveChannelUiState(instance, "proxy", "1");
ok("proxy shows proxy stream", proxyState.proxyDisplay === "block");
ok("proxy keeps proxy default url", proxyState.nextUrl === instance.DEFAULT_PROXY_URL);

const tuerchaState = deriveChannelUiState(instance, TUERCHA_CHANNEL_VALUE, "1");
ok("tuercha hides proxy stream", tuerchaState.proxyDisplay === "none");
ok("tuercha clears url default", tuerchaState.nextUrl === "");

console.log(`\n==== TUERCHA UI tests: ${pass} passed, ${fail} failed ====`);
process.exit(fail === 0 ? 0 : 1);
