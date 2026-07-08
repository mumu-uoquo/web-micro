# Requirements Document

## Introduction

本文档描述将现有单体前端项目（`web-monolith`）按 qiankun 微前端架构拆分并迁移至 `web-micro` 的完整需求。这是一项代码迁移拆分任务，业务逻辑、页面组件和工具函数在迁移过程中不得重写，只允许最小必要的 import 路径调整和 qiankun 适配改造。

原项目技术栈：Vue 3 + TypeScript + Vite + Pinia + Element Plus + vue-router v5。目标项目延续相同技术栈，通过 pnpm monorepo 组织三个子包：`packages/main-app`（主应用基座）、`packages/app-platform`（业务子应用）、`packages/shared`（公共模块）。

**布局归属主应用**：所有 Layout 布局（LeftLayout / TopLayout / MixLayout / BaseLayout 等）完全由 Main_App 负责渲染，Sub_App 仅渲染内容区域的业务页面，不包含任何 Layout 外壳部分。

**子应用路由策略**：在 Dev_Mode 下，Sub_App 可脱离 Main_App 独立运行，使用本地静态路由；在 Prod_Mode 下，Sub_App 由 Main_App 通过 qiankun 加载，接收 Global_State 中的 token 和权限信息。

**visitor 约定入口**：`/visitor/` 是各子应用约定的免登录公开入口。主应用路由守卫识别路径中含 `/visitor/` 片段的请求（包括子应用前缀，如 `/platform/visitor/**`），直接放行，不校验登录状态，由对应子应用自行渲染。主应用自身也保留 `/visitor/` 路由用于主应用级别的公开页面。

**SSE 归属主应用**：SSE 长连接（消息通知、心跳、踢下线）由 Main_App 统一管理，使用全局单例 `useSse`。子应用需要接收推送数据时，通过 Global_State 获取，不直接建立 SSE 连接，避免多个子应用重复连接消耗服务端资源。


---

## Glossary

- **Main_App**：主应用（基座），位于 `packages/main-app`，负责登录鉴权（含 MFA）、Layout 渲染、路由守卫、全局 Pinia store、子应用注册与生命周期管理。技术栈：Vue 3 + TypeScript + Vite + Pinia + Element Plus + vue-router v5。
- **Sub_App**：业务子应用，即 `app-platform`（`packages/app-platform`），承载所有业务页面（dashboard、account、logs、message、system 等）；Sub_App 仅渲染内容区域，不渲染任何 Layout 外壳。
- **Shared_Module**：公共模块（`packages/shared`），以 `@web-micro/shared` 包名发布，提供 HTTP 请求封装（含 token 刷新队列、签名机制）和 crypto 加解密工具（含时间因子 AES、RSA、MD5）。
- **Layout_Module**：原 `web-monolith/src/layouts/` 下的全套布局组件（LeftLayout、TopLayout、MixLayout、BaseLayout、frame、redirect 等），整体迁移至 Main_App，不做重写。
- **Permission_Guard**：原 `web-monolith/src/router/permission.ts` 的路由守卫，迁移至 Main_App。白名单规则扩展为：路径属于固定白名单（`/login`、`/403`、`/404`），或路径中包含 `/visitor/` 片段（匹配主应用及各子应用的免登录入口），则直接放行，不校验登录状态。
- **Qiankun_Runtime**：qiankun 微前端框架在运行时提供的沙箱、子应用注册、Global_State 通信和生命周期管理能力。
- **Global_State**：通过 qiankun `initGlobalState` 在主子应用间共享的状态对象，包含 `token`、`userInfo`、`permissions` 等字段。
- **Dev_Mode**：`NODE_ENV === 'development'` 且 `window.__POWERED_BY_QIANKUN__ !== true`，子应用可独立运行，使用本地静态路由和本地 token。
- **Prod_Mode**：子应用由 Main_App 通过 qiankun 加载，`window.__POWERED_BY_QIANKUN__ === true`。
- **MFA**：多因素认证，登录时需在账号密码之外完成的第二步验证（6 位数字动态验证码）。
- **AuthStorage**：原 `web-monolith/src/utils/auth.ts` 中的凭证存储工具，负责 accessToken / refreshToken 的读写，支持 remember-me 模式（localStorage 与 sessionStorage 切换）。
- **Token_Refresh_Queue**：原 `web-monolith/src/utils/http.ts` 中的 token 刷新队列机制，刷新期间将并发请求暂存队列，刷新完成后统一重放。
- **SSE_Module**：原 `web-monolith/src/composables/sse/` 目录下的 SSE 连接与消息分发模块，包含 `useSse`（全局单例连接管理）、`useNoticeSync`（消息通知分发）、`useDictSync`、`useOnlineCount` 等 composables，整体迁移至 Main_App，不做重写。
- **Visitor_Route**：各子应用约定的免登录公开入口路由前缀，路径形式为 `/{activeRule}/visitor/**`（如 `/platform/visitor/**`）。主应用路由守卫识别路径中含 `/visitor/` 片段的请求，直接放行；子应用在自身路由表中注册 `/visitor/**` 路由，负责渲染对应的公开页面，无需主应用介入。


