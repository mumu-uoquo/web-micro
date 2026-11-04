import type { RouteRecordRaw } from "vue-router";
import { MICRO_APP_CONFIGS } from "@/micro/config";

const Layout = () => import("@/layouts/index.vue");

/**
 * 子应用的访客页面（/<子应用前缀>/visitor/**）：无需登录的全屏页面，不带主框架。
 * 主应用不承载任何业务页面，这里只提供子应用的挂载容器，页面由 qiankun 加载子应用渲染。
 * 路由守卫已对包含 /visitor/ 的路径放行（见 router/permission.ts）。
 */
const microVisitorRoutes: RouteRecordRaw[] = MICRO_APP_CONFIGS.map((config) => ({
  path: `${config.activeRule}/visitor/:path(.*)*`,
  name: `MicroVisitor-${config.name}`,
  component: () => import("@/micro/MicroAppHost.vue"),
  meta: { title: "visitor", hidden: true, microApp: config.name },
}));

export default [
  // 登录页面
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: { title: "login", hidden: true },
  },
  // 内部：主框架显示区
  {
    path: "/redirect",
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layouts/redirect.vue"),
        meta: { title: "redirect", hidden: true },
      },
      {
        path: "/iframe/:src(.*)",
        name: "Iframe",
        component: () => import("@/layouts/frame.vue"),
        meta: { title: "iframe", hidden: true },
      },
    ],
  },
  // 访客页面：无需登录的页面（全屏）
  {
    path: "/visitor/:path(.*)*",
    component: () => import("@/views/visitor/dynamic.vue"),
    meta: { title: "visitor", hidden: true },
  },
  // 子应用访客页面：/platform/visitor/**、/operate/visitor/** 等
  ...microVisitorRoutes,
] satisfies Array<RouteRecordRaw>;
