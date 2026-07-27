import { ElMessage } from "element-plus";
import { AuthStorage, createHttpInstance } from "@web-micro/shared";

/**
 * app-platform 不直接刷新 Token。
 * 会话失效时，独立运行跳转子应用登录页；qiankun 模式跳转主应用登录页。
 */
function redirectToLogin(): never {
  AuthStorage.clearTokens();

  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const loginUrl = window.__POWERED_BY_QIANKUN__ ? "/login" : `${baseUrl}#/login`;

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
