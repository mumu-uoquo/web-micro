/**
 * 通用工具函数
 */

export { guid, getRangeDate, assert, passwordComplex } from "@web-micro/shared";

/**
 * 判断路径是否为外部链接（http/https/mailto/tel）
 */
export function isExternal(path: string): boolean {
  return /^(https?:|mailto:|tel:)/.test(path);
}