---

## Requirements

### 需求 1：Monorepo 工程结构初始化

**用户故事：** 作为前端工程师，我希望以 `web-monolith` 的依赖配置为蓝本，将 `web-micro` 的 monorepo 各子包的 `package.json`、Vite 配置、TypeScript 配置、ESLint/Prettier/Stylelint 等工程化配置与原项目对齐，以便开发工具链和依赖版本保持一致，避免因技术栈差异导致迁移失败。

#### 验收标准

1. THE Monorepo 根目录 SHALL 包含 `pnpm-workspace.yaml`，声明 `packages: ['packages/*']`，且 `packages/main-app`、`packages/shared`、`packages/app-platform` 三个子包各自有唯一 `name` 字段的 `package.json`。
2. THE Main_App 的 `package.json` SHALL 声明技术栈依赖与 `web-monolith` 对齐：`vue ^3.x`、`vue-router ^5.x`、`pinia ^3.x`、`element-plus ^2.x`、`vite ^8.x`、`typescript ^5.x`，不得使用 Vue 2 或 Vuex。
3. THE Sub_App 的 `package.json` SHALL 声明与 Main_App 相同版本范围的 Vue 3、vue-router v5、Pinia、Element Plus、Vite 依赖，并额外声明 `qiankun ^2.x` 依赖。
4. THE Main_App 的 `package.json` SHALL 额外声明 `qiankun ^2.x`、`@fingerprintjs/fingerprintjs`、`@microsoft/fetch-event-source`、`jsencrypt`、`crypto-js`、`axios`、`nprogress` 依赖，版本号与 `web-monolith/package.json` 中保持一致。
5. WHEN 执行 `pnpm install` 时，THE Monorepo SHALL 以退出码 0 完成，输出中不包含循环依赖警告。
6. THE Main_App 与 THE Sub_App 均 SHALL 包含 `vite.config.ts`，配置 `@vitejs/plugin-vue`、`unplugin-auto-import`、`unplugin-vue-components`（自动导入 Element Plus）；Main_App 的 Vite 配置中不得出现 UMD 输出格式配置。
7. THE Sub_App 的 `vite.config.ts` SHALL 配置 Vite 以 `lib` 模式输出 UMD 格式构建产物，`name` 字段为 `app-platform`；开发服务器 SHALL 在响应头中包含 `Access-Control-Allow-Origin: *`。
8. THE Main_App 与 THE Sub_App 均 SHALL 包含 `tsconfig.json`，与 `web-monolith/tsconfig.json` 中的 `compilerOptions`（strict、paths、types 等）保持一致。
9. THE Monorepo 根目录 SHALL 提供统一的 ESLint（`eslint.config.ts`）和 Prettier（`.prettierrc.yaml`）配置，与 `web-monolith` 的同名文件保持规则一致。
10. WHEN 在任意子包目录执行 `pnpm run dev` 时，THE 对应应用 SHALL 启动本地开发服务器且控制台无 TypeScript 编译错误。


---

### 需求 2：Shared 公共模块迁移

**用户故事：** 作为前端工程师，我希望将 `web-monolith/src/utils/http.ts`、`crypto.ts`、`auth.ts`、`common.ts` 等跨应用复用的工具函数迁移至 `packages/shared`，并以 `@web-micro/shared` npm 包的形式供 Main_App 和 Sub_App 共同引用，以避免重复维护同一逻辑。

#### 验收标准

