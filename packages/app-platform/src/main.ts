/**
 * app-platform 子应用入口
 *
 * - 导出 qiankun 三个生命周期函数：bootstrap / mount / unmount
 * - 底部 Dev_Mode 判断：!window.__POWERED_BY_QIANKUN__ 时直接 createApp().mount('#app')
 *
 * Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 5.2, 5.4, 6.1
 */

import { createApp, type App as VueApp } from "vue";
import AppComponent from "./App.vue";

// ===== 样式导入 =====
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "vxe-table/lib/style.css";
import "@/styles/index.scss";
import "uno.css";
import "animate.css";

// ===== 核心配置 =====
import { createAppRouter, disposeAppRouter } from "./router/index";
import { pinia } from "./stores";
import { setupI18n } from "./plugins/i18n";
import ElementPlus from "element-plus";
import { setupPermissionDirective, updatePermissions } from "./directives/permission";
import { AuthStorage } from "@web-micro/shared";
import { consumeTabTicket } from "./utils/ticket";
import { qiankunWindow, renderWithQiankun } from "vite-plugin-qiankun/dist/helper";

// ── qiankun 全局标志声明 ────────────────────────────────────────────────────
declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean;
  }
}

// ── QiankunProps 接口 ────────────────────────────────────────────────────────
export interface GlobalState {
  token: string;
  userInfo: Record<string, any>;
  permissions: string[];
  [key: string]: any;
}

export interface QiankunProps {
  /** 子应用挂载的容器元素（由 qiankun 注入） */
  container: HTMLElement;
  /** 当前 Global_State 快照（挂载时的初始值） */
  token: string;
  userInfo: Record<string, any>;
  permissions: string[];
  /** 订阅 Global_State 变更 */
  onGlobalStateChange: (
    callback: (state: GlobalState, prev: GlobalState) => void,
    fireImmediately?: boolean
  ) => void;
  /** 向 Main_App 推送部分状态更新 */
  setGlobalState: (state: Partial<GlobalState>) => void;
}

// ── 模块级状态 ────────────────────────────────────────────────────────────────
let app: VueApp | null = null;
let unsubscribeGlobalState: (() => void) | null = null;
let mountedContainer: HTMLElement | null = null;

/**
 * 同步 Global_State 至子应用内部响应式状态
 * 更新 v-permission 指令所依赖的权限数组
 */
function syncGlobalState(state: GlobalState): void {
  if (Array.isArray(state.permissions)) {
    updatePermissions(state.permissions);
  }
}

// ── 生命周期：bootstrap ───────────────────────────────────────────────────────
/**
 * 完成全局插件的一次性注册，不创建 Vue 实例。
 * qiankun 在整个子应用生命周期中只调用一次。
 *
 * Requirements: 4.5
 */
export async function bootstrap(): Promise<void> {
  console.log("[app-platform] bootstrap");
}

// ── 生命周期：mount ───────────────────────────────────────────────────────────
/**
 * 创建 Vue 3 应用实例并挂载至 props.container 中的 #app。
 *
 * Prod_Mode（window.__POWERED_BY_QIANKUN__ === true）且 props.token 为空时
 * reject 并打印错误日志，拒绝挂载。
 *
 * Requirements: 4.6, 4.8, 5.2
 */
export async function mount(props: QiankunProps): Promise<void> {
  // 主应用 props 为首选；共享认证存储作为防御性回退，避免生命周期时序导致误拒绝。
  const accessToken = props.token || AuthStorage.getAccessToken();
  if (qiankunWindow.__POWERED_BY_QIANKUN__ && !accessToken) {
    const msg = "[app-platform] 缺少 token，拒绝挂载";
    console.error(msg);
    return Promise.reject(new Error(msg));
  }
  props.token = accessToken;

  const router = createAppRouter(props);

  app = createApp(AppComponent);
  app.use(router);
  app.use(pinia);
  setupI18n(app);
  app.use(ElementPlus);
  setupPermissionDirective(app, props);

  // Memory History 已由路由工厂写入宿主对应地址，等待首次导航完成后再渲染。
  await router.isReady();

  // 订阅 Global_State 变更，fireImmediately=true 确保挂载时立即同步初始值
  // qiankun v2 的 props.onGlobalStateChange 返回取消订阅函数
  if (typeof props.onGlobalStateChange === "function") {
    const unsubscribe = props.onGlobalStateChange((state: GlobalState) => {
      syncGlobalState(state);
    }, true);

    // 保存取消订阅函数供 unmount 调用
    unsubscribeGlobalState = typeof unsubscribe === "function" ? unsubscribe : null;
  }

  // qiankun 将子应用入口 HTML 注入 props.container，真实 Vue 挂载点是其中的 #app。
  const container =
    props.container.querySelector<HTMLElement>("#app") ??
    (props.container.matches("#app") ? props.container : null);
  if (!container) {
    console.error("[app-platform] 未找到 #app，挂载失败");
    return Promise.reject(new Error("[app-platform] 未找到 #app"));
  }
  mountedContainer = container;
  app.mount(container);
}

