import type { RouteRecordRaw } from "vue-router";

const Layout = () => import("@/layouts/index.vue");

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
] satisfies Array<RouteRecordRaw>;