1. THE Shared_Module SHALL 将 `web-monolith/src/utils/crypto.ts` 完整复制到 `packages/shared/src/utils/crypto.ts`，保留全部导出（`encrypt.md5`、`encrypt.sha256`、`encrypt.aes`、`encrypt.taes`、`encrypt.rsa`、`encrypt.password`、`decrypt.aes`、`decrypt.taes`、`decrypt.rsa`），不得删改任何加解密逻辑。
2. THE Shared_Module SHALL 将 `web-monolith/src/utils/http.ts` 迁移至 `packages/shared/src/utils/http.ts`，保留 `AxiosWithTokenRefresh` 类、Token_Refresh_Queue 机制、`generateSignature` 函数和文件下载处理逻辑；`useUserStoreHook` 的引用改为通过构造函数参数注入，不得直接 import 主应用 Pinia store。
3. WHEN 发起请求时，THE Shared_Module 的 HTTP 封装 SHALL 从 `AuthStorage.getAccessToken()` 读取 token 并附加到请求头 `Authorization: Bearer <token>` 和 `token` 头；IF token 为空字符串，SHALL 不添加 Authorization 头。
4. THE Shared_Module SHALL 将 `web-monolith/src/utils/auth.ts` 中的 `AuthStorage` 对象和 `redirectToLogin` 函数迁移至 `packages/shared/src/utils/auth.ts`；`redirectToLogin` 中对 `router` 的引用改为通过函数参数注入，不直接 import 各应用路由实例。
5. THE Shared_Module SHALL 将 `web-monolith/src/utils/common.ts` 中与 Pinia store 无关的函数（`guid`、`getRangeDate`、`assert`、`passwordComplex`）迁移至 `packages/shared/src/utils/common.ts`；依赖 Pinia store 的函数（`parseReturnCode`、`parseDictCode`）不迁入 Shared_Module。
6. THE Shared_Module 的构建产物 SHALL 同时包含 ES Module 格式（`dist/index.esm.js`）和 CommonJS 格式（`dist/index.cjs.js`）；`package.json` 中 `module` 指向 ESM 产物，`main` 指向 CJS 产物。
7. THE Main_App 与 THE Sub_App 均 SHALL 在 `package.json` 的 `dependencies` 中通过 `"@web-micro/shared": "workspace:*"` 引用 Shared_Module，以确保运行时可用。
8. WHEN 执行 `pnpm --filter @web-micro/shared run build` 时，THE Shared_Module SHALL 以退出码 0 完成构建，`dist/` 目录下同时存在 ESM 和 CJS 产物文件。
9. IF `encrypt.taes` 对同一明文执行加密后立即由 `decrypt.taes` 解密，THEN THE Shared_Module SHALL 返回与原始明文相同的字符串（round-trip 属性）。
10. IF `decrypt.taes` 解密时当前时间窗口与加密时的窗口差为 ±1 个窗口（±5 秒），THEN THE Shared_Module SHALL 通过重试相邻 key 成功解密，不抛出异常。


---

### 需求 3：主应用迁移（登录 + Layout + 路由守卫 + Store + qiankun 注册）

**用户故事：** 作为前端工程师，我希望将 `web-monolith` 的登录页、所有 Layout 布局、路由守卫、全局 Pinia store 整体迁移至 Main_App，并在 Main_App 中完成 qiankun 子应用注册与 Global_State 初始化，以便用户通过主应用统一入口完成登录、看到完整的 Layout 外壳，并按权限访问业务功能。

#### 验收标准

