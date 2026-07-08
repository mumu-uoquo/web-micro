/**
 * 通用工具函数
 * 迁移自 web-monolith/src/utils/common.ts
 *
 * - guid / getRangeDate / assert / passwordComplex: 从 @web-micro/shared 转发
 * - parseReturnCode / parseDictCode: 依赖 app-platform 本地 Pinia store，在此定义
 */

// 从 @web-micro/shared 转发（不依赖 store 的纯工具函数）
export { guid, getRangeDate, assert, passwordComplex } from "@web-micro/shared";

import { useDictStore, useReturnCodeStore } from "@/stores";

/**
 * 解析返回码
 */
export function parseReturnCode(code: string | undefined): string {
  if (!code) return "";
  const returnCodeStore = useReturnCodeStore();
  const value = returnCodeStore.getReturnCode(code);
  return value || code || "";
}

/**
 * 解析字典码
 */
export function parseDictCode(code: string | undefined): string {
  if (!code) return "";
  const dictStore = useDictStore();
  const value = dictStore.getDictionary(code);
  return value?.dicValue || code || "";
}
