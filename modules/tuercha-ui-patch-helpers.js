"use strict";

export const TUERCHA_CHANNEL_VALUE = "tuercha";
export const TUERCHA_CHANNEL_OPTION_HTML = '<option value="tuercha">TUERCHA 公益站</option>';

/**
 * 判断当前渠道是否应该显示 Proxy Stream 开关。
 * 为什么单独抽纯函数：该规则会同时用于 render 初始态与 change 事件后的同步，拆出来后可以独立单测，
 * 避免每次都把整个运行时补丁模块拉进 Node 测试环境。
 * @param {string | undefined | null} channel 当前渠道
 * @returns {boolean} true 表示显示 Proxy Stream，false 表示隐藏
 */
export function shouldShowProxyStream(channel) {
  return channel === "proxy";
}

/**
 * 计算指定渠道的默认 URL。
 * 为什么 tuercha 要返回空字符串：该渠道要求用户填写 NewAPI base URL，沿用 proxy 默认值会直接把错误地址带进请求。
 * @param {{ DEFAULT_OFFICIAL_URL: string, DEFAULT_PROXY_URL: string }} instance 含默认 URL 的设置实例
 * @param {string} channel 当前渠道
 * @returns {string} 该渠道的默认 URL
 */
export function getChannelDefaultUrl(instance, channel) {
  if (channel === "official") return instance.DEFAULT_OFFICIAL_URL;
  if (channel === TUERCHA_CHANNEL_VALUE) return "";
  return instance.DEFAULT_PROXY_URL;
}

/**
 * 对 attribute 值做最小转义，避免把引号直接注入回 HTML。
 * @param {string} value 原始属性值
 * @returns {string} 可安全放回双引号属性的值
 */
export function escapeHtmlAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * 在 render() 返回的 HTML 中注入 TUERCHA 选项，并修正第三渠道的初始 UI 状态。
 * 为什么基于字符串补丁：原始 `nai-settings.js` 是混淆产物，直接维护它的 diff 成本极高；
 * 这里把最小必要改动压缩为运行时字符串替换，方便未来跟原作者同步。
 * @param {string} html 原始 HTML
 * @param {{ _getSettings(): any, DEFAULT_OFFICIAL_URL: string, DEFAULT_PROXY_URL: string }} instance 设置实例
 * @returns {string} 已注入 TUERCHA 的 HTML
 */
export function patchNaiSettingsRenderHtml(html, instance) {
  if (typeof html !== "string" || html.length === 0) return html;
  let patched = html;

  if (!patched.includes('value="tuercha"')) {
    patched = patched.replace(
      '<option value="proxy"',
      `${TUERCHA_CHANNEL_OPTION_HTML}<option value="proxy"`
    );
  }

  const settings = instance._getSettings();
  const channel = settings?.channel || "proxy";
  const fallbackUrl = getChannelDefaultUrl(instance, channel);
  const currentUrl = settings?.proxyUrl || fallbackUrl;
  const proxyDisplay = shouldShowProxyStream(channel) ? "block" : "none";

  if (channel === TUERCHA_CHANNEL_VALUE) {
    patched = patched.replace('value="proxy" selected', 'value="proxy"');
    patched = patched.replace('value="tuercha">', 'value="tuercha" selected>');
  }

  patched = patched.replace(
    /id="nai-proxy-stream-group"\s+style="display:[^"]*"/,
    `id="nai-proxy-stream-group" style="display:${proxyDisplay}"`
  );

  if (channel === TUERCHA_CHANNEL_VALUE) {
    patched = patched.replace(
      /id="nai-api-url"([^>]*)value="[^"]*"/,
      `id="nai-api-url"$1value="${escapeHtmlAttribute(currentUrl)}"`
    );
  }

  return patched;
}

/**
 * 计算渠道切换后 URL 输入框与 Proxy Stream 的目标状态。
 * 为什么拆成纯函数：事件层只负责把计算结果写回 DOM，规则本身独立出来后可稳定覆盖切换场景。
 * @param {{ DEFAULT_OFFICIAL_URL: string, DEFAULT_PROXY_URL: string }} instance 设置实例
 * @param {string} channel 当前渠道
 * @param {string} currentUrl 当前输入框值
 * @returns {{ proxyDisplay: string, nextUrl: string }} 目标显示状态与 URL 值
 */
export function deriveChannelUiState(instance, channel, currentUrl) {
  const normalizedCurrentUrl = typeof currentUrl === "string" ? currentUrl.trim() : "";
  const defaultUrl = getChannelDefaultUrl(instance, channel);
  const allKnownDefaults = new Set([
    instance.DEFAULT_OFFICIAL_URL,
    instance.DEFAULT_PROXY_URL,
    ""
  ]);
  const shouldReplaceUrl = !normalizedCurrentUrl || allKnownDefaults.has(normalizedCurrentUrl);

  return {
    proxyDisplay: shouldShowProxyStream(channel) ? "block" : "none",
    nextUrl: shouldReplaceUrl ? defaultUrl : normalizedCurrentUrl
  };
}