1. THE Main_App SHALL 将 `web-monolith/src/views/login/` 目录整体复制至 `packages/main-app/src/views/login/`，保留登录页全部逻辑（账号密码表单、MFA 验证码步骤、记住我选项、RSA/AES 密码加密），只调整 import 路径，不重写业务逻辑。
2. THE Main_App SHALL 将 `web-monolith/src/layouts/` 目录整体复制至 `packages/main-app/src/layouts/`，包含 `LeftLayout.vue`、`TopLayout.vue`、`MixLayout.vue`、`BaseLayout.vue`、`frame.vue`、`redirect.vue`、`index.vue`、`useLayout.ts` 及 `components/` 子目录，不得重写任何布局组件。
3. THE Main_App SHALL 将 `web-monolith/src/router/permission.ts` 复制至 `packages/main-app/src/router/permission.ts`，保留白名单数组（`/login`、`/403`、`/404`）和 `/visitor/` 前缀判断逻辑；相关 import 路径调整为指向 Main_App 的本地 store 和 router。
4. THE Main_App SHALL 将 `web-monolith/src/stores/modules/` 下全部 store 模块（`app.store.ts`、`dict.store.ts`、`permission.store.ts`、`return-code.store.ts`、`settings.store.ts`、`tags-view.store.ts`、`tenant.store.ts`、`user.store.ts`）完整迁移至 `packages/main-app/src/stores/modules/`，不重写 store 逻辑，只调整 import 路径。
5. THE Main_App SHALL 将 `web-monolith/src/views/welcome/` 和 `web-monolith/src/views/profile/` 目录完整迁移至对应路径，在 Main_App 路由中注册并由 Layout 内部渲染，不迁入 Sub_App。
6. THE Main_App SHALL 将 `web-monolith/src/views/visitor/` 目录完整迁移，在 Main_App 路由中注册，路由守卫白名单含 `/visitor/` 前缀，无需登录即可访问。
7. WHEN Main_App 完成初始化时，THE Main_App SHALL 调用 qiankun `registerMicroApps` 注册 Sub_App，配置项包含 `name`、`entry`（Sub_App 开发服务地址）、`container`（`#sub-app-container`）、`activeRule`（路由前缀）。
8. WHEN Main_App 注册子应用后，THE Main_App SHALL 调用 `initGlobalState` 初始化 Global_State，初始值包含：`token`（空字符串）、`userInfo`（`{}`）、`permissions`（`[]`）。
9. WHEN 用户登录成功后，THE Main_App SHALL 将 token 和 userInfo 写入 Global_State，同时调用 Permission_Guard 已有的 `permissionStore.generateRoutes` 逻辑生成动态路由并注册至 Main_App 路由实例。
10. WHEN `permissionStore.generateRoutes` 返回权限数据时，THE Main_App SHALL 将 `moduleType` 为 `005002` 的节点的 `moduleCode` 收集为数组，更新至 Global_State 的 `permissions` 字段。
11. WHEN 用户执行退出登录时，THE Main_App SHALL 调用各 Pinia store 的 reset 方法清除本地状态，同时将 Global_State 中的 `token`、`userInfo`、`permissions` 重置为初始值，并跳转至登录页。
12. IF Sub_App 本地开发服务地址不可达，THEN THE Main_App 的开发服务器 SHALL 在控制台输出警告，说明子应用无法加载，但不阻塞主应用本身的启动和渲染。
13. WHEN Main_App 渲染菜单时，THE Main_App SHALL 对同级菜单节点按 `sortIdx` 字段升序排序后渲染，排序须递归应用于所有层级子节点。
14. THE Main_App SHALL 过滤 `moduleType` 为 `005002` 的节点，仅将 `moduleType` 为 `005001` 的节点渲染为 Sidebar 菜单项；`visible` 为 `false` 的节点不渲染菜单项，但仍注册对应路由；IF `visible` 为 `false` 的节点含 `children`，THEN 其子节点也不渲染菜单项（传递性），但仍注册路由。
15. WHEN 用户点击菜单项且该节点 `popup` 为 `true` 时，THE Main_App SHALL 通过 `window.open` 以弹窗形式打开对应 URL，不执行路由跳转。
16. WHEN 用户点击菜单项且该节点 `target` 为 `'_blank'` 且 `popup` 为 `false` 时，THE Main_App SHALL 先执行 Tab_Ticket 写入（见需求11），再调用 `window.open(url + '?_ticket=1', '_blank')` 在新标签页中打开，不执行 `router.push`。
17. THE MenuNode 数据结构 SHALL 支持 `target` 字段（枚举 `'_self'` | `'_blank'`，默认 `'_self'`）与 `fullscreen` 字段（布尔值，默认 `false`）；后端未返回这两个字段时，前端 SHALL 使用默认值兜底。


---

### 需求 4：子应用 app-platform 迁移（业务页面 + qiankun 生命周期适配）

**用户故事：** 作为前端工程师，我希望将 `web-monolith` 中所有业务页面（dashboard、account、logs、message、system）、相关 API 文件和业务组件完整迁移至 `app-platform`，并在该子应用中正确导出 qiankun 生命周期函数，以便主应用能通过 qiankun 加载并渲染业务页面。

#### 验收标准

1. THE Sub_App SHALL 将 `web-monolith/src/views/dashboard/`、`src/views/account/`、`src/views/logs/`、`src/views/message/`、`src/views/system/` 目录整体复制至 `packages/app-platform/src/views/` 对应路径；页面组件内只允许调整 import 路径，不得重写业务逻辑。
2. THE Sub_App SHALL 将 `web-monolith/src/api/` 下对应业务接口文件（dashboard、account、logs、message、system 相关）复制至 `packages/app-platform/src/api/`，保留全部接口函数签名，只调整 import 的 http 工具来源为 `@web-micro/shared`。
3. THE Sub_App SHALL 将 `web-monolith/src/components/` 中被上述业务页面使用的组件复制至 `packages/app-platform/src/components/`，不复制仅 Main_App 使用的 Layout 相关组件。
4. THE Sub_App 的入口文件（`src/main.ts`）SHALL 导出符合 qiankun 规范的三个异步生命周期函数：`bootstrap`、`mount`、`unmount`，每个函数均返回 `Promise<void>`。
5. WHEN Qiankun_Runtime 调用 `bootstrap` 时，THE Sub_App SHALL 完成全局插件（Element Plus、自定义指令等）的一次性注册，不创建 Vue 实例，函数以 resolved Promise 返回。
6. WHEN Qiankun_Runtime 调用 `mount(props)` 时，THE Sub_App SHALL 创建 Vue 3 应用实例，挂载至 `props.container` 中的 `#sub-app-container` 元素，并从 `props` 读取 Global_State 中的 `token` 和 `userInfo`。
7. WHEN Qiankun_Runtime 调用 `unmount` 时，THE Sub_App SHALL 调用 Vue 应用实例的 `unmount()` 方法并清空容器 innerHTML，同时注销所有通过 `props.onGlobalStateChange` 注册的监听器。
8. IF `mount` 接收到的 `props` 中 `token` 字段为空字符串且当前为 Prod_Mode，THEN THE Sub_App SHALL reject Promise 并在控制台输出包含"缺少 token，拒绝挂载"的错误日志。
9. THE Sub_App 的 Vite 配置 SHALL 设置 `build.lib.formats: ['umd']`，`build.lib.name: 'app-platform'`，以保证 qiankun 能通过 `window['app-platform']` 读取生命周期导出。
10. THE Sub_App 的 Vite 开发服务器 SHALL 在响应头中返回 `Access-Control-Allow-Origin: *`，允许主应用跨域加载子应用资源。
11. WHEN 在 Sub_App 目录执行 `pnpm run build` 时，THE Sub_App SHALL 以退出码 0 完成构建，`dist/` 目录中存在 UMD 格式的 JS 产物文件。


