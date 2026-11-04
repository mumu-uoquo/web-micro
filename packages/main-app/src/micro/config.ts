/** 微应用注册与宿主路由配置。 */

import { AuthStorage } from "@/utils";
import { getGlobalActions } from "./global-state";
import { subscribeSseEvent } from "./sse-bridge";

export interface MicroAppEntry {
  readonly development: string;
  readonly production: string;
}

export type MicroAppPropsFactory = () => Record<string, unknown>;

export interface MicroAppConfig {
  readonly name: string;
  readonly entry: MicroAppEntry;
  readonly container: string;
  readonly activeRule: string;
  readonly props: MicroAppPropsFactory;
}

let retainedMicroAppRoutePaths: string[] = [];
let rerouteScheduled = false;

function scheduleMicroAppReroute(): void {
  if (typeof window === "undefined" || rerouteScheduled) return;

  rerouteScheduled = true;
  queueMicrotask(() => {
    rerouteScheduled = false;
    // retained path 不是浏览器 URL 的一部分，移除最后一个微应用标签时
    // 需要主动通知 single-spa/qiankun 重新计算 activeRule 并执行 unmount。
    //
    // 这里不能派发 popstate：vue-router 也监听 popstate，且 single-spa 会缓存其监听器并在
    // 重新计算后用旧的 history.state 回调。关闭激活标签时，router.push(上一个标签) 正在进行，
    // vue-router 会把待完成的导航改回当前（已关闭的）地址，导致跳转被取消、标签被重新加入，
    // 表现为"某子应用只剩一个激活标签时无法关闭"。
    // single-spa 同样监听 hashchange，而 vue-router 不监听它，因此用它触发重新计算。
    const url = window.location.href;
    window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL: url, newURL: url }));
  });
}

export function setRetainedMicroAppRoutePaths(paths: string[]): void {
  const nextPaths = [...new Set(paths)];
  const removedLastRetainedRoute = MICRO_APP_CONFIGS.some(
    (config) =>
      retainedMicroAppRoutePaths.some((path) => matchesActiveRule(path, config.activeRule)) &&
      !nextPaths.some((path) => matchesActiveRule(path, config.activeRule))
  );

  retainedMicroAppRoutePaths = nextPaths;

  if (removedLastRetainedRoute) {
    scheduleMicroAppReroute();
  }
}

/** 所有子应用默认共享的主应用状态；在每次生命周期执行前动态读取。 */
export function getMicroAppProps(): Record<string, unknown> {
  const { token, userInfo, permissions, cachedViews } = getGlobalActions().getState();
  return {
    token: AuthStorage.getAccessToken() || token,
    userInfo,
    permissions,
    cachedViews,
    // SSE 连接只由主应用持有，子应用通过它订阅主应用转发的事件（禁止自建 SSE 连接）
    onSseEvent: subscribeSseEvent,
  };
}

/**
 * 是否启用多实例模式（VITE_APP_MULTI_INSTANCE=true）。默认关闭（单实例）。
 *
 * - 单实例：所有子应用共用一个挂载容器，同一时刻只挂载一个子应用，切换子应用会卸载上一个，
 *   其页面缓存随之丢失。
 * - 多实例：每个子应用使用独立容器并常驻（qiankun singular=false），切换子应用只切换显示，
 *   页面缓存得以保留。该应用的标签全部关闭、切换角色或退出登录时才会卸载。
 */
export const MULTI_INSTANCE_ENABLED = import.meta.env.VITE_APP_MULTI_INSTANCE === "true";

/**
 * 是否启用 qiankun 的子应用样式隔离（VITE_APP_STYLE_ISOLATION=true）。默认关闭。
 *
 * 开启时子应用样式会被加前缀，但 :root 变量会被改写到子应用容器上（覆盖主应用通过
 * html.dark、行内样式设置的暗黑模式/主题色变量），html.dark 等选择器会失效，
 * 子应用无法跟随主应用切换主题。
 */
export const STYLE_ISOLATION_ENABLED = import.meta.env.VITE_APP_STYLE_ISOLATION === "true";

/** 新增子应用时只需在此增加一项。 */
export const MICRO_APP_CONFIGS = [
  {
    name: "app-platform",
    entry: {
      development: "http://localhost:7101",
      production: "/platform/",
    },
    container: "#sub-app-container",
    activeRule: "/platform",
    props: getMicroAppProps,
  },
  {
    name: "app-operate",
    entry: {
      development: "http://localhost:7102",
      production: "/operate/",
    },
    container: "#sub-app-container",
    activeRule: "/operate",
    props: getMicroAppProps,
  },
] as const satisfies readonly MicroAppConfig[];

export type MicroAppName = (typeof MICRO_APP_CONFIGS)[number]["name"];

