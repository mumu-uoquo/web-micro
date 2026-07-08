import { AuthStorage, generateSignature } from "@web-micro/shared";
import { USER_BASE_URL } from "@/api/user";
import { isMainWindow } from "@/utils/ticket";

export interface UseSseOptions {
  url?: string; // SSE 连接地址，默认走 VITE_APP_BASE_API 代理
  debug?: boolean; // 是否在控制台打印调试日志
  connectionTimeout?: number; // 连接超时时间(ms)
  /** 重连间隔基数，实际间隔 = min(基数 × 2^n, 最大间隔) */
  reconnectInterval?: number;
  maxReconnectInterval?: number; // 重连间隔上限(ms)
  maxReconnectAttempts?: number; // 最大重试次数，超过后停止重连
}

type EventHandler = (data: any) => void;

export enum SseConnectionState {
  DISCONNECTED = "DISCONNECTED", // 未连接
  CONNECTING = "CONNECTING", // 连接中
  CONNECTED = "CONNECTED", // 已连接
}

let globalInstance: ReturnType<typeof createSseConnection> | null = null;

function createSseConnection(options: UseSseOptions = {}) {
  const baseUrl = import.meta.env.VITE_APP_BASE_API;
  const defaultUrl = `${baseUrl}${USER_BASE_URL}/v1/message/sse/subscribe`;

  const config = {
    url: options.url ?? defaultUrl,
    debug: options.debug ?? false,
    connectionTimeout: options.connectionTimeout ?? 10000, // 连接超时 10s
    reconnectInterval: options.reconnectInterval ?? 5000, // 首次重连等 5s，之后翻倍
    maxReconnectInterval: options.maxReconnectInterval ?? 120000, // 重连间隔最大 2min
    maxReconnectAttempts: options.maxReconnectAttempts ?? 10, // 最多重试 10 次
  };

  const connectionState = ref<SseConnectionState>(SseConnectionState.DISCONNECTED);
  const isConnected = computed(() => connectionState.value === SseConnectionState.CONNECTED);

  let abortController: AbortController | null = null;
  let connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let isManualDisconnect = false; // 主动断开则不重连
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  let currentReconnectInterval = config.reconnectInterval;

  const eventHandlers = new Map<string, Set<EventHandler>>();

  const sseId = String(new Date().getTime());
  const log = (...args: any[]) => console.log(`[SSE-${sseId}]`, ...args);
  const logError = (...args: any[]) => console.error(`[SSE-${sseId}]`, ...args);

  const clearTimer = (timer: typeof connectionTimeoutTimer) => {
    if (timer) {
      clearTimeout(timer);
      return null;
    }
    return timer;
  };

  // 指数退避重连（主窗口约束：非主窗口跳过重连）
  const scheduleReconnect = () => {
    if (isManualDisconnect) return;

    // 非主窗口时跳过重连
    if (!isMainWindow()) {
      console.warn("SSE 连接已跳过，当前窗口非主窗口：" + location.href);
      return;
    }

    if (config.maxReconnectAttempts > 0 && reconnectAttempts >= config.maxReconnectAttempts) {
      log(`已达到最大重试次数 ${config.maxReconnectAttempts}，停止重连`);
      return;
    }

    reconnectAttempts++;
    log(`将在 ${currentReconnectInterval}ms 后重试（${reconnectAttempts}）`);

    reconnectTimer = setTimeout(() => {
      connect();
      currentReconnectInterval = Math.min(
        currentReconnectInterval * 2,
        config.maxReconnectInterval
      );
    }, currentReconnectInterval);
  };

  // 内部断开：仅中止连接和清理资源，不修改 isManualDisconnect，不影响重连逻辑
  const _abortAndReset = () => {
    connectionTimeoutTimer = clearTimer(connectionTimeoutTimer);
    reader?.cancel();
    reader = null;
    abortController?.abort();
    abortController = null;
    connectionState.value = SseConnectionState.DISCONNECTED;
  };

  const connect = () => {
    // ⚠️ 必须先检查状态，再重置 isManualDisconnect，
    // 避免在已连接/连接中时提前 return 却已修改了标志位
    if (connectionState.value !== SseConnectionState.DISCONNECTED) {
      log(
        connectionState.value === SseConnectionState.CONNECTED
          ? "SSE 已连接，跳过重复连接"
          : "SSE 正在连接中，跳过重复连接"
      );
      return;
    }

    isManualDisconnect = false;

    const token = AuthStorage.getAccessToken();
    if (!token) {
      log("未检测到有效令牌，跳过 SSE 连接");
      return;
    }

    connectionState.value = SseConnectionState.CONNECTING;
    abortController = new AbortController();

    // 超时自动断开（非主动断开，应触发重连）
    connectionTimeoutTimer = setTimeout(() => {
      if (connectionState.value === SseConnectionState.CONNECTING) {
        log("SSE 连接超时");
        _abortAndReset();
        scheduleReconnect();
      }
    }, config.connectionTimeout);

    log("正在建立 SSE 连接...");

    // 入参签名
    const signHeader = generateSignature();
    fetch(config.url, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        ...signHeader,
      },
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        // 自定义错误码
        const resCode = response.headers.get("response-code");
        if (resCode) {
          throw new Error(`HTTP ${resCode}`);
        }
        connectionTimeoutTimer = clearTimer(connectionTimeoutTimer);
        connectionState.value = SseConnectionState.CONNECTED;
        reconnectAttempts = 0;
        currentReconnectInterval = config.reconnectInterval;
        log("SSE 连接已建立");
        return response.body?.getReader();
      })
      .then((r) => {
        if (!r) return;
        reader = r;
        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "message";
        let currentData = "";

        // SSE 文本协议解析：event / data / 空行分隔
        const processChunk = ({
          done,
          value,
        }: ReadableStreamReadResult<Uint8Array>): Promise<void> | void => {
          if (done) {
            connectionState.value = SseConnectionState.DISCONNECTED;
            log("SSE 连接已关闭");
            // 服务端主动关闭流，非主动断开时应触发重连
            if (!isManualDisconnect) {
              scheduleReconnect();
            }
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith(":")) continue;
            if (line.startsWith("event:")) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              const dataLine = line.slice(5).trim();
              currentData = currentData ? `${currentData}\n${dataLine}` : dataLine;
            } else if (line === "") {
              if (currentData) {
                const handlers = eventHandlers.get(currentEvent);
                if (handlers) {
                  try {
                    const data = JSON.parse(currentData);
                    handlers.forEach((h) => h(data));
                  } catch {
                    handlers.forEach((h) => h(currentData));
                  }
                  log(`处理事件[${currentEvent}]:`, currentData);
                } else {
                  log(`忽略事件[${currentEvent}]（无订阅）:`, currentData);
                }
              }
              currentEvent = "message";
              currentData = "";
            }
          }

          return reader!.read().then(processChunk);
        };

        return reader.read().then(processChunk);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          log("SSE 连接已主动断开");
        } else {
          logError("SSE 连接错误:", err);
          connectionState.value = SseConnectionState.DISCONNECTED;
          scheduleReconnect();
        }
      });
  };

  // 订阅事件，返回取消函数
  const on = (eventName: string, handler: EventHandler): (() => void) => {
    if (!eventHandlers.has(eventName)) {
      eventHandlers.set(eventName, new Set());
    }
    eventHandlers.get(eventName)!.add(handler);
    log(`已订阅事件: ${eventName}`);

    return () => {
      const handlers = eventHandlers.get(eventName);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlers.delete(eventName);
        }
      }
    };
  };

  // 主动断开，不会触发重连
  const disconnect = () => {
    isManualDisconnect = true;
    reconnectTimer = clearTimer(reconnectTimer);
    _abortAndReset();
    log("SSE 连接已断开");
  };

  // 登出时调用，断开并释放所有资源
  const cleanup = () => {
    disconnect();
    eventHandlers.clear();
    log("SSE 资源已清理");
  };

  return {
    connectionState: readonly(connectionState),
    isConnected,
    connect,
    disconnect,
    cleanup,
    on,
  };
}

/**
 * 获取全局唯一的 SSE 连接实例（单例模式）
 *
 * 注意：单例在首次调用时创建，后续调用传入的 options 会被忽略。
 * 如需修改连接配置，请先调用 cleanupSse() 销毁当前实例，再重新调用 useSse(options)。
 */
export function useSse(options: UseSseOptions = {}) {
  if (!globalInstance) {
    globalInstance = createSseConnection(options);
  }
  return globalInstance;
}

export function cleanupSse() {
  if (globalInstance) {
    globalInstance.cleanup();
    globalInstance = null;
  }
}
