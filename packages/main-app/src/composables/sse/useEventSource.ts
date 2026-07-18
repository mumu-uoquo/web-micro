/**
 * 封装SSE请求
 *
 * 注意：一个系统（或一个WEB页面）只能有一个SSE请求
 *      1. 后台接口只保留了一个SSE的连接，有重复连接时，会将之前的请求取消掉
 *      2. 组件中用到了 `document.addEventListener` ，若实例化多次会相互干扰
 *
 * 迁移自 web-monolith/src/composables/sse/useEventSource.ts
 * 调整：
 *   - `@/utils/auth` → `@web-micro/shared`
 *   - `@/utils/common` → `@web-micro/shared`
 *   - `@/utils/crypto` → `@web-micro/shared`
 *   - `@/constants` → `@/constants`（main-app 本地）
 *   - `@/stores` → `@/stores`（main-app 本地）
 *   - `@/api/sse` → `@/api/user`（USER_BASE_URL）
 */
/// <reference lib="dom" />
import { ref, onBeforeUnmount } from "vue";
import {
  fetchEventSource,
  EventSourceMessage,
  EventStreamContentType,
} from "@microsoft/fetch-event-source";
import { AuthStorage, guid, encrypt } from "@web-micro/shared";
import { STORAGE_KEYS } from "@web-micro/shared";
import { ResultEnum } from "@/enums/system/result.enum";
import { useUserStoreHook } from "@/stores";

/**
 * 组件参数定义
 */
interface UseEventSourceOptions {
  onMessage: (event: EventSourceMessage) => void;
  onOpen?: (response: Response | Event) => void;
  onClose?: () => void;
  onError?: (error: any) => void;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  openWhenHidden?: boolean; // 允许在页面隐藏时继续发送请求
  body?: any;
  method?: string;

  fetchOptions?: RequestInit;
  retryDelayMs?: number; // 重试延迟(毫秒)
  retryMaximum?: number; // 重试次数(-1为无限制)
}
// 默认参数
const DEFAULT_OPTIONS: Partial<UseEventSourceOptions> = {
  method: "POST",
  withCredentials: true,
  openWhenHidden: true,
  headers: {
    // "Content-Type": "application/json",
    "Content-Type": EventStreamContentType,
  },
  onMessage: (event) => console.log("EventSource Received:", event),
  retryDelayMs: 5000, // 重试延迟(毫秒)
  retryMaximum: -1, // 重试次数
};

/**
 * 连接状态
 */
export const enum ConnectStatus {
  connecting = "connecting",
  connected = "connected",
  disconnected = "disconnected",
  error = "error",
}

class RetriableError extends Error {}

function getNewMessage(): EventSourceMessage {
  return {
    data: "",
    event: "",
    id: "",
    retry: undefined,
  };
}

/**
 * 重定向到登录页
 */
function redirectToLogin() {
  ElMessage({
    message: "您的会话已过期，请重新登录",
    grouping: true,
    type: "error",
  });
  return useUserStoreHook()
    .resetAllState()
    .then(() => {
      setTimeout(() => {
        location.reload();
      }, 2000);
    });
}

/**
 * 解析处理服务端的错误信息
 */
async function checkReloginError(resCode: string | null, response: Response) {
  // 克隆响应体（原始响应只能读取一次）
  const responseClone = response.clone();
  // 尝试解析为文本或JSON
  const errorBody = await responseClone.text(); // 或 .json()
  // console.log("非SSE响应", contentType, resCode, errorBody);
  let statusCode, message;
  try {
    const errorData = JSON.parse(errorBody);
    statusCode = errorData.status;
    message = errorData.message;
  } catch (e) {
    console.debug("check error", e);
    statusCode = resCode || ResultEnum.SYSTEM_ERROR;
    message = errorBody;
  }
  if (statusCode === ResultEnum.TOKEN_INVALID || statusCode === ResultEnum.TOKEN_KICK_OUT) {
    redirectToLogin();
    return true;
  } else {
    ElMessage({
      message: message || "系统出错",
      grouping: true,
      type: "error",
    });
    return false;
  }
}

/**
 * 生成签名请求头
 */
function getSignHeader(body: any) {
  const nonce = guid();
  const token = AuthStorage.getAccessToken();
  const appid = AuthStorage.getAppkey();
  const secret = AuthStorage.getSecret();
  const device = AuthStorage.getDevcieId();
  // 从 localStorage 读取用户选择的语言，未设置时降级为 zh-CN
  const language = localStorage.getItem(STORAGE_KEYS.LANGUAGE) ?? "zh-CN";
  const time = new Date().getTime() + "";
  const prefix = appid + token + language + nonce + device + time;
  const param = "";
  const bodystr = body ? JSON.stringify(body) : "";
  const signature = encrypt.md5(prefix + param + bodystr + secret);

  return {
    token,
    nonce,
    appid,
    timestamp: time,
    "device-id": device,
    "user-language": language,
    "signature-app": signature,
  };
}

