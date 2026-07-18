import { SidebarColor, ThemeMode } from "@/enums";
import type { LayoutMode } from "@/enums";
import {
  applyTheme,
  generateThemeColors,
  resolveThemeMode,
  toggleDarkMode,
  toggleSidebarColor,
  watchSystemTheme,
} from "@/utils/theme";
import { STORAGE_KEYS } from "@web-micro/shared";
import { defaults } from "@/settings";
import SystemAPI from "@/api/system";
import { decrypt } from "@web-micro/shared";

// ─────────────────────────────────────────────
// 公共系统配置（内存中，每次 load() 重新获取）
// ─────────────────────────────────────────────

/** 支持的登录方式 key */
export type LoginMode = "account" | "sms" | "wechat" | "wecom" | "emerg";

interface PublicConfig {
  /** AES 密钥：security.aes.key */
  aesKey: string;
  /** RSA 公钥：security.rsa.public-key */
  rsaPublicKey: string;
  /** 本地与服务器的时间差（ms），正值表示服务器比本地快 */
  serverTimeDiff: number;
  /** 是否强制开启水印：sys.watermark.enabled */
  watermarkEnable: boolean;
  /** 已启用的登录方式（顺序与后端配置一致） */
  enabledLoginModes: LoginMode[];
  /** 是否开启用户注册（sys.register.enabled） */
  registerEnabled: boolean;
}

const _publicConfig = ref<PublicConfig>({
  aesKey: "",
  rsaPublicKey: "",
  serverTimeDiff: 0,
  watermarkEnable: false,
  enabledLoginModes: ["account"],
  registerEnabled: false,
});

