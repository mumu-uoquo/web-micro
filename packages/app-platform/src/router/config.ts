/** app-platform 在主应用中的宿主路由前缀。 */

function normalizeRoutePrefix(prefix: string | undefined): string {
  const value = (prefix || "/platform").trim();
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

export const HOST_ROUTE_PREFIX = normalizeRoutePrefix(import.meta.env.VITE_APP_HOST_ROUTE_PREFIX);

/** 将宿主 /#/platform/** 地址转换为子应用内部地址；当前地址不在该前缀下时返回 null。 */
export function getChildRouteFromHostHash(): string | null {
  const hostFullPath = window.location.hash.slice(1) || "/";
  if (hostFullPath === HOST_ROUTE_PREFIX) return "/";
  if (hostFullPath.startsWith(`${HOST_ROUTE_PREFIX}?`)) {
    return `/${hostFullPath.slice(HOST_ROUTE_PREFIX.length)}`;
  }
  if (hostFullPath.startsWith(`${HOST_ROUTE_PREFIX}/`)) {
    return hostFullPath.slice(HOST_ROUTE_PREFIX.length);
  }
  return null;
}

/**
 * 访客页面（免登录）的子应用内部路径规则：仅 /visitor 或 /visitor/** 。
 * 免登录只放开这个命名空间，不能用 includes 之类的宽松匹配，避免业务页面被误当成匿名页。
 */
export function isVisitorPath(path: string): boolean {
  return /^\/visitor(\/|\?|$)/.test(path);
}

/**
 * 当前入口是否为访客页面（免登录）。
 * 子应用模式取宿主地址去掉前缀后的内部路径；独立运行时 hash 本身就是子应用内部路径。
 */
export function isVisitorEntry(): boolean {
  const childPath = getChildRouteFromHostHash() ?? (window.location.hash.slice(1) || "/");
  return isVisitorPath(childPath);
}
