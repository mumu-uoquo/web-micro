import { ref } from "vue";
import { HOST_ROUTE_PREFIX } from "./config";

export const cachedViewKeys = ref<string[]>([]);

export function syncCachedViews(hostPaths: string[]): void {
  const childPaths = hostPaths.flatMap((hostPath) => {
    // publicPath 为根路径时，宿主路径就是子应用内部路径。
    if (HOST_ROUTE_PREFIX === "/") {
      return hostPath.startsWith("/") ? [hostPath] : [];
    }
    if (hostPath === HOST_ROUTE_PREFIX) return ["/"];
    if (hostPath.startsWith(`${HOST_ROUTE_PREFIX}/`)) {
      return [hostPath.slice(HOST_ROUTE_PREFIX.length)];
    }
    return [];
  });

  cachedViewKeys.value = [...new Set(childPaths)];
}
