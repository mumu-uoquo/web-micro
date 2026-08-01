import type { RouteLocationNormalized } from "vue-router";
import NProgress from "@/plugins/nprogress";
import router from "@/router";
import { redirectToLogin } from "@web-micro/shared";
import { usePermissionStore, useUserStore, useAppStore } from "@/stores";

export function setupPermissionGuard() {
  // 白名单（无需登录的页面：登录页、全屏错误页）
  const whiteList = ["/login", "/403", "/404"];

  /**
   * 路由守卫支持的返回类型：
   * true: 放行
   * false: 拦截
   * {path: "/"} 跳转到首页
   * {path: "/login", query: {redirect: to.fullPath}} 跳转到登录页并带上 redirect 参数
   *
   * 注意：异步操作时必须使用 next(); 不能直接 return true;
   */
  router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    const permissionStore = usePermissionStore();
    const userStore = useUserStore();
    NProgress.start();

    try {
      // 白名单处理
      // 使用 includes 而非 startsWith，以覆盖带子应用前缀的路径（如 /platform/visitor/**）
      if (whiteList.includes(to.path) || to.path.includes("/visitor/")) {
        return true;
      }

      const isLoggedIn = userStore.isLoggedIn();

      // 1. 未登录处理
      if (!isLoggedIn) {
        throw new Error("无权访问，请登录后再试");
      }

      // 2. 已登录且访问登录页，重定向到首页
      if (to.path === "/login") {
        return { path: "/" };
      }

      // 3. 已登录用户的正常访问
      if (!permissionStore.isDynamicRoutesGenerated) {
        // 路由未生成则生成
        const userInfo = await userStore.getUserInfo();
        if (!userInfo.currentRoleId) {
          throw new Error("无用户角色信息，请重新登录");
        }
        // 获取登录用户角色的授权信息
        // generateRoutes 内部已经完成 router.addRoute，避免重复注册同名路由。
        await permissionStore.generateRoutes(userInfo.currentRoleId);
        return { ...to, replace: true };
      }

      // 检查路由是否存在
      if (to.matched.length === 0) {
        return { path: "/error/404" };
      }

      return true;
    } catch (error: unknown) {
      console.error("❌ Route guard error:", error);
      const message = error instanceof Error ? error.message : "请重新登录";
      return redirectToLogin(message, true, { fullPath: to.fullPath }, router);
    } finally {
      NProgress.done();
    }
  });

  // 后置守卫，保证每次路由跳转结束时关闭进度条
  // 同时检查目标路由对应的菜单节点，若 fullscreen=false 则自动重置全屏状态
  router.afterEach((to) => {
    NProgress.done();

    // 自动重置全屏状态：目标路由对应菜单节点 fullscreen=false 时取消全屏
    const permissionStore = usePermissionStore();
    const appStore = useAppStore();
    const matchedMenu = permissionStore.findMenuByPath(to.path);
    if (matchedMenu && !matchedMenu.fullscreen) {
      appStore.setFullscreen(false);
    }
  });
}
