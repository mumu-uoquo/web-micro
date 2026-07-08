import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { STORAGE_KEYS } from "../constants";
import { Storage } from "./storage";

/**
 * Minimal structural types that are compatible with both vue-router v4 and v5.
 * Avoids importing from vue-router directly so the shared package doesn't bind
 * to a specific major version's type definitions.
 */

/** Minimal route location compatible with vue-router v4 & v5 RouteLocationRaw */
export type SharedRouteLocationRaw =
  | string
  | { path: string; query?: Record<string, string | null | undefined | (string | null)[]> };

/** Minimal normalised route location compatible with vue-router v4 & v5 */
export interface SharedRouteLocationNormalized {
  fullPath: string;
  [key: string]: unknown;
}

/**
 * Minimal router interface compatible with vue-router v4 and v5.
 * Using a structural type avoids version-mismatch errors when shared is
 * consumed by packages that pin different vue-router major versions.
 */
export interface RouterLike {
  push(location: SharedRouteLocationRaw): Promise<unknown>;
}

const DEVICE_ID_KEY = "UOQUO_DEVICE_ID";

/**
 * Token 信息（与后端 TokenDto 对应）
 */
export interface TokenDto {
  /** 会话 token */
  accessToken: string;
  /** 过期时间（秒） */
  expireTime: number;
  /** 刷新 token */
  refreshToken: string;
}

// 负责本地凭证与偏好的读写
export const AuthStorage = {
  getAccessToken(): string {
    const isRememberMe = Storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME, false);
    return isRememberMe
      ? Storage.get(STORAGE_KEYS.ACCESS_TOKEN, "")
      : Storage.sessionGet(STORAGE_KEYS.ACCESS_TOKEN, "");
  },

  getRefreshToken(): string {
    const isRememberMe = Storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME, false);
    return isRememberMe
      ? Storage.get(STORAGE_KEYS.REFRESH_TOKEN, "")
      : Storage.sessionGet(STORAGE_KEYS.REFRESH_TOKEN, "");
  },

  setTokens(token: TokenDto): void {
    const rememberMe = Storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME, false);
    if (rememberMe) {
      Storage.set(STORAGE_KEYS.ACCESS_TOKEN, token.accessToken);
      Storage.set(STORAGE_KEYS.REFRESH_TOKEN, token.refreshToken);
    } else {
      Storage.sessionSet(STORAGE_KEYS.ACCESS_TOKEN, token.accessToken);
      Storage.sessionSet(STORAGE_KEYS.REFRESH_TOKEN, token.refreshToken);
      Storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      Storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },

  clearTokens(): void {
    Storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    Storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    Storage.sessionRemove(STORAGE_KEYS.ACCESS_TOKEN);
    Storage.sessionRemove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRememberMe(rememberMe: boolean = false): void {
    Storage.set(STORAGE_KEYS.REMEMBER_ME, rememberMe);
  },

  getRememberMe(): boolean {
    return Storage.get<boolean>(STORAGE_KEYS.REMEMBER_ME, false);
  },

  /**
   * 应用授权信息
   */
  getAppkey(): string {
    return "K4X3Z5W9H6Q0J7Q4";
  },
  getSecret(): string {
    return "lN0dU9iI4rT2wR2jD5cE1sL5nL6sE6zC";
  },

  /**
   * 浏览器指纹
   */
  async loadDeviceId() {
    const deviceId = this.getDevcieId();
    if (!deviceId) {
      // 初始化 FingerprintJS
      const fp = await FingerprintJS.load();
      // 获取指纹结果
      const result = await fp.get();
      // 缓存访客ID
      Storage.set(DEVICE_ID_KEY, result.visitorId);
    }
  },
  getDevcieId() {
    return Storage.get(DEVICE_ID_KEY, "");
  },
};

/**
 * 重定向到登录页面
 *
 * @param message - 提示信息（保留参数，供调用方展示）
 * @param useRedirectParam - 是否将当前路由附加为 redirect 查询参数
 * @param to - 当前路由位置（用于构造 redirect 参数）
 * @param router - 可选的 vue-router 实例；传入时自动执行跳转，否则仅返回目标路由对象
 * @returns 登录页路由对象（RouteLocationRaw）
 */
export function redirectToLogin(
  message?: string,
  useRedirectParam?: boolean,
  to?: SharedRouteLocationNormalized,
  router?: RouterLike
): SharedRouteLocationRaw {
  const loginRoute: SharedRouteLocationRaw = {
    path: "/login",
    query: to ? { redirect: to.fullPath } : {},
  };
  if (router) {
    router.push(loginRoute);
  }
  return loginRoute;
}
