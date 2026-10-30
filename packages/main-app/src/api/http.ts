import { createHttpInstance } from "@/utils";
import type { UserStoreAdapter, SessionExpiredHandler } from "@/utils";
import router from "@/router";
import { useUserStore } from "@/stores";
import { ElMessage } from "element-plus";

/** 避免同一次会话失效触发多次清理和跳转 */
let sessionExpiredHandling = false;

/**
 * 会话失效处理：清理本地登录态后跳转登录页。
 *
 * shared 的 HTTP 层不依赖路由实例，刷新令牌失败、被踢下线、缺少令牌时只回调这里，
 * 由主应用负责跳转。否则页面刷新后令牌已失效时，路由守卫中等待用户信息的请求被丢弃，
 * 页面会一直停在空白。
 */
const handleSessionExpired: SessionExpiredHandler = (reason, message) => {
  if (sessionExpiredHandling) return;
  sessionExpiredHandling = true;

  if (reason === "kick-out") {
    ElMessage.warning(message || "您的账号已在其他地方登录");
  }

  // hash 路由下，地址栏的 hash 就是用户想访问的地址（首次加载时 currentRoute 还未解析）
  const target = window.location.hash.slice(1) || "/";
  void useUserStore().resetAllState();
  if (!target.startsWith("/login")) {
    void router.push({ path: "/login", query: { redirect: target } });
  }
  // 登录页路由已切换后再放开，允许下次会话失效时再次处理
  setTimeout(() => {
    sessionExpiredHandling = false;
  }, 1000);
};

/**
 * main-app 的 UserStore 适配器
 * 将 Pinia useUserStore().refreshToken() 包装为 UserStoreAdapter 接口
 */
const userStoreAdapter: UserStoreAdapter = {
  refreshToken: () => useUserStore().refreshToken(),
};

/**
 * main-app 全局 HTTP 实例
 *
 * 通过 createHttpInstance 工厂函数创建，注入 userStore 适配器以支持
 * Token 自动刷新队列机制。
 *
 * Requirements: 2.2, 3.4
 */
export const http = createHttpInstance(
  {
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 15000,
  },
  userStoreAdapter,
  (message) => ElMessage({ message: message || "系统出错", grouping: true, type: "error" }),
  handleSessionExpired
);

export default http;
