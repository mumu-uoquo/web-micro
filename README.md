# web-micro — 微前端 Monorepo

基于 **qiankun v2** 的微前端工程，由三个 pnpm workspace 包组成。原始单体项目 `web-monolith`（Vue 3 + TypeScript + Vite）按关注点拆分为主应用基座、业务子应用和公共共享模块。

---

## 目录

1. [工程结构](#工程结构)
2. [主应用职责（main-app）](#主应用职责main-app)
3. [子应用职责（app-platform）](#子应用职责app-platform)
4. [Monorepo 依赖关系说明](#monorepo-依赖关系说明)
5. [跨域注意事项](#跨域注意事项)
6. [样式隔离说明](#样式隔离说明)
7. [应用间通信说明](#应用间通信说明)
8. [本地开发指南](#本地开发指南)
9. [生产构建与部署指南](#生产构建与部署指南)

---

## 工程结构

```text
web-micro/
├── package.json                  # 根目录：build:all / dev:main / dev:sub 脚本
├── pnpm-workspace.yaml           # 声明 packages: ['packages/*']
├── .npmrc
├── eslint.config.ts
├── .prettierrc.yaml
├── .stylelintrc.cjs
├── mock/                         # 根级共享 mock（auth / menu / sse）
└── packages/
    ├── shared/                   # @web-micro/shared — 公共工具（crypto / http / auth）
    ├── main-app/                 # @web-micro/main-app — 主应用基座（端口 7100）
    └── app-platform/             # @web-micro/app-platform — 业务子应用（端口 7101）
```

---

## 主应用职责（main-app）

`packages/main-app`（`@web-micro/main-app`）是整个微前端系统的**基座**，负责：

- **登录与鉴权**：登录页（账号密码 + MFA 二步验证）、RSA/AES 密码加密、记住我（localStorage/sessionStorage 切换）。
- **Layout 渲染**：LeftLayout / TopLayout / MixLayout / BaseLayout 等全套布局由主应用独占渲染，子应用只渲染内容区域，不包含任何导航外壳。
- **路由守卫（Permission_Guard）**：
  - 固定白名单：`/login`、`/403`、`/404`
  - 动态放行：路径包含 `/visitor/` 片段的请求直接放行，无需登录（覆盖子应用前缀，如 `/platform/visitor/**`）
  - 其余路由需要有效 token，否则重定向至 `/login`
- **Pinia Stores**：`app`、`dict`、`permission`、`return-code`、`settings`、`tags-view`、`tenant`、`user` 共 8 个 store，统一由主应用管理。
- **qiankun 子应用注册**：通过 `registerMicroApps` 注册 `app-platform`，`activeRule` 为 `/platform`；在 `beforeMount` 钩子中将最新 token/userInfo/permissions 注入子应用 props。
- **Global_State 初始化**：调用 `initGlobalState({ token, userInfo, permissions, fullscreen, notifications })`，作为主子应用唯一通信通道。
- **SSE 消息通知**：全局单例 `useSse`，仅主窗口（`window.opener === null` 且 URL 不含 `_ticket` 参数）在登录后建立 SSE 连接，新标签页不重复连接。
- **全屏模式**：通过 `app.store.ts` 的 `layout.fullscreen` 控制是否隐藏 Header/Sidebar，支持菜单点击触发和子应用通过 Global_State 请求切换。
- **Tab_Ticket 机制**：菜单 `target='_blank'` 时，将 token 写入 `sessionStorage._tab_ticket` 并传递至新标签页，新标签页消费后立即删除（30s 有效期）。

---

## 子应用职责（app-platform）

`packages/app-platform`（`@web-micro/app-platform`）是**业务子应用**，负责：

- **业务页面渲染**：dashboard、account、logs、message、system 等所有业务视图，不包含任何 Layout 外壳。
- **qiankun 生命周期导出**（UMD 格式）：
  - `bootstrap()`：全局一次性初始化（插件注册等），不创建 Vue 实例。
  - `mount(props)`：创建 Vue 实例并挂载至 `props.container.querySelector('#sub-app-container')`；Prod_Mode 下 `props.token` 为空时直接 reject 并打印错误，拒绝挂载。
  - `unmount()`：注销 Global_State 监听、卸载 Vue 实例、清空容器 innerHTML。
- **路由策略**：使用 `createWebHashHistory`（hash 路由），避免与主应用 history 路由冲突；路由守卫对 `to.path.includes('/visitor/')` 的路由直接放行。
- **权限指令 `v-permission`**：基于 Global_State 传入的 `permissions` 数组，无权限时通过 `removeChild` 从 DOM 移除元素（不用 `display:none`）。
- **Dev_Mode 独立运行**：`!window.__POWERED_BY_QIANKUN__` 时直接 `createApp().mount('#app')`，支持不启动主应用独立调试业务页面。
- **Tab_Ticket 分支**：Dev_Mode 下检测 URL 含 `_ticket` 参数时，消费 Tab_Ticket 获取 token 后正常挂载；token 无效则跳转 `/login`。
- **HTTP 请求**：使用 `@web-micro/shared` 的 `createHttpInstance`，token 刷新委托给主应用（通过 `props.setGlobalState` 通知），子应用内部不直接刷新 token。

---

## Monorepo 依赖关系说明

### 包间依赖

```text
@web-micro/main-app
  └── @web-micro/shared (workspace:*)

@web-micro/app-platform
  └── @web-micro/shared (workspace:*)

@web-micro/shared
  └── (无内部依赖，external: axios / crypto-js / jsencrypt)
```

### 关键技术栈版本

| 依赖 | 版本范围 | 说明 |
|------|----------|------|
| `vue` | `^3.x` | 主应用提供，子应用通过 UMD externals 共享 |
| `vue-router` | `^5.x` | 主应用 history 模式，子应用 hash 模式 |
| `pinia` | `^3.x` | 主应用提供，子应用通过 UMD externals 共享 |
| `element-plus` | `^2.x` | 主应用提供，子应用通过 UMD externals 共享 |
| `qiankun` | `^2.x` | 主应用注册与启动，子应用声明生命周期 |
| `vite` | `^8.x` | 主/子应用构建工具；shared 使用 Rollup |

### Shared 模块构建格式

`@web-micro/shared` 由 **Rollup** 构建（非 Vite），输出：

- `dist/index.esm.js`（ES Module，供 Vite 构建的主/子应用使用）
- `dist/index.cjs.js`（CommonJS，供 Node.js 工具链使用）

### 构建顺序约束

子应用构建时依赖 shared 的 `dist/` 产物，主应用构建时依赖子应用已构建完成。**必须按顺序构建**：

```text
shared → app-platform → main-app
```

根目录 `build:all` 脚本已保证此顺序（`&&` 语义，任一步骤失败立即终止）。

---

## 跨域注意事项

### 开发环境

qiankun 主应用通过 `fetch` 或动态 `<script>` 加载子应用入口 HTML 和 JS 资源，**子应用开发服务器必须允许跨域**。

`packages/app-platform/vite.config.ts` 已配置：

```typescript
server: {
  port: 7101,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
}
```

### 生产环境

生产环境不存在跨域问题，通过 **nginx 反向代理**实现同域访问：

- 主应用 nginx 将 `/platform/` 前缀的请求 `proxy_pass` 至子应用服务器
- 浏览器视角是同一域名，无跨域请求

详见[生产构建与部署指南](#生产构建与部署指南)中的 nginx 配置说明。

### 子应用 API 请求跨域

开发环境下，子应用 API 请求通过 Vite proxy 代理至后端，无需额外 CORS 配置：

```typescript
// packages/app-platform/.env.development
VITE_APP_BASE_API=/api
VITE_APP_API_URL=http://your-backend-server
```

当 `VITE_APP_USE_MOCK=true` 时，proxy 自动禁用，改用本地 mock 服务（两者互斥，同时存在时以 mock 优先并输出警告）。

---

## 样式隔离说明

### 方案选择：CSS Scoping（非 Shadow DOM）

qiankun 启动配置：

```typescript
start({
  sandbox: {
    experimentalStyleIsolation: true,  // CSS Scoping 方案
  },
})
```

**选用 CSS Scoping 而非 Shadow DOM** 的原因：Element Plus 的弹出层（`el-dialog`、`el-tooltip`、`el-select` 下拉等）默认挂载至 `document.body`，Shadow DOM 边界会导致这些弹出层无法继承样式，造成样式完全失效。

### CSS Scoping 工作原理

qiankun 自动为子应用根容器添加属性选择器前缀（如 `div[data-qiankun-app="app-platform"]`），子应用所有 CSS 规则在运行时被改写为带此前缀的选择器，从而实现样式隔离，同时 Element Plus 弹出层依然工作正常。

### 注意事项

- 子应用不应使用 `:root`、`html`、`body` 选择器设置全局变量，这些选择器无法被 CSS Scoping 覆盖，可能污染主应用样式。
- 子应用应避免使用 `!important` 强制覆盖主应用 CSS 变量。
- 主应用和子应用可以共享 Element Plus 组件库，但各自的 CSS 覆写变量应限定在各自的根容器作用域内。

---

## 应用间通信说明

### 通信机制：qiankun Global_State

主子应用通过 `initGlobalState` 建立的响应式状态对象进行通信，**不直接跨包引用 Pinia store**。

### Global_State 结构

```typescript
interface GlobalState {
  token: string;                         // 访问令牌，主应用写入，子应用只读
  userInfo: Record<string, any>;         // 当前登录用户信息
  permissions: string[];                 // 权限码数组（moduleType=005002 的 moduleCode）
  fullscreen: boolean | null;            // 全屏切换信号：null=无操作，true/false=切换
  notifications: {
    unreadCount: number;                 // 消息未读数，由主应用 SSE 模块更新
  };
}
```

### 数据流向

```text
主应用（写入）                    子应用（读取）
─────────────────────────────────────────────────────
登录成功 → setState({ token, userInfo })
generateRoutes → setState({ permissions })
SSE 推送 → setState({ notifications })
                                   onGlobalStateChange(callback, true)
                                   同步 token / permissions / notifications
```

```text
子应用（写入）                    主应用（监听）
─────────────────────────────────────────────────────
props.setGlobalState({ fullscreen: true })
                                   onGlobalStateChange → appStore.setFullscreen()
                                   处理后重置 fullscreen = null
```

### 主应用写入时机

| 时机 | 写入字段 |
|------|----------|
| 用户登录成功 | `token`、`userInfo` |
| `generateRoutes` 完成 | `permissions` |
| 退出登录 | `token: ''`、`userInfo: {}`、`permissions: []`、`fullscreen: null` |
| SSE 收到消息通知 | `notifications.unreadCount` |

### 子应用挂载时的初始同步

qiankun `beforeMount` 钩子在挂载前将最新状态注入 `props`，子应用 `mount(props)` 收到初始值后调用 `onGlobalStateChange(callback, true)`（`fireImmediately=true`）立即同步一次，确保挂载时权限和 token 已就绪。

### SSE 通知传递

SSE 长连接由主应用全局单例管理，子应用不直接建立 SSE 连接。当 `useNoticeSync` 收到 `notify/message/todo` 事件时，通过 `setState({ notifications: { unreadCount } })` 将未读数推送至子应用，子应用订阅 Global_State 变更后更新自身徽标显示。

---

## 本地开发指南

### 环境要求

- Node.js `>= 14.0.0`
- pnpm `>= 7.0.0`

### 首次安装依赖

```bash
# 在根目录执行，一次性安装所有 workspace 包的依赖
pnpm install
```

### 构建 Shared 模块（必须先执行）

shared 包是主/子应用的编译时依赖，首次开发前或修改 shared 后需重新构建：

```bash
pnpm run build:shared
# 或等价命令：
pnpm --filter @web-micro/shared build
```

构建产物输出至 `packages/shared/dist/`。

### 启动开发服务器

### 方式一：同时运行主应用与子应用（完整集成调试）

在两个终端分别执行：

```bash
# 终端 1：启动子应用（端口 7101）
pnpm run dev:sub

# 终端 2：启动主应用（端口 7100）
pnpm run dev:main
```

访问 `http://localhost:7100`，通过主应用登录后即可访问所有业务页面。

### 方式二：仅运行子应用（独立调试业务页面）

```bash
pnpm run dev:sub
```

访问 `http://localhost:7101`，子应用提供独立登录页，登录后可直接访问业务功能，无需启动主应用。

### 环境变量配置

主应用（`packages/main-app/.env.development`）：

```env
VITE_SUB_APP_ENTRY=http://localhost:7101   # 子应用入口地址
```

子应用（`packages/app-platform/.env.development`）：

```env
VITE_APP_USE_MOCK=false       # 是否启用 mock 模式（与 proxy 互斥）
VITE_APP_BASE_API=/api        # API 路径前缀
VITE_APP_API_URL=http://...   # 后端服务地址（proxy 目标）
```

启用 mock 模式（不依赖后端）：

```env
VITE_APP_USE_MOCK=true
```

### Tab_Ticket 新标签页调试

当菜单配置 `target='_blank'` 时，主应用点击菜单会向新标签页传递 Tab_Ticket（写入 `sessionStorage._tab_ticket`，有效期 30 秒）。新标签页子应用检测到 `_ticket` 参数后消费 ticket 获取 token，ticket 读取后立即删除，确保单次使用。

---

## 生产构建与部署指南

### 一键构建所有包

```bash
pnpm run build:all
```

等价于顺序执行：

```bash
pnpm run build:shared && pnpm run build:sub && pnpm run build:main
```

任一步骤失败立即终止，以非零退出码退出。

### 构建产物位置

| 包 | 产物目录 | 格式 |
|----|----------|------|
| `@web-micro/shared` | `packages/shared/dist/` | ESM + CJS |
| `@web-micro/app-platform` | `packages/app-platform/dist/` | UMD（`app-platform.umd.js`） |
| `@web-micro/main-app` | `packages/main-app/dist/` | 标准 SPA 静态文件 |

### 子应用公共路径配置

生产环境子应用静态资源路径通过环境变量控制：

```env
# packages/app-platform/.env.production
VITE_APP_PUBLIC_PATH=/platform/  # 与主应用 nginx 反代路径前缀一致
```

### nginx 部署方案

生产环境推荐将主应用和子应用分别部署，通过 nginx 反向代理实现同域访问。

**主应用 nginx 配置（`packages/main-app/nginx.conf.template`）**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /usr/share/nginx/html/main-app;
    index index.html;

    # 子应用反代 — 必须在 location / 之前声明
    location ^~ /platform/ {
        proxy_pass ${SUB_APP_ORIGIN}/;   # 子应用服务地址（替换为实际地址）
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 主应用静态文件（history 模式回退）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长效缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

**子应用 nginx 配置（`packages/app-platform/nginx.conf.template`）**

```nginx
server {
    listen 7101;
    server_name localhost;

    root /usr/share/nginx/html/app-platform;
    index index.html;

    # qiankun 要求子应用允许跨域（若经主应用反代则无需此配置）
    add_header Access-Control-Allow-Origin *;

    location / {
        try_files $uri $uri/ @history;
    }

    location @history {
        # 仅对非静态资源后缀的请求回退到 index.html
        if ($request_filename !~* \.(js|css|png|jpg|ico|woff|woff2)$) {
            rewrite ^(.*)$ /index.html last;
        }
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 部署步骤

1. 执行 `pnpm run build:all` 完成全量构建。
2. 将 `packages/main-app/dist/` 上传至主应用服务器的静态文件目录。
3. 将 `packages/app-platform/dist/` 上传至子应用服务器的静态文件目录。
4. 根据 nginx 模板配置并启动 nginx，将 `${SUB_APP_ORIGIN}` 替换为子应用的实际服务地址（如 `http://127.0.0.1:7101`）。
5. 验证：访问主域名，登录后确认 `/platform/` 路径下的业务页面正常加载。

### CI/CD 参考

```yaml
steps:
  - name: Install
    run: pnpm install --frozen-lockfile

  - name: Build
    run: pnpm run build:all

  - name: Deploy Main App
    run: rsync -av packages/main-app/dist/ $DEPLOY_PATH_MAIN/

  - name: Deploy Sub App
    run: rsync -av packages/app-platform/dist/ $DEPLOY_PATH_SUB/
```