export const useSettingsStore = defineStore("setting", () => {
  // 界面显示
  const settingsVisible = ref(false);
  const showTagsView = useStorage(STORAGE_KEYS.SHOW_TAGS_VIEW, defaults.showTagsView);
  const showAppLogo = useStorage(STORAGE_KEYS.SHOW_APP_LOGO, defaults.showAppLogo);
  const showWatermark = useStorage(STORAGE_KEYS.SHOW_WATERMARK, defaults.showWatermark);
  const pageSwitchingAnimation = useStorage(
    STORAGE_KEYS.PAGE_SWITCHING_ANIMATION,
    defaults.pageSwitchingAnimation
  );

  // 布局
  const layout = useStorage<LayoutMode>(STORAGE_KEYS.LAYOUT, defaults.layout as LayoutMode);
  const sidebarColorScheme = useStorage(
    STORAGE_KEYS.SIDEBAR_COLOR_SCHEME,
    defaults.sidebarColorScheme
  );

  // 主题
  const theme = useStorage<ThemeMode>(STORAGE_KEYS.THEME, defaults.theme);
  const themeColor = useStorage(STORAGE_KEYS.THEME_COLOR, defaults.themeColor);

  // 旧默认值 → 新默认值 自动迁移（用户自定义的颜色不会被覆盖）
  const LEGACY_DEFAULTS = ["#4080FF", "#4080ff", "#2563EB", "#2563eb"];
  if (LEGACY_DEFAULTS.includes(themeColor.value)) {
    themeColor.value = defaults.themeColor;
  }
  const resolvedTheme = ref<ThemeMode>(resolveThemeMode(theme.value));

  // 特殊模式
  const grayMode = useStorage(STORAGE_KEYS.GRAY_MODE, false);
  const colorWeak = useStorage(STORAGE_KEYS.COLOR_WEAK, false);

  // 主题变化监听
  let stopWatchingSystemTheme: (() => void) | undefined;

  watch(
    theme,
    (value) => {
      stopWatchingSystemTheme?.();
      resolvedTheme.value = resolveThemeMode(value);

      if (value === ThemeMode.AUTO) {
        stopWatchingSystemTheme = watchSystemTheme((systemTheme) => {
          resolvedTheme.value = systemTheme;
        });
      } else {
        stopWatchingSystemTheme = undefined;
      }
    },
    { immediate: true }
  );

  watch(
    [resolvedTheme, themeColor],
    ([t, c]: [ThemeMode, string]) => {
      toggleDarkMode(t === ThemeMode.DARK);
      applyTheme(generateThemeColors(c, t));
    },
    { immediate: true }
  );

  watch(sidebarColorScheme, (v) => toggleSidebarColor(v === SidebarColor.CLASSIC_BLUE), {
    immediate: true,
  });

  // 灰色模式监听
  watch(
    grayMode,
    (v) => {
      document.documentElement.style.filter = v ? "grayscale(100%)" : "";
    },
    { immediate: true }
  );

  // 色弱模式监听
  watch(
    colorWeak,
    (v) => {
      document.documentElement.classList.toggle("color-weak", v);
    },
    { immediate: true }
  );

  function resetSettings() {
    showTagsView.value = defaults.showTagsView;
    showAppLogo.value = defaults.showAppLogo;
    showWatermark.value = defaults.showWatermark;
    pageSwitchingAnimation.value = defaults.pageSwitchingAnimation;
    grayMode.value = false;
    colorWeak.value = false;
    sidebarColorScheme.value = defaults.sidebarColorScheme;
    layout.value = defaults.layout as LayoutMode;
    themeColor.value = defaults.themeColor;
    theme.value = defaults.theme;
  }

  /**
   * 加载公共系统配置
   * - 清空现有缓存
   * - 从服务端拉取 listPublicSettings
   * - configValue 使用 taes 解密
   * - 解析并暴露常用配置
   */
  async function loadServerSettings() {
    // 清空现有缓存
    _publicConfig.value = {
      aesKey: "",
      rsaPublicKey: "",
      serverTimeDiff: 0,
      watermarkEnable: false,
      enabledLoginModes: ["account"],
      registerEnabled: false,
    };

    try {
      const localTimeBefore = Date.now();
      const settings = await SystemAPI.listPublicSettings({ prefix: "" });
      const localTimeAfter = Date.now();

      const get = (code: string) => {
        const item = settings.find((s) => s.configCode === code);
        if (!item?.configValue) return "";
        // 对 configValue 做 taes 解密，解密失败时降级返回原文
        try {
          return decrypt.taes(item.configValue) || item.configValue;
        } catch {
          return item.configValue;
        }
      };

      // AES 密钥
      _publicConfig.value.aesKey = get("security.aes.key");

      // RSA 公钥
      _publicConfig.value.rsaPublicKey = get("security.rsa.public-key");

      // 水印开关
      const watermarkRaw = get("sys.watermark.enabled");
      _publicConfig.value.watermarkEnable = watermarkRaw === "true";
      if (_publicConfig.value.watermarkEnable) {
        showWatermark.value = true;
      }

      // 服务器时间差：server.time 存的是服务器时间戳（ms）
      const serverTimeRaw = get("server.time");
      if (serverTimeRaw) {
        const serverTs = Number(serverTimeRaw);
        if (!isNaN(serverTs)) {
          // 用请求往返的中间点估算服务器时间
          const localMid = Math.floor((localTimeBefore + localTimeAfter) / 2);
          _publicConfig.value.serverTimeDiff = serverTs - localMid;
        }
      }

      // 登录方式：按 password / sms / wechat / wecom / emerg 顺序采集已启用的项
      const LOGIN_MODE_KEYS: Array<{ code: string; mode: LoginMode }> = [
        { code: "login.account.enabled", mode: "account" },
        { code: "login.sms.enabled", mode: "sms" },
        { code: "login.wechat.enabled", mode: "wechat" },
        { code: "login.wecom.enabled", mode: "wecom" },
        { code: "login.emerg.enabled", mode: "emerg" },
      ];
      const modes: LoginMode[] = LOGIN_MODE_KEYS.filter(({ code }) => get(code) === "true").map(
        ({ mode }) => mode
      );
      // 至少保留账号密码，防止后端未配置时全空
      _publicConfig.value.enabledLoginModes = modes.length > 0 ? modes : ["account"];

      // 注册开关：sys.register.enabled，未配置时默认关闭
      _publicConfig.value.registerEnabled = get("sys.register.enabled") === "true";
    } catch {
      // 加载失败不影响正常使用，保持默认空值
    }
  }

  // ── 常用配置的只读访问器 ──────────────────────────

  /** AES 密钥（security.aes.key） */
  const aesKey = computed(() => _publicConfig.value.aesKey);

  /** RSA 公钥（security.rsa.public-key） */
  const rsaPublicKey = computed(() => _publicConfig.value.rsaPublicKey);

  /**
   * 本地与服务器的时间差（ms）
   * 正值表示服务器时间比本地快，使用示例：
   *   const serverNow = Date.now() + settingsStore.serverTimeDiff
   */
  const serverTimeDiff = computed(() => _publicConfig.value.serverTimeDiff);

  /** 已启用的登录方式列表（由后端 login.**.enabled 配置决定） */
  const enabledLoginModes = computed(() => _publicConfig.value.enabledLoginModes);

  /** 是否开启用户注册（sys.register.enabled） */
  const registerEnabled = computed(() => _publicConfig.value.registerEnabled);

  return {
    settingsVisible,
    showTagsView,
    showAppLogo,
    showWatermark,
    pageSwitchingAnimation,
    grayMode,
    colorWeak,
    sidebarColorScheme,
    layout,
    themeColor,
    theme,
    resolvedTheme,
    resetSettings,
    loadServerSettings,
    // 常用系统配置
    aesKey,
    rsaPublicKey,
    serverTimeDiff,
    enabledLoginModes,
    registerEnabled,
  };
});