---

### 需求 5：应用间通信（Global_State）

**用户故事：** 作为前端工程师，我希望主应用通过 qiankun `initGlobalState` 将 token、userInfo 和 permissions 传递给子应用，子应用通过 `props` 读取并监听状态变更，以便业务页面能正确展示当前用户信息并按权限控制按钮显隐。

#### 验收标准

1. THE Main_App SHALL 通过 `initGlobalState` 初始化 Global_State，字段结构为 `{ token: string, userInfo: object, permissions: string[] }`，三个字段均有明确默认值（`''`、`{}`、`[]`）。
2. WHEN Sub_App 在 `mount` 生命周期调用 `props.onGlobalStateChange(callback, true)` 后，WHEN Global_State 中 `token` 字段发生变更时，THE Sub_App 的回调 SHALL 在同一事件循环轮次内被调用，将最新 token 同步至子应用本地响应式状态。
3. WHEN Sub_App 需要向 Main_App 传递事件时，THE Sub_App SHALL 调用 `props.setGlobalState(patch)` 方法，`patch` 为仅含需更新字段的部分对象，不直接访问主应用 Pinia store。
4. WHEN Sub_App 在 `unmount` 生命周期执行时，THE Sub_App SHALL 注销所有通过 `props.onGlobalStateChange` 注册的监听器，确保监听回调不再被触发。
5. THE Sub_App SHALL 提供 `v-permission` 自定义指令，指令的判断逻辑为：从当前 Global_State 的 `permissions` 数组中查找绑定值（权限码字符串）；IF 权限码存在则保留 DOM 元素；IF 权限码不存在则从 DOM 中移除该元素（而非设置 `display:none`）。
6. WHEN Global_State 的 `permissions` 数组更新时，THE Sub_App SHALL 重新评估页面内所有 `v-permission` 绑定：权限码存在则将元素插入 DOM，不存在则移除。
7. IF `v-permission` 绑定值为空字符串、`null` 或 `undefined`，THEN THE Sub_App SHALL 移除对应 DOM 元素，不抛出异常。


---

### 需求 6：Dev_Mode 独立运行（子应用脱离主应用独立开发调试）

**用户故事：** 作为前端工程师，我希望在开发环境中能够不启动主应用，直接运行 `app-platform` 子应用进行业务页面的开发和调试，以便缩短开发反馈循环，提高迭代效率。

#### 验收标准

1. WHILE `window.__POWERED_BY_QIANKUN__ !== true`（即 Dev_Mode）时，THE Sub_App 的入口文件 SHALL 直接创建 Vue 3 应用实例并挂载至 `document.getElementById('app')`，不等待 qiankun `mount` 调用。
2. WHILE Dev_Mode 时，THE Sub_App SHALL 使用预定义的本地静态路由表（包含全部业务页面路由），不依赖 Main_App 传入的路由数据。
3. IF Dev_Mode 且 `AuthStorage.getAccessToken()` 返回非空字符串，THEN THE Sub_App SHALL 直接进入业务页面，不展示登录页。
4. IF Dev_Mode 且 `AuthStorage.getAccessToken()` 返回空字符串，THEN THE Sub_App SHALL 展示独立登录页，用户完成登录（含 MFA 步骤）后跳转至首页。
5. THE Sub_App 的独立登录页 SHALL 复用 `web-monolith/src/views/login/` 中的登录组件，或提供功能等价的简化登录入口（账号密码 + MFA），登录成功后通过 `AuthStorage.setTokens` 保存 token。
6. WHEN Dev_Mode 下访问未匹配的路由时，THE Sub_App SHALL 展示 404 提示页面，页面内包含可点击的"返回首页"链接。
7. THE Sub_App 的 `vite.config.ts` 开发配置 SHALL 支持通过环境变量 `VITE_APP_USE_MOCK`（值为 `'true'`）启用 mock 服务（使用 `vite-plugin-mock-dev-server`），使开发时所有接口请求由本地 mock 数据响应；`VITE_APP_USE_MOCK` 为其他值时，接口请求通过 Vite proxy 代理至真实后端。
8. IF `VITE_APP_USE_MOCK=true` 与代理配置同时存在于同一 Vite 配置中，THEN THE 构建工具 SHALL 在启动时输出警告，提示 mock 模式与代理模式不得混用，并以 mock 模式优先。


