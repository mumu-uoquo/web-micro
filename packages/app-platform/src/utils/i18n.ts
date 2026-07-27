/**
 * i18n 工具函数
 */
import i18n from "@/plugins/i18n";

/**
 * 翻译路由标题
 * 如果标题是一个 i18n 键（以 "route." 开头），则翻译；否则直接返回
 */
export function translateRouteTitle(title: unknown): string {
  if (!title || typeof title !== "string") {
    return "";
  }
  const t = i18n.global.t as (key: string) => string;
  if (title.startsWith("route.")) {
    return t(title);
  }
  return title;
}
