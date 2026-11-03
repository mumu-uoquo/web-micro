/**
 * SSE 事件转发：主应用持有唯一的 SSE 连接，把白名单内的事件转发给子应用。
 *
 * 子应用禁止自建 SSE 连接（服务端压力 + 浏览器同域连接数限制会阻塞普通 ajax 请求），
 * 统一通过 qiankun props 中的 `onSseEvent` 订阅（见 getMicroAppProps）。
 *
 * 与 Global_State 的分工：
 * - 状态型数据（未读数等）走 Global_State，挂载时可立即拿到当前值；
 * - 事件型数据走本模块，不重放、不合并，每个事件都会送达当前已订阅的子应用。
 */

import type { HostSseEvent, HostSseHandler } from "@/utils";

/**
 * 允许转发给子应用的事件名（与后台 eventName 一致）。
 * 心跳（HEARTBEAT）、被踢下线（kickOut）等只在主应用内部处理，不转发。
 * 新增需要转发的事件时，只需在此追加。
 */
export const SSE_FORWARD_EVENTS = ["notify", "message", "todo"] as const;

/** 事件名 → 子应用订阅者 */
const subscribers = new Map<string, Set<HostSseHandler>>();
let seq = 0;

/**
 * 子应用订阅事件，作为 props.onSseEvent 注入。
 * 非白名单事件会被忽略（返回空操作的取消函数）。
 *
 * @returns 取消订阅函数
 */
export function subscribeSseEvent(event: string, handler: HostSseHandler): () => void {
  if (!(SSE_FORWARD_EVENTS as readonly string[]).includes(event)) {
    console.warn(`[SseBridge] 事件 "${event}" 不在转发白名单中，已忽略订阅`);
    return () => {};
  }
  let set = subscribers.get(event);
  if (!set) {
    set = new Set();
    subscribers.set(event, set);
  }
  set.add(handler);
  return () => {
    subscribers.get(event)?.delete(handler);
  };
}

/** 向已订阅该事件的子应用转发；单个子应用的处理器报错不影响其他子应用 */
function emit(event: string, data: unknown): void {
  const set = subscribers.get(event);
  if (!set?.size) return;

  const payload: HostSseEvent = { event, data, seq: ++seq, ts: Date.now() };
  // 复制一份再遍历，防止处理器内部取消订阅影响遍历
  [...set].forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[SseBridge] 子应用处理事件 ${event} 失败:`, err);
    }
  });
}

/**
 * 在主应用的 SSE 连接上注册转发器。
 *
 * @param on useSse().on，注册事件处理并返回取消函数
 * @returns 取消全部转发器的函数
 */
export function startSseForwarding(
  on: (event: string, handler: (data: any) => void) => () => void
): () => void {
  const offs = SSE_FORWARD_EVENTS.map((event) => on(event, (data) => emit(event, data)));
  return () => offs.forEach((off) => off());
}
