# Implementation Plan: web-micro-qiankun

## Overview

将 `web-monolith`（Vue 3 + TypeScript + Vite）按 qiankun 微前端架构迁移至 `web-micro` pnpm monorepo。
核心原则：大部分任务是**复制代码 + 调整 import 路径**，不重写业务逻辑；新增任务集中在 qiankun 接入层。

实现顺序：Monorepo 初始化 → Shared 模块 → 主应用 → 子应用 → 集成验证。

---

## Tasks

- [x] 1. 初始化 monorepo 工程结构
  - [x] 1.1 配置根目录工程文件
    - 更新根目录 `package.json`：添加 `build:all`、`dev:main`、`dev:sub` 脚本；`build:all` 执行顺序为 `build:shared && build:sub && build:main`
    - 确认 `pnpm-workspace.yaml` 已声明 `packages: ['packages/*']`
    - 将 `web-monolith/.npmrc` 复制至根目录 `.npmrc`
    - _Requirements: 1.1, 7.3, 7.4_

  - [x] 1.2 配置根目录代码规范文件
    - 将 `web-monolith/eslint.config.ts` 复制至根目录 `eslint.config.ts`，保持规则一致
    - 将 `web-monolith/.prettierrc.yaml` 复制至根目录 `.prettierrc.yaml`
    - 将 `web-monolith/.stylelintrc.cjs` 复制至根目录 `.stylelintrc.cjs`
    - _Requirements: 1.9_

  - [x] 1.3 初始化各子包 package.json 与 tsconfig.json
    - 更新 `packages/shared/package.json`：name=`@web-micro/shared`，添加 `main`/`module`/`exports` 字段；声明 `axios`、`crypto-js`、`jsencrypt` 依赖
    - 更新 `packages/main-app/package.json`：name=`@web-micro/main-app`；声明 Vue 3、vue-router v5、pinia、element-plus、vite、qiankun ^2.x、`@fingerprintjs/fingerprintjs`、`@microsoft/fetch-event-source`、`jsencrypt`、`crypto-js`、`axios`、`nprogress` 依赖，版本与 `web-monolith/package.json` 一致；dependencies 中添加 `"@web-micro/shared": "workspace:*"`
    - 更新 `packages/app-platform/package.json`：name=`@web-micro/app-platform`；声明与 main-app 相同版本范围的 Vue 3、vue-router v5、pinia、element-plus、vite、qiankun ^2.x；dependencies 中添加 `"@web-micro/shared": "workspace:*"`
    - 将 `web-monolith/tsconfig.json` 分别复制至三个子包根目录，保留 `compilerOptions`（strict、paths、types 等）
    - _Requirements: 1.2, 1.3, 1.4, 1.8, 2.7_

