/**
 * 通用工具函数
 */

export {
  AuthStorage,
  ROOT_ROLE_ID,
  STORAGE_KEYS,
  assert,
  createHttpInstance,
  decrypt,
  encrypt,
  generateSignature,
  getRangeDate,
  guid,
  passwordComplex,
  redirectToLogin,
} from "@web-micro/shared";
export type {
  UserStoreAdapter,
  SessionExpiredHandler,
  SessionExpiredReason,
} from "@web-micro/shared";
export {
  formatGrowthRate,
  formatFileSize,
  formatNumber,
  formatCurrency,
  formatDate,
  parseDate,
} from "./format";
export { configureRouteTitleTranslator, translateRouteTitle } from "./i18n";
export {
  generateThemeColors,
  applyTheme,
  toggleDarkMode,
  toggleSidebarColor,
  watchSystemTheme,
  resolveThemeMode,
} from "./theme";
export { writeTabTicket, consumeTabTicket, isMainWindow } from "./ticket";

/**
 * 判断路径是否为外部链接（http/https/mailto/tel）
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path);
}