---

### 需求 7：构建与部署配置

**用户故事：** 作为运维工程师，我希望 monorepo 中每个子包可独立构建并将产物输出至各自的 `dist/` 目录，根目录提供一键构建全部子包的脚本，并提供 nginx 配置模板，以便在生产环境将各应用分别部署到独立的静态资源路径。

#### 验收标准

1. THE Main_App 的 `vite.config.ts` SHALL 配置 `build.outDir: 'dist'`，`base: '/'`；执行 `pnpm --filter @web-micro/main-app run build` 后，产物 SHALL 输出至 `packages/main-app/dist/`。
2. THE Sub_App 的 `vite.config.ts` SHALL 配置 `build.outDir: 'dist'`，生产环境 `base` 由环境变量 `VITE_APP_PUBLIC_PATH` 控制（默认 `'/'`）；执行 `pnpm --filter @web-micro/app-platform run build` 后，产物 SHALL 输出至 `packages/app-platform/dist/`，且包含 UMD 格式 JS 文件。
3. THE Monorepo 根目录的 `package.json` SHALL 提供 `build:all` 脚本，执行顺序为：先构建 Shared_Module，再构建 Sub_App，最后构建 Main_App。
4. IF `build:all` 执行过程中任一子包构建返回非零退出码，THEN 整体构建流程 SHALL 立即终止，以非零退出码退出，不继续执行后续步骤。
5. THE Monorepo 根目录 SHALL 提供 `packages/main-app/nginx.conf.template` 文件，内容包含：`location /` 指向 Main_App 静态产物目录，以及针对 Sub_App `activeRule` 路径前缀的 `location ^~` 块，使用 `proxy_pass` 反向代理至 Sub_App 部署地址。
6. THE Sub_App 的 nginx 配置模板 SHALL 包含 `try_files $uri $uri/ /index.html` 规则，仅对非静态资源后缀（`.js`、`.css`、`.png`、`.jpg`、`.ico`、`.woff`、`.woff2`）的请求生效，以支持 history 模式路由。
7. THE Monorepo 根目录的 `README.md` SHALL 包含以下各节：主应用职责、子应用职责、monorepo 依赖关系说明、跨域注意事项、样式隔离说明、应用间通信说明、本地开发指南、生产构建与部署指南。
8. WHEN 执行 `pnpm run build:all` 且所有子包均构建成功时，THE Monorepo SHALL 以退出码 0 退出，`packages/main-app/dist/`、`packages/app-platform/dist/`、`packages/shared/dist/` 三个目录均非空。


---

### 需求 8：SSE 消息通知迁移（主应用单例管理，主窗口唯一连接）

**用户故事：** 作为前端工程师，我希望将 `web-monolith` 的 SSE 消息通知模块整体迁移至主应用，并确保整个微前端系统中 SSE 长连接只在用户从登录页登录成功的主窗口中建立，通过 Ctrl+点击菜单、`window.open` 等方式打开的新标签页不建立 SSE 连接，以避免多窗口并发连接消耗服务端资源。

#### 验收标准

