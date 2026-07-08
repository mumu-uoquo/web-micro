import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";

export const USER_BASE_URL = "/health/api/platform";

/**
 * 系统管理相关 API（供主应用使用）
 * 完整 API 请参考 app-platform/src/api/system.ts
 */
const SystemAPI = {
  /**
   * 获取所有字典列表（简版）
   */
  listDictionarySimpleByAll(config?: AxiosRequestConfig) {
    return http.request<SysDictionarySimpleDto[]>(
      "post",
      `${USER_BASE_URL}/v1/system/dictionary/list/simple/all`,
      { ...config }
    );
  },

  /**
   * 按字典编码前缀获取字典列表（简版）
   */
  listDictionarySimpleByCode(
    data: SysDictionarySearchParam,
    config?: AxiosRequestConfig
  ) {
    return http.request<SysDictionarySimpleDto[]>(
      "post",
      `${USER_BASE_URL}/v1/system/dictionary/list/simple/prefix`,
      { data, ...config }
    );
  },

  /**
   * 查询所有系统响应码
   */
  listAllReturnCodes(config?: AxiosRequestConfig) {
    return http.request<SysReturnCodeDto[]>(
      "post",
      `${USER_BASE_URL}/v1/system/return-code/list/all`,
      { ...config }
    );
  },

  /**
   * 获取公共系统配置（无需登录）
   */
  listPublicSettings(data: SettingSearchParam, config?: AxiosRequestConfig) {
    return http.request<SettingDto[]>(
      "post",
      `${USER_BASE_URL}/v1/system/settings/list/public`,
      { data, ...config }
    );
  },
};

export default SystemAPI;

// ─── DTO 类型 ─────────────────────────────────────────────────────────────────

export interface SysDictionarySimpleDto {
  /** 字典编码 */
  dicCode: string;
  /** 字典名称 */
  dicName?: string;
  /** 子项列表 */
  children?: SysDictionarySimpleDto[];
  /** 字典值 */
  dicValue?: string;
  /** 排序 */
  sortIdx?: number;
  /** 标签样式（用于 DictTag 组件） */
  tagStyle?: string;
}

export interface SysReturnCodeDto {
  /** 响应码 */
  returnCode: string;
  /** 响应值 */
  returnValue?: string;
}

export interface SettingDto {
  /** 配置标识 */
  configCode: string;
  /** 配置值 */
  configValue?: string;
  /** 配置名称 */
  configName?: string;
}

export interface SettingSearchParam {
  /** 前缀过滤 */
  prefix?: string;
}

export interface SysDictionarySearchParam {
  /** 字典编码（前缀） */
  itemCode?: string;
}
