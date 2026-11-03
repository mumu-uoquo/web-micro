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
8. [SSE 事件转发（子应用订阅主应用 SSE）](#sse-事件转发子应用订阅主应用-sse)
9. [本地开发指南](#本地开发指南)
10. [Shared 模块的编译与发布](#shared-模块的编译与发布)
11. [生产构建与部署指南](#生产构建与部署指南)

---

## 工程结构

```text
web-micro/
├── package.json                  # 根目录：build:all / dev:main / dev:app-platform 等脚本
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
- **qiankun 子应用注册**：所有子应用的名称、分环境入口、容器、activeRule 和函数式 props 集中维护在 `src/micro/config.ts`；`register.ts` 仅负责动态注册。
- **Global_State 初始化**：调用 `initGlobalState({ token, userInfo, permissions, cachedViews, fullscreen, notifications, language })`，承载主子应用间的状态同步；SSE 事件则通过 props 中的 `onSseEvent` 转发，见 [SSE 事件转发](#sse-事件转发子应用订阅主应用-sse)。
- **SSE 消息通知**：全局单例 `useSse`，仅主窗口（`window.opener === null` 且 URL 不含 `_ticket` 参数）在登录后建立 SSE 连接，新标签页不重复连接。**SSE 连接只由主应用持有**，子应用通过主应用转发的事件获取消息，详见 [SSE 事件转发](#sse-事件转发子应用订阅主应用-sse)。
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
| ------ | ---------- | ------ |
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

### 方案选择：默认关闭样式隔离，可通过开关启用 CSS Scoping（不使用 Shadow DOM）

是否启用由主应用环境变量 `VITE_APP_STYLE_ISOLATION` 控制（`packages/main-app/.env.development` / `.env.production`），**默认 `false`**：

```env
# 子应用样式隔离开关(true:开启 qiankun experimentalStyleIsolation false:关闭)
# 开启后子应用不跟随主应用的暗黑模式/主题色切换，默认关闭
VITE_APP_STYLE_ISOLATION=false
```

`src/micro/register.ts` 将该开关传给 qiankun：

```typescript
start({
  singular: !MULTI_INSTANCE_ENABLED,
  sandbox: {
    experimentalStyleIsolation: STYLE_ISOLATION_ENABLED,  // 读取 VITE_APP_STYLE_ISOLATION
  },
})
```

**默认关闭的原因**：主应用的暗黑模式（`html.dark`）、主题色（行内样式写在 `:root` 上的 CSS 变量）需要对子应用生效。开启样式隔离后，qiankun 会给子应用样式加前缀，并把 `:root` 改写为子应用容器、把 `html.dark` 之类的选择器改写成无法匹配的规则，导致子应用不再跟随主应用切换暗黑模式和主题色。

**不使用 Shadow DOM** 的原因：Element Plus 的弹出层（`el-dialog`、`el-tooltip`、`el-select` 下拉等）默认挂载至 `document.body`，Shadow DOM 边界会导致这些弹出层无法继承样式，造成样式完全失效。

### 开启时的工作原理（CSS Scoping）

开启后，qiankun 为子应用的 CSS 规则添加属性选择器前缀（形如 `div[data-qiankun="app-platform"]`），规则只在该子应用容器内生效，同时 Element Plus 弹出层依然可用。

### 注意事项

- **默认（关闭）模式下**，主应用与子应用共用同一份全局样式环境，没有自动隔离：子应用应使用 `scoped` 样式或带前缀的类名，避免用全局选择器（如直接覆写 `.el-button`）影响主应用和其他子应用。
- 子应用不应在 `:root`、`html`、`body` 上写入与主应用同名的变量，也应避免用 `!important` 强制覆盖主应用的 CSS 变量，否则会污染主应用。
- **开启隔离时**，`:root`、`html`、`body` 选择器会被改写，子应用将无法跟随主应用的暗黑模式和主题色；仅在明确需要样式隔离且接受此限制时开启。
- 子应用共享 Element Plus 组件库时，各自的 CSS 覆写变量应限定在自己的根容器作用域内。

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
  cachedViews: string[];                 // 主应用中需要保留实例的标签 path，子应用据此同步 KeepAlive 缓存
  fullscreen: boolean | null;            // 全屏切换信号：null=无操作，非 null 时主应用切换内容区全屏并重置为 null
  notifications: {
    unreadCount: number;                 // 消息未读数，由主应用 SSE 模块更新
  };
  language: string;                      // 界面语言（zh-CN / en），主应用切换语言时更新，子应用据此切换自身多语言
}
```

定义见 `packages/main-app/src/micro/global-state.ts`。

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
                                   onGlobalStateChange → appStore.toggleContentFullscreen()
                                   处理后重置 fullscreen = null
```

### 主应用写入时机

| 时机 | 写入字段 |
| ------ | ---------- |
| 用户登录成功 | `token`、`userInfo` |
| `generateRoutes` 完成 | `permissions` |
| 令牌刷新成功 | `token` |
| 标签页增删（打开/关闭标签） | `cachedViews` |
| 用户切换界面语言 | `language` |
| 退出登录 | `token: ''`、`userInfo: {}`、`permissions: []`、`fullscreen: null` |
| SSE 收到消息通知 | `notifications.unreadCount` |

### 子应用挂载时的初始同步

qiankun `beforeMount` 钩子在挂载前将最新状态注入 `props`，子应用 `mount(props)` 收到初始值后调用 `onGlobalStateChange(callback, true)`（`fireImmediately=true`）立即同步一次，确保挂载时权限和 token 已就绪。

### SSE 通知传递

SSE 长连接由主应用全局单例管理，子应用不直接建立 SSE 连接。当 `useNoticeSync` 收到 `notify/message/todo` 事件时，通过 `setState({ notifications: { unreadCount } })` 将未读数推送至子应用，子应用订阅 Global_State 变更后更新自身徽标显示。

需要在子应用中处理 SSE 事件本身（如收到待办后刷新列表）时，使用主应用转发的事件通道，见下一节。

---

## SSE 事件转发（子应用订阅主应用 SSE）

### 为什么子应用不能自建 SSE

- **服务端压力**：每个子应用各建一条长连接，连接数随子应用数量成倍增加。
- **浏览器连接数限制**：浏览器对同一域名的并发连接数有限（HTTP/1.1 通常为 6 条），SSE 长连接会一直占用名额，连接过多会导致普通 ajax 请求排队发不出去。

因此约定：**SSE 连接只由主应用持有，子应用禁止自建 `EventSource` / `fetch` event-stream 连接**。需要消息时，向主应用订阅转发的事件。

### 整体结构

```text
后端 ──SSE──▶ main-app useSse（唯一连接）
                  │  白名单内的事件
                  ▼
             micro/sse-bridge（主应用内的发布订阅）
                  │  通过 qiankun props 注入 onSseEvent
         ┌────────┴────────┐
    app-platform       其他子应用       mount 时订阅，unmount 时取消
```

### 与 Global_State 的分工

| 数据类型 | 通道 | 说明 |
|----------|------|------|
| 状态型（未读数、token、权限） | Global_State | 挂载时可立即拿到当前值 |
| 事件型（收到一条通知/待办） | `onSseEvent` | 不重放、不合并，每个事件送达当前已订阅的子应用 |

事件不放进 Global_State 的原因：`onGlobalStateChange(cb, true)` 在子应用挂载时会立即回调当前值，如果把"最近一条事件"存为状态，单实例模式下每次重新挂载都会重复收到旧事件；同时每次 `setGlobalState` 会深拷贝整个状态并通知所有监听者，开销较大。

### 事件格式

```typescript
interface HostSseEvent<T = any> {
  event: string;  // 后端事件名（eventName），如 "notify"
  data: T;        // 事件数据（JSON 解析后的对象，解析失败时为原始文本）
  seq: number;    // 主应用侧自增序号，同一次会话内单调递增
  ts: number;     // 主应用收到事件的时间戳（ms）
}
```

### 主应用侧

| 文件 | 作用 |
| ------ | ------ |
| `main-app/src/micro/sse-bridge.ts` | 转发白名单 `SSE_FORWARD_EVENTS`、子应用订阅 `subscribeSseEvent`、转发器 `startSseForwarding` |
| `main-app/src/micro/config.ts` | `getMicroAppProps()` 将 `onSseEvent: subscribeSseEvent` 注入每个子应用的 props |
| `main-app/src/composables/sse/useNoticeSync.ts` | `initialize()` 中注册转发器（`cleanupSse` 会清空所有处理器，登录后需重新注册） |

当前转发白名单：

```typescript
export const SSE_FORWARD_EVENTS = ["notify", "message", "todo"] as const;
```

- 需要新增可转发的事件时，在此数组追加事件名（与后端 `eventName` 一致）即可。
- 心跳（`HEARTBEAT`）、被踢下线（`kickOut`）只在主应用内部处理，不转发。
- 订阅白名单之外的事件会被忽略，并在控制台输出警告。
- 单个子应用的处理器抛错只记录日志，不影响其他子应用。

### 子应用注册示例

下面以 `app-platform` 为例，新增子应用按同样方式接入。前提：依赖 `@web-micro/shared >= 1.1.1`（见 [Shared 模块的编译与发布](#shared-模块的编译与发布)）。

**1. 在入口 `main.ts` 中声明 props 类型，并在生命周期里连接/断开**

```typescript
import { attachHostSse, detachHostSse } from "@/utils";
import type { HostSseSubscribe } from "@/utils";

export interface QiankunProps {
  container: HTMLElement;
  // ...其他 props（token / userInfo / onGlobalStateChange 等）
  /** 订阅主应用转发的 SSE 事件；非 qiankun 运行时不存在 */
  onSseEvent?: HostSseSubscribe;
}

export async function mount(props: QiankunProps): Promise<void> {
  // ...创建 router
  // 需在页面组件创建之前连接，页面里的订阅才能生效
  attachHostSse(props.onSseEvent);

  app = createApp(AppComponent);
  // ...
  app.mount(container);
}

export async function unmount(): Promise<void> {
  // 取消所有 SSE 事件订阅
  detachHostSse();
  // ...卸载 Vue 实例、清空容器
}
```

`@/utils` 需要从 `@web-micro/shared` 再导出 `attachHostSse`、`detachHostSse`、`onHostSseEvent` 及类型 `HostSseEvent`、`HostSseHandler`、`HostSseSubscribe`（`app-platform/src/utils/index.ts` 已导出）。

**2. 封装组合式函数（组件卸载时自动取消订阅）**

`app-platform/src/composables/useHostSse.ts`：

```typescript
import { onScopeDispose } from "vue";
import { onHostSseEvent } from "@/utils";
import type { HostSseHandler } from "@/utils";

export function useHostSse<T = any>(eventName: string, handler: HostSseHandler<T>): () => void {
  const off = onHostSseEvent<T>(eventName, handler);
  onScopeDispose(off);
  return off;
}
```

**3. 在页面中订阅**

```vue
<script setup lang="ts">
import { useHostSse } from "@/composables";

// 首次加载仍需通过接口获取数据（挂载之前的事件不会重放）
loadTodoList();

// 收到主应用转发的待办事件后刷新列表
useHostSse("todo", ({ data, seq }) => {
  console.log("收到待办", seq, data);
  loadTodoList();
});
</script>
```

**4. 非 Vue 场景**

```typescript
import { onHostSseEvent } from "@web-micro/shared";

const off = onHostSseEvent("notify", ({ data }) => { /* ... */ });
// 不再需要时
off();
```

### 使用规范

1. **禁止自建 SSE**：子应用不得使用 `EventSource`、`@microsoft/fetch-event-source` 或自行 `fetch` 事件流，统一使用 `useHostSse` / `onHostSseEvent`。
2. **不保证重放**：挂载之前发生的事件收不到。页面首次加载时通过接口获取最新数据，之后依靠事件增量更新。
3. **只能订阅白名单事件**：需要新事件时先在主应用 `SSE_FORWARD_EVENTS` 中追加。
4. **独立运行时无事件**：子应用以 Dev_Mode 独立运行（非 qiankun）时 props 中没有 `onSseEvent`，`attachHostSse` 为空操作，**不会降级为自建连接**；需要联调事件请通过主应用访问。
5. **处理器要轻量**：处理器同步执行，耗时操作请自行异步化，避免阻塞其他子应用收到同一事件。
6. **在 mount 中订阅、unmount 中断开**：`detachHostSse()` 会清空该子应用内的全部订阅，防止子应用卸载后残留。

### SSE 鉴权失败处理（主应用）

主应用 `useSse` 对服务端以 HTTP 200 + `Response-Code` 响应头返回的鉴权类错误码不再重连，而是按错误码处理：

| 错误码 | 含义 | 处理 |
| -------- | ------ | ------ |
| `02006` | 令牌失效/过期 | 先刷新令牌并立即重连一次；刷新失败，或刷新后仍返回 `02006`，则清理登录态并跳转登录页 |
| `02021` | 异地登录被踢下线 | 直接清理登录态并跳转登录页（提示账号已在其他地方登录） |
| `02001` / `02005` | 缺少签名/令牌 | 直接清理登录态并跳转登录页 |

跳转逻辑复用 `api/http.ts` 导出的 `handleSessionExpired`，与普通 HTTP 请求的会话失效处理一致（保留 `redirect` 参数，避免重复触发）。其他错误码仍按指数退避重连（最多 10 次）。

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
pnpm run dev:app-platform

# 终端 2：启动主应用（端口 7100）
pnpm run dev:main
```

访问 `http://localhost:7100`，通过主应用登录后即可访问所有业务页面。

### 方式二：仅运行子应用（独立调试业务页面）

```bash
pnpm run dev:app-platform
```

访问 `http://localhost:7101`，子应用提供独立登录页，登录后可直接访问业务功能，无需启动主应用。

### 微应用与环境配置

主应用不再使用按子应用拆分的 `VITE_SUB_APP_*` 环境变量。所有子应用入口与路由规则统一维护在 `packages/main-app/src/micro/config.ts`：

```typescript
{
  name: "app-platform",
  entry: {
    development: "http://localhost:7101",
    production: "/platform/",
  },
  container: "#sub-app-container",
  activeRule: "/platform",
  props: getMicroAppProps,
}
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

## Shared 模块的编译与发布

`@web-micro/shared`（`packages/shared`）使用 Rollup 构建，产物在 `dist/`。`web-micro` 内的 `main-app`、`app-platform` 通过 `workspace:*` 直接引用本地 `dist/`；仓库外的子应用（如 `app-operate`）通过私有 npm 仓库安装已发布的版本。

### 编译

在 `web-micro` 根目录执行：

```bash
# 构建一次（输出 dist/index.esm.js、dist/index.cjs.js、dist/index.d.ts 及 sourcemap）
pnpm run build:shared
# 等价于
pnpm --filter @web-micro/shared build

# 监听源码变更并自动重新构建（联调 shared 时使用）
pnpm --filter @web-micro/shared dev

# 运行 shared 的单元测试
pnpm --filter @web-micro/shared test
```

注意：

- 修改 `shared` 源码后，必须重新构建，主应用和子应用才能看到变更；新增导出时，类型检查也依赖最新的 `dist/index.d.ts`。
- `dist/` 不提交到 Git，克隆仓库后首次开发前需先构建一次。

### 版本号约定

按语义化版本修改 `packages/shared/package.json` 的 `version`：

| 变更类型 | 修改位 | 示例 |
| ---------- | -------- | ------ |
| 向后兼容的新增导出、问题修复 | 第三位（补丁号） | `1.1.0` → `1.1.1` |
| 向后兼容的较大功能 | 第二位 | `1.1.1` → `1.2.0` |
| 不兼容变更（删除/修改已有导出的行为） | 第一位 | `1.2.0` → `2.0.0` |

可手工修改，也可在 `packages/shared` 目录下执行（不创建 Git tag）：

```bash
npm version patch --no-git-tag-version   # 第三位 +1
```

### 发布到私有 npm 仓库

发布仓库在 `packages/shared/package.json` 的 `publishConfig.registry` 中指定：

```text
https://mvn.uoquo.com/repository/npm-hosted/    # 发布（hosted）
https://mvn.uoquo.com/repository/npm-public/    # 安装（group，聚合 hosted 与代理仓库）
```

发布步骤：

```bash
# 1. 首次发布前登录（凭证保存在用户级 ~/.npmrc，不要写入仓库）
npm login --registry=https://mvn.uoquo.com/repository/npm-hosted/

# 2. 修改 packages/shared/package.json 的 version，并确认测试通过
pnpm --filter @web-micro/shared test

# 3. 重新构建，保证 dist 与源码一致（发布内容仅包含 dist/，见 package.json 的 files 字段）
pnpm run build:shared

# 4. 发布（在仓库根目录执行；发布前会读取 publishConfig.registry）
pnpm --filter @web-micro/shared publish --no-git-checks
```

说明：

- 同一个版本号只能发布一次，重复发布会被仓库拒绝，需先提升版本号。
- 发布不会自动执行构建，务必先执行第 3 步，否则会发布过期的 `dist/`。
- 发布完成后，`web-micro` 内部的包无需修改（仍为 `workspace:*`）；仓库外的子应用需要升级依赖。

### 仓库外子应用升级 shared

以 `app-operate` 为例，其 `.npmrc` 已将 `@web-micro` 作用域指向 `npm-public`：

```bash
# 在 app-operate 目录
# 1. 将 package.json 中的依赖改为新版本，如 "@web-micro/shared": "^1.1.1"
# 2. 安装
pnpm install
# 或直接升级到最新版本
pnpm update @web-micro/shared
```

依赖某个 shared 新增能力的功能（例如 SSE 事件转发需要 `>= 1.1.1`），必须在对应版本发布后才能在仓库外子应用中使用。

---

## 生产构建与部署指南

### 一键构建所有包

```bash
pnpm run build:all
```

等价于顺序执行：

```bash
pnpm run build:shared && pnpm run build:app-platform && pnpm run build:main
```

任一步骤失败立即终止，以非零退出码退出。

### 构建产物位置

| 包 | 产物目录 | 格式 |
| ---- | ---------- | ------ |
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

    # app-operate 子应用反代（每新增一个子应用，都需要增加对应的 location）
    location ^~ /operate/ {
        proxy_pass ${OPERATE_APP_ORIGIN}/;   # app-operate 服务地址（替换为实际地址）
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
4. 根据 nginx 模板配置并启动 nginx，将 `${SUB_APP_ORIGIN}` 替换为 app-platform 的实际服务地址（如 `http://127.0.0.1:7101`），将 `${OPERATE_APP_ORIGIN}` 替换为 app-operate 的实际服务地址（如 `http://127.0.0.1:7102`）。
5. 验证：访问主域名，登录后确认 `/platform/`、`/operate/` 路径下的业务页面均正常加载。可在浏览器直接访问 `/operate/`，应返回 app-operate 的 index.html 而不是主应用页面。

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