1. THE Main_App SHALL 将 `web-monolith/src/composables/sse/` 目录整体复制至 `packages/main-app/src/composables/sse/`，包含 `useSse.ts`（全局单例连接管理）、`useNoticeSync.ts`（消息通知分发）、`useDictSync.ts`、`useOnlineCount.ts`、`useEventSource.ts`、`index.ts`，只调整 import 路径，不重写任何连接管理逻辑。
2. THE Main_App 的 SSE_Module SHALL 使用全局单例模式（`useSse` 已实现），确保同一浏览器窗口中不论 Layout 组件重渲染多少次，SSE 连接只建立一次。
3. THE Main_App SHALL 定义**主窗口**判断规则：同时满足以下两个条件时，当前窗口为主窗口——`window.opener === null`（非通过 `window.open` 打开），且当前 URL 不含查询参数 `_ticket=1`（非 Tab_Ticket 新标签页）。不满足任一条件，则为**衍生窗口**。
4. WHEN 用户登录成功后，THE Main_App SHALL 先执行主窗口判断；IF 当前为主窗口，THEN 调用 `useSse().connect()` 建立 SSE 连接，并调用 `useNoticeSync().initialize()` 注册事件监听；IF 当前为衍生窗口，THEN 不建立 SSE 连接，并在浏览器控制台输出 `console.warn` 级别警告，警告内容须包含"SSE 连接已跳过"字样及当前页面 URL。
5. WHEN 用户执行退出登录时，THE Main_App SHALL 调用 `cleanupSse()` 主动关闭连接并清理全部事件订阅，无论当前窗口是主窗口还是衍生窗口（衍生窗口调用 `cleanupSse()` 为空操作，不报错）。
6. THE Main_App 的 SSE_Module SHALL 保留指数退避重连机制（首次重连间隔 5s，每次翻倍，上限 2 分钟，最多重试 10 次）；**重连前须再次执行主窗口判断**，IF 重连时当前窗口已不再满足主窗口条件（如用户在新标签页中），THEN 停止重连，不建立新连接。
7. THE Main_App 的 SSE_Module SHALL 保留踢下线（`kickOut` 事件）处理：收到踢下线事件时，调用 `cleanupSse()`，弹出通知提示，等待用户确认后调用 `userStore.resetAllState()` 并跳转登录页。
8. WHEN Sub_App 需要响应 SSE 推送数据（如消息未读数更新）时，THE Main_App SHALL 将相关数据通过 Global_State 传递给 Sub_App，Sub_App 订阅 Global_State 变更获取数据，不直接调用 SSE_Module。
9. THE Sub_App SHALL 不在自身内部建立任何 SSE 连接；IF Sub_App 代码中出现对 `useSse`、`useFetchEventSource` 等 SSE composable 的直接调用，视为违反此约束。
10. IF 用户通过 Ctrl+点击菜单在新标签页中打开业务页面（`window.opener !== null` 或 URL 含 `_ticket=1`），THEN THE Main_App 在该新标签页中 SHALL 不建立 SSE 连接，业务功能正常可用，仅消息实时推送功能不可用（未读数徽标不更新）。


---

### 需求 9：Visitor 约定免登录入口

**用户故事：** 作为前端工程师，我希望在微前端架构下，各子应用能通过约定的 `/visitor/` 路径前缀提供无需登录的公开页面（如大屏展示、ECG 波形图等），主应用路由守卫识别该约定并直接放行，以便各子应用自主维护自己的公开功能入口，不依赖主应用管理页面组件。

#### 验收标准

1. THE Main_App 的路由守卫（Permission_Guard）SHALL 将白名单规则扩展为：路径属于固定列表（`/login`、`/403`、`/404`），**或**路径中包含 `/visitor/` 片段（即 `to.path.includes('/visitor/')` 为 `true`），则直接放行，不校验登录状态，不执行动态路由生成。
2. THE Main_App 的 `/visitor/` 路由 SHALL 保留原有 `dynamic.vue` 动态组件加载机制，通过 `import.meta.glob('@/views/visitor/**/*.vue')` 加载主应用自身的公开页面，如 `visitor/ecg/index.vue`。
3. THE Sub_App（app-platform）SHALL 在自身路由表中注册 `/visitor/**` 路由，路由组件可为 404 占位或具体的公开页面；qiankun 的 `activeRule` 配置须同时覆盖 `/platform`（已登录业务路由）和 `/platform/visitor`（免登录访客路由）两个前缀，使主应用能将这两类请求都路由至 app-platform 子应用。
4. WHEN 用户访问 `/{activeRule}/visitor/**` 格式的路径（如 `/platform/visitor/ecg/index`）时，THE Main_App 路由守卫 SHALL 直接放行，不重定向至登录页；qiankun SHALL 根据 `activeRule` 激活对应子应用；Sub_App SHALL 渲染对应的 visitor 页面，不强制跳转至登录页。
5. THE Sub_App 的 visitor 页面在渲染时 SHALL 不依赖 Global_State 中的 `token`（因主应用不保证此时已登录）；IF visitor 页面需要调用需要鉴权的后端接口，该接口须支持无 token 访问或 Sub_App 自行处理鉴权逻辑。
6. THE Main_App 的 `dynamic.vue` 的 `import.meta.glob` 路径 SHALL 仅扫描主应用自身 `src/views/visitor/` 目录，不尝试跨包扫描子应用的 visitor 组件；子应用的 visitor 页面由 qiankun 路由机制加载，不通过 `dynamic.vue` 代理。
7. 每个新增子应用（如后续 app-ecg、app-health 等）遵守以下约定：其 qiankun `activeRule` 须同时声明业务路由前缀和 `{activeRule}/visitor` 前缀；visitor 路由在子应用路由表中以 `/visitor/**` 注册，路由守卫中对 `/visitor/` 路径不执行 token 校验。

