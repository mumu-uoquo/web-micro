/**
 * 子应用订阅主应用转发的 SSE 事件。
 *
 * 约定：SSE 连接只由主应用（main-app）持有，子应用禁止自建 EventSource / fetch event-stream，
 * 否则会增加服务端压力，并占用浏览器对同一域名的连接数，导致普通 ajax 请求被阻塞。
 * 主应用把白名单内的事件通过 qiankun props 的 `onSseEvent` 转发给子应用。
 *
 * 用法：
 *   1. 子应用 mount 时调用 attachHostSse(props.onSseEvent)，unmount 时调用返回的函数（或 detachHostSse）。
 *   2. 页面/组件中调用 onHostSseEvent("notify", handler)，返回取消订阅函数。
 *
 * 不保证重放：挂载之前发生的事件收不到，需要由页面在首次加载时通过接口补齐数据。
 * 本模块不依赖 Vue，子应用可自行用 onScopeDispose / onBeforeUnmount 包装取消订阅。
 */

/** 主应用转发的事件包装 */
export interface HostSseEvent<T = any> {
  /** 后端事件名（eventName） */
  event: string;
  /** 事件数据（已按 JSON 解析，解析失败时为原始文本） */
  data: T;
  /** 主应用侧自增序号，同一次会话内单调递增 */
  seq: number;
  /** 主应用收到事件的时间戳（ms） */
  ts: number;
}

export type HostSseHandler<T = any> = (event: HostSseEvent<T>) => void;

/** 主应用通过 qiankun props 注入的订阅函数，返回取消订阅函数 */
export type HostSseSubscribe = (event: string, handler: HostSseHandler) => () => void;

/** 本子应用内的处理器登记表：事件名 → 处理器集合 */
const handlers = new Map<string, Set<HostSseHandler>>();
/** 已向主应用建立的订阅：事件名 → 取消订阅函数。每个事件只向主应用订阅一次 */
const hostUnsubscribes = new Map<string, () => void>();

let hostSubscribe: HostSseSubscribe | null = null;

/** 把本地登记表中某个事件的所有处理器依次调用，单个处理器报错不影响其他处理器 */
function dispatch(event: HostSseEvent): void {
  handlers.get(event.event)?.forEach((handler) => {
    try {
      handler(event);
    } catch (err) {
      console.error(`[HostSse] 事件 ${event.event} 的处理器执行失败:`, err);
    }
  });
}

/** 确保已向主应用订阅该事件（仅在已连接主应用且存在本地处理器时） */
function ensureHostSubscription(eventName: string): void {
  if (!hostSubscribe || hostUnsubscribes.has(eventName)) return;
  if (!handlers.get(eventName)?.size) return;
  hostUnsubscribes.set(eventName, hostSubscribe(eventName, dispatch));
}

/** 本地已无处理器时，释放对主应用的订阅 */
function releaseHostSubscription(eventName: string): void {
  if (handlers.get(eventName)?.size) return;
  handlers.delete(eventName);
  hostUnsubscribes.get(eventName)?.();
  hostUnsubscribes.delete(eventName);
}

/**
 * 连接到主应用的事件转发通道，在子应用 mount 时调用。
 * 非 qiankun 运行（props 中没有 onSseEvent）时为空操作：不会降级为自建 SSE 连接。
 *
 * @returns 断开函数，在 unmount 时调用
 */
export function attachHostSse(subscribe?: HostSseSubscribe): () => void {
  // 仅断开旧的主应用订阅，保留已登记的本地处理器
  disconnectHost();
  hostSubscribe = typeof subscribe === "function" ? subscribe : null;
  // 挂载前（或重新挂载时）已登记的处理器，补建对主应用的订阅
  handlers.forEach((_, eventName) => ensureHostSubscription(eventName));
  return detachHostSse;
}

/** 取消对主应用的全部订阅，不影响本地处理器登记表 */
function disconnectHost(): void {
  hostUnsubscribes.forEach((unsubscribe) => unsubscribe());
  hostUnsubscribes.clear();
  hostSubscribe = null;
}

/** 断开与主应用的连接并清空本地订阅，在子应用 unmount 时调用 */
export function detachHostSse(): void {
  disconnectHost();
  handlers.clear();
}

/**
 * 订阅主应用转发的 SSE 事件。可在 attachHostSse 之前或之后调用。
 *
 * @returns 取消订阅函数
 */
export function onHostSseEvent<T = any>(eventName: string, handler: HostSseHandler<T>): () => void {
  let set = handlers.get(eventName);
  if (!set) {
    set = new Set();
    handlers.set(eventName, set);
  }
  set.add(handler as HostSseHandler);
  ensureHostSubscription(eventName);

  return () => {
    handlers.get(eventName)?.delete(handler as HostSseHandler);
    releaseHostSubscription(eventName);
  };
}