/**
 * 采用第三方组件（推荐）
 * https://github.com/Azure/fetch-event-source
 * 优点：
 * 1. 可以先采用POST方式进行前置验参、鉴权
 * 2. 可以将收到的消息全部交给onmessage处理
 */
export function useFetchEventSource(url: string, userOptions: UseEventSourceOptions) {
  // 合并用户选项和默认选项
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...userOptions.headers,
    },
  };

  const retryCount = ref(0);
  const lastEventId = ref<string>("");
  const status = ref<ConnectStatus>(ConnectStatus.disconnected);
  const error = ref<any>(null);
  let abortController: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  const clearRetryTimer = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };

  /**
   * 建立连接
   */
  const connect = async () => {
    // 关闭旧链接
    if (abortController) {
      abortController.abort();
    }
    error.value = null;
    status.value = ConnectStatus.connecting;
    abortController = new AbortController();
    // 入参签名
    const signHeader = getSignHeader(options.body);

    try {
      await fetchEventSource(url, {
        ...options.fetchOptions,
        method: options.method || "POST",
        mode: "cors", // CORS模式
        credentials: options.withCredentials ? "include" : "same-origin",
        headers: {
          "Last-Event-ID": lastEventId.value || "",
          ...signHeader,
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: abortController.signal,
        openWhenHidden: options.openWhenHidden,
        onopen: async (response) => {
          // 这里抛出异常后，会进入onerror方法
          // 1. 检查 Content-Type
          const resCode = response.headers.get("response-code");
          const contentType = response.headers.get("Content-Type");
          if (resCode || !contentType?.includes("text/event-stream")) {
            const flag = await checkReloginError(resCode, response);
            if (flag) {
              return;
            }
            throw new RetriableError(`Failed to connect to ${url}: ${response.status}`);
          }
          // 2. 检查状态码
          if (!response.ok) {
            throw new RetriableError(`Failed to connect to ${url}: ${response.status}`);
          }
          // 3. 成功连接
          status.value = ConnectStatus.connected;
          options.onOpen?.(response);
        },
        onmessage: (event) => {
          if (event.id) {
            lastEventId.value = event.id;
          }
          options.onMessage(event);
        },
        onclose: () => {
          status.value = ConnectStatus.disconnected;
          options.onClose?.();
          console.log("sse closed");
        },
        onerror: (err) => {
          error.value = err;
          status.value = ConnectStatus.error;
          abortController?.abort();
          // 非手动断开时尝试重连
          if (err instanceof RetriableError) {
            options.onError?.(err);
            scheduleReconnect();
            throw err; // 抛出错误以停止重试
          }
          // 停止当前的重试
          throw err; // 抛出错误以停止重试
        },
      });
    } catch (err) {
      if (err instanceof RetriableError) {
        return;
      }
      error.value = err;
      status.value = ConnectStatus.error;
      options.onError?.(err);
      disconnect();
    }
  };

  /**
   * 定时重连（到达最大次数时，会触发onError回调）
   */
  const scheduleReconnect = (err: Error | null = null) => {
    clearRetryTimer();
    const maxRetry = options.retryMaximum || -1;
    if (maxRetry !== -1 && retryCount.value >= maxRetry) {
      if (!err) {
        options.onError?.(new Error(`Max retries (${maxRetry}) reached. Giving up.`));
      }
      return;
    }
    retryCount.value += 1;
    console.log(`Attempting to reconnect (${retryCount.value}/${maxRetry})...`);
    // 重连
    retryTimer = setTimeout(() => {
      connect();
    }, options.retryDelayMs);
  };

  // 连接优化（减少服务器资源）
  function visibilityHandler() {
    if (document.visibilityState === "hidden") {
      disconnect(); // 页面隐藏时关闭SSE
    } else {
      connect(); // 页面可见时重新连接
    }
  }
  if (!options.openWhenHidden) {
    document.addEventListener("visibilitychange", visibilityHandler);
  }

  /**
   * 关闭链接
   */
  const disconnect = () => {
    clearRetryTimer();
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    retryCount.value = 0;
    status.value = ConnectStatus.disconnected;
  };

  /**
   * 组件销毁时关闭链接
   */
  onBeforeUnmount(() => {
    disconnect();
    document.removeEventListener("visibilitychange", visibilityHandler);
  });

  return {
    status,
    error,
    connect,
    disconnect,
  };
}

