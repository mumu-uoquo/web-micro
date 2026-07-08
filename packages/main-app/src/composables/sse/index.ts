import { useSse } from "./useSse";

/**
 * 登录成功后建立 SSE 连接
 * SSE 事件的注册/注销由各使用组件通过 initialize()/cleanup() 自行管理
 */
export function connectSse() {
  useSse().connect();
}

/**
 * 退出登录时断开 SSE 连接
 * 仅断开网络连接，不清理事件订阅（由各组件在 onBeforeUnmount 里 cleanup()）
 */
export function disconnectSse() {
  useSse().disconnect();
}

export { useSse, cleanupSse, SseConnectionState } from "./useSse";
export { useNoticeSync } from "./useNoticeSync";
export type { NoticeCallback } from "./useNoticeSync";
export { useDictSync } from "./useDictSync";
export type { DictChangeCallback, DictChangeMessage } from "./useDictSync";
export { useOnlineCount } from "./useOnlineCount";
export { useFetchEventSource, useDefaultEventSource, ConnectStatus } from "./useEventSource";
