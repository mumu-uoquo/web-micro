/** 微应用注册与宿主路由配置。 */

import { AuthStorage } from "@/utils";
import { getGlobalActions } from "./global-state";

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
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
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
  };
}

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

/** 根据当前构建模式获取子应用入口。 */
export function resolveMicroAppEntry(config: MicroAppConfig): string {
  return import.meta.env.DEV ? config.entry.development : config.entry.production;
}

/** 最近一次由地址栏命中的子应用 activeRule。 */
let lastShownActiveRule: string | undefined;

/**
 * 将字符串 activeRule 转换为适用于主应用 Hash Router 的 qiankun 激活函数。
 *
 * 所有子应用共用同一个挂载容器，同一时刻只能有一个子应用处于激活状态，
 * 否则后挂载的应用会清空容器，已挂载的另一个应用无法再显示。因此：
 * - 地址栏属于某个子应用时，只激活该子应用；
 * - 地址栏是主应用自身页面（如欢迎页、个人中心）时，仅保留最近展示的那个子应用，
 *   且它仍有标签页时才保留，以便切回时恢复页面状态。
 */
export function createHashActiveRule(activeRule: string): (location: Location) => boolean {
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

/** 判断标准化路由是否属于指定或任一已注册微应用。 */
export function isMicroAppRoute(path: string, microApp?: string): boolean {
  const activeRule = resolveMicroAppActiveRule(microApp);
  if (activeRule) return matchesActiveRule(path, activeRule);
  return MICRO_APP_CONFIGS.some((config) => matchesActiveRule(path, config.activeRule));
}