function normalizePath(path: string): string {
  const normalized = path.trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+/, "")}`;
}

function matchesActiveRule(path: string, activeRule: string): boolean {
  return (
    path === activeRule || path.startsWith(`${activeRule}/`) || path.startsWith(`${activeRule}?`)
  );
}

/** 多实例模式下，子应用独立容器的元素 id。 */
export function getSubAppContainerId(name: string): string {
  return `sub-app-${name}`;
}

/** 获取子应用的挂载容器选择器：单实例共用配置中的容器，多实例使用各自独立的容器。 */
export function resolveMicroAppContainer(config: MicroAppConfig): string {
  return MULTI_INSTANCE_ENABLED ? `#${getSubAppContainerId(config.name)}` : config.container;
}

/** 根据当前构建模式获取子应用入口。 */
export function resolveMicroAppEntry(config: MicroAppConfig): string {
  return import.meta.env.DEV ? config.entry.development : config.entry.production;
}

/** 最近一次由地址栏命中的子应用 activeRule。 */
let lastShownActiveRule: string | undefined;

/**
 * 将字符串 activeRule 转换为适用于主应用 Hash Router 的 qiankun 激活函数。
 *
 * 单实例模式下，所有子应用共用同一个挂载容器，同一时刻只能有一个子应用处于激活状态，
 * 否则后挂载的应用会清空容器，已挂载的另一个应用无法再显示。因此：
 * - 地址栏属于某个子应用时，只激活该子应用；
 * - 地址栏是主应用自身页面（如欢迎页、个人中心）时，仅保留最近展示的那个子应用，
 *   且它仍有标签页时才保留，以便切回时恢复页面状态。
 */
export function createHashActiveRule(activeRule: string): (location: Location) => boolean {
  // 多实例：地址栏命中的子应用，以及仍有标签页的子应用都保持激活（各自使用独立容器）。
  if (MULTI_INSTANCE_ENABLED) {
    return (location) =>
      matchesActiveRule(location.hash.slice(1), activeRule) ||
      retainedMicroAppRoutePaths.some((path) => matchesActiveRule(path, activeRule));
  }

  return (location) => {
    const hashPath = location.hash.slice(1);
    const hashApp = MICRO_APP_CONFIGS.find((config) =>
      matchesActiveRule(hashPath, config.activeRule)
    );
    if (hashApp) {
      lastShownActiveRule = hashApp.activeRule;
      return hashApp.activeRule === activeRule;
    }
    return (
      lastShownActiveRule === activeRule &&
      retainedMicroAppRoutePaths.some((path) => matchesActiveRule(path, activeRule))
    );
  };
}

/** 将后端应用名、activeRule 名称统一成注册配置中的应用名。 */
export function resolveMicroAppName(value?: string): string | undefined {
  const normalized = value?.trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) return undefined;

  const matched = MICRO_APP_CONFIGS.find(
    (config) =>
      config.name === normalized || config.activeRule.replace(/^\/+|\/+$/g, "") === normalized
  );
  return matched?.name ?? normalized;
}

/** 获取应用对应的宿主激活前缀；未知应用按其名称生成前缀。 */
export function resolveMicroAppActiveRule(value?: string): string | undefined {
  const name = resolveMicroAppName(value);
  if (!name) return undefined;
  return (
    MICRO_APP_CONFIGS.find((config) => config.name === name)?.activeRule ?? normalizePath(name)
  );
}

/** 将子应用业务 path 转换为主应用中的宿主路由 path。 */
export function buildHostRoutePath(microPath: string, microApp?: string): string {
  const path = normalizePath(microPath);
  const activeRule = resolveMicroAppActiveRule(microApp);
  if (!activeRule || matchesActiveRule(path, activeRule)) return path;
  return path === "/" ? activeRule : `${activeRule}${path}`;
}

/**
 * 是否访客页面（免登录）。仅放开两类地址：
 * - /visitor、/visitor/**
 * - <微前端前缀>/visitor、<微前端前缀>/visitor/**（如 /platform/visitor/**、/operate/visitor/**）
 * 不能用 includes 之类的宽松匹配，否则路径中任意位置带 /visitor/ 的业务页面都会被当成匿名页。
 */
export function isVisitorRoute(path: string): boolean {
  const matches = (prefix: string) =>
    path === `${prefix}/visitor` || path.startsWith(`${prefix}/visitor/`);
  return matches("") || MICRO_APP_CONFIGS.some((config) => matches(config.activeRule));
}

/** 判断标准化路由是否属于指定或任一已注册微应用。 */
export function isMicroAppRoute(path: string, microApp?: string): boolean {
  const activeRule = resolveMicroAppActiveRule(microApp);
  if (activeRule) return matchesActiveRule(path, activeRule);
  return MICRO_APP_CONFIGS.some((config) => matchesActiveRule(path, config.activeRule));
}