---

### 需求 10：无导航栏页面模式（全屏模式）

**用户故事：** 作为前端工程师，我希望某些业务页面（如大屏展示、图表分析）能够隐藏主应用的 Header 与 Sidebar、仅渲染业务内容区域，或允许子应用主动请求切换此模式，以便为需要无干扰布局体验的业务场景提供支持。

#### 验收标准

1. THE Main_App 的 Pinia store（`app.store.ts`）SHALL 包含 `layout.fullscreen` 布尔状态（默认 `false`）及对应的 mutation/action，用于控制无导航栏模式的开关。
2. WHEN `layout.fullscreen` 为 `true` 时，THE Main_App 的 Layout 组件 SHALL 通过 `v-show="!layout.fullscreen"` 隐藏 Header 与 Sidebar（保留 DOM，不销毁），仅渲染 `#sub-app-container`，使业务内容占据全部可用视口；此处"无导航栏"指隐藏布局导航区域，不调用浏览器原生 Fullscreen API。
3. WHEN 用户点击菜单节点且该节点 `fullscreen` 为 `true`、`target` 为 `'_self'`、`popup` 为 `false` 时，THE Main_App SHALL 在执行路由跳转的同时将 `layout.fullscreen` 置为 `true`。
4. WHEN 路由发生变更且目标路由对应的菜单节点 `fullscreen` 为 `false` 时，THE Main_App SHALL 自动将 `layout.fullscreen` 重置为 `false`，确保全屏状态不污染其他页面。
5. WHEN 用户在全屏模式下点击退出全屏按钮（或执行退出登录）时，THE Main_App SHALL 将 `layout.fullscreen` 置为 `false`，Layout 恢复渲染 Header 与 Sidebar。
6. WHEN Sub_App 通过 `props.setGlobalState({ fullscreen: true })` 或 `props.setGlobalState({ fullscreen: false })` 请求切换模式时，THE Main_App SHALL 监听 Global_State 中 `fullscreen` 字段的变更，同步更新 `layout.fullscreen`，允许子应用页面主动控制是否显示导航栏。
7. IF Global_State 中 `fullscreen` 字段值为 `null` 或 `undefined`，THEN THE Main_App SHALL 忽略该信号，不修改 `layout.fullscreen` 当前状态。


---

### 需求 11：Tab_Ticket 新标签页鉴权

**用户故事：** 作为前端工程师，我希望用户通过菜单 `target='_blank'` 在新标签页中打开业务页面时，新标签页能自动继承当前用户的登录状态，而无需重新登录，以便无缝访问需要在独立窗口展示的功能页面（如大屏、报表等）。

#### 验收标准

1. THE Main_App SHALL 提供 `writeTabTicket(token)` 工具函数：将当前用户的 access_token 以键名 `_tab_ticket` 写入 `sessionStorage`，同时记录写入时间戳；Tab_Ticket 有效期不超过 30 秒，过期后视为无效。
2. THE Main_App SHALL 提供 `consumeTabTicket()` 工具函数：从 `sessionStorage` 读取 `_tab_ticket` 键值，**立即删除**该键（一次性消费），并验证时间戳是否在有效期内——有效则返回 token 字符串，过期或不存在则返回 `null`。
3. WHEN Main_App 处理 `target='_blank'` 的菜单点击时，THE Main_App SHALL 先调用 `writeTabTicket(currentToken)`，再调用 `window.open(url + '?_ticket=1', '_blank')`；目标 URL 中的 `_ticket=1` 参数作为新标签页标识，供主窗口判断使用。
4. WHEN 子应用在新标签页中启动（`window.__POWERED_BY_QIANKUN__ !== true` 且 URL 含 `_ticket=1` 参数）时，THE Sub_App SHALL 在入口逻辑中调用 `consumeTabTicket()`；IF 返回有效 token，THEN 将该 token 保存至 `AuthStorage`（`setTokens`），并以此 token 初始化应用，正常渲染页面。
5. IF `consumeTabTicket()` 返回 `null`（Tab_Ticket 不存在或已过期），THEN THE Sub_App SHALL 重定向至主应用登录页（`/login`），不展示业务页面。
6. THE Tab_Ticket 机制 SHALL 保证一次性：同一 `sessionStorage._tab_ticket` 在被 `consumeTabTicket()` 读取后立即删除，后续任何对该键的读取均返回 `null`，防止在同一新标签页中多次刷新时重复使用同一凭证。
7. THE `isMainWindow()` 函数判断规则 SHALL 与 Tab_Ticket 机制联动：URL 含 `_ticket=1` 参数的窗口判定为衍生窗口，不建立 SSE 连接（与需求8对应）。
