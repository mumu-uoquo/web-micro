export {
  AuthStorage,
  STORAGE_KEYS,
  assert,
  createHttpInstance,
  decrypt,
  encrypt,
  getRangeDate,
  guid,
  passwordComplex,
} from "@web-micro/shared";
export { configureCodeResolvers, parseReturnCode, parseDictCode } from "./common";
export {
  formatGrowthRate,
  formatFileSize,
  formatNumber,
  formatCurrency,
  formatDate,
  parseDate,
} from "./format";
export { configureRouteTitleTranslator, translateRouteTitle } from "./i18n";
export { consumeTabTicket, isMainWindow } from "./ticket";
export { default as FileUtil } from "./file";
export type { UploadConfigParam } from "./file";
