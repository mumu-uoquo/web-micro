/**
 * app-platform 独立 Pinia 实例
 *
 * Sub_App 仅包含业务相关 store：
 * - useUserStore：管理登录用户信息及登录态（Dev_Mode 独立运行使用）
 * - useSettingsStore：管理系统公共配置（RSA 公钥、AES 密钥、登录方式等）
 * - useDictStore：管理字典数据缓存
 *
 * Prod_Mode 下 token 由 Main_App 通过 qiankun Global_State 注入，
 * Dev_Mode 下 token 从 AuthStorage 读取或在登录成功后写入。
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { App } from "vue";
import { ref, computed } from "vue";
import { createPinia, defineStore } from "pinia";
import { useStorage } from "@vueuse/core";
import { AuthStorage, decrypt } from "@web-micro/shared";
import AuthAPI, { type UserAuthDto, type TokenDto } from "@/api/auth";
import SystemAPI from "@/api/system";
import { STORAGE_KEYS } from "@web-micro/shared";

// ─── Pinia 实例 ────────────────────────────────────────────────────────────

const pinia = createPinia();

export function setupStore(app: App<Element>) {
  app.use(pinia);
}

export { pinia };

// ─── LoginMode 类型（与 main-app settings.store 保持一致） ─────────────────

export type LoginMode = "account" | "sms" | "wechat" | "wecom" | "emerg";

// ─── useSettingsStore ──────────────────────────────────────────────────────

interface PublicConfig {
  aesKey: string;
  rsaPublicKey: string;
  serverTimeDiff: number;
  watermarkEnable: boolean;
  enabledLoginModes: LoginMode[];
  registerEnabled: boolean;
}

const _publicConfig = ref<PublicConfig>({
  aesKey: "",
  rsaPublicKey: "",
  serverTimeDiff: 0,
  watermarkEnable: false,
  enabledLoginModes: ["account"],
  registerEnabled: false,
});

export const useSettingsStore = defineStore("setting", () => {
  /**
   * 加载公共系统配置（RSA 公钥、AES 密钥、登录方式等）
   * 与 main-app settings.store 保持相同逻辑
   */
  async function loadServerSettings() {
    _publicConfig.value = {
      aesKey: "",
      rsaPublicKey: "",
      serverTimeDiff: 0,
      watermarkEnable: false,
      enabledLoginModes: ["account"],
      registerEnabled: false,
    };

    try {
      const localTimeBefore = Date.now();
      const settings = await SystemAPI.listPublicSettings({ prefix: "" });
      const localTimeAfter = Date.now();

      const get = (code: string) => {
        const item = settings.find((s) => s.configCode === code);
        if (!item?.configValue) return "";
        try {
          return decrypt.taes(item.configValue) || item.configValue;
        } catch {
          return item.configValue;
        }
      };

      _publicConfig.value.aesKey = get("security.aes.key");
      _publicConfig.value.rsaPublicKey = get("security.rsa.public-key");

      const watermarkRaw = get("sys.watermark.enabled");
      _publicConfig.value.watermarkEnable = watermarkRaw === "true";

      const serverTimeRaw = get("server.time");
      if (serverTimeRaw) {
        const serverTs = Number(serverTimeRaw);
        if (!isNaN(serverTs)) {
          const localMid = Math.floor((localTimeBefore + localTimeAfter) / 2);
          _publicConfig.value.serverTimeDiff = serverTs - localMid;
        }
      }

      const LOGIN_MODE_KEYS: Array<{ code: string; mode: LoginMode }> = [
        { code: "login.account.enabled", mode: "account" },
        { code: "login.sms.enabled", mode: "sms" },
        { code: "login.wechat.enabled", mode: "wechat" },
        { code: "login.wecom.enabled", mode: "wecom" },
        { code: "login.emerg.enabled", mode: "emerg" },
      ];
      const modes: LoginMode[] = LOGIN_MODE_KEYS.filter(({ code }) => get(code) === "true").map(
        ({ mode }) => mode
      );
      _publicConfig.value.enabledLoginModes = modes.length > 0 ? modes : ["account"];
      _publicConfig.value.registerEnabled = get("sys.register.enabled") === "true";
    } catch {
      // 加载失败不影响正常使用，保持默认值
    }
  }

  const aesKey = computed(() => _publicConfig.value.aesKey);
  const rsaPublicKey = computed(() => _publicConfig.value.rsaPublicKey);
  const serverTimeDiff = computed(() => _publicConfig.value.serverTimeDiff);
  const enabledLoginModes = computed(() => _publicConfig.value.enabledLoginModes);
  const registerEnabled = computed(() => _publicConfig.value.registerEnabled);

  return {
    loadServerSettings,
    aesKey,
    rsaPublicKey,
    serverTimeDiff,
    enabledLoginModes,
    registerEnabled,
  };
});

// ─── useUserStore ──────────────────────────────────────────────────────────

