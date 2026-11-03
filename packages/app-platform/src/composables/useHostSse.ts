import { onScopeDispose } from "vue";
import { onHostSseEvent } from "@/utils";
import type { HostSseHandler } from "@/utils";

/**
 * 在组件中订阅主应用转发的 SSE 事件，组件卸载时自动取消订阅。
 *
 * 子应用禁止自建 SSE 连接（EventSource / fetch event-stream），统一使用本方法。
 * 不保证重放：挂载之前发生的事件收不到，页面需在首次加载时通过接口获取最新数据。
 * 可订阅的事件以主应用的转发白名单为准（micro/sse-bridge.ts 的 SSE_FORWARD_EVENTS）。
 *
 * @example
 * useHostSse("notify", ({ data }) => { ... });
 *
 * @param eventName 后端事件名，如 "notify" / "message" / "todo"
 * @param handler 事件处理器
 * @returns 手动取消订阅函数（一般无需调用）
 */
export function useHostSse<T = any>(eventName: string, handler: HostSseHandler<T>): () => void {
  const off = onHostSseEvent<T>(eventName, handler);
  onScopeDispose(off);
  return off;
}
