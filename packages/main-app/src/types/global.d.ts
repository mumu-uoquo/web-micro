/**
 * 全局类型声明
 *
 * @deprecated 请使用 @/types 下的具名导出
 */
declare global {
  type ApiResponse<T = any> = import("@/types/api").ApiResponse<T>;
  type BaseQueryParams = import("@/types/api").BaseQueryParams;
  type PageResult<T> = import("@/types/api").PageResult<T>;
  type OptionItem = import("@/types/api").OptionItem;
  type ExcelResult = import("@/types/api").ExcelResult;
  type TagView = import("@/types/ui").TagView;
  type AppSettings = import("@/types/ui").AppSettings;

  /**
   * Vite define 注入的应用信息
   */
  const __APP_INFO__: {
    pkg: {
      name: string;
      version: string;
    };
    buildTimestamp: number;
  };
}

export {};
