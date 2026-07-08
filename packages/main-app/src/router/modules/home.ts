import type { RouteRecordRaw } from "vue-router";

// 菜单国际化在 Menu 组件中处理，此处只需要保证 titile 是多语言资源的key即可
// ：$t(`route.${item.meta.title}`)

const Layout = () => import("@/layouts/index.vue");
export default {
  path: "/",
  name: "/",
  component: Layout,
  redirect: "/welcome", // 由 permission-store 将其替换为后台返回的第一个菜单
  meta: { icon: "homepage", hidden: true, rank: 0 },
  children: [
    {
      path: "welcome",
      name: "Welcome",
      component: () => import("@/views/welcome/index.vue"),
      // 用于 keep-alive 功能，需要与 SFC 中自动推导或显式声明的组件名称一致
      // 参考文档: https://cn.vuejs.org/guide/built-ins/keep-alive.html#include-exclude
      meta: { title: "welcome", icon: "homepage", affix: true },
    },
    {
      path: "profile",
      name: "Profile",
      component: () => import("@/views/profile/index.vue"),
      meta: { title: "个人中心", icon: "user", hidden: true },
    },
  ],
} satisfies RouteRecordRaw;
