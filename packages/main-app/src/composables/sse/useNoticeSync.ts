import { useUserStoreHook } from "@/stores";
import type { MsgInfoViewDto } from "@/api/message";
import { useSse, cleanupSse } from "./useSse";
import { getGlobalActions } from "@/micro/global-state";

export type NoticeCallback = (data: MsgInfoViewDto) => void;

let singletonInstance: ReturnType<typeof createNoticeSyncComposable> | null = null;

function createNoticeSyncComposable() {
  const sse = useSse();

  // 三类消息的回调列表
  const notifyCallbacks = ref<NoticeCallback[]>([]);
  const messageCallbacks = ref<NoticeCallback[]>([]);
  const todoCallbacks = ref<NoticeCallback[]>([]);

  let unsubscribes: (() => void)[] = [];

  // ── 内部处理器 ────────────────────────────────────────

  /**
   * 心跳包：仅打印日志，无需对外暴露
   */
  const handleHeartbeat = (data: any) => {
    console.info("[NoticeSync] 心跳：", new Date().toLocaleTimeString(), data);
  };

  /**
   * 被踢下线：弹出提示后跳转登录
   */
  const handleKickOut = (data: any) => {
    // 强制清理SSE单例
    cleanupSse();
    // 弹窗提示
    ElNotification({
      title: "异常警告",
      message: data?.messageContent ?? "您的账号已在其他地方登录，请重新登录",
      type: "error",
      position: "bottom-right",
      showClose: false,
      onClose: () => {
        useUserStoreHook()
          .resetAllState()
          .then(() => {
            location.href = "/login";
          });
      },
    });
  };

  /**
   * 派发消息给对应类型的回调，并通过 GlobalState 推送未读数
   */
  const dispatch = (callbacks: NoticeCallback[], data: MsgInfoViewDto) => {
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error("[NoticeSync] 回调执行失败:", err);
      }
    });

    // 通过 Global_State 推送未读数至子应用（Requirements 8.8）
    // 从消息数据中获取未读数，若无则增加计数
    const unreadCount = (data as any)?.unreadCount ?? 0;
    if (unreadCount > 0) {
      getGlobalActions().setState({ notifications: { unreadCount } });
    }
  };

  // ── 初始化 / 清理 ────────────────────────────────────

  const initialize = () => {
    // 只注册事件监听，不建立连接
    // 连接由登录成功后调用 useSse().connect() 统一触发
    unsubscribes = [
      sse.on("HEARTBEAT", handleHeartbeat),
      sse.on("kickOut", handleKickOut),
      // 三种业务消息，eventName 与后台保持一致
      sse.on("notify", (data: MsgInfoViewDto) => dispatch(notifyCallbacks.value, data)),
      sse.on("message", (data: MsgInfoViewDto) => dispatch(messageCallbacks.value, data)),
      sse.on("todo", (data: MsgInfoViewDto) => dispatch(todoCallbacks.value, data)),
    ];
    console.info("[SSE] NoticeSync 初始化完成");
  };

  const cleanup = () => {
    unsubscribes.forEach((unsub) => unsub());
    unsubscribes = [];
    notifyCallbacks.value = [];
    messageCallbacks.value = [];
    todoCallbacks.value = [];
    console.info("[SSE] NoticeSync 销毁完成");
  };

  // ── 订阅接口 ─────────────────────────────────────────

  /**
   * 订阅通知公告（eventName: notify）
   * @returns 取消订阅函数
   */
  const onNotify = (callback: NoticeCallback): (() => void) => {
    notifyCallbacks.value.push(callback);
    return () => {
      const idx = notifyCallbacks.value.indexOf(callback);
      if (idx !== -1) notifyCallbacks.value.splice(idx, 1);
    };
  };

  /**
   * 订阅系统消息（eventName: message）
   * @returns 取消订阅函数
   */
  const onMessage = (callback: NoticeCallback): (() => void) => {
    messageCallbacks.value.push(callback);
    return () => {
      const idx = messageCallbacks.value.indexOf(callback);
      if (idx !== -1) messageCallbacks.value.splice(idx, 1);
    };
  };

  /**
   * 订阅待办任务（eventName: todo）
   * @returns 取消订阅函数
   */
  const onTodo = (callback: NoticeCallback): (() => void) => {
    todoCallbacks.value.push(callback);
    return () => {
      const idx = todoCallbacks.value.indexOf(callback);
      if (idx !== -1) todoCallbacks.value.splice(idx, 1);
    };
  };

  return {
    isConnected: sse.isConnected,
    connectionState: sse.connectionState,
    initialize,
    cleanup,
    onNotify,
    onMessage,
    onTodo,
  };
}

/**
 * 消息通知同步组合式函数（单例模式）
 *
 * 注意：单例在首次调用时创建，后续调用传入的选项会被忽略。
 */
export function useNoticeSync() {
  if (!singletonInstance) {
    singletonInstance = createNoticeSyncComposable();
  }
  return singletonInstance;
}
