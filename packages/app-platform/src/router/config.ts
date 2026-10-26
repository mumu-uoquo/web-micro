/** app-platform 在主应用中的宿主路由前缀。 */

function normalizeRoutePrefix(prefix: string | undefined): string {
  const value = (prefix || "/platform").trim();
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

export const HOST_ROUTE_PREFIX = normalizeRoutePrefix(import.meta.env.VITE_APP_HOST_ROUTE_PREFIX);
