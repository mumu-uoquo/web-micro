import type { RouteRecordRaw } from "vue-router";

const Layout = () => import("@/layouts/index.vue");
export default [
  // 非全屏错误页面
  {
    path: "/error",
    redirect: "/error/403",
    component: Layout,
    meta: { hidden: true, rank: 990 },
    children: [
      {
        path: "/error/403",
        component: () => import("@/views/error/403.vue"),
        meta: { title: "403", hidden: true },
      },
      {
        path: "/error/404",
        component: () => import("@/views/error/404.vue"),
        meta: { title: "404", hidden: true },
      },
    ],
  },
  // 全屏403页面
  {
    path: "/403",
    name: "Page403",
    component: () => import("@/views/error/403.vue"),
    meta: { title: "403", hidden: true, rank: 991 },
  },
  // 全屏404页面
  {
    path: "/404",
    name: "Page404",
    component: () => import("@/views/error/404.vue"),
    meta: { title: "404", hidden: true, rank: 992 },
  },
] satisfies Array<RouteRecordRaw>;
