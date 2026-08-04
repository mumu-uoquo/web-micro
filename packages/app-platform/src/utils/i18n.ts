/**
 * i18n 工具函数
 */

type RouteTitleTranslator = (key: string) => string;

let routeTitleTranslator: RouteTitleTranslator | undefined;

export function configureRouteTitleTranslator(translator: RouteTitleTranslator): void {
  routeTitleTranslator = translator;
}

/**
 * 翻译路由标题
 * 如果标题是一个 i18n 键（以 "route." 开头），则翻译；否则直接返回
 */
export function translateRouteTitle(title: unknown): string {
  if (!title || typeof title !== "string") {
    return "";
  }
  if (title.startsWith("route.")) {
    return routeTitleTranslator?.(title) ?? title;
  }
  return title;
}