- [x] 2. 迁移并适配 Shared 公共模块（@web-micro/shared）
  - [x] 2.1 创建 shared 包构建配置（Rollup）
    - 创建 `packages/shared/rollup.config.ts`：ESM 输出 `dist/index.esm.js`，CJS 输出 `dist/index.cjs.js`；external 排除 `axios`、`crypto-js`、`jsencrypt`
    - 在 `packages/shared/package.json` 中补全 `main`/`module`/`types`/`exports` 字段
    - 创建 `packages/shared/src/index.ts` 统一导出入口
    - _Requirements: 2.6, 2.8_

  - [x] 2.2 迁移 crypto.ts（完整复制）
    - 将 `web-monolith/src/utils/crypto.ts` **完整复制**至 `packages/shared/src/utils/crypto.ts`，不修改任何加解密逻辑
    - 确认保留全部导出：`encrypt.md5`、`encrypt.sha256`、`encrypt.aes`、`encrypt.taes`、`encrypt.rsa`、`encrypt.password`、`decrypt.aes`、`decrypt.taes`、`decrypt.rsa`
    - 在 `packages/shared/src/index.ts` 中 re-export `encrypt` 和 `decrypt`
    - _Requirements: 2.1, 2.9, 2.10_

  - [ ]* 2.3 写属性测试：taes 加解密 Round-Trip（Property 1）
    - **Property 1: taes 加解密 Round-Trip**
    - 使用 fast-check 对任意非空字符串明文，`encrypt.taes` 后立即 `decrypt.taes` 结果应等于原始明文（100 次迭代）
    - **Validates: Requirements 2.9**

  - [x] 2.4 迁移并改造 auth.ts（参数注入 router）
    - 将 `web-monolith/src/utils/auth.ts` 迁移至 `packages/shared/src/utils/auth.ts`
    - 保留 `AuthStorage` 对象（accessToken/refreshToken 的 localStorage/sessionStorage 切换逻辑）
    - 改造 `redirectToLogin`：将原 `import router from '@/router'` 替换为函数参数注入 `router?: Router`
    - 在 `packages/shared/src/index.ts` 中 re-export `AuthStorage` 和 `redirectToLogin`
    - _Requirements: 2.4_

  - [x] 2.5 迁移并改造 http.ts（构造函数注入 UserStore）
    - 将 `web-monolith/src/utils/http.ts` 迁移至 `packages/shared/src/utils/http.ts`
    - 保留 `AxiosWithTokenRefresh` 类、Token_Refresh_Queue 机制、`generateSignature` 函数、文件下载处理逻辑
    - 将 `useUserStoreHook()` 调用替换为构造函数参数 `userStore: UserStoreAdapter`；定义并导出 `UserStoreAdapter` 接口
    - 导出工厂函数 `createHttpInstance(config, userStore)`
    - 在 `packages/shared/src/index.ts` 中 re-export `createHttpInstance`、`UserStoreAdapter`
    - _Requirements: 2.2, 2.3_

  - [x] 2.6 迁移 common.ts 与其他依赖文件
    - 将 `web-monolith/src/utils/common.ts` 中的 `guid`、`getRangeDate`、`assert`、`passwordComplex` 迁移至 `packages/shared/src/utils/common.ts`（不迁入 `parseReturnCode`、`parseDictCode`）
    - 将 `web-monolith/src/utils/file.ts` 复制至 `packages/shared/src/utils/file.ts`（http.ts 的依赖）
    - 将 `web-monolith/src/enums/system/result.enum.ts` 复制至 `packages/shared/src/enums/result.enum.ts`
    - 将 `web-monolith/src/constants/` 中的 `STORAGE_KEYS` 等常量迁移至 `packages/shared/src/constants/index.ts`
    - 在 `packages/shared/src/index.ts` 中 re-export 上述工具
    - _Requirements: 2.5_

- [x] 3. Checkpoint — 确认 Shared 模块构建通过
  - 执行 `pnpm --filter @web-micro/shared run build`，确认以退出码 0 完成，`dist/` 目录同时存在 ESM 和 CJS 产物，如有问题请告知。


