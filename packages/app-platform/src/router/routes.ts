/**
 * app-platform 静态业务路由表
 *
 * 包含：
 *  - dashboard（仪表盘）
 *  - account（账户管理：机构、用户、角色）
 *  - logs（日志中心）
 *  - message（消息中心）
 *  - system（系统管理）
 *  - visitor（免登录访客路由，meta.noAuth = true）
 *
 * 404 兜底路由由 router/index.ts 统一追加，不在此处声明。
 */
import type { RouteRecordRaw } from "vue-router";

// ─── Dashboard ───────────────────────────────────────────────────────────────
const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: "/dashboard",
    redirect: "/dashboard/index",
  },
  {
    path: "/dashboard/index",
    component: () => import("@/views/dashboard/index.vue"),
  },
];

// ─── Account ─────────────────────────────────────────────────────────────────
const accountRoutes: RouteRecordRaw[] = [
  {
    path: "/account",
    redirect: "/account/institute/admin",
  },
  {
    path: "/account/institute/admin",
    component: () => import("@/views/account/institute/admin.vue"),
  },
  {
    path: "/account/institute/index",
    component: () => import("@/views/account/institute/index.vue"),
  },
  {
    path: "/account/user/admin/index",
    component: () => import("@/views/account/user/admin/index.vue"),
  },
  {
    path: "/account/user/index",
    component: () => import("@/views/account/user/index.vue"),
  },
  {
    path: "/account/role/admin/index",
    component: () => import("@/views/account/role/admin/index.vue"),
  },
  {
    path: "/account/role/index",
    component: () => import("@/views/account/role/index.vue"),
  },
];

// ─── Logs ─────────────────────────────────────────────────────────────────────
const logsRoutes: RouteRecordRaw[] = [
  {
    path: "/logs",
    redirect: "/logs/auth",
  },
  {
    path: "/logs/auth",
    component: () => import("@/views/logs/auth.vue"),
  },
  {
    path: "/logs/operation",
    component: () => import("@/views/logs/operation.vue"),
  },
];

// ─── Message ──────────────────────────────────────────────────────────────────
const messageRoutes: RouteRecordRaw[] = [
  {
    path: "/message",
    redirect: "/message/receiver",
  },
  {
    path: "/message/receiver",
    component: () => import("@/views/message/receiver.vue"),
  },
  {
    path: "/message/sender",
    component: () => import("@/views/message/sender.vue"),
  },
  {
    path: "/message/admin/list",
    component: () => import("@/views/message/admin/list.vue"),
  },
  {
    path: "/message/admin/template",
    component: () => import("@/views/message/admin/template.vue"),
  },
];

// ─── System ───────────────────────────────────────────────────────────────────
const systemRoutes: RouteRecordRaw[] = [
  {
    path: "/system",
    redirect: "/system/module/index",
  },
  {
    path: "/system/module/index",
    component: () => import("@/views/system/module/index.vue"),
  },
  {
    path: "/system/appinfo/index",
    component: () => import("@/views/system/appinfo/index.vue"),
  },
  {
    path: "/system/dictionary/tree",
    component: () => import("@/views/system/dictionary/tree.vue"),
  },
  {
    path: "/system/logs/online",
    component: () => import("@/views/system/logs/online.vue"),
  },
  {
    path: "/system/logs/auth",
    component: () => import("@/views/system/logs/auth.vue"),
  },
  {
    path: "/system/logs/operation",
    component: () => import("@/views/system/logs/operation.vue"),
  },
  {
    path: "/system/holiday/index",
    component: () => import("@/views/system/holiday/index.vue"),
  },
  {
    path: "/system/settings/index",
    component: () => import("@/views/system/settings/index.vue"),
  },
];

// ─── Visitor（免登录约定路由） ────────────────────────────────────────────────
// 路由 meta.noAuth = true，守卫直接放行，无需 token 校验
const visitorRoutes: RouteRecordRaw[] = [
  {
    path: "/visitor",
    redirect: "/visitor/index",
    meta: { noAuth: true },
  },
  {
    path: "/visitor/index",
    component: () => import("@/views/visitor/index.vue"),
    meta: { noAuth: true },
  },
  {
    // 动态路由：支持任意 /visitor/** 路径，由 dynamic.vue 按路径懒加载对应组件
    path: "/visitor/:pathMatch(.*)*",
    component: () => import("@/views/visitor/dynamic.vue"),
    meta: { noAuth: true },
  },
];

// ─── 根路由重定向 ─────────────────────────────────────────────────────────────
const rootRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard/index",
  },
];

/**
 * 合并后的业务路由表，供 router/index.ts 使用。
 * 不含 404 兜底路由（由 createAppRouter 追加）。
 */
export const businessRoutes: RouteRecordRaw[] = [
  ...rootRoutes,
  ...dashboardRoutes,
  ...accountRoutes,
  ...logsRoutes,
  ...messageRoutes,
  ...systemRoutes,
  ...visitorRoutes,
];