/**
 * 标准EventSource
 * https://developer.mozilla.org/zh-CN/docs/Web/API/EventSource
 */
export function useDefaultEventSource(url: string, userOptions: UseEventSourceOptions) {
  // 合并用户选项和默认选项
  const options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...userOptions.headers,
    },
  };

  const retryCount = ref(0);
  const lastEventId = ref<string>("");
  const status = ref<ConnectStatus>(ConnectStatus.disconnected);
  const error = ref<any>(null);
  let abortController: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  const clearRetryTimer = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  };
  const eventSource = ref<EventSource>();

  /**
   * 建立连接
   */
  const connect = () => {
    if (abortController) {
      abortController.abort();
    }
    error.value = null;
    status.value = ConnectStatus.connecting;
    abortController = new AbortController();
    // 必要的入参信息
    const nonce = guid();
    const token = AuthStorage.getAccessToken();
    const appid = AuthStorage.getAppkey();
    const prurl = url.includes("?") ? `${url}&` : `${url}?`;
    eventSource.value = new EventSource(
      `${prurl}token=${token}&appid=${appid}&nonce=${nonce}&Last-Event-ID=${lastEventId.value}`,
      {
        withCredentials: true,
      }
    );
    // 建立链接后
    eventSource.value.onopen = (event) => {
      status.value = ConnectStatus.connected;
      options.onOpen?.(event);
    };
    // 消息监听（无事件名的消息）
    eventSource.value.onmessage = (event) => {
      if (event.lastEventId) {
        lastEventId.value = event.lastEventId;
      }
      const message = parseMessage(event);
      options.onMessage?.(message);
    };
    // 消息监听（MESSAGE：系统消息）
    eventSource.value.addEventListener("MESSAGE", (event) => {
      if (event.lastEventId) {
        lastEventId.value = event.lastEventId;
      }
      const message = parseMessage(event);
      options.onMessage?.(message);
    });
    // 消息监听（NOTICE：系统通知）
    eventSource.value.addEventListener("NOTICE", (event) => {
      if (event.lastEventId) {
        lastEventId.value = event.lastEventId;
      }
      const message = parseMessage(event);
      options.onMessage?.(message);
    });
    // 消息监听（BROADCAST：系统广播）
    eventSource.value.addEventListener("BROADCAST", (event) => {
      if (event.lastEventId) {
        lastEventId.value = event.lastEventId;
      }
      const message = parseMessage(event);
      options.onMessage?.(message);
    });
    // 错误监听
    eventSource.value.onerror = (err) => {
      error.value = err;
      status.value = ConnectStatus.error;
      options.onError?.(err);
      // 非手动断开时尝试重连
      if (abortController && !abortController.signal.aborted) {
        scheduleReconnect();
      }
    };
    // 监听 `AbortSignal`，如果触发则关闭连接
    abortController?.signal.addEventListener("abort", () => {
      eventSource.value?.close();
      options.onClose?.();
    });
  };

  // 解析message
  const parseMessage = (event: MessageEvent): EventSourceMessage => {
    const message = getNewMessage();
    message.id = event.lastEventId;
    message.event = event.type;
    message.data = event.data;
    return message;
  };

  /**
   * 定时重连（到达最大次数时，会触发onError回调）
   */
  const scheduleReconnect = () => {
    clearRetryTimer();
    const maxRetry = options.retryMaximum || -1;
    if (maxRetry !== -1 && retryCount.value >= maxRetry) {
      options.onError?.(new Error(`Max retries (${maxRetry}) reached. Giving up.`));
      return;
    }
    retryCount.value += 1;
    console.log(`Attempting to reconnect (${retryCount.value}/${maxRetry})...`);
    // 重连
    retryTimer = setTimeout(() => {
      connect();
    }, options.retryDelayMs);
  };

  // 连接优化（减少服务器资源）
  function visibilityHandler() {
    if (document.visibilityState === "hidden") {
      disconnect(); // 页面隐藏时关闭SSE
    } else {
      connect(); // 页面可见时重新连接
    }
  }
  if (!options.openWhenHidden) {
    document.addEventListener("visibilitychange", visibilityHandler);
  }

  /**
   * 关闭链接
   */
  const disconnect = () => {
    clearRetryTimer();
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    retryCount.value = 0;
    status.value = ConnectStatus.disconnected;
  };

  /**
   * 组件销毁时关闭链接
   */
  onBeforeUnmount(() => {
    disconnect();
    document.removeEventListener("visibilitychange", visibilityHandler);
  });

  return {
    status,
    error,
    connect,
    disconnect,
  };
}