- [x] 4. 迁移主应用（Main_App）
  - [x] 4.1 配置 main-app Vite 与构建配置
    - 将 `web-monolith/vite.config.ts` 复制至 `packages/main-app/vite.config.ts`，调整如下：去除所有 UMD/lib 模式配置；`build.outDir: 'dist'`；`base: '/'`；`server.port: 7100`；保留 proxy、AutoImport、Components、UnoCSS 插件配置
    - 将 `web-monolith/uno.config.ts` 复制至 `packages/main-app/uno.config.ts`
    - 将 `web-monolith/index.html` 复制至 `packages/main-app/index.html`
    - 将 `web-monolith/public/` 整体复制至 `packages/main-app/public/`
    - 将 `web-monolith/.env.development` 和 `.env.production` 复制至 `packages/main-app/`，添加 `VITE_SUB_APP_ENTRY=http://localhost:7101` 变量
    - _Requirements: 1.6, 1.8, 1.10, 7.1_

  - [x] 4.2 迁移 main-app 全局样式、类型、枚举、常量
    - 将以下目录整体复制至 `packages/main-app/src/` 对应路径，只调整 import 路径：`styles/`、`lang/`、`types/`、`constants/`、`enums/`、`settings.ts`
    - _Requirements: 3.1_

  - [x] 4.3 迁移 Pinia stores（全部 8 个模块）
    - 将 `web-monolith/src/stores/index.ts` 和 `src/stores/modules/` 下全部 store 文件整体复制至 `packages/main-app/src/stores/`，包含：`app.store.ts`、`dict.store.ts`、`permission.store.ts`、`return-code.store.ts`、`settings.store.ts`、`tags-view.store.ts`、`tenant.store.ts`、`user.store.ts`
    - 调整所有 store 中引用 `@/utils/http` 的 import 路径为 main-app 本地 `src/api/http.ts`（该文件将在 4.4 中创建）
    - _Requirements: 3.4_

  - [x] 4.4 创建 main-app HTTP 实例（适配 Shared）
    - 创建 `packages/main-app/src/api/http.ts`：调用 `createHttpInstance` 并注入 `userStore` 适配器（`refreshToken: () => useUserStore().refreshToken()`）
    - 将 `web-monolith/src/api/auth.ts` 复制至 `packages/main-app/src/api/auth.ts`，调整 http import 路径
    - _Requirements: 2.2, 3.4_

  - [x] 4.5 迁移 Layouts（完整复制）
    - 将 `web-monolith/src/layouts/` 整体复制至 `packages/main-app/src/layouts/`，包含：`LeftLayout.vue`、`TopLayout.vue`、`MixLayout.vue`、`BaseLayout.vue`、`frame.vue`、`redirect.vue`、`index.vue`、`useLayout.ts`、`components/` 子目录
    - 调整 import 路径（`@/stores`、`@/router` 指向 main-app 本地路径）
    - 在 Layout 的内容区插槽中确认 `<div id="sub-app-container">` 存在
    - _Requirements: 3.2_

  - [x] 4.6 迁移 main-app 全局组件、指令与插件
    - 将 `web-monolith/src/components/` 中仅 Layout 依赖的全局组件复制至 `packages/main-app/src/components/`
    - 将 `web-monolith/src/directives/` 复制至 `packages/main-app/src/directives/`
    - 将 `web-monolith/src/plugins/` 复制至 `packages/main-app/src/plugins/`
    - 调整各文件 import 路径
    - _Requirements: 3.1_

  - [x] 4.7 迁移 main-app 路由（含权限守卫，扩展 visitor 白名单规则）
    - 将 `web-monolith/src/router/index.ts` 和 `router/modules/` 复制至 `packages/main-app/src/router/`，保留静态路由模块
    - 将 `web-monolith/src/router/permission.ts` 复制至 `packages/main-app/src/router/permission.ts`；将白名单判断从 `to.path.startsWith('/visitor/')` 改为 `to.path.includes('/visitor/')`，以覆盖带子应用前缀的路径（如 `/platform/visitor/**`）；调整 import 路径指向 main-app 本地 store 和 router
    - _Requirements: 3.3, 9.1_

  - [x] 4.8 迁移 main-app views（login、welcome、profile、visitor、error）
    - 将以下目录整体复制至 `packages/main-app/src/views/` 对应路径：`login/`（保留账号密码表单、MFA 步骤、RSA/AES 加密逻辑）、`welcome/`、`profile/`、`visitor/`、`error/`
    - 调整 import 路径（`@/stores`、`@/api`、`@/utils` 等指向 main-app 本地路径；`crypto`、`AuthStorage` 改为 `@web-micro/shared`）
    - _Requirements: 3.1, 3.5, 3.6_

  - [x] 4.9 新增 qiankun 注册与 Global_State 模块
    - 创建 `packages/main-app/src/micro/register.ts`：实现 `setupMicroApps()`，调用 `registerMicroApps` 注册 `app-platform`（`entry` 读取 `VITE_SUB_APP_ENTRY`，`container: '#sub-app-container'`，`activeRule: '/platform'`）；配置 `beforeMount` 钩子注入最新 token/userInfo/permissions 到 props；调用 `start({ sandbox: { experimentalStyleIsolation: true } })`
    - 创建 `packages/main-app/src/micro/global-state.ts`：实现 `initAppGlobalState()`，调用 `initGlobalState({ token: '', userInfo: {}, permissions: [], fullscreen: null, notifications: { unreadCount: 0 } })`；导出 `getGlobalActions()` 提供 `getState()`/`setState(patch)` 方法；在 `onGlobalStateChange` 中监听 `fullscreen` 信号，非 null 时同步更新 `appStore.layout.fullscreen`，并将 `fullscreen` 重置为 null
    - _Requirements: 3.7, 3.8, 5.1, 10.6, 10.7_

  - [x] 4.10 更新 main-app 入口文件（main.ts）
    - 将 `web-monolith/src/main.ts` 复制至 `packages/main-app/src/main.ts`，在原有初始化链末尾追加：`setupMicroApps()`（在 store 初始化之后）、`initAppGlobalState()`
    - 将 `web-monolith/src/App.vue` 复制至 `packages/main-app/src/App.vue`，调整 import 路径
    - _Requirements: 3.7, 3.8_

  - [x] 4.11 实现登录后写入 Global_State 与动态路由逻辑
    - 在 `user.store.ts` 的登录成功回调中调用 `getGlobalActions().setState({ token, userInfo })`
    - 在 `permission.store.ts` 的 `generateRoutes` 中收集 `moduleType === '005002'` 的 `moduleCode` 列表，调用 `getGlobalActions().setState({ permissions })`，并通过 `router.addRoute()` 注册动态路由
    - 在退出登录逻辑中调用各 store 的 `$reset()`，然后调用 `getGlobalActions().setState({ token: '', userInfo: {}, permissions: [], fullscreen: null })`，最后跳转 `/login`
    - _Requirements: 3.9, 3.10, 3.11_

  - [x] 4.12 迁移 SSE 消息通知模块（含主窗口唯一连接约束）
    - 将 `web-monolith/src/composables/sse/` 整体复制至 `packages/main-app/src/composables/sse/`，包含 `useSse.ts`、`useNoticeSync.ts`、`useDictSync.ts`、`useOnlineCount.ts`、`useEventSource.ts`、`index.ts`
    - 只调整 import 路径（`@/utils/auth` → `@web-micro/shared`，`@/utils/http` → main-app 本地 http，`@/stores` → main-app 本地 store）
    - 新增 `isMainWindow()` 辅助函数（可放在 `utils/ticket.ts` 中统一管理）：`window.opener === null` 且 URL 不含 `_ticket` 参数时返回 `true`
    - 修改 `useSse.ts` 的 `scheduleReconnect` 方法：重连前调用 `isMainWindow()`，非主窗口时跳过重连并打印 `console.warn('SSE 连接已跳过，当前窗口非主窗口：' + location.href)`
    - 在 `user.store.ts` 的 login action 末尾：调用 `isMainWindow()` 判断——主窗口时调用 `useSse().connect()` + `useNoticeSync().initialize()`，衍生窗口时仅打印 `console.warn`
    - 在 logout action 中追加 `cleanupSse()` 调用（衍生窗口调用为空操作，不报错）
    - `useNoticeSync` 收到 notify/message/todo 事件时，通过 `getGlobalActions().setState({ notifications: { unreadCount } })` 推送未读数至子应用
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 4.13 新增 Tab_Ticket 工具函数
    - 创建 `packages/main-app/src/utils/ticket.ts`（新增文件，非迁移）
    - 实现 `writeTabTicket(token: string)`：将 `{ token, timestamp: Date.now() }` 序列化后写入 `sessionStorage._tab_ticket`
    - 实现 `consumeTabTicket(): string | null`：读取并**立即删除** `sessionStorage._tab_ticket`；验证时间戳是否在 30s 内；有效则返回 token，否则返回 null
    - 将 `isMainWindow()` 函数也放入此文件（`window.opener === null` 且 URL 不含 `_ticket` 参数）
    - _Requirements: 11.1, 11.2, 11.6, 11.7_

  - [x] 4.14 实现菜单点击行为（fullscreen / target='_blank' / popup）
    - 在 Layout 侧边栏组件（`LayoutSidebar.vue` 或 `useLayout.ts`）中实现 `handleMenuClick(node)` 函数，按优先级处理四种场景：
      1. `popup=true` → `window.open(url, '_blank', 'width=1200,height=800')`
      2. `target='_blank'` → `writeTabTicket(token)` + `window.open(url + '?_ticket=1', '_blank')`
      3. `fullscreen=true` → `appStore.setFullscreen(true)` + `router.push(path + qs)`
      4. 默认 → `router.push(path + qs)`
    - 在 `permission.store.ts` 的 `parseMenuTree` 中为每个节点补全 `target`（默认 `'_self'`）和 `fullscreen`（默认 `false`）默认值
    - 菜单渲染时按 `sortIdx` 升序排序（递归所有层级）；过滤 `moduleType === '005002'` 节点不渲染；`visible=false` 节点不渲染但路由仍注册（传递性）
    - 在 `router/permission.ts` 的 `afterEach` 钩子中：查找目标路由对应菜单节点，若 `fullscreen=false` 则调用 `appStore.setFullscreen(false)` 自动重置
    - _Requirements: 3.13, 3.14, 3.15, 3.16, 3.17, 10.3, 10.4_

