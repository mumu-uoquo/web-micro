/**
 * 主题工具函数
 */

import { ThemeMode } from "@/enums";

/**
 * 生成主题颜色变量（主色 + 衍生色阶）
 */
export function generateThemeColors(
  primaryColor: string,
  _themeMode: ThemeMode
): Record<string, string> {
  return {
    "--el-color-primary": primaryColor,
  };
}

/**
 * 应用主题颜色到 CSS 变量
 */
export function applyTheme(colors: Record<string, string>): void {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * 切换暗黑模式
 */
export function toggleDarkMode(isDark: boolean): void {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

/**
 * 切换侧边栏颜色模式
 */
export function toggleSidebarColor(isClassicBlue: boolean): void {
  const html = document.documentElement;
  if (isClassicBlue) {
    html.classList.add("sidebar-classic-blue");
  } else {
    html.classList.remove("sidebar-classic-blue");
  }
}

/**
 * 监听系统主题变化
 * @returns 停止监听的函数
 */
export function watchSystemTheme(callback: (mode: ThemeMode) => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? ThemeMode.DARK : ThemeMode.LIGHT);
  };
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}

/**
 * 解析主题模式（AUTO → 根据系统偏好返回 DARK/LIGHT）
 */
export function resolveThemeMode(mode: ThemeMode): ThemeMode {
  if (mode === ThemeMode.AUTO) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? ThemeMode.DARK
      : ThemeMode.LIGHT;
  }
  return mode;
}
