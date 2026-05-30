"use strict";
// 副作用导入：加载 TUERCHA 公益站渠道补丁，包装 ImageGenerator.prototype.generateWithNAI。
// 该补丁仅在 channel==="tuercha" 时介入，其余渠道(official/proxy)原样委托原方法，因此对现有流程零影响。
import "../../modules/tuercha-channel-patch.js";
export class NAISettings {
  constructor(_0x19ef71) {
    this.ctx = _0x19ef71;
    this.containerEl = null;
    this.apiPresets = [];
    this.activeApiPreset = "";
    this.DEFAULT_OFFICIAL_URL = "https://image.novelai.net/ai/generate-image";
    this.DEFAULT_PROXY_URL = "1";
    this.EMOTION_DEFINITIONS = [{
      key: "neutral",
      label: "中性",
      desc: "平静，接近面无表情"
    }, {
      key: "happy",
      label: "开心",
      desc: "嘴角上扬，有时候会张开"
    }, {
      key: "sad",
      label: "难过",
      desc: "会流泪，哭泣"
    }, {
      key: "angry",
      label: "愤怒",
      desc: "皱眉"
    }, {
      key: "scared",
      label: "害怕",
      desc: "m字嘴"
    }, {
      key: "surprised",
      label: "惊讶",
      desc: "目瞪口呆，眼珠子凸出"
    }, {
      key: "tired",
      label: "疲惫",
      desc: "黑眼圈的烟熏妆"
    }, {
      key: "excited",
      label: "兴奋",
      desc: "有点猥琐的表情"
    }, {
      key: "nervous",
      label: "紧张",
      desc: "m字嘴暴汗"
    }, {
      key: "thinking",
      label: "思考",
      desc: "迷惑，手部靠近下巴与眯眯眼"
    }, {
      key: "confused",
      label: "困惑的",
      desc: "蚊香眼"
    }, {
      key: "shy",
      label: "害羞",
      desc: "脸颊上腮红"
    }, {
      key: "disgusted",
      label: "厌恶",
      desc: "经典厌恶脸，居高临下"
    }, {
      key: "smug",
      label: "得意",
      desc: "龙王归来耐克嘴"
    }, {
      key: "bored",
      label: "无聊",
      desc: "死鱼眼或眼睛失去焦点发呆"
    }, {
      key: "laughing",
      label: "笑出声",
      desc: "比开心嘴巴张的大，颠婆"
    }, {
      key: "irritated",
      label: "恼怒",
      desc: "类似娇嗔，让你猜"
    }, {
      key: "aroused",
      label: "兴奋(极)",
      desc: "超级发春，直接出蒸汽"
    }, {
      key: "embarrassed",
      label: "尴尬",
      desc: "与害怕差不多但多了腮红"
    }, {
      key: "worried",
      label: "担忧",
      desc: "像娇羞，会出现一滴汗"
    }, {
      key: "love",
      label: "爱",
      desc: "笑，眯眯眼"
    }, {
      key: "determined",
      label: "决心",
      desc: "认真脸"
    }, {
      key: "hurt",
      label: "受伤",
      desc: "流泪，大概率出现伤痕"
    }, {
      key: "playful",
      label: "俏皮",
      desc: "抛媚眼"
    }];
    const _0x29e1b7 = {
      channel: "proxy",
      proxyUrl: "",
      apiPresets: [],
      activeApiPreset: "",
      apiKey: "",
      proxyStream: true,
      model: "nai-diffusion-3",
      sampler: "k_euler_ancestral",
      noiseSchedule: "native",
      steps: 28,
      scale: 5,
      cfgRescale: 0,
      width: 832,
      height: 1216,
      sm: true,
      dyn: false,
      variety: false,
      decrisper: false,
      multiRoleEnabled: false,
      useCoords: false,
      i2iStrength: 0.7,
      i2iNoise: 0,
      inpaintStrength: 1,
      vibeEnabled: false,
      referenceMode: "vibe",
      vibeImages: [],
      seed: -1
    };
    this.defaultSettings = _0x29e1b7;
    this.vibeImages = [];
    this.referenceMode = "vibe";
    this.naiPresets = [];
    this.activePresetName = "";
  }
  _getSettings() {
    try {
      const _0x19fbfe = this.ctx?.getModule?.("imageGen");
      const _0x15e2a2 = _0x19fbfe?.settings?.nai || {};
      const _0x147e36 = _0x15e2a2.naiPresets || [];
      const _0x32c019 = _0x15e2a2.naiTriggersEnabled || false;
      const _0x8da116 = {
        ...this.defaultSettings,
        ..._0x15e2a2
      };
      _0x8da116.naiPresets = _0x147e36;
      _0x8da116.naiTriggersEnabled = _0x32c019;
      return _0x8da116;
    } catch (_0x58f6bd) {
      console.warn("[NAISettings] 获取设置失败，使用默认值", _0x58f6bd);
      return this.defaultSettings;
    }
  }
  render() {
    const _0x39149c = this._getSettings();
    this.loadedEmotions = _0x39149c.emotions || {};
    this.naiPresets = _0x39149c.naiPresets || [];
    this.activePresetName = this.naiPresets.length > 0 ? this.naiPresets[0].name : "";
    this.vibeImages = _0x39149c.vibeImages || [];
    this.referenceMode = _0x39149c.referenceMode || "vibe";
    // 三渠道默认 URL：official 用官方默认，proxy 用代理默认，tuercha（NewAPI 公益站）默认留空强制用户填写 base URL
    const _0xd6a53c = _0x39149c.channel === "official" ? this.DEFAULT_OFFICIAL_URL : _0x39149c.channel === "tuercha" ? "" : this.DEFAULT_PROXY_URL;
    const _0x412efd = _0x39149c.proxyUrl || _0xd6a53c;
    return "\n        <div class=\"tsp-settings-pane-inner\">\n            <!-- API 设置 -->\n            <div class=\"tsp-settings-group\">\n                <h4 class=\"tsp-settings-group-title\">\n                    <i class=\"fa-solid fa-key\"></i> API 设置\n                </h4>\n                <div class=\"tsp-settings-group\" style=\"padding: 12px; background: var(--tsp-bg-tertiary); border-radius:8px; margin-bottom:15px;\">\n                    <h5 style=\"margin-top:0; font-size:0.9em; color:var(--tsp-text-secondary);\">API 预设管理</h5>\n                    <div class=\"tsp-form-row\">\n                        <div class=\"tsp-form-group\" style=\"flex:2;\">\n                            <label>选择预设</label>\n                            <select class=\"tsp-input\" id=\"nai-api-preset-select\">\n                                <option value=\"\">-- 新建预设 --</option>\n                            </select>\n                        </div>\n                        <div class=\"tsp-btn-group\" style=\"flex:1; align-self: flex-end; justify-content: flex-end;\">\n                            <!--  更新按钮 -->\n                            <button type=\"button\" class=\"tsp-btn tsp-btn-primary\" id=\"nai-api-preset-update\" title=\"覆盖更新当前预设\">\n                                <i class=\"fa-solid fa-sync\"></i> 更新\n                            </button>\n                            <button type=\"button\" class=\"tsp-btn\" id=\"nai-api-preset-save\" title=\"将当前配置另存为新预设\">\n                                <i class=\"fa-solid fa-save\"></i> 另存\n                            </button>\n                            <button type=\"button\" class=\"tsp-btn tsp-btn-danger\" id=\"nai-api-preset-delete\" title=\"删除当前预设\">\n                                <i class=\"fa-solid fa-trash\"></i> 删除\n                            </button>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"tsp-form-group\">\n                    <label>渠道</label>\n                    <select class=\"tsp-input\" id=\"nai-channel\">\n                        <option value=\"proxy\" " + (_0x39149c.channel === "proxy" ? "selected" : "") + ">第三方代理</option>\n                        <option value=\"official\" " + (_0x39149c.channel === "official" ? "selected" : "") + ">官方 (Official)</option>\n                        <option value=\"tuercha\" " + (_0x39149c.channel === "tuercha" ? "selected" : "") + ">TUERCHA 公益站</option>\n                    </select>\n                </div>\n                <div class=\"tsp-form-group\">\n                    <label>API 地址 (URL)</label>\n                    <input type=\"text\" class=\"tsp-input\" id=\"nai-api-url\"\n                           value=\"" + _0x412efd + "\"\n                           placeholder=\"留空默认使用官方链接\">\n                </div>\n                <!-- [修改开始]：增加了眼睛按钮 -->\n                <div class=\"tsp-form-group\">\n                    <label>密钥 (Key)</label>\n                    <div class=\"tsp-input-group\">\n                        <input type=\"password\" class=\"tsp-input\" id=\"nai-token\"\n                               value=\"" + (_0x39149c.apiKey || "") + "\"\n                               placeholder=\"API Key 或密钥\">\n                        <button class=\"tsp-btn tsp-btn-icon\" id=\"nai-token-toggle\" title=\"显示/隐藏密钥\">\n                            <i class=\"fa-solid fa-eye\"></i>\n                        </button>\n                    </div>\n                </div>\n                <div class=\"tsp-form-group\" id=\"nai-proxy-stream-group\" style=\"" + (_0x39149c.channel === "proxy" ? "" : "display:none;") + "\">\n                    <label>第三方代理流式传输</label>\n                    <select class=\"tsp-input\" id=\"nai-proxy-stream\">\n                        <option value=\"true\" " + (_0x39149c.proxyStream === true ? "selected" : "") + ">启用 (Stream)</option>\n                        <option value=\"false\" " + (_0x39149c.proxyStream === false ? "selected" : "") + ">禁用 (Direct Image)</option>\n                    </select>\n                    <small class=\"tsp-text-muted\">如果代理直接返回图片而不是 URL，请选择\"禁用\"</small>\n                </div>\n            </div>\n\n            <!-- 模型与采样 -->\n            <div class=\"tsp-settings-group\">\n                <h4 class=\"tsp-settings-group-title\">\n                    <i class=\"fa-solid fa-cube\"></i> 模型与采样\n                </h4>\n                <div class=\"tsp-form-row\">\n                    <div class=\"tsp-form-group\">\n                        <label>模型 (Model)</label>\n                        <select class=\"tsp-input\" id=\"nai-model\">\n                            <option value=\"nai-diffusion-3\" " + (_0x39149c.model === "nai-diffusion-3" ? "selected" : "") + ">NAI Diffusion 3</option>\n                            <option value=\"nai-diffusion-furry-3\" " + (_0x39149c.model === "nai-diffusion-furry-3" ? "selected" : "") + ">NAI Diffusion Furry 3</option>\n                            <option value=\"nai-diffusion-4-full\" " + (_0x39149c.model === "nai-diffusion-4-full" ? "selected" : "") + ">NAI Diffusion 4 Full</option>\n                            <option value=\"nai-diffusion-4-curated-preview\" " + (_0x39149c.model === "nai-diffusion-4-curated-preview" ? "selected" : "") + ">NAI Diffusion 4 Curated</option>\n                            <option value=\"nai-diffusion-4-5-full\" " + (_0x39149c.model === "nai-diffusion-4-5-full" ? "selected" : "") + ">NAI Diffusion 4.5 Full</option>\n                            <option value=\"nai-diffusion-4-5-curated\" " + (_0x39149c.model === "nai-diffusion-4-5-curated" ? "selected" : "") + ">NAI Diffusion 4.5 Curated</option>\n                        </select>\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>采样器 (Sampler)</label>\n                        <select class=\"tsp-input\" id=\"nai-sampler\">\n                            <option value=\"k_euler\" " + (_0x39149c.sampler === "k_euler" ? "selected" : "") + ">Euler</option>\n                            <option value=\"k_euler_ancestral\" " + (_0x39149c.sampler === "k_euler_ancestral" ? "selected" : "") + ">Euler Ancestral</option>\n                            <option value=\"k_dpmpp_2s_ancestral\" " + (_0x39149c.sampler === "k_dpmpp_2s_ancestral" ? "selected" : "") + ">DPM++ 2S Ancestral</option>\n                            <option value=\"k_dpmpp_2m_sde\" " + (_0x39149c.sampler === "k_dpmpp_2m_sde" ? "selected" : "") + ">DPM++ 2M SDE</option>\n                            <option value=\"k_dpmpp_2m\" " + (_0x39149c.sampler === "k_dpmpp_2m" ? "selected" : "") + ">DPM++ 2M</option>\n                            <option value=\"k_dpmpp_sde\" " + (_0x39149c.sampler === "k_dpmpp_sde" ? "selected" : "") + ">DPM++ SDE</option>\n                        </select>\n                    </div>\n                </div>\n                <div class=\"tsp-form-group\">\n                    <label>噪点调度 (Noise Schedule)</label>\n                    <select class=\"tsp-input\" id=\"nai-noise-schedule\">\n                        <option value=\"native\" " + (_0x39149c.noiseSchedule === "native" ? "selected" : "") + ">native</option>\n                        <option value=\"exponential\" " + (_0x39149c.noiseSchedule === "exponential" ? "selected" : "") + ">exponential</option>\n                        <option value=\"polyexponential\" " + (_0x39149c.noiseSchedule === "polyexponential" ? "selected" : "") + ">polyexponential</option>\n                        <option value=\"karras\" " + (_0x39149c.noiseSchedule === "karras" ? "selected" : "") + ">karras</option>\n                    </select>\n                </div>\n                <div class=\"tsp-form-row\">\n                    <div class=\"tsp-form-group\">\n                        <label>步数 (Steps)</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-steps\"\n                               value=\"" + _0x39149c.steps + "\" min=\"1\" max=\"50\">\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>Scale</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-scale\"\n                               value=\"" + _0x39149c.scale + "\" min=\"1\" max=\"30\" step=\"0.5\">\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>CFG Rescale</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-cfg-rescale\"\n                               value=\"" + _0x39149c.cfgRescale + "\" min=\"0\" max=\"1\" step=\"0.05\">\n                    </div>\n                </div>\n                <div class=\"tsp-form-row\">\n                    <div class=\"tsp-form-group\">\n                        <label>宽度</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-width\"\n                               value=\"" + _0x39149c.width + "\" min=\"64\" step=\"64\">\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>高度</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-height\"\n                               value=\"" + _0x39149c.height + "\" min=\"64\" step=\"64\">\n                    </div>\n                </div>\n            </div>\n\n            <!-- 情绪管理区域 -->\n            <div class=\"tsp-settings-group\">\n                <!-- [修改] 标题添加点击事件和图标 -->\n                <h4 class=\"tsp-settings-group-title\" id=\"nai-emotion-header\" style=\"cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;\">\n                    <span><i class=\"fa-solid fa-face-smile\"></i> 情绪管理</span>\n                    <i class=\"fa-solid fa-chevron-right\" id=\"nai-emotion-icon\"></i>\n                </h4>\n\n                <!-- [修改] 内容容器，默认隐藏，且初始为空 -->\n                <div id=\"nai-emotion-container\" style=\"display: none;\">\n                    <p class=\"tsp-text-muted\">当提示词命中触发词时，对生成的图片进行情绪重绘。支持官方渠道和第三方代理。</p>\n\n                    <!-- [修改] 这里移除了原有的 map 循环，改为一个空的容器等待按需注入 -->\n                    <div class=\"tsp-emotion-grid\" id=\"nai-emotion-grid\" style=\"display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px;\">\n                        <!-- 内容将在点击展开时动态生成 -->\n                    </div>\n                </div>\n            </div>\n\n            <!-- 高级参数 -->\n            <div class=\"tsp-settings-group\">\n                <h4 class=\"tsp-settings-group-title\">\n                    <i class=\"fa-solid fa-sliders\"></i> 高级参数\n                </h4>\n                <div class=\"tsp-form-row\">\n                    <div class=\"tsp-form-group\">\n                        <label>SM (V3)</label>\n                        <select class=\"tsp-input\" id=\"nai-sm\">\n                            <option value=\"true\" " + (_0x39149c.sm === true ? "selected" : "") + ">True</option>\n                            <option value=\"false\" " + (_0x39149c.sm !== true ? "selected" : "") + ">False</option>\n                        </select>\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>SMEA+DYN (V3)</label>\n                        <select class=\"tsp-input\" id=\"nai-dyn\">\n                            <option value=\"true\" " + (_0x39149c.dyn === true ? "selected" : "") + ">True</option>\n                            <option value=\"false\" " + (_0x39149c.dyn !== true ? "selected" : "") + ">False</option>\n                        </select>\n                    </div>\n                </div>\n                <div class=\"tsp-form-row\">\n                    <div class=\"tsp-form-group\">\n                        <label>多样性 (Variety)</label>\n                        <select class=\"tsp-input\" id=\"nai-variety\">\n                            <option value=\"true\" " + (_0x39149c.variety === true ? "selected" : "") + ">True</option>\n                            <option value=\"false\" " + (_0x39149c.variety !== true ? "selected" : "") + ">False</option>\n                        </select>\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>Decrisper</label>\n                        <select class=\"tsp-input\" id=\"nai-decrisper\">\n                            <option value=\"true\" " + (_0x39149c.decrisper === true ? "selected" : "") + ">True</option>\n                            <option value=\"false\" " + (_0x39149c.decrisper !== true ? "selected" : "") + ">False</option>\n                        </select>\n                    </div>\n                </div>\n                <div class=\"tsp-form-row\">\n                    <div class=\"tsp-form-group\" style=\"display: flex; align-items: center; padding-top: 25px;\">\n                        <label class=\"tsp-switch-label\">\n                            <input type=\"checkbox\" class=\"tsp-switch\" id=\"nai-multi-role\" " + (_0x39149c.multiRoleEnabled ? "checked" : "") + ">\n                            <span class=\"tsp-switch-slider\"></span>\n                            <span>启用多角色模式</span>\n                        </label>\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>角色位置 (V4+)</label>\n                        <select class=\"tsp-input\" id=\"nai-use-coords\">\n                            <option value=\"true\" " + (_0x39149c.useCoords === true ? "selected" : "") + ">True</option>\n                            <option value=\"false\" " + (_0x39149c.useCoords !== true ? "selected" : "") + ">False</option>\n                        </select>\n                    </div>\n                </div>\n            </div>\n\n            <!-- 图生图 -->\n            <div class=\"tsp-settings-group\">\n                <h4 class=\"tsp-settings-group-title\">\n                    <i class=\"fa-solid fa-image\"></i> 图生图 (Image to Image)\n                </h4>\n                <p class=\"tsp-text-muted\" style=\"margin-top: -10px;\">在聊天记录中长按生成的图片，可上传图生图底图。</p>\n                <div class=\"tsp-form-row\">\n                    <div class=\"tsp-form-group\">\n                        <label>重绘强度 (Strength)</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-strength\"\n                               value=\"" + _0x39149c.i2iStrength + "\" min=\"0\" max=\"0.99\" step=\"0.01\">\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>重绘噪声 (Noise)</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-noise\"\n                               value=\"" + _0x39149c.i2iNoise + "\" min=\"0\" max=\"0.99\" step=\"0.01\">\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>蒙版重绘幅度</label>\n                        <input type=\"number\" class=\"tsp-input\" id=\"nai-inpaint-strength\"\n                               value=\"" + _0x39149c.inpaintStrength + "\" min=\"0.01\" max=\"1\" step=\"0.01\">\n                    </div>\n                </div>\n            </div>\n\n            <!-- 参考模式 -->\n            <div class=\"tsp-settings-group\">\n                <h4 class=\"tsp-settings-group-title\">\n                    <i class=\"fa-solid fa-wand-magic-sparkles\"></i> 参考模式 (Reference)\n                </h4>\n\n                <!--  预设管理区域 开始 -->\n                <div class=\"tsp-settings-group\" style=\"padding: 12px; background: rgba(0,0,0,0.1); border-radius:8px;\">\n                    <h5 style=\"margin-top:0; font-size:0.9em; color:var(--tsp-text-secondary);\">预设管理</h5>\n                    <div class=\"tsp-form-row\">\n                        <div class=\"tsp-form-group\" style=\"flex:2;\">\n                            <label>选择预设</label>\n                            <select class=\"tsp-input\" id=\"nai-preset-select\">\n                                <option value=\"\">-- 新建预设 --</option>\n                            </select>\n                        </div>\n                        <div class=\"tsp-btn-group\" style=\"flex:1; align-self: flex-end; justify-content: flex-end;\">\n                            <button type=\"button\" class=\"tsp-btn\" id=\"nai-preset-save\" title=\"将当前配置另存为新预设\">\n                                <i class=\"fa-solid fa-save\"></i> 保存\n                            </button>\n                            <button type=\"button\" class=\"tsp-btn tsp-btn-danger\" id=\"nai-preset-delete\" title=\"删除当前预设\">\n                                <i class=\"fa-solid fa-trash\"></i> 删除\n                            </button>\n                        </div>\n                    </div>\n                    <div class=\"tsp-form-group\">\n                        <label>触发词 (用 , 分隔)</label>\n                        <input type=\"text\" class=\"tsp-input\" id=\"nai-preset-triggers\" placeholder=\"例如: 街拍, cyberpunk, neon\">\n                    </div>\n                </div>\n                <!--  预设管理区域 结束 -->\n\n\n                <div class=\"tsp-form-group\" style=\"margin-top: 15px;\">\n                    <label class=\"tsp-switch-label\">\n                        <input type=\"checkbox\" class=\"tsp-switch\" id=\"nai-triggers-enabled\" " + (_0x39149c.naiTriggersEnabled ? "checked" : "") + ">\n                        <span class=\"tsp-switch-slider\"></span>\n                        <span>启用触发词模式 (与手动开启参考模式互斥)</span>\n                    </label>\n                </div>\n                <div class=\"tsp-form-group\">\n                    <label class=\"tsp-switch-label\">\n                        <input type=\"checkbox\" class=\"tsp-switch\" id=\"nai-vibe-enabled\" " + (_0x39149c.vibeEnabled ? "checked" : "") + ">\n                        <span class=\"tsp-switch-slider\"></span>\n                        <span>手动开启参考模式</span>\n                    </label>\n                </div>\n\n                <div id=\"nai-ref-controls\" style=\"" + (_0x39149c.vibeEnabled ? "" : "opacity: 0.5; pointer-events: none;") + "\">\n                    <div class=\"tsp-btn-group\" id=\"nai-ref-mode-buttons\" style=\"margin-bottom: 15px;\">\n                        <button type=\"button\" class=\"tsp-btn " + (this.referenceMode === "vibe" ? "tsp-btn-primary" : "") + "\"\n                                data-mode=\"vibe\">氛围模式 (Vibe)</button>\n                        <button type=\"button\" class=\"tsp-btn " + (this.referenceMode === "director" ? "tsp-btn-primary" : "") + "\"\n                                data-mode=\"director\">人物参考 (Character)</button>\n                    </div>\n\n                    <div class=\"tsp-btn-group\" style=\"margin-bottom: 10px;\">\n                        <button type=\"button\" class=\"tsp-btn\" id=\"nai-vibe-upload-btn\">\n                            <i class=\"fa-solid fa-upload\"></i> 上传参考图\n                        </button>\n                        <button type=\"button\" class=\"tsp-btn tsp-btn-primary\" id=\"nai-vibe-generate-btn\" title=\"生成.naiv4vibe文件\">\n                            <i class=\"fa-solid fa-wand-magic-sparkles\"></i> 生成氛围文件\n                        </button>\n                    </div>\n                    <input type=\"file\" id=\"nai-vibe-upload-input\" multiple accept=\"image/*,.naiv4vibe,.json,.naiv4vibebundle\" style=\"display: none;\">\n\n                    <p id=\"nai-vibe-status\" class=\"tsp-text-muted\" style=\"margin-bottom: 10px;\"></p>\n\n                    <div id=\"nai-vibe-image-list\" class=\"tsp-vibe-list\"></div>\n                </div>\n            </div>\n        </div>\n        ";
  }
  _renderEmotionCards() {
    const _0xcd0006 = this._getSettings();
    const _0x5b0811 = this.loadedEmotions || {};
    return this.EMOTION_DEFINITIONS.map(_0x28c4cd => {
      const _0x4b4e14 = _0x5b0811[_0x28c4cd.key] || {};
      const _0x2a50dd = _0x4b4e14.triggers || "";
      const _0x1a4b68 = _0x4b4e14.strength !== undefined ? _0x4b4e14.strength : 0;
      return "\n            <div class=\"tsp-card\" style=\"padding: 8px; border: 1px solid var(--tsp-border);\">\n                <div style=\"display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;\">\n                    <label style=\"font-weight:bold; cursor:help;\" title=\"" + _0x28c4cd.desc + "\">" + _0x28c4cd.label + " (" + _0x28c4cd.key + ")</label>\n                    <select class=\"tsp-input tsp-input-sm emotion-strength\" data-key=\"" + _0x28c4cd.key + "\" style=\"width:80px;\" title=\"强度: 0(最强) - 5(微弱)\">\n                        <option value=\"0\" " + (_0x1a4b68 == 0 ? "selected" : "") + ">0 (强)</option>\n                        <option value=\"1\" " + (_0x1a4b68 == 1 ? "selected" : "") + ">1</option>\n                        <option value=\"2\" " + (_0x1a4b68 == 2 ? "selected" : "") + ">2</option>\n                        <option value=\"3\" " + (_0x1a4b68 == 3 ? "selected" : "") + ">3</option>\n                        <option value=\"4\" " + (_0x1a4b68 == 4 ? "selected" : "") + ">4</option>\n                        <option value=\"5\" " + (_0x1a4b68 == 5 ? "selected" : "") + ">5 (弱)</option>\n                    </select>\n                </div>\n                <input type=\"text\" class=\"tsp-input tsp-input-sm emotion-triggers\"\n                       data-key=\"" + _0x28c4cd.key + "\"\n                       value=\"" + _0x2a50dd + "\"\n                       placeholder=\"触发词(英文逗号分隔)\">\n                <div style=\"font-size:0.75em; color:var(--tsp-text-muted); margin-top:2px;\">" + _0x28c4cd.desc + "</div>\n            </div>\n            ";
    }).join("");
  }
  bindEvents(_0x44c91b) {
    this.containerEl = _0x44c91b;
    const _0x3c51d9 = _0x44c91b.querySelector("#nai-emotion-header");
    const _0x1da5e7 = _0x44c91b.querySelector("#nai-emotion-container");
    const _0x387e98 = _0x44c91b.querySelector("#nai-emotion-icon");
    const _0x323dd5 = _0x44c91b.querySelector("#nai-emotion-grid");
    if (_0x3c51d9 && _0x1da5e7 && _0x387e98) {
      _0x3c51d9.addEventListener("click", () => {
        const _0x308023 = _0x1da5e7.style.display === "none";
        if (_0x308023) {
          if (_0x323dd5 && _0x323dd5.children.length === 0) {
            requestAnimationFrame(() => {
              _0x323dd5.innerHTML = this._renderEmotionCards();
            });
          }
          _0x1da5e7.style.display = "block";
          _0x387e98.classList.remove("fa-chevron-right");
          _0x387e98.classList.add("fa-chevron-down");
        } else {
          _0x1da5e7.style.display = "none";
          _0x387e98.classList.remove("fa-chevron-down");
          _0x387e98.classList.add("fa-chevron-right");
        }
      });
    }
    _0x44c91b.querySelector("#nai-token-toggle")?.addEventListener("click", _0x5bf2e7 => {
      _0x5bf2e7.preventDefault();
      const _0x303085 = _0x44c91b.querySelector("#nai-token");
      const _0x4e96f0 = _0x5bf2e7.currentTarget.querySelector("i");
      if (_0x303085 && _0x4e96f0) {
        if (_0x303085.type === "password") {
          _0x303085.type = "text";
          _0x4e96f0.classList.remove("fa-eye");
          _0x4e96f0.classList.add("fa-eye-slash");
        } else {
          _0x303085.type = "password";
          _0x4e96f0.classList.remove("fa-eye-slash");
          _0x4e96f0.classList.add("fa-eye");
        }
      }
    });
    this._renderApiPresetDropdown();
    this._applyActiveApiPresetToUI();
    _0x44c91b.querySelector("#nai-api-preset-select")?.addEventListener("change", _0x5cdada => {
      this.activeApiPreset = _0x5cdada.target.value;
      this._applyActiveApiPresetToUI();
      if (this.ctx.getModule("settingsPanel")) {
        this.ctx.getModule("settingsPanel").isApiPresetModified.nai = false;
      }
    });
    _0x44c91b.querySelector("#nai-api-preset-update")?.addEventListener("click", async () => {
      await this._updateApiPreset();
      if (this.ctx.getModule("settingsPanel")) {
        this.ctx.getModule("settingsPanel").isApiPresetModified.nai = false;
      }
    });
    _0x44c91b.querySelector("#nai-api-preset-save")?.addEventListener("click", () => this._saveApiPreset());
    _0x44c91b.querySelector("#nai-api-preset-delete")?.addEventListener("click", () => this._deleteApiPreset());
    const _0x1ef18f = _0x44c91b.querySelector("#nai-channel");
    const _0x45a7eb = _0x44c91b.querySelector("#nai-api-url");
    const _0x408a1f = _0x44c91b.querySelector("#nai-token");
    const _0x3bbe74 = _0x44c91b.querySelector("#nai-proxy-stream");
    if (_0x1ef18f) {
      _0x1ef18f.addEventListener("change", () => {
        if (this.ctx.getModule("settingsPanel")) {
          this.ctx.getModule("settingsPanel").isApiPresetModified.nai = true;
        }
      });
    }
    if (_0x45a7eb) {
      _0x45a7eb.addEventListener("input", () => {
        if (this.ctx.getModule("settingsPanel")) {
          this.ctx.getModule("settingsPanel").isApiPresetModified.nai = true;
        }
      });
    }
    if (_0x408a1f) {
      _0x408a1f.addEventListener("input", () => {
        if (this.ctx.getModule("settingsPanel")) {
          this.ctx.getModule("settingsPanel").isApiPresetModified.nai = true;
        }
      });
    }
    if (_0x3bbe74) {
      _0x3bbe74.addEventListener("change", () => {
        if (this.ctx.getModule("settingsPanel")) {
          this.ctx.getModule("settingsPanel").isApiPresetModified.nai = true;
        }
      });
    }
    this._renderPresetDropdown();
    this._applyActivePresetToUI();
    _0x44c91b.querySelector("#nai-preset-select")?.addEventListener("change", _0x39e1d6 => {
      this.activePresetName = _0x39e1d6.target.value;
      this._applyActivePresetToUI();
    });
    _0x44c91b.querySelector("#nai-preset-save")?.addEventListener("click", async () => {
      await this._saveAsNewPreset();
    });
    _0x44c91b.querySelector("#nai-preset-delete")?.addEventListener("click", async () => {
      await this._deleteActivePreset();
    });
    _0x44c91b.querySelector("#nai-preset-triggers")?.addEventListener("input", _0x1dc7be => {
      this._updateActivePresetTriggerWords(_0x1dc7be.target.value);
    });
    this._renderVibeList();
    this._updateVibeStatus();
    _0x44c91b.querySelector("#nai-channel")?.addEventListener("change", _0x2a1232 => {
      // 流式传输选项仅对第三方代理(proxy)有意义；official 与 tuercha(NewAPI 公益站)都隐藏
      const _0x14e0e0 = _0x2a1232.target.value === "proxy";
      const _0x298107 = _0x44c91b.querySelector("#nai-proxy-stream-group");
      if (_0x298107) {
        _0x298107.style.display = _0x14e0e0 ? "block" : "none";
      }
    });
    _0x44c91b.querySelector("#nai-vibe-enabled")?.addEventListener("change", _0x54587e => {
      const _0x1a5d14 = _0x44c91b.querySelector("#nai-ref-controls");
      if (_0x1a5d14) {
        _0x1a5d14.style.cssText = _0x54587e.target.checked ? "" : "opacity: 0.5; pointer-events: none;";
      }
    });
    const _0x2cc9ea = _0x44c91b.querySelectorAll("#nai-ref-mode-buttons button");
    console.log("[NAISettings] 找到参考模式按钮数量:", _0x2cc9ea.length);
    _0x2cc9ea.forEach(_0x476a93 => {
      console.log("[NAISettings] 绑定按钮事件:", _0x476a93.dataset.mode);
      _0x476a93.addEventListener("click", _0x271aee => {
        _0x271aee.preventDefault();
        _0x271aee.stopPropagation();
        console.log("[NAISettings] 点击参考模式按钮:", _0x476a93.dataset.mode);
        this.referenceMode = _0x476a93.dataset.mode;
        this._updateRefModeUI();
      });
    });
    _0x44c91b.querySelector("#nai-vibe-upload-btn")?.addEventListener("click", () => {
      _0x44c91b.querySelector("#nai-vibe-upload-input")?.click();
    });
    _0x44c91b.querySelector("#nai-vibe-upload-input")?.addEventListener("change", _0x2f65ab => {
      this._handleVibeUpload(_0x2f65ab.target.files);
    });
    _0x44c91b.querySelector("#nai-vibe-generate-btn")?.addEventListener("click", () => {
      this._handleGenerateVibeFiles();
    });
  }
  _updateRefModeUI() {
    console.log("[NAISettings] _updateRefModeUI 被调用, referenceMode:", this.referenceMode);
    if (!this.containerEl) {
      console.log("[NAISettings] containerEl 为空，退出");
      return;
    }
    this.containerEl.querySelectorAll("#nai-ref-mode-buttons button").forEach(_0x41ee54 => {
      const _0x3ece8 = _0x41ee54.dataset.mode === this.referenceMode;
      console.log("[NAISettings] 按钮", _0x41ee54.dataset.mode, "应该激活:", _0x3ece8, "当前有 tsp-btn-primary:", _0x41ee54.classList.contains("tsp-btn-primary"));
      _0x41ee54.classList.toggle("tsp-btn-primary", _0x3ece8);
    });
    this._renderVibeList();
    this._updateVibeStatus();
  }
  async _handleVibeUpload(_0x447bae) {
    if (!_0x447bae || _0x447bae.length === 0) {
      return;
    }
    for (const _0x20d19b of _0x447bae) {
      try {
        if (_0x20d19b.name.endsWith(".naiv4vibe") || _0x20d19b.name.endsWith(".naiv4vibebundle") || _0x20d19b.name.endsWith(".json")) {
          const _0x3853c2 = await _0x20d19b.text();
          const _0x105361 = JSON.parse(_0x3853c2);
          if (_0x105361.identifier === "novelai-vibe-transfer-bundle" && Array.isArray(_0x105361.vibes)) {
            console.log("[NAISettings] 检测到 Vibe Bundle 文件，包含 " + _0x105361.vibes.length + " 个 Vibe。");
            for (const _0x431134 of _0x105361.vibes) {
              if (!_0x431134.encodings) {
                continue;
              }
              let _0x3d0ded = "";
              if (_0x431134.thumbnail && _0x431134.thumbnail.startsWith("data:")) {
                if (_0x431134.thumbnail.startsWith("data:image/")) {
                  _0x3d0ded = _0x431134.thumbnail;
                } else {
                  console.log("[NAISettings] 跳过NAI特殊编码的thumbnail，使用空缩略图");
                }
              }
              const _0xefc413 = {
                type: "vibeFile",
                vibeData: _0x431134,
                image: _0x3d0ded,
                thumbnail: _0x3d0ded,
                strength: _0x431134.importInfo?.strength ?? 0.6,
                infoExtracted: _0x431134.importInfo?.information_extracted ?? 1,
                name: _0x431134.name || _0x20d19b.name
              };
              this._addVibeImage(_0xefc413);
            }
            this.ctx.helpers.showToast("已从Bundle文件加载 " + _0x105361.vibes.length + " 个参考图", "success");
          } else if (_0x105361.encodings) {
            const _0x20215b = _0x105361;
            let _0x54cb80 = "";
            if (_0x20215b.thumbnail && _0x20215b.thumbnail.startsWith("data:")) {
              if (_0x20215b.thumbnail.startsWith("data:image/")) {
                _0x54cb80 = _0x20215b.thumbnail;
              } else {
                console.log("[NAISettings] 跳过NAI特殊编码的thumbnail，使用空缩略图");
              }
            }
            const _0x3dcc47 = {
              type: "vibeFile",
              vibeData: _0x20215b,
              image: _0x54cb80,
              thumbnail: _0x54cb80,
              strength: _0x20215b.importInfo?.strength ?? 0.6,
              infoExtracted: _0x20215b.importInfo?.information_extracted ?? 1,
              name: _0x20215b.name || _0x20d19b.name
            };
            this._addVibeImage(_0x3dcc47);
            console.log("[NAISettings] 已加载单个 .naiv4vibe 文件:", _0x20215b.name || _0x20d19b.name);
          } else if (Array.isArray(_0x105361)) {
            _0x105361.forEach(_0x58e3e7 => this._addVibeImage(_0x58e3e7));
          } else {
            this._addVibeImage(_0x105361);
          }
        } else if (_0x20d19b.type.startsWith("image/")) {
          const _0x2e0b7f = await this._readFileAsDataURL(_0x20d19b);
          const _0x4784c2 = {
            type: "image",
            image: _0x2e0b7f,
            strength: 0.6,
            infoExtracted: 1
          };
          this._addVibeImage(_0x4784c2);
        }
      } catch (_0x370640) {
        console.error("[NAISettings] 处理文件失败:", _0x370640);
        this.ctx.helpers.showToast("处理文件 " + _0x20d19b.name + " 失败: " + _0x370640.message, "error");
      }
    }
    this._renderVibeList();
    this._updateVibeStatus();
    this._updateActivePresetImages();
  }
  _addVibeImage(_0x3ebb8c) {
    if (this.referenceMode === "director") {
      if (!_0x3ebb8c.mode) {
        _0x3ebb8c.mode = "character";
      }
      if (_0x3ebb8c.strength === undefined) {
        _0x3ebb8c.strength = 1;
      }
      if (_0x3ebb8c.infoExtracted === undefined) {
        _0x3ebb8c.infoExtracted = 1;
      }
      if (_0x3ebb8c.secondaryStrength === undefined) {
        _0x3ebb8c.secondaryStrength = 0;
      }
      this.vibeImages.push(_0x3ebb8c);
    } else {
      this.vibeImages.push(_0x3ebb8c);
    }
  }
  async _handleGenerateVibeFiles() {
    console.log("[NAISettings] 开始生成氛围文件");
    const _0x2a1e90 = this.ctx.getModule("imageGen");
    if (!_0x2a1e90) {
      this.ctx.helpers.showToast("无法获取图像生成模块", "error");
      return;
    }
    const _0x648208 = this._getSettings();
    if (this.vibeImages.length === 0) {
      this.ctx.helpers.showToast("请先上传参考图片", "warning");
      return;
    }
    if (_0x648208.channel !== "official") {
      this.ctx.helpers.showToast("此功能仅支持官方渠道", "warning");
      return;
    }
    const _0x3b0fbb = this.vibeImages.filter(_0x2298b7 => _0x2298b7.type === "vibeFile").length;
    const _0x4cf23a = this.vibeImages.length - _0x3b0fbb;
    if (_0x3b0fbb === this.vibeImages.length) {
      this.ctx.helpers.showToast("所有图片都已经是 .naiv4vibe 文件了", "info");
      return;
    }
    const _0x598334 = _0x648208.proxyUrl ? this._removeTrailingSlash(_0x648208.proxyUrl) : this.DEFAULT_OFFICIAL_URL;
    const _0x41dcd0 = _0x598334.includes("/ai/generate-image");
    const _0x20169d = _0x41dcd0 ? _0x598334 : _0x598334 + "/ai/generate-image";
    const _0x4abc83 = _0x41dcd0 ? _0x598334.replace("/ai/generate-image", "") : _0x598334;
    const _0x33f0c9 = _0x20169d.replace("/generate-image", "/encode-vibe");
    const _0x4bf595 = _0x4abc83 + "/ai/encode-vibe";
    const _0x2a87c9 = _0x648208.model || "nai-diffusion-4-5-curated";
    console.log("[NAISettings] 当前预设:", this.activePresetName);
    console.log("[NAISettings] 待处理图片数量:", _0x4cf23a);
    console.log("[NAISettings] 使用带后缀API端点:", _0x33f0c9);
    console.log("[NAISettings] 回退API端点:", _0x4bf595);
    const _0x288a5c = this.containerEl.querySelector("#nai-vibe-generate-btn");
    if (_0x288a5c) {
      _0x288a5c.disabled = true;
      _0x288a5c.innerHTML = "<i class=\"fa-solid fa-spinner fa-spin\"></i> 生成中...";
    }
    let _0x4fe223 = 0;
    let _0x5abc44 = 0;
    for (let _0x20d363 = 0; _0x20d363 < this.vibeImages.length; _0x20d363++) {
      const _0x51625a = this.vibeImages[_0x20d363];
      if (_0x51625a.type === "vibeFile") {
        console.log("[NAISettings] 跳过已经是.naiv4vibe文件的图片 " + (_0x20d363 + 1));
        continue;
      }
      const _0x44f721 = _0x51625a.strength ?? 0.6;
      const _0x1d6cd4 = _0x51625a.infoExtracted ?? 1;
      let _0x45a443 = _0x51625a.image;
      if (!_0x45a443) {
        console.warn("[NAISettings] 图片 " + (_0x20d363 + 1) + " 缺少图片数据，跳过");
        _0x5abc44++;
        continue;
      }
      if (!_0x45a443.startsWith("data:")) {
        console.log("[NAISettings] 图片 " + (_0x20d363 + 1) + " 是服务器路径，正在转换为base64:", _0x45a443);
        try {
          _0x45a443 = await this._convertServerPathToBase64(_0x45a443);
          if (!_0x45a443) {
            console.warn("[NAISettings] 图片 " + (_0x20d363 + 1) + " 转换失败，跳过");
            _0x5abc44++;
            continue;
          }
        } catch (_0x52381b) {
          console.error("[NAISettings] 图片 " + (_0x20d363 + 1) + " 转换base64失败:", _0x52381b);
          _0x5abc44++;
          continue;
        }
      }
      const _0x260eb0 = this._generateImageHash(_0x45a443);
      if (_0x51625a._processingHash === _0x260eb0) {
        console.log("[NAISettings] 图片 " + (_0x20d363 + 1) + " 正在处理中，跳过重复请求");
        continue;
      }
      _0x51625a._processingHash = _0x260eb0;
      console.log("[NAISettings] 开始处理图片 " + (_0x20d363 + 1) + "/" + this.vibeImages.length);
      console.log("[NAISettings] 请求参数:", {
        model: _0x2a87c9,
        information_extracted: _0x1d6cd4,
        strength: _0x44f721,
        imageHash: _0x260eb0.substring(0, 16) + "..."
      });
      try {
        let _0x558cba = await this._requestVibeFile(_0x33f0c9, _0x648208.apiKey, _0x45a443, _0x1d6cd4, _0x2a87c9);
        console.log("[NAISettings] 图片 " + (_0x20d363 + 1) + " 请求成功，返回数据:", _0x558cba);
        if (_0x558cba && _0x558cba.encodings) {
          this.vibeImages[_0x20d363] = {
            type: "vibeFile",
            vibeData: _0x558cba,
            image: _0x45a443,
            thumbnail: _0x45a443,
            strength: _0x44f721,
            infoExtracted: _0x1d6cd4,
            name: _0x51625a.name || "vibe_" + Date.now() + ".naiv4vibe",
            _processingHash: undefined
          };
          _0x4fe223++;
          console.log("[NAISettings] 图片 " + (_0x20d363 + 1) + " 成功转换为.naiv4vibe文件");
        } else {
          console.error("[NAISettings] 图片 " + (_0x20d363 + 1) + " 返回数据格式错误:", _0x558cba);
          _0x5abc44++;
        }
      } catch (_0x5c8fba) {
        console.error("[NAISettings] 图片 " + (_0x20d363 + 1) + " 使用带后缀URL生成失败:", _0x5c8fba);
        try {
          console.log("[NAISettings] 图片 " + (_0x20d363 + 1) + " 尝试使用回退URL: " + _0x4bf595);
          const _0x424424 = await this._requestVibeFile(_0x4bf595, _0x648208.apiKey, _0x45a443, _0x1d6cd4, _0x2a87c9);
          console.log("[NAISettings] 图片 " + (_0x20d363 + 1) + " 使用回退URL请求成功，返回数据:", _0x424424);
          if (_0x424424 && _0x424424.encodings) {
            this.vibeImages[_0x20d363] = {
              type: "vibeFile",
              vibeData: _0x424424,
              image: _0x45a443,
              thumbnail: _0x45a443,
              strength: _0x44f721,
              infoExtracted: _0x1d6cd4,
              name: _0x51625a.name || "vibe_" + Date.now() + ".naiv4vibe",
              _processingHash: undefined
            };
            _0x4fe223++;
            console.log("[NAISettings] 图片 " + (_0x20d363 + 1) + " 使用回退URL成功转换为.naiv4vibe文件");
          } else {
            console.error("[NAISettings] 图片 " + (_0x20d363 + 1) + " 使用回退URL返回数据格式错误:", _0x424424);
            _0x5abc44++;
          }
        } catch (_0x500819) {
          console.error("[NAISettings] 图片 " + (_0x20d363 + 1) + " 使用回退URL也失败:", _0x500819);
          _0x5abc44++;
        }
        this.vibeImages[_0x20d363]._processingHash = undefined;
      }
    }
    if (_0x288a5c) {
      _0x288a5c.disabled = false;
      _0x288a5c.innerHTML = "<i class=\"fa-solid fa-wand-magic-sparkles\"></i> 生成氛围文件";
    }
    this._renderVibeList();
    this._updateVibeStatus();
    if (_0x4fe223 > 0) {
      this._updateActivePresetImages();
      this.ctx.helpers.showToast("成功生成 " + _0x4fe223 + " 个氛围文件" + (_0x5abc44 > 0 ? "，失败 " + _0x5abc44 + " 个" : ""), _0x4fe223 === _0x4cf23a ? "success" : "warning");
    } else if (_0x5abc44 > 0) {
      this.ctx.helpers.showToast("生成失败，请查看控制台日志", "error");
    }
  }
  async _requestVibeFile(_0x190992, _0x9057cc, _0x579a53, _0x3d8f81, _0x3de69f) {
    let _0x17ba9f = _0x579a53;
    if (_0x579a53.startsWith("data:")) {
      const _0x26915f = _0x579a53.indexOf(",");
      if (_0x26915f > -1) {
        _0x17ba9f = _0x579a53.substring(_0x26915f + 1);
      }
    }
    const _0x34e1c9 = {
      image: _0x17ba9f,
      information_extracted: _0x3d8f81,
      model: _0x3de69f
    };
    const _0x1fbc40 = _0x34e1c9;
    console.log("[NAISettings] 发送氛围文件请求:", {
      url: _0x190992,
      payload: {
        ..._0x1fbc40,
        image: _0x17ba9f.substring(0, 50) + "..."
      }
    });
    const _0x16cb01 = await fetch(_0x190992, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + _0x9057cc,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(_0x1fbc40)
    });
    console.log("[NAISettings] 收到响应，状态码:", _0x16cb01.status);
    console.log("[NAISettings] 响应Content-Type:", _0x16cb01.headers.get("content-type"));
    if (!_0x16cb01.ok) {
      const _0x3ec4b5 = await _0x16cb01.text();
      console.error("[NAISettings] 请求失败，响应内容:", _0x3ec4b5);
      throw new Error("API 错误 (" + _0x16cb01.status + "): " + _0x3ec4b5);
    }
    const _0x820617 = _0x16cb01.headers.get("content-type");
    let _0x4a0e44;
    if (_0x820617 && _0x820617.includes("application/json")) {
      _0x4a0e44 = await _0x16cb01.json();
      console.log("[NAISettings] 解析后的JSON响应数据:", _0x4a0e44);
    } else {
      const _0x235fdd = await _0x16cb01.blob();
      console.log("[NAISettings] 收到二进制响应，大小:", _0x235fdd.size, "bytes");
      console.log("[NAISettings] 响应类型:", _0x235fdd.type);
      const _0x446adb = new FileReader();
      _0x4a0e44 = await new Promise((_0x136249, _0x4b2ce0) => {
        _0x446adb.onloadend = () => {
          const _0x242be7 = _0x446adb.result;
          console.log("[NAISettings] 转换后的base64长度:", _0x242be7 ? _0x242be7.length : 0);
          const _0x445144 = {
            encodings: _0x242be7,
            thumbnail: _0x242be7
          };
          _0x136249(_0x445144);
        };
        _0x446adb.onerror = _0x4b2ce0;
        _0x446adb.readAsDataURL(_0x235fdd);
      });
    }
    return _0x4a0e44;
  }
  _generateImageHash(_0x4dfe22) {
    let _0x1a821d = 0;
    const _0x3302ee = _0x4dfe22.substring(0, 1000);
    for (let _0x3400c9 = 0; _0x3400c9 < _0x3302ee.length; _0x3400c9++) {
      const _0x5b20de = _0x3302ee.charCodeAt(_0x3400c9);
      _0x1a821d = (_0x1a821d << 5) - _0x1a821d + _0x5b20de;
      _0x1a821d = _0x1a821d & _0x1a821d;
    }
    return _0x1a821d.toString(36);
  }
  async _convertServerPathToBase64(_0x4bdcc5) {
    try {
      const _0x32bda5 = this.ctx.getModule("imageGen");
      if (!_0x32bda5 || !_0x32bda5.storageManager) {
        console.warn("[NAISettings] 无法获取storageManager");
        return null;
      }
      console.log("[NAISettings] 正在从服务器加载图片:", _0x4bdcc5);
      const _0x200d3f = await _0x32bda5.storageManager._loadFromTavern(_0x4bdcc5);
      if (!_0x200d3f) {
        console.warn("[NAISettings] 从服务器加载图片失败");
        return null;
      }
      return new Promise((_0x33b3a5, _0x1ef9b7) => {
        const _0x420b8e = new FileReader();
        _0x420b8e.onloadend = () => {
          _0x33b3a5(_0x420b8e.result);
        };
        _0x420b8e.onerror = _0x1ef9b7;
        _0x420b8e.readAsDataURL(_0x200d3f);
      });
    } catch (_0x480ad9) {
      console.error("[NAISettings] 转换服务器路径为base64失败:", _0x480ad9);
      return null;
    }
  }
  _renderVibeList() {
    const _0xe6d86b = this.containerEl?.querySelector("#nai-vibe-image-list");
    if (!_0xe6d86b) {
      return;
    }
    if (this.vibeImages.length === 0) {
      _0xe6d86b.innerHTML = "<p class=\"tsp-text-muted\">暂无参考图片</p>";
      return;
    }
    const _0x43dc54 = this.referenceMode === "director";
    _0xe6d86b.innerHTML = this.vibeImages.map((_0x5183b7, _0x48b45c) => {
      const _0x3edad6 = _0x5183b7.type === "vibeFile";
      const _0x2e2a9c = _0x5183b7.image || _0x5183b7.thumbnail || "";
      const _0x21339c = _0x3edad6 ? "<span style=\"font-size: 0.7em; color: var(--tsp-accent-primary); margin-left: 5px;\">.naiv4vibe</span>" : "";
      const _0x126f33 = _0x5183b7.name ? "<div style=\"font-size: 0.75em; color: var(--tsp-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;\">" + _0x5183b7.name + "</div>" : "";
      const _0x52b09a = _0x2e2a9c ? "<img src=\"" + _0x2e2a9c + "\" class=\"tsp-vibe-thumbnail\" style=\"width: 60px; height: 60px; object-fit: cover; border-radius: 6px;\">" : _0x3edad6 ? "<div class=\"tsp-vibe-thumbnail\" style=\"width: 60px; height: 60px; border-radius: 6px; background: rgba(122,162,247,0.2); display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer;\" onclick=\"document.getElementById('vibe-upload-" + _0x48b45c + "').click()\">\n                        <i class=\"fa-solid fa-upload\" style=\"font-size: 1.5em; color: var(--tsp-accent-primary);\"></i>\n                        <input type=\"file\" id=\"vibe-upload-" + _0x48b45c + "\" accept=\"image/*\" style=\"display: none;\" data-index=\"" + _0x48b45c + "\" class=\"vibe-thumbnail-upload\">\n                       </div>" : "<div class=\"tsp-vibe-thumbnail\" style=\"width: 60px; height: 60px; border-radius: 6px; background: rgba(122,162,247,0.2); display: flex; align-items: center; justify-content: center;\"><i class=\"fa-solid fa-file-code\" style=\"font-size: 1.5em; color: var(--tsp-accent-primary);\"></i></div>";
      const _0x34684a = !_0x43dc54;
      const _0x20d87f = _0x34684a ? "\n                <div class=\"tsp-slider-group\" style=\"font-size: 0.85em; margin-bottom: 4px;\">\n                    <label style=\"min-width: 50px;\">信息量</label>\n                    <input type=\"range\" class=\"tsp-slider vibe-info tsp-slider-desktop\" data-index=\"" + _0x48b45c + "\"\n                           min=\"0.01\" max=\"1\" step=\"0.01\" value=\"" + (_0x5183b7.infoExtracted ?? 1) + "\">\n                    <input type=\"number\" class=\"tsp-input vibe-info-input tsp-slider-mobile\" data-index=\"" + _0x48b45c + "\"\n                           min=\"0.01\" max=\"1\" step=\"0.01\" value=\"" + Number(_0x5183b7.infoExtracted ?? 1).toFixed(2) + "\">\n                    <span class=\"tsp-slider-value tsp-slider-desktop\">" + Number(_0x5183b7.infoExtracted ?? 1).toFixed(2) + "</span>\n                </div>" : "";
      const _0x934d0a = _0x43dc54 ? "\n                <div class=\"tsp-form-group\" style=\"font-size: 0.85em; margin-bottom: 4px;\">\n                    <label style=\"min-width: 50px;\">模式</label>\n                    <select class=\"tsp-input vibe-mode tsp-slider-desktop\" data-index=\"" + _0x48b45c + "\" style=\"flex: 1;\">\n                        <option value=\"character&style\" " + (_0x5183b7.mode === "character&style" ? "selected" : "") + ">角色+风格</option>\n                        <option value=\"character\" " + (_0x5183b7.mode === "character" || !_0x5183b7.mode ? "selected" : "") + ">角色</option>\n                        <option value=\"style\" " + (_0x5183b7.mode === "style" ? "selected" : "") + ">风格</option>\n                    </select>\n                    <select class=\"tsp-input vibe-mode-input tsp-slider-mobile\" data-index=\"" + _0x48b45c + "\" style=\"flex: 1;\">\n                        <option value=\"character&style\" " + (_0x5183b7.mode === "character&style" ? "selected" : "") + ">角色+风格</option>\n                        <option value=\"character\" " + (_0x5183b7.mode === "character" || !_0x5183b7.mode ? "selected" : "") + ">角色</option>\n                        <option value=\"style\" " + (_0x5183b7.mode === "style" ? "selected" : "") + ">风格</option>\n                    </select>\n                </div>" : "";
      const _0x3a0323 = _0x43dc54 ? "参考强度" : "强度";
      return "\n                <div class=\"tsp-vibe-item\" data-index=\"" + _0x48b45c + "\">\n                    " + _0x52b09a + "\n                    <div class=\"tsp-vibe-info\" style=\"flex: 1;\">\n                        " + _0x126f33 + "\n                        " + _0x934d0a + "\n                        " + _0x20d87f + "\n                        <div class=\"tsp-slider-group\" style=\"font-size: 0.85em;\">\n                            <label style=\"min-width: 50px;\">" + _0x3a0323 + _0x21339c + "</label>\n                            <input type=\"range\" class=\"tsp-slider vibe-strength tsp-slider-desktop\" data-index=\"" + _0x48b45c + "\"\n                                   min=\"0.01\" max=\"1\" step=\"0.01\" value=\"" + (_0x5183b7.strength ?? (_0x43dc54 ? 1 : 0.6)) + "\">\n                            <input type=\"number\" class=\"tsp-input vibe-strength-input tsp-slider-mobile\" data-index=\"" + _0x48b45c + "\"\n                                   min=\"0.01\" max=\"1\" step=\"0.01\" value=\"" + Number(_0x5183b7.strength ?? (_0x43dc54 ? 1 : 0.6)).toFixed(2) + "\">\n                            <span class=\"tsp-slider-value tsp-slider-desktop\">" + Number(_0x5183b7.strength ?? (_0x43dc54 ? 1 : 0.6)).toFixed(2) + "</span>\n                        </div>\n                        " + (_0x43dc54 ? "\n                        <div class=\"tsp-slider-group\" style=\"font-size: 0.85em;\">\n                            <label style=\"min-width: 50px;\">保真度</label>\n                            <input type=\"range\" class=\"tsp-slider vibe-fidelity tsp-slider-desktop\" data-index=\"" + _0x48b45c + "\"\n                                   min=\"0.01\" max=\"1\" step=\"0.01\" value=\"" + (_0x5183b7.infoExtracted ?? 1) + "\">\n                            <input type=\"number\" class=\"tsp-input vibe-fidelity-input tsp-slider-mobile\" data-index=\"" + _0x48b45c + "\"\n                                   min=\"0.01\" max=\"1\" step=\"0.01\" value=\"" + Number(_0x5183b7.infoExtracted ?? 1).toFixed(2) + "\">\n                            <span class=\"tsp-slider-value tsp-slider-desktop\">" + Number(_0x5183b7.infoExtracted ?? 1).toFixed(2) + "</span>\n                        </div>" : "") + "\n                    </div>\n                    <button class=\"tsp-btn tsp-btn-icon tsp-btn-danger vibe-delete\" data-index=\"" + _0x48b45c + "\">\n                        <i class=\"fa-solid fa-trash\"></i>\n                    </button>\n                </div>\n            ";
    }).join("");
    _0xe6d86b.querySelectorAll(".vibe-strength").forEach(_0x4964c1 => {
      _0x4964c1.addEventListener("input", _0x9f9d78 => {
        const _0x50797e = parseInt(_0x9f9d78.target.dataset.index);
        const _0x198a02 = parseFloat(_0x9f9d78.target.value);
        this.vibeImages[_0x50797e].strength = _0x198a02;
        const _0x436ec1 = _0x9f9d78.target.parentElement;
        _0x436ec1.querySelector(".vibe-strength-input").value = _0x198a02.toFixed(2);
        _0x436ec1.querySelector(".tsp-slider-value").textContent = _0x198a02.toFixed(2);
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-strength-input").forEach(_0x5f150b => {
      _0x5f150b.addEventListener("input", _0x4e5d14 => {
        const _0x349d23 = parseInt(_0x4e5d14.target.dataset.index);
        const _0x57a20d = parseFloat(_0x4e5d14.target.value);
        if (isNaN(_0x57a20d)) {
          return;
        }
        this.vibeImages[_0x349d23].strength = _0x57a20d;
        const _0x846cde = _0x4e5d14.target.parentElement;
        _0x846cde.querySelector(".vibe-strength").value = _0x57a20d;
        _0x846cde.querySelector(".tsp-slider-value").textContent = _0x57a20d.toFixed(2);
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-info").forEach(_0x21888b => {
      _0x21888b.addEventListener("input", _0x2c1004 => {
        const _0x464514 = parseInt(_0x2c1004.target.dataset.index);
        const _0x5ea2f4 = parseFloat(_0x2c1004.target.value);
        this.vibeImages[_0x464514].infoExtracted = _0x5ea2f4;
        const _0xf09380 = _0x2c1004.target.parentElement;
        _0xf09380.querySelector(".vibe-info-input").value = _0x5ea2f4.toFixed(2);
        _0xf09380.querySelector(".tsp-slider-value").textContent = _0x5ea2f4.toFixed(2);
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-info-input").forEach(_0x197b91 => {
      _0x197b91.addEventListener("input", _0x14d07f => {
        const _0x28f5fe = parseInt(_0x14d07f.target.dataset.index);
        const _0x407903 = parseFloat(_0x14d07f.target.value);
        if (isNaN(_0x407903)) {
          return;
        }
        this.vibeImages[_0x28f5fe].infoExtracted = _0x407903;
        const _0x307c92 = _0x14d07f.target.parentElement;
        _0x307c92.querySelector(".vibe-info").value = _0x407903;
        _0x307c92.querySelector(".tsp-slider-value").textContent = _0x407903.toFixed(2);
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-mode").forEach(_0x31e1b6 => {
      _0x31e1b6.addEventListener("change", _0x20da64 => {
        const _0x62c43d = parseInt(_0x20da64.target.dataset.index);
        this.vibeImages[_0x62c43d].mode = _0x20da64.target.value;
        const _0x8ae226 = _0x20da64.target.parentElement;
        _0x8ae226.querySelector(".vibe-mode-input").value = _0x20da64.target.value;
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-mode-input").forEach(_0x2c3ad7 => {
      _0x2c3ad7.addEventListener("change", _0x170a46 => {
        const _0x1bf4f9 = parseInt(_0x170a46.target.dataset.index);
        this.vibeImages[_0x1bf4f9].mode = _0x170a46.target.value;
        const _0x2f96fa = _0x170a46.target.parentElement;
        _0x2f96fa.querySelector(".vibe-mode").value = _0x170a46.target.value;
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-fidelity").forEach(_0x4a4f64 => {
      _0x4a4f64.addEventListener("input", _0x155bf0 => {
        const _0x55d6b9 = parseInt(_0x155bf0.target.dataset.index);
        const _0x2e855b = parseFloat(_0x155bf0.target.value);
        this.vibeImages[_0x55d6b9].infoExtracted = _0x2e855b;
        const _0x5e2e22 = _0x155bf0.target.parentElement;
        _0x5e2e22.querySelector(".vibe-fidelity-input").value = _0x2e855b.toFixed(2);
        _0x5e2e22.querySelector(".tsp-slider-value").textContent = _0x2e855b.toFixed(2);
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-fidelity-input").forEach(_0x4bc9c2 => {
      _0x4bc9c2.addEventListener("input", _0x2ebb38 => {
        const _0x54c018 = parseInt(_0x2ebb38.target.dataset.index);
        const _0xd3cac4 = parseFloat(_0x2ebb38.target.value);
        if (isNaN(_0xd3cac4)) {
          return;
        }
        this.vibeImages[_0x54c018].infoExtracted = _0xd3cac4;
        const _0x5d212b = _0x2ebb38.target.parentElement;
        _0x5d212b.querySelector(".vibe-fidelity").value = _0xd3cac4;
        _0x5d212b.querySelector(".tsp-slider-value").textContent = _0xd3cac4.toFixed(2);
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-delete").forEach(_0x7dab2 => {
      _0x7dab2.addEventListener("click", _0x1ef346 => {
        const _0x22dab4 = parseInt(_0x1ef346.currentTarget.dataset.index);
        this.vibeImages.splice(_0x22dab4, 1);
        this._renderVibeList();
        this._updateVibeStatus();
        this._updateActivePresetImages();
      });
    });
    _0xe6d86b.querySelectorAll(".vibe-thumbnail-upload").forEach(_0x1541a3 => {
      _0x1541a3.addEventListener("change", async _0x3f9ce4 => {
        const _0x22e25f = parseInt(_0x3f9ce4.target.dataset.index);
        const _0xd762a4 = _0x3f9ce4.target.files[0];
        if (!_0xd762a4) {
          return;
        }
        try {
          const _0x9d320d = await new Promise((_0x4c6da9, _0x4b0718) => {
            const _0x262f80 = new FileReader();
            _0x262f80.onloadend = () => _0x4c6da9(_0x262f80.result);
            _0x262f80.onerror = _0x4b0718;
            _0x262f80.readAsDataURL(_0xd762a4);
          });
          this.vibeImages[_0x22e25f].image = _0x9d320d;
          this.vibeImages[_0x22e25f].thumbnail = _0x9d320d;
          this._renderVibeList();
          this._updateActivePresetImages();
          this.ctx.helpers.showToast("缩略图上传成功", "success");
        } catch (_0x3c6ef0) {
          console.error("[NAISettings] 上传缩略图失败:", _0x3c6ef0);
          this.ctx.helpers.showToast("上传缩略图失败", "error");
        }
      });
    });
  }
  _renderApiPresetDropdown() {
    const _0x1a7ad8 = this.containerEl.querySelector("#nai-api-preset-select");
    if (!_0x1a7ad8) {
      return;
    }
    const _0x141dca = this._getSettings();
    this.apiPresets = _0x141dca.apiPresets || [];
    this.activeApiPreset = _0x141dca.activeApiPreset || this.apiPresets[0]?.name || "";
    _0x1a7ad8.innerHTML = "<option value=\"\">-- 新建预设 --</option>";
    this.apiPresets.forEach(_0x50b1ac => {
      const _0x9d2ecc = document.createElement("option");
      _0x9d2ecc.value = _0x50b1ac.name;
      _0x9d2ecc.textContent = _0x50b1ac.name;
      _0x1a7ad8.appendChild(_0x9d2ecc);
    });
    if (this.activeApiPreset) {
      _0x1a7ad8.value = this.activeApiPreset;
    }
  }
  _applyActiveApiPresetToUI() {
    const _0x392b54 = this.apiPresets.find(_0xe29618 => _0xe29618.name === this.activeApiPreset);
    const _0x2a715c = this.containerEl.querySelector("#nai-channel");
    const _0x377c8c = this.containerEl.querySelector("#nai-api-url");
    const _0x49e921 = this.containerEl.querySelector("#nai-token");
    const _0x248c50 = this.containerEl.querySelector("#nai-api-preset-delete");
    if (_0x392b54) {
      if (_0x2a715c) {
        _0x2a715c.value = _0x392b54.channel || "proxy";
      }
      if (_0x377c8c) {
        _0x377c8c.value = _0x392b54.proxyUrl || "";
      }
      if (_0x49e921) {
        _0x49e921.value = _0x392b54.apiKey || "";
      }
      if (_0x248c50) {
        _0x248c50.disabled = false;
      }
    } else {
      if (_0x2a715c) {
        _0x2a715c.value = "proxy";
      }
      if (_0x377c8c) {
        _0x377c8c.value = "";
      }
      if (_0x49e921) {
        _0x49e921.value = "";
      }
      if (_0x248c50) {
        _0x248c50.disabled = true;
      }
    }
    _0x2a715c?.dispatchEvent(new Event("change"));
  }
  async _saveApiPreset() {
    const _0x3f7715 = await this.ctx.helpers.promptInput("输入新 API 预设名称");
    if (!_0x3f7715 || !_0x3f7715.trim()) {
      return;
    }
    if (this.apiPresets.some(_0x194953 => _0x194953.name === _0x3f7715)) {
      this.ctx.helpers.showToast("预设名称已存在", "error");
      return;
    }
    const _0xe1434b = {
      name: _0x3f7715,
      channel: this.containerEl.querySelector("#nai-channel")?.value || "proxy",
      proxyUrl: this.containerEl.querySelector("#nai-api-url")?.value.trim() || "",
      apiKey: this.containerEl.querySelector("#nai-token")?.value.trim() || ""
    };
    this.apiPresets.push(_0xe1434b);
    this.activeApiPreset = _0x3f7715;
    this._renderApiPresetDropdown();
    this._applyActiveApiPresetToUI();
    this.ctx.helpers.showToast("API 预设已保存", "success");
  }
  async _updateApiPreset() {
    const _0x3949b2 = this.ctx.getModule("imageGen");
    const _0x5ca8d1 = _0x3949b2.settings.nai;
    if (!this.activeApiPreset) {
      this.ctx.helpers.showToast("请先选择一个预设", "warning");
      return;
    }
    const _0x459acc = _0x5ca8d1.apiPresets || [];
    const _0x2375b7 = _0x459acc.findIndex(_0x5ee269 => _0x5ee269.name === this.activeApiPreset);
    if (_0x2375b7 === -1) {
      this.ctx.helpers.showToast("预设索引丢失，请刷新面板", "error");
      return;
    }
    const _0x340835 = this.containerEl.querySelector("#nai-channel")?.value;
    const _0x5383c9 = this.containerEl.querySelector("#nai-api-url")?.value.trim();
    const _0x39a53f = this.containerEl.querySelector("#nai-token")?.value.trim();
    _0x459acc[_0x2375b7] = {
      ..._0x459acc[_0x2375b7],
      channel: _0x340835,
      proxyUrl: _0x5383c9,
      apiKey: _0x39a53f
    };
    _0x5ca8d1.apiPresets = _0x459acc;
    try {
      await _0x3949b2.saveSettings();
      this.apiPresets = JSON.parse(JSON.stringify(_0x459acc));
      this.ctx.helpers.showToast("预设 \"" + this.activeApiPreset + "\" 已更新并同步", "success");
    } catch (_0x528b7d) {
      this.ctx.helpers.showToast("保存失败: " + _0x528b7d.message, "error");
    }
  }
  async _deleteApiPreset() {
    if (!this.activeApiPreset) {
      return;
    }
    const _0x24de43 = await this.ctx.helpers.promptConfirm("确定要删除预设 \"" + this.activeApiPreset + "\" 吗?");
    if (!_0x24de43) {
      return;
    }
    const _0x4ccc54 = this.ctx.getModule("imageGen");
    if (!_0x4ccc54) {
      this.ctx.helpers.showToast("错误：找不到 imageGen 模块", "error");
      return;
    }
    this.apiPresets = this.apiPresets.filter(_0x5db39a => _0x5db39a.name !== this.activeApiPreset);
    if (_0x4ccc54.settings.nai) {
      _0x4ccc54.settings.nai.apiPresets = this.apiPresets;
    }
    this.activeApiPreset = this.apiPresets.length > 0 ? this.apiPresets[0].name : "";
    try {
      await _0x4ccc54.saveSettings();
      this.ctx.helpers.showToast("API 预设已删除", "success");
    } catch (_0x5be88c) {
      this.ctx.helpers.showToast("保存设置失败，请在关闭时手动保存", "error");
      console.error("[NAISettings] 删除预设后保存设置时出错：", _0x5be88c);
    }
    this._renderApiPresetDropdown();
    this._applyActiveApiPresetToUI();
  }
  _renderPresetDropdown() {
    const _0x5bfd64 = this.containerEl.querySelector("#nai-preset-select");
    if (!_0x5bfd64) {
      return;
    }
    _0x5bfd64.innerHTML = "<option value=\"\">-- 新建预设 --</option>";
    this.naiPresets.forEach(_0x19aedc => {
      const _0x423c81 = document.createElement("option");
      _0x423c81.value = _0x19aedc.name;
      _0x423c81.textContent = _0x19aedc.name;
      _0x423c81.selected = _0x19aedc.name === this.activePresetName;
      _0x5bfd64.appendChild(_0x423c81);
    });
  }
  _applyActivePresetToUI() {
    const _0x3872c0 = this.naiPresets.find(_0x3e5245 => _0x3e5245.name === this.activePresetName);
    const _0x370d0f = this.containerEl.querySelector("#nai-preset-triggers");
    const _0x5ce4c9 = this.containerEl.querySelector("#nai-preset-delete");
    if (_0x3872c0) {
      this.vibeImages = _0x3872c0.images || [];
      this.referenceMode = _0x3872c0.referenceMode || "vibe";
      if (_0x370d0f) {
        _0x370d0f.value = _0x3872c0.triggerWords || "";
      }
      if (_0x5ce4c9) {
        _0x5ce4c9.disabled = false;
      }
    } else {
      this.vibeImages = [];
      this.referenceMode = "vibe";
      if (_0x370d0f) {
        _0x370d0f.value = "";
      }
      if (_0x5ce4c9) {
        _0x5ce4c9.disabled = true;
      }
    }
    this._updateRefModeUI();
  }
  _updateActivePresetTriggerWords(_0x172675) {
    if (!this.activePresetName) {
      return;
    }
    const _0x4498f1 = this.naiPresets.find(_0x3faa45 => _0x3faa45.name === this.activePresetName);
    if (_0x4498f1) {
      _0x4498f1.triggerWords = _0x172675.trim();
    }
  }
  _updateActivePresetImages() {
    if (!this.activePresetName) {
      return;
    }
    const _0x5a07ec = this.naiPresets.find(_0x22d262 => _0x22d262.name === this.activePresetName);
    if (_0x5a07ec) {
      _0x5a07ec.images = JSON.parse(JSON.stringify(this.vibeImages));
      console.log("[NAISettings] 已更新预设的images数据:", _0x5a07ec.name, "图片数量:", _0x5a07ec.images.length);
      const _0x202d37 = this.ctx.getModule("imageGen");
      if (_0x202d37 && _0x202d37.storageManager) {
        _0x202d37.settings.nai.naiPresets = this.naiPresets;
        _0x202d37.saveSettings().catch(_0x3cee85 => {
          console.error("[NAISettings] 保存预设到服务器失败:", _0x3cee85);
        });
      }
    }
  }
  _removeTrailingSlash(_0xb64390) {
    return _0xb64390.replace(/\/+$/, "");
  }
  async _saveAsNewPreset() {
    const _0xf20155 = await this.ctx.helpers.promptInput("输入预设名称");
    if (!_0xf20155 || !_0xf20155.trim()) {
      return;
    }
    if (this.naiPresets.some(_0x2b571f => _0x2b571f.name === _0xf20155)) {
      this.ctx.helpers.showToast("预设名称已存在", "error");
      return;
    }
    const _0xa82650 = {
      name: _0xf20155,
      triggerWords: this.containerEl.querySelector("#nai-preset-triggers")?.value.trim() || "",
      referenceMode: this.referenceMode,
      images: JSON.parse(JSON.stringify(this.vibeImages))
    };
    this.naiPresets.push(_0xa82650);
    this.activePresetName = _0xf20155;
    this._renderPresetDropdown();
    const _0x3d621d = this.ctx.getModule("imageGen");
    if (_0x3d621d && _0x3d621d.storageManager) {
      _0x3d621d.settings.nai.naiPresets = this.naiPresets;
      try {
        await _0x3d621d.saveSettings();
      } catch (_0x19f5b3) {
        console.error("[NAISettings] 保存预设到服务器失败:", _0x19f5b3);
      }
    }
    this.ctx.helpers.showToast("预设已保存", "success");
  }
  async _deleteActivePreset() {
    if (!this.activePresetName) {
      return;
    }
    const _0xda8171 = await this.ctx.helpers.promptConfirm("确定要删除预设 \"" + this.activePresetName + "\" 吗?");
    if (!_0xda8171) {
      return;
    }
    const _0x2e5fb5 = this.naiPresets.find(_0x281e93 => _0x281e93.name === this.activePresetName);
    if (_0x2e5fb5) {
      const _0x492d1b = this.ctx.getModule("imageGen");
      if (_0x492d1b && _0x492d1b.storageManager) {
        this.ctx.helpers.showToast("正在删除服务器上的关联图片...", "info");
        try {
          await _0x492d1b.storageManager.deleteNaiPresetFiles(_0x2e5fb5);
        } catch (_0xf0f8ec) {
          this.ctx.helpers.showToast("删除服务器图片时出错，部分文件可能残留", "error");
          console.error("[NAISettings] 删除预设图片失败:", _0xf0f8ec);
        }
      }
    }
    this.naiPresets = this.naiPresets.filter(_0x2183f9 => _0x2183f9.name !== this.activePresetName);
    this.activePresetName = this.naiPresets.length > 0 ? this.naiPresets[0].name : "";
    this._renderPresetDropdown();
    this._applyActivePresetToUI();
    this.ctx.helpers.showToast("预设已删除", "success");
  }
  _updateVibeStatus() {
    const _0x526d76 = this.containerEl?.querySelector("#nai-vibe-status");
    if (!_0x526d76) {
      return;
    }
    if (this.vibeImages.length === 0) {
      _0x526d76.textContent = "";
      return;
    }
    const _0x3798b6 = this.referenceMode === "vibe" ? "氛围模式" : "人物参考模式";
    _0x526d76.textContent = "当前: " + _0x3798b6 + "，" + this.vibeImages.length + " 张参考图";
  }
  _readFileAsDataURL(_0x2110d8) {
    return new Promise((_0x3ed48e, _0x1ee266) => {
      const _0x5f4718 = new FileReader();
      _0x5f4718.onload = () => _0x3ed48e(_0x5f4718.result);
      _0x5f4718.onerror = _0x1ee266;
      _0x5f4718.readAsDataURL(_0x2110d8);
    });
  }
  _getSizePreset() {
    const _0xaac134 = parseInt(this.containerEl?.querySelector("#nai-width")?.value) || 832;
    const _0x1497bb = parseInt(this.containerEl?.querySelector("#nai-height")?.value) || 1216;
    if (_0xaac134 === 832 && _0x1497bb === 1216) {
      return "竖图";
    }
    if (_0xaac134 === 1216 && _0x1497bb === 832) {
      return "横图";
    }
    if (_0xaac134 === 1024 && _0x1497bb === 1024) {
      return "方图";
    }
    return "Custom";
  }
  collectSettings() {
    if (!this.containerEl) {
      return null;
    }
    if (this.activePresetName) {
      const _0x986bd4 = this.naiPresets.find(_0xe9c749 => _0xe9c749.name === this.activePresetName);
      if (_0x986bd4) {
        _0x986bd4.triggerWords = this.containerEl.querySelector("#nai-preset-triggers")?.value.trim() || "";
        _0x986bd4.referenceMode = this.referenceMode;
        _0x986bd4.images = JSON.parse(JSON.stringify(this.vibeImages));
      }
    }
    const _0x281f49 = this.containerEl.querySelector("#nai-api-preset-select")?.value || "";
    const _0x162523 = this.apiPresets.find(_0x43c786 => _0x43c786.name === _0x281f49);
    const _0x156ba4 = _0x162523 ? _0x162523.channel : this.containerEl.querySelector("#nai-channel")?.value || "proxy";
    const _0x2b18cc = _0x162523 ? _0x162523.proxyUrl : this.containerEl.querySelector("#nai-api-url")?.value || "";
    const _0x47dcd3 = _0x162523 ? _0x162523.apiKey : this.containerEl.querySelector("#nai-token")?.value || "";
    return {
      channel: _0x156ba4,
      proxyUrl: _0x2b18cc,
      apiKey: _0x47dcd3,
      proxyStream: this.containerEl.querySelector("#nai-proxy-stream")?.value === "true",
      model: this.containerEl.querySelector("#nai-model")?.value || "nai-diffusion-3",
      sampler: this.containerEl.querySelector("#nai-sampler")?.value || "k_euler_ancestral",
      noiseSchedule: this.containerEl.querySelector("#nai-noise-schedule")?.value || "karras",
      steps: parseInt(this.containerEl.querySelector("#nai-steps")?.value) || 28,
      scale: parseFloat(this.containerEl.querySelector("#nai-scale")?.value) || 5,
      cfgRescale: parseFloat(this.containerEl.querySelector("#nai-cfg-rescale")?.value) || 0,
      width: parseInt(this.containerEl.querySelector("#nai-width")?.value) || 832,
      height: parseInt(this.containerEl.querySelector("#nai-height")?.value) || 1216,
      sizePreset: this._getSizePreset(),
      sm: this.containerEl.querySelector("#nai-sm")?.value === "true",
      dyn: this.containerEl.querySelector("#nai-dyn")?.value === "true",
      variety: this.containerEl.querySelector("#nai-variety")?.value === "true",
      decrisper: this.containerEl.querySelector("#nai-decrisper")?.value === "true",
      multiRoleEnabled: this.containerEl.querySelector("#nai-multi-role")?.checked || false,
      useCoords: this.containerEl.querySelector("#nai-use-coords")?.value === "true",
      i2iStrength: parseFloat(this.containerEl.querySelector("#nai-strength")?.value) || 0.7,
      i2iNoise: parseFloat(this.containerEl.querySelector("#nai-noise")?.value) || 0,
      inpaintStrength: parseFloat(this.containerEl.querySelector("#nai-inpaint-strength")?.value) || 1,
      vibeEnabled: this.containerEl.querySelector("#nai-vibe-enabled")?.checked || false,
      naiTriggersEnabled: this.containerEl.querySelector("#nai-triggers-enabled")?.checked || false,
      naiPresets: this.naiPresets,
      referenceMode: this.referenceMode,
      vibeImages: this.vibeImages,
      apiPresets: this.apiPresets,
      activeApiPreset: _0x281f49,
      emotions: this._collectEmotions()
    };
  }
  _collectEmotions() {
    if (!this.containerEl) {
      return this.loadedEmotions || {};
    }
    const _0x25537c = this.containerEl.querySelectorAll(".emotion-triggers");
    if (_0x25537c.length === 0) {
      return this.loadedEmotions || {};
    }
    const _0x3dba36 = {};
    _0x25537c.forEach(_0x45134f => {
      const _0xaa879d = _0x45134f.dataset.key;
      const _0x6a4603 = _0x45134f.value.trim();
      const _0x17f9a4 = this.containerEl.querySelector(".emotion-strength[data-key=\"" + _0xaa879d + "\"]");
      const _0x3ec248 = parseInt(_0x17f9a4?.value || "0");
      if (_0x6a4603) {
        const _0xeef889 = {
          triggers: _0x6a4603,
          strength: _0x3ec248
        };
        _0x3dba36[_0xaa879d] = _0xeef889;
      }
    });
    this.loadedEmotions = _0x3dba36;
    return _0x3dba36;
  }
}
