import { ElMessage } from "element-plus";
import { AuthStorage, createHttpInstance } from "@/utils";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";

/**
 * app-platform 不直接刷新 Token。
 * 会话失效时：
 * - qiankun（生产）模式：跳转主应用登录页
 * - 独立运行（开发调试）：跳转子应用自带的登录页（hash 路由 #/login）
 */
function redirectToLogin(): never {
  AuthStorage.clearTokens();

  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const loginUrl = qiankunWindow.__POWERED_BY_QIANKUN__ ? "/login" : `${baseUrl}#/login`;

  window.location.replace(loginUrl);
  throw new Error("会话已失效，请重新登录");
}

export const http = createHttpInstance(
  {
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 15000,
  },
  {
    refreshToken: async () => redirectToLogin(),
  },
  (message) => ElMessage({ message: message || "系统出错", grouping: true, type: "error" })
);

export default http;