- [x] 5. Checkpoint — 确认主应用可独立启动
  - 执行 `pnpm --filter @web-micro/main-app run dev`，确认控制台无 TypeScript 编译错误，登录流程可用，如有问题请告知。


- [x] 6. 迁移子应用（app-platform）
  - [x] 6.1 配置 app-platform Vite 构建配置
    - 创建 `packages/app-platform/vite.config.ts`：配置 `base` 由环境变量 `VITE_APP_PUBLIC_PATH` 控制（默认 `/`）；`server.port: 7101`；`server.headers: { 'Access-Control-Allow-Origin': '*' }`；`build.lib: { entry: 'src/main.ts', name: 'app-platform', formats: ['umd'], fileName: () => 'app-platform.umd.js' }`；`build.outDir: 'dist'`；`rollupOptions.external: ['vue', 'vue-router', 'pinia', 'element-plus']`
    - 配置 `VITE_APP_USE_MOCK=true` 时禁用 proxy 并启用 `vite-plugin-mock-dev-server`，否则启用 proxy 代理至真实后端；两者同时存在时输出警告并以 mock 模式优先
    - 创建 `packages/app-platform/index.html`（Dev_Mode 独立运行入口 HTML，挂载点为 `<div id="app">`）
    - 创建 `packages/app-platform/.env.development`，添加 `VITE_APP_USE_MOCK`、`VITE_APP_BASE_API`、`VITE_APP_API_URL` 变量
    - _Requirements: 1.7, 4.9, 4.10, 6.7, 6.8, 7.2_

  - [x] 6.2 迁移 app-platform 业务 views（完整复制）
    - 将以下目录整体复制至 `packages/app-platform/src/views/` 对应路径：`web-monolith/src/views/dashboard/`、`src/views/account/`、`src/views/logs/`、`src/views/message/`、`src/views/system/`
    - 页面组件内只调整 import 路径（`@/api` 指向 app-platform 本地 api；`@/utils/crypto`、`AuthStorage` 改为 `@web-micro/shared`），不重写业务逻辑
    - _Requirements: 4.1_

  - [x] 6.3 迁移 app-platform API 文件
    - 将 `web-monolith/src/api/` 下 dashboard、account、logs、message、system 相关接口文件复制至 `packages/app-platform/src/api/`，保留全部函数签名
    - 创建 `packages/app-platform/src/api/http.ts`：调用 `createHttpInstance` 并注入子应用专用适配器（`refreshToken` 委托给 `props.setGlobalState` 通知主应用，直接 reject 不在子应用内刷新）
    - 将所有 api 文件中的 http import 路径改为指向 `src/api/http.ts`
    - _Requirements: 4.2_

  - [x] 6.4 迁移 app-platform 业务组件与 composables
    - 将 `web-monolith/src/components/` 中被业务页面使用的组件复制至 `packages/app-platform/src/components/`（排除 Layout 相关组件）
    - 将 `web-monolith/src/composables/` 中的业务 composables 复制至 `packages/app-platform/src/composables/`
    - 将 `web-monolith/src/styles/` 复制至 `packages/app-platform/src/styles/`
    - 调整所有文件的 import 路径
    - _Requirements: 4.3_

  - [x] 6.5 创建 app-platform 路由工厂（含 visitor 约定路由）
    - 创建 `packages/app-platform/src/router/routes.ts`：将 `web-monolith/src/router/modules/` 中的业务路由模块合并为静态路由表（dashboard、account、logs、message、system）；新增 `/visitor/**` 路由组，路由 meta 中标记 `noAuth: true`；将 `web-monolith/src/views/visitor/` 复制至 `packages/app-platform/src/views/visitor/`；添加 `{ path: '/:pathMatch(.*)*', component: 404.vue }` 兜底路由
    - 创建 `packages/app-platform/src/router/index.ts`：实现 `createAppRouter(props)` 工厂函数；路由守卫中对 `to.meta.noAuth === true` 或 `to.path.includes('/visitor/')` 的路由直接放行，不执行 token 校验；使用 `createWebHashHistory`
    - 创建 `packages/app-platform/src/views/error/404.vue`（包含"返回首页"可点击链接）
    - _Requirements: 4.5, 4.6, 6.2, 6.6, 9.3, 9.4, 9.5, 9.7_

  - [x] 6.6 新增 v-permission 自定义指令
    - 创建 `packages/app-platform/src/directives/permission.ts`：维护响应式 `currentPermissions: string[]`；导出 `updatePermissions(perms)`；实现指令 `mounted`/`updated` 钩子——`!hasPermission(binding.value)` 时调用 `el.parentNode?.removeChild(el)`（不使用 `display:none`）；空值/null/undefined 直接移除，不抛出异常
    - 导出 `setupPermissionDirective(app, initialProps)` 函数
    - _Requirements: 5.5, 5.6, 5.7_

  - [ ]* 6.7 写属性测试：v-permission 指令正确性（Property 3）
    - **Property 3: v-permission 指令正确性**
    - 使用 fast-check 对任意权限码和权限数组，有权限时 DOM 元素存在，无权限（含空值/null/undefined）时 DOM 元素被移除（100 次迭代）
    - **Validates: Requirements 5.5, 5.7**

  - [x] 6.8 创建 app-platform 入口文件（qiankun 生命周期 + Dev_Mode 双模）
    - 创建 `packages/app-platform/src/App.vue`（子应用根组件，仅包含 `<router-view>`）
    - 创建 `packages/app-platform/src/main.ts`：
      - 导出 `bootstrap()`：完成 Element Plus 等全局插件一次性注册，不创建 Vue 实例，返回 resolved Promise
      - 导出 `mount(props: QiankunProps)`：Prod_Mode 且 `props.token` 为空时 `reject` 并打印 `[app-platform] 缺少 token，拒绝挂载`；否则创建 Vue 实例，挂载至 `props.container.querySelector('#sub-app-container')`；调用 `props.onGlobalStateChange(callback, true)` 订阅 Global_State 并同步 token/permissions
      - 导出 `unmount()`：注销 `onGlobalStateChange` 监听器，调用 `app.unmount()` 并清空容器 innerHTML
      - 底部 Dev_Mode 判断：`!window.__POWERED_BY_QIANKUN__` 时直接 `createApp().mount('#app')`
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 5.2, 5.4, 6.1_

  - [ ]* 6.9 写属性测试：mount token 守卫（Property 2）
    - **Property 2: mount token 守卫**
    - 使用 fast-check 对任意 props 对象：`__POWERED_BY_QIANKUN__=true` 且 `token` 为空字符串时 `mount` 应 reject；`token` 为任意非空字符串时不因 token 缺失而 reject（100 次迭代）
    - **Validates: Requirements 4.8**

  - [x] 6.10 实现 Dev_Mode 独立运行支持（含 Tab_Ticket 新标签页分支）
    - 在 `packages/app-platform/src/main.ts` 的 Dev_Mode 分支中：
      - 检测 URL 是否含 `_ticket` 参数——若是，调用 `consumeTabTicket()`（从 `@web-micro/shared` 或本地 utils 导入）；token 有效则 `AuthStorage.setTokens()` 后正常挂载，无效则 `window.location.href = '/login'`
      - 若 URL 不含 `_ticket`，走普通 Dev_Mode 流程：`AuthStorage.getAccessToken()` 非空进入首页，否则挂载登录页
    - 将 `web-monolith/src/views/login/` 复制至 `packages/app-platform/src/views/login/`（复用登录组件，登录成功后调用 `AuthStorage.setTokens` 保存 token）
    - 创建 `packages/app-platform/src/stores/index.ts`（子应用独立 Pinia 实例，仅业务相关 store）
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.4, 11.5, 11.6_