export const useUserStore = defineStore("user", () => {
  const userInfo = ref<UserAuthDto>({ id: "", instituteId: "" } as UserAuthDto);

  /**
   * 设置用户信息并保存 token 至 AuthStorage
   * 登录成功后由登录组件的 emit('on-submit') 回调间接触发
   */
  function setUserInfo(data: UserAuthDto) {
    if (!data.currentRoleId && data.roleList?.length) {
      data.currentRoleId = data.roleList[0].id;
    }
    Object.assign(userInfo.value, { ...data });
    // 登录成功后调用 AuthStorage.setTokens 保存 token（Requirements: 6.5）
    const token: TokenDto = {
      accessToken: data.accessToken || "",
      refreshToken: data.refreshToken || "",
      expireTime: data.expireTime || 0,
    };
    AuthStorage.setTokens(token);
  }

  /**
   * 获取当前登录用户信息（兼容旧代码 getUserInfo() 调用）
   * 若 userInfo 已有数据直接返回，否则从 API 获取并缓存
   */
  async function getUserInfo(): Promise<UserAuthDto> {
    if (userInfo.value.id) {
      return userInfo.value;
    }
    const data = await AuthAPI.getInfo({});
    if (data && (data as any).id) {
      Object.assign(userInfo.value, data);
    }
    return userInfo.value;
  }

  /**
   * 重置所有状态（登出时调用）
   */
  function resetAllState() {
    AuthStorage.clearTokens();
    userInfo.value = { id: "", instituteId: "" } as UserAuthDto;
  }

  /**
   * 刷新 token（Sub_App 委托给主应用处理，此处仅提供接口占位）
   */
  async function refreshToken(): Promise<TokenDto> {
    const refreshTokenValue = AuthStorage.getRefreshToken();
    if (!refreshTokenValue) {
      throw new Error("没有有效的刷新令牌");
    }
    const data = await AuthAPI.tokenLogin({
      refreshToken: refreshTokenValue,
      currentRoleId: userInfo.value.currentRoleId,
    });
    if (data) {
      AuthStorage.setTokens(data);
      return data;
    }
    throw new Error("刷新令牌失败");
  }

  return {
    userInfo,
    isLoggedIn: () => !!AuthStorage.getAccessToken(),
    setUserInfo,
    getUserInfo,
    resetAllState,
    refreshToken,
  };
});

// ─── useDictStore ──────────────────────────────────────────────────────────

export const useDictStore = defineStore("dict", () => {
  const dictionary = useStorage<Record<string, any[]>>(STORAGE_KEYS.DICT_CACHE, {});
  const requestQueue: Record<string, Promise<void>> = {};

  const loadDictionary = async (code: string | null) => {
    if (code && code.length >= 3) {
      await loadDictionaryByCode(code.substring(0, 3));
    } else {
      await loadDictionaryByAll();
    }
  };

  const loadDictionaryByAll = async () => {
    if (Object.keys(dictionary.value).length > 0) return;
    const code = "all";
    if (!requestQueue[code]) {
      dictionary.value = {};
      SystemAPI.listDictionarySimpleByAll().then((data) => {
        data.forEach((item) => {
          dictionary.value[item.dicCode] = item.children || [];
        });
        Reflect.deleteProperty(requestQueue, code);
      });
    }
    await requestQueue[code];
  };

  const loadDictionaryByCode = async (code: string) => {
    if (dictionary.value[code]) return;
    if (!requestQueue[code]) {
      SystemAPI.listDictionarySimpleByCode({ itemCode: code }).then((data) => {
        dictionary.value[code] = data;
        Reflect.deleteProperty(requestQueue, code);
      });
    }
    await requestQueue[code];
  };

  const getDictionary = (code: string) => {
    let list: any[] = [];
    if (code && code.length === 6) {
      list = dictionary.value[code.substring(0, 3)] || [];
    }
    return list.find((item) => item.dicCode === code);
  };

  const listDictionary = (code: string): any[] => {
    let list: any[] = [];
    if (code && code.length >= 3) {
      list = dictionary.value[code.substring(0, 3)] || [];
    }
    return list;
  };

  const clearDictionary = () => {
    dictionary.value = {};
  };

  return {
    loadDictionary,
    getDictionary,
    listDictionary,
    clearDictionary,
  };
});

// ─── useReturnCodeStore（兼容旧代码 import，Sub_App 无需完整实现） ──────────

export const useReturnCodeStore = defineStore("returnCode", () => {
  /**
   * 根据返回码查找描述文字（Sub_App 中不维护返回码字典，始终返回空字符串）
   */
  function getDesc(code: string): string {
    return code || "";
  }
  return { getDesc };
});

// ─── Hook 函数（供组件外部使用） ──────────────────────────────────────────

export function useUserStoreHook() {
  return useUserStore(pinia);
}

export function useSettingsStoreHook() {
  return useSettingsStore(pinia);
}

export function useDictStoreHook() {
  return useDictStore(pinia);
}

export function useReturnCodeStoreHook() {
  return useReturnCodeStore(pinia);
}
