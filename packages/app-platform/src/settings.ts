/**
 * app-platform 应用配置
 *
 * Dev_Mode 下独立运行时使用的应用配置，
 * Prod_Mode 下通过 qiankun Global_State 从主应用获取。
 *
 * Requirements: 6.1, 6.2
 */

const env = import.meta.env;

export const appConfig = {
  name: "app-platform",
  version: env.VITE_APP_VERSION || "1.0.0",
  title: (env.VITE_APP_TITLE as string) || "业务平台",
  tenantEnabled: env.VITE_APP_TENANT_ENABLED === "true",
} as const;
