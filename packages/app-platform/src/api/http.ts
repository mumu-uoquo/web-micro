import { ElMessage } from "element-plus";
import { AuthStorage, createHttpInstance } from "@/utils";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";

/**
 * app-platform 不直接刷新 Token。
 * 会话失效（刷新失败、被踢下线、缺少令牌）时：
 * - qiankun（生产）模式：跳转主应用登录页
 * - 独立运行（开发调试）：跳转子应用自带的登录页（hash 路由 #/login）
 */
function redirectToLogin(): void {
  AuthStorage.clearTokens();

  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    // 主应用使用 hash 路由，登录页地址形如 /#/login?redirect=<当前主应用地址>，登录后回到原页面
    const current = window.location.hash.slice(1) || "/";
    if (current.startsWith("/login")) return;
    const query = encodeURIComponent(current);
    window.location.replace(
      `${window.location.pathname}${window.location.search}#/login?redirect=${query}`
    );
    // 仅改变 hash 不会刷新页面；刷新以清除主应用内存中的用户信息和动态路由
    window.location.reload();
    return;
  }

  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  window.location.replace(`${baseUrl}#/login`);
}

export const http = createHttpInstance(
  {
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 15000,
  },
  {
    // 子应用不刷新令牌：令牌失效时直接按刷新失败处理，由会话失效回调跳转登录页
    refreshToken: async () => {
      throw new Error("会话已失效，请重新登录");
    },
  },
  (message) => ElMessage({ message: message || "系统出错", grouping: true, type: "error" }),
  (reason, message) => {
    if (reason === "kick-out") {
      ElMessage.warning(message || "您的账号已在其他地方登录");
    }
    redirectToLogin();
  }
);

export default http;