- [x] 7. Checkpoint — 确认子应用可独立启动并通过构建
  - 执行 `pnpm --filter @web-micro/app-platform run dev`，确认 Dev_Mode 独立运行正常；执行 `pnpm --filter @web-micro/app-platform run build`，确认 `dist/` 中存在 UMD 格式产物，如有问题请告知。

- [x] 8. 集成验证与构建流水线
  - [x] 8.1 配置生产构建 nginx 模板
    - 创建 `packages/main-app/nginx.conf.template`：`location /` 指向 Main_App 静态产物目录；`location ^~ /platform/` 使用 `proxy_pass` 反向代理至 Sub_App 部署地址；主应用添加 history 模式 `try_files` 回退规则
    - 创建 `packages/app-platform/nginx.conf.template`：包含 `try_files $uri $uri/ /index.html` 规则，仅对非静态资源后缀（`.js`、`.css`、`.png`、`.jpg`、`.ico`、`.woff`、`.woff2`）的请求生效
    - _Requirements: 7.5, 7.6_

  - [x] 8.2 更新根目录 README.md
    - 创建/更新 `README.md`，包含以下节：主应用职责、子应用职责、monorepo 依赖关系说明、跨域注意事项、样式隔离说明、应用间通信说明、本地开发指南、生产构建与部署指南
    - _Requirements: 7.7_

  - [x] 8.3 验证 mock 目录与根 package.json 构建脚本
    - 确认 `mock/` 目录下的 `auth.js`、`index.js`、`menu.json`、`sse.js` 与子应用 mock 模式对接正确
    - 验证根 `package.json` 中 `build:all` 脚本执行顺序正确（`build:shared && build:sub && build:main`）；任一子包构建失败时整体以非零退出码退出
    - _Requirements: 7.3, 7.4, 7.8_

