/**
 * 应用配置
 */

import {
  LayoutMode,
  ComponentSize,
  SidebarColor,
  ThemeMode,
  LanguageEnum,
  WatermarkMode,
} from "@/enums";

const env = import.meta.env;
const { pkg } = __APP_INFO__;
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

// ============================================
// 应用配置
// ============================================
export const appConfig = {
  name: pkg.name as string,
  version: pkg.version as string,
  title: (env.VITE_APP_TITLE as string) || pkg.name,

  // 功能开关
  tenantEnabled: env.VITE_APP_TENANT_ENABLED === "true",

  // 可同时打开的标签页上限（不含固定标签）。每个标签对应一个被 KeepAlive 缓存的页面实例，
  // 数量不设上限会导致内存持续增长；超出时自动关闭最早打开的标签。可用 VITE_APP_MAX_TABS 覆盖。
  maxTabs: Number(env.VITE_APP_MAX_TABS) > 0 ? Number(env.VITE_APP_MAX_TABS) : 15,
} as const;

// ============================================
// 用户偏好默认值
// ============================================
export const defaults = {
  theme: prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT,
  themeColor: "#1677FF",
  sidebarColorScheme: SidebarColor.MINIMAL_WHITE,
  layout: LayoutMode.LEFT,
  size: ComponentSize.DEFAULT,
  language: LanguageEnum.ZH_CN,
  showTagsView: true,
  showAppLogo: true,
  showWatermark: false,
  pageSwitchingAnimation: "fade-slide",
  showSettings: true,
  // 水印模式
  watermarkMode: WatermarkMode.ACCOUNT,
  watermarkContent: pkg.name,
} as const;

// ============================================
// 主题色预设
// 注意：修改默认主题色时，需要同步修改 src/styles/variables.scss 中的 primary.base 值
// ============================================
export const themeColorPresets = [
  "#1677FF",
  "#165DFF",
  "#3370FF",
  "#22C55E",
  "#FAAD14",
  "#FF4D4F",
  "#722ED1", // 优雅紫 - 高端大气
  "#EB2F96", // 品红 - 时尚个性
  "#13C2C2", // 青色 - 科技感
  "#F97316",
] as const;
