/**
 * 通用工具函数
 * 迁移自 web-monolith/src/utils/common.ts
 */

interface CodeResolvers {
  getReturnCode: (code: string) => string | undefined;
  getDictionary: (code: string) => { dicValue?: string } | undefined;
}

let codeResolvers: CodeResolvers | undefined;

export function configureCodeResolvers(resolvers: CodeResolvers): void {
  codeResolvers = resolvers;
}

/**
 * 解析返回码
 */
export function parseReturnCode(code: string | undefined): string {
  if (!code) return "";
  const value = codeResolvers?.getReturnCode(code);
  return value || code;
}

/**
 * 解析字典码
 */
export function parseDictCode(code: string | undefined): string {
  if (!code) return "";
  const value = codeResolvers?.getDictionary(code);
  return value?.dicValue || code;
}
