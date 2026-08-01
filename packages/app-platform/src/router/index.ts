/** app-platform 路由工厂。 */

import { createMemoryHistory, createRouter, createWebHashHistory, type Router } from "vue-router";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { businessRoutes } from "./routes";

const HOST_ROUTE_PREFIX = "/platform";
let stopHostRouteBridge: (() => void) | null = null;

/** 将宿主 /#/platform/** 地址转换为子应用内部地址。 */
function getChildRouteFromHostHash(): string | null {
  const hostFullPath = window.location.hash.slice(1) || "/";
  if (hostFullPath === HOST_ROUTE_PREFIX) return "/";
  if (hostFullPath.startsWith(`${HOST_ROUTE_PREFIX}?`)) {
    return `/${hostFullPath.slice(HOST_ROUTE_PREFIX.length)}`;
  }
  if (hostFullPath.startsWith(`${HOST_ROUTE_PREFIX}/`)) {
    return hostFullPath.slice(HOST_ROUTE_PREFIX.length);
  }
  return null;
}

function getHostHashFromChildRoute(fullPath: string): string {
  return `#${HOST_ROUTE_PREFIX}${fullPath === "/" ? "" : fullPath}`;
}

/** 清理 qiankun 模式下的宿主/子应用路由桥接。 */
export function disposeAppRouter(): void {
  stopHostRouteBridge?.();
  stopHostRouteBridge = null;
}

export function createAppRouter(_props?: unknown): Router {
  const runningInQiankun = Boolean(qiankunWindow.__POWERED_BY_QIANKUN__);
  const history = runningInQiankun ? createMemoryHistory() : createWebHashHistory("/");

  // Memory History 不读取浏览器 URL，创建 Router 前先写入宿主对应的内部地址。
  if (runningInQiankun) {
    history.replace(getChildRouteFromHostHash() ?? "/");
  }

  const router = createRouter({
    history,
    routes: [
      ...(runningInQiankun
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
      {
        path: "/:pathMatch(.*)*",
        name: "NotFound",
        component: () => import("@/views/error/404.vue"),
      },
    ],
  });

  router.beforeEach(async (to) => {
    if (to.meta?.noAuth === true || to.path.includes("/visitor/")) return true;
    return true;
  });

  if (runningInQiankun) {
    disposeAppRouter();

    const syncFromHost = () => {
      const target = getChildRouteFromHostHash();
      if (target && target !== router.currentRoute.value.fullPath) {
        void router.replace(target);
      }
    };

    const hostRoutingEvent = "single-spa:routing-event";
    window.addEventListener(hostRoutingEvent, syncFromHost);
    const removeAfterEach = router.afterEach((to, _from, failure) => {
      if (failure) return;
      const targetHash = getHostHashFromChildRoute(to.fullPath);
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    });

    stopHostRouteBridge = () => {
      window.removeEventListener(hostRoutingEvent, syncFromHost);
      removeAfterEach();
    };
  }

  return router;
}
