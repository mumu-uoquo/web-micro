import type { RouteRecordRaw } from 'vue-router'

interface StandaloneMenuOptions {
  group?: string
  groupOrder?: number
  order?: number
}

/** 独立运行菜单元数据；未配置该元数据的路由不会出现在菜单中。 */
function standaloneMenu(title: string, options: StandaloneMenuOptions = {}) {
  return {
    standaloneMenu: true,
    title,
    menuGroup: options.group,
    menuGroupOrder: options.groupOrder ?? 0,
    menuOrder: options.order ?? 0,
  }
}

const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    redirect: '/dashboard/index',
  },
  {
    path: '/dashboard/index',
    component: () => import('@/views/dashboard/index.vue'),
    meta: standaloneMenu('仪表盘', { groupOrder: 10 }),
  },
]

const accountRoutes: RouteRecordRaw[] = [
  {
    path: '/account',
    redirect: '/account/institute/admin',
  },
  {
    path: '/account/institute/admin',
    component: () => import('@/views/account/institute/admin.vue'),
    meta: standaloneMenu('平台机构', { group: '账户管理', groupOrder: 20, order: 10 }),
  },
  {
    path: '/account/institute/index',
    component: () => import('@/views/account/institute/index.vue'),
    meta: standaloneMenu('机构管理', { group: '账户管理', groupOrder: 20, order: 20 }),
  },
  {
    path: '/account/user/admin/index',
    component: () => import('@/views/account/user/admin/index.vue'),
    meta: standaloneMenu('平台用户', { group: '账户管理', groupOrder: 20, order: 30 }),
  },
  {
    path: '/account/user/index',
    component: () => import('@/views/account/user/index.vue'),
    meta: standaloneMenu('用户管理', { group: '账户管理', groupOrder: 20, order: 40 }),
  },
  {
    path: '/account/role/admin/index',
    component: () => import('@/views/account/role/admin/index.vue'),
    meta: standaloneMenu('平台角色', { group: '账户管理', groupOrder: 20, order: 50 }),
  },
  {
    path: '/account/role/index',
    component: () => import('@/views/account/role/index.vue'),
    meta: standaloneMenu('角色管理', { group: '账户管理', groupOrder: 20, order: 60 }),
  },
]

const logsRoutes: RouteRecordRaw[] = [
  {
    path: '/logs',
    redirect: '/logs/auth',
  },
  {
    path: '/logs/auth',
    component: () => import('@/views/logs/auth.vue'),
    meta: standaloneMenu('认证日志', { group: '日志中心', groupOrder: 30, order: 10 }),
  },
  {
    path: '/logs/operation',
    component: () => import('@/views/logs/operation.vue'),
    meta: standaloneMenu('操作日志', { group: '日志中心', groupOrder: 30, order: 20 }),
  },
]

const messageRoutes: RouteRecordRaw[] = [
  {
    path: '/message',
    redirect: '/message/receiver',
  },
  {
    path: '/message/receiver',
    component: () => import('@/views/message/receiver.vue'),
    meta: standaloneMenu('收件箱', { group: '消息中心', groupOrder: 40, order: 10 }),
  },
  {
    path: '/message/sender',
    component: () => import('@/views/message/sender.vue'),
    meta: standaloneMenu('发件箱', { group: '消息中心', groupOrder: 40, order: 20 }),
  },
  {
    path: '/message/admin/list',
    component: () => import('@/views/message/admin/list.vue'),
    meta: standaloneMenu('公告管理', { group: '消息中心', groupOrder: 40, order: 30 }),
  },
  {
    path: '/message/admin/template',
    component: () => import('@/views/message/admin/template.vue'),
    meta: standaloneMenu('消息模板', { group: '消息中心', groupOrder: 40, order: 40 }),
  },
]

const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    redirect: '/system/module/index',
  },
  {
    path: '/system/module/index',
    component: () => import('@/views/system/module/index.vue'),
    meta: standaloneMenu('模块管理', { group: '系统管理', groupOrder: 50, order: 10 }),
  },
  {
    path: '/system/appinfo/index',
    component: () => import('@/views/system/appinfo/index.vue'),
    meta: standaloneMenu('应用管理', { group: '系统管理', groupOrder: 50, order: 20 }),
  },
  {
    path: '/system/dictionary/tree',
    component: () => import('@/views/system/dictionary/tree.vue'),
    meta: standaloneMenu('字典管理', { group: '系统管理', groupOrder: 50, order: 30 }),
  },
  {
    path: '/system/logs/online',
    component: () => import('@/views/system/logs/online.vue'),
    meta: standaloneMenu('在线用户', { group: '系统管理', groupOrder: 50, order: 40 }),
  },
  {
    path: '/system/logs/auth',
    component: () => import('@/views/system/logs/auth.vue'),
    meta: standaloneMenu('认证日志', { group: '系统管理', groupOrder: 50, order: 50 }),
  },
  {
    path: '/system/logs/operation',
    component: () => import('@/views/system/logs/operation.vue'),
    meta: standaloneMenu('操作日志', { group: '系统管理', groupOrder: 50, order: 60 }),
  },
  {
    path: '/system/holiday/index',
    component: () => import('@/views/system/holiday/index.vue'),
    meta: standaloneMenu('节假日', { group: '系统管理', groupOrder: 50, order: 70 }),
  },
  {
    path: '/system/settings/index',
    component: () => import('@/views/system/settings/index.vue'),
    meta: standaloneMenu('系统设置', { group: '系统管理', groupOrder: 50, order: 80 }),
  },
]

const visitorRoutes: RouteRecordRaw[] = [
  {
    path: '/visitor',
    redirect: '/visitor/index',
    meta: { noAuth: true },
  },
  {
    path: '/visitor/index',
    component: () => import('@/views/visitor/index.vue'),
    meta: { noAuth: true },
  },
  {
    path: '/visitor/:pathMatch(.*)*',
    component: () => import('@/views/visitor/dynamic.vue'),
    meta: { noAuth: true },
  },
]

const rootRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard/index',
  },
]

export const businessRoutes: RouteRecordRaw[] = [
  ...rootRoutes,
  ...dashboardRoutes,
  ...accountRoutes,
  ...logsRoutes,
  ...messageRoutes,
  ...systemRoutes,
  ...visitorRoutes,
]
