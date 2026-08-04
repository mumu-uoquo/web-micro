import type { App } from "vue";
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  type RouterHistory,
  type RouteRecordRaw,
} from "vue-router";

/**
 * 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules: Record<string, any> = import.meta.glob(
  // ["./modules/**/*.ts", "!./modules/**/remaining.ts"],
  ["./modules/**/*.ts"],
  {
    eager: true,
  }
);
// 原始静态路由（未做任何处理）
export const constantRoutes: RouteRecordRaw[] = [];
Object.keys(modules).forEach((key) => {
  if (Array.isArray(modules[key].default)) {
    constantRoutes.push(...modules[key].default);
  } else {
    constantRoutes.push(modules[key].default);
  }
});

/**
 * 创建路由
 */
const router = createRouter({
  history: getHistoryMode(""),
  routes: constantRoutes,
  strict: true,
  // 刷新时，滚动条直接回到顶部
  // scrollBehavior: () => ({ left: 0, top: 0 }),
  // 刷新时，滚动条尝试定位到上一次的位置
  scrollBehavior: (to, from, savedPosition) => {
    return new Promise((resolve) => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          const top: number = document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        } else {
          resolve({ left: 0, top: 0 });
        }
      }
    });
  },
});

/**
 * 获取路由历史模式
 * https://next.router.vuejs.org/zh/guide/essentials/history-mode.html
 * https://next.router.vuejs.org/zh/api/#%E5%8F%82%E6%95%B0-1
 */
function getHistoryMode(routerHistory: string | null): RouterHistory {
  const historyMode = routerHistory?.split(",");
  const leftMode = historyMode?.[0];
  const rightMode = historyMode?.[1];
  // len为1 代表只有历史模式 为2 代表历史模式中存在base参数
  // no param
  if (historyMode?.length === 1) {
    if (leftMode === "hash") {
      return createWebHashHistory("");
    } else if (leftMode === "h5") {
      return createWebHistory("");
    }
  } //has param
  else if (historyMode?.length === 2) {
    if (leftMode === "hash") {
      return createWebHashHistory(rightMode);
    } else if (leftMode === "h5") {
      return createWebHistory(rightMode);
    }
  }
  // 无指定时使用默认模式
  return createWebHashHistory();
}

// 全局注册 router
export function setupRouter(app: App<Element>) {
  app.use(router);
}
export default router;