// ── 生命周期：unmount ─────────────────────────────────────────────────────────
/**
 * 注销 onGlobalStateChange 监听器，卸载 Vue 实例并清空容器 innerHTML。
 *
 * Requirements: 4.7, 5.4
 */
export async function unmount(): Promise<void> {
  disposeAppRouter();

  // 注销 Global_State 监听
  if (unsubscribeGlobalState) {
    unsubscribeGlobalState();
    unsubscribeGlobalState = null;
  }

  if (app) {
    app.unmount();
    app = null;
  }

  // 清空容器 innerHTML，防止残留 DOM 节点
  if (mountedContainer) {
    mountedContainer.innerHTML = "";
    mountedContainer = null;
  }
}

// Vite 开发态通过插件将 ESM 生命周期注册到 qiankun。
export async function update(props: QiankunProps): Promise<void> {
  syncGlobalState(props as GlobalState);
}

renderWithQiankun({
  bootstrap,
  mount: (props) => mount(props as QiankunProps),
  unmount,
  update: (props) => update(props as QiankunProps),
});

// ── Dev_Mode 双模入口 ─────────────────────────────────────────────────────────
/**
 * 非 qiankun 环境（Dev_Mode 独立运行）时直接创建应用并挂载至 #app。
 *
 * 进入逻辑（优先级从高到低）：
 * 1. URL 含 _ticket 参数 → Tab_Ticket 新标签页流程
 *    - consumeTabTicket() 读取并立即删除 sessionStorage._tab_ticket
 *    - 有效 token → AuthStorage.setTokens() 后正常挂载（进入首页）
 *    - 无效 / 过期 → 重定向至 /login
 * 2. URL 不含 _ticket → 普通 Dev_Mode 流程
 *    - AuthStorage.getAccessToken() 非空 → 正常挂载（进入首页）
 *    - token 为空 → 挂载登录页
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.4, 11.5, 11.6
 */
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  const url = new URL(window.location.href);
  const hasTicket = url.searchParams.has("_ticket");

  if (hasTicket) {
    // ── Tab_Ticket 新标签页流程 ──────────────────────────────────────────
    // Requirements: 11.4, 11.5, 11.6
    const token = consumeTabTicket();
    if (token) {
      // Token 有效：保存至 AuthStorage，正常挂载子应用（进入首页）
      AuthStorage.setTokens({
        accessToken: token,
        refreshToken: "",
        expireTime: 0,
      });
      // 清除 URL 中的 _ticket 参数，防止刷新时重复消费
      url.searchParams.delete("_ticket");
      window.history.replaceState({}, "", url.toString());

      const router = createAppRouter({} as QiankunProps);
      const devApp = createApp(AppComponent);
      devApp.use(router);
      devApp.use(pinia);
      setupI18n(devApp);
      devApp.use(ElementPlus);
      setupPermissionDirective(devApp, { permissions: [] });
      devApp.mount("#app");
    } else {
      // Token 无效或过期：重定向至登录页（Requirements: 11.5）
      console.warn("[app-platform] Tab_Ticket 无效或已过期，重定向至登录页");
      window.location.href = "/login";
    }
  } else {
    // ── 普通 Dev_Mode 流程 ───────────────────────────────────────────────
    // Requirements: 6.3, 6.4
    const existingToken = AuthStorage.getAccessToken();

    const router = createAppRouter({} as QiankunProps);
    const devApp = createApp(AppComponent);
    devApp.use(router);
    devApp.use(pinia);
    setupI18n(devApp);
    devApp.use(ElementPlus);
    setupPermissionDirective(devApp, { permissions: [] });
    devApp.mount("#app");

    if (!existingToken) {
      // Token 为空：挂载后跳转至登录页
      router.isReady().then(() => {
        router.push("/login");
      });
    }
    // Token 非空时 router 默认 '/' → '/dashboard/index'，直接进入业务首页
  }
}
