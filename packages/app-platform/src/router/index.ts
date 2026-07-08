/**
 * app-platform 路由工厂
 *
 * - 使用 createWebHashHistory（hash 模式）避免与 Main_App history 路由冲突
 * - qiankun 环境下 base 为 '/platform'，独立运行时为 '/'
 * - 路由守卫：meta.noAuth === true 或路径包含 '/visitor/' 时直接放行
 *
 * Requirements: 4.5, 4.6, 6.2, 6.6, 9.3, 9.4, 9.5, 9.7
 */

// qiankun 在子应用运行时向 window 注入此标志
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean;
  }
}

import { createRouter, createWebHashHistory, type Router } from "vue-router";
import { businessRoutes } from "./routes";

/**
 * 创建子应用路由实例。
 *
 * @param props - qiankun 注入的 props（Prod_Mode）或空对象（Dev_Mode）
 * @returns Vue Router 实例
 */
export function createAppRouter(props?: any): Router {
  const router = createRouter({
    history: createWebHashHistory(
      window.__POWERED_BY_QIANKUN__ ? "/platform" : "/"
    ),
    routes: [
      // Dev_Mode 独立运行时包含登录路由
      ...(window.__POWERED_BY_QIANKUN__
        ? []
        : [
            {
              path: "/login",
              name: "Login",
              component: () => import("@/views/login/index.vue"),
              meta: { noAuth: true },
            },
          ]),
      ...businessRoutes,
      // 404 兜底路由，匹配所有未命中路径
      {
        path: "/:pathMatch(.*)*",
        name: "NotFound",
        component: () => import("@/views/error/404.vue"),
      },
    ],
  });

  // ─── 路由守卫 ──────────────────────────────────────────────────────────────
  router.beforeEach(async (to) => {
    // 免登录路由：meta.noAuth === true 或路径中包含 /visitor/ 片段
    if (to.meta?.noAuth === true || to.path.includes("/visitor/")) {
      return true;
    }

    // 子应用内所有其他业务路由直接放行
    // 认证鉴权由 Main_App 路由守卫在激活子应用前处理；
    // Sub_App 无 token 时由 mount() 在生命周期层拒绝挂载（Prod_Mode），
    // Dev_Mode 时在 main.ts 入口判断。
    return true;
  });

  return router;
}