- [x] 9. Final Checkpoint — 确认全量构建与集成测试通过
  - 执行 `pnpm run build:all`，确认三个 `dist/` 目录均非空，退出码为 0；确认所有属性测试通过，如有问题请告知。


---

## Notes

- 标记 `*` 的子任务为可选测试任务，不阻塞主流程，可跳过以加速 MVP 交付
- 属性测试使用 **fast-check**（Vitest 环境），每个属性配置至少 100 次迭代
- 所有迁移任务的核心原则：**复制代码 + 调整 import 路径**，不重写业务逻辑
- Sub_App 构建产物通过 `rollupOptions.external` 排除 vue、vue-router、pinia、element-plus（由 Main_App 提供）
- qiankun 样式隔离使用 `experimentalStyleIsolation: true`（CSS Scoping），不使用 Shadow DOM（与 Element Plus 不兼容）
- Sub_App 使用 hash 路由（`createWebHashHistory`），避免与 Main_App history 路由冲突
- `VITE_APP_USE_MOCK=true` 与 proxy 互斥，同时存在时以 mock 优先并输出警告

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.5", "2.6"] },
    { "id": 4, "tasks": ["2.3", "4.1", "6.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.6"] },
    { "id": 6, "tasks": ["4.4", "4.5", "4.7", "4.8", "6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["4.9", "4.10", "4.13", "6.5", "6.6"] },
    { "id": 8, "tasks": ["4.11", "4.12", "4.14", "6.7", "6.8", "6.10"] },
    { "id": 9, "tasks": ["6.9"] },
    { "id": 10, "tasks": ["8.1", "8.2", "8.3"] }
  ]
}
```
