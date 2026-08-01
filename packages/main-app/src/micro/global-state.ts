/**
 * qiankun Global_State 管理
 *
 * @description
 * 封装 initGlobalState，维护主子应用共享状态（token、userInfo、permissions、fullscreen、notifications）；
 * 提供 getGlobalActions() 供其他模块读写 GlobalState；
 * 监听 fullscreen 信号，非 null 时同步更新 appStore.layout.fullscreen，并重置为 null。
 *
 * Requirements: 3.8, 5.1, 10.6, 10.7
 */

import { initGlobalState, type MicroAppStateActions } from "qiankun";
import { AuthStorage } from "@web-micro/shared";

// ─── Global_State 数据结构 ─────────────────────────────────────────────────────

interface GlobalState {
  /** 访问令牌，登录成功后由 Main_App 写入；Sub_App 只读 */
  token: string;
  /** 当前登录用户信息 */
  userInfo: {
    userId?: string;
    username?: string;
    nickname?: string;
    avatar?: string;
    currentRoleId?: string;
    currentRoleName?: string;
    tenantId?: string;
    [key: string]: any;
  };
  /** 权限码数组，来自 permissionStore.generateRoutes 返回的 moduleType=005002 节点的 moduleCode */
  permissions: string[];
  /** 全屏信号：非 null 时触发全屏切换，处理后重置为 null */
  fullscreen: boolean | null;
  /** 通知状态 */
  notifications: {
    unreadCount: number;
  };
}

// ─── 内部状态 ─────────────────────────────────────────────────────────────────

let _actions: MicroAppStateActions | null = null;

let _currentState: GlobalState = {
  // 页面刷新时从共享认证存储恢复 token，避免首次直达微应用时注入空值。
  token: AuthStorage.getAccessToken() ?? "",
  userInfo: {},
  permissions: [],
  fullscreen: null,
  notifications: { unreadCount: 0 },
};

// ─── 初始化 ───────────────────────────────────────────────────────────────────

/**
 * 初始化 Global_State
 * 在 main.ts 中 setupStore 之后调用
 */
export function initAppGlobalState() {
  _actions = initGlobalState({ ..._currentState });

  // 主应用监听 Global_State 变更
  _actions.onGlobalStateChange((state: Record<string, any>, prev: Record<string, any>) => {
    const newState = state as GlobalState;
    const prevState = prev as GlobalState;
    console.log("[Main_App] GlobalState changed:", prevState, "->", newState);

    // 同步内部缓存
    _currentState = { ..._currentState, ...newState };

    // 监听 fullscreen 信号：非 null 时同步更新 appStore，并将信号重置为 null
    if (newState.fullscreen !== null && newState.fullscreen !== undefined) {
      import("@/stores").then(({ useAppStoreHook }) => {
        const appStore = useAppStoreHook();
        appStore.toggleContentFullscreen();
      });
      // 重置信号
      _actions?.setGlobalState({ fullscreen: null });
      _currentState.fullscreen = null;
    }
  });
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 获取 Global_State 操作句柄
 * 在 initAppGlobalState() 之后调用
 */
export function getGlobalActions() {
  return {
    /** 获取当前 Global_State 快照 */
    getState(): GlobalState {
      return { ..._currentState };
    },
    /** 合并更新 Global_State */
    setState(patch: Partial<GlobalState>) {
      _currentState = { ..._currentState, ...patch };
      _actions?.setGlobalState(patch);
    },
  };
}
