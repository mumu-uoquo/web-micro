import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 节假日管理、系统字典、系统设置、系统响应码、接入授权
 */
const SystemAPI = {
  /**
   * 新增AppInfo信息
   * @param data 接入授权
   */
  addAppInfo(data: AppInfoParam, config?: AxiosRequestConfig) {
    return http.request<AppInfoDto>("post", `${USER_BASE_URL}/v1/system/appinfo/add`, {
      data,
      ...config,
    });
  },

  /**
   * 关联资源：添加关联资源
   * @param data APP授权
   */
  addAppRelationResource(data: AppPermissionAddParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/resource/relate/add`, {
      data,
      ...config,
    });
  },

  /**
   * 新增节假日
   * @param data 节假日信息
   */
  addHolidayInfo(data: SysHolidayInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/holiday/add/info`, {
      data,
      ...config,
    });
  },

  /**
   * 新增节假日
   * @param data 节假日集合
   */
  addHolidayList(data: SysHolidayInfoParam[], config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/holiday/add/list`, {
      data,
      ...config,
    });
  },

  /**
   * 关联模板：添加关联模板
   * @param data APP授权继承
   */
  addRelateInherit(data: AppInhertAddParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/inherit/add`, {
      data,
      ...config,
    });
  },

  /**
   * 资源信息：新增
   * @param data 添加/修改资源
   */
  addResourceInfo4App(data: ResourceInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/resource/add`, {
      data,
      ...config,
    });
  },

  /**
   * 复制AppInfo的授权信息
   * @param data 复制APP授权
   */
  copyAppInfoPermission(data: AppPermissionCopyParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/permission/copy`, {
      data,
      ...config,
    });
  },

  /**
   * 删除AppInfo信息
   * @param data 应用ID
   */
  deleteAppInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 关联资源：删除关联资源
   * @param data 应用与资源的关联ID
   */
  deleteAppRelationResource(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/resource/relate/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除字典信息
   * @param data 字典ID
   */
  deleteDictionaryInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/dictionary/info/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除节假日信息
   * @param data 节假日ID
   */
  deleteHolidayInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/holiday/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 关联模板：删除关联模板
   * @param data 应用与模板的关联ID
   */
  deleteRelateInherit(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/inherit/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除系统响应码
   * @param data ID信息
   */
  deleteReturnCode(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/return-code/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除系统配置
   * @param data 配置编码查询参数
   */
  deleteSystemSetting(data: SettingCodeParam, config?: AxiosRequestConfig) {
    return http.request<void>("post", `${USER_BASE_URL}/v1/system/settings/delete`, {
      data,
      ...config,
    });
  },

  /**
   * AppInfo详情查询
   * @param data 应用ID
   */
  getAppInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<AppInfoDto>("post", `${USER_BASE_URL}/v1/system/appinfo/info`, {
      data,
      ...config,
    });
  },

  /**
   * 查询系统响应码详情（按响应码）
   * @param data 系统响应码请求参数
   */
  getReturnCodeByCode(data: SysReturnCodeParam, config?: AxiosRequestConfig) {
    return http.request<SysReturnCodeDto>("post", `${USER_BASE_URL}/v1/system/return-code/info/code`, {
      data,
      ...config,
    });
  },

  /**
   * 查询系统响应码详情（按ID）
   * @param data ID信息
   */
  getReturnCodeById(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<SysReturnCodeDto>("post", `${USER_BASE_URL}/v1/system/return-code/info/id`, {
      data,
      ...config,
    });
  },

  /**
   * 查询单个系统配置
   * @param data 配置编码查询参数
   */
  getSystemSetting(data: SettingCodeParam, config?: AxiosRequestConfig) {
    return http.request<SettingDto>("post", `${USER_BASE_URL}/v1/system/settings/info`, {
      data,
      ...config,
    });
  },

  /**
   * 查询所有系统响应码
   */
  listAllReturnCodes(config?: AxiosRequestConfig) {
    return http.request<SysReturnCodeDto[]>("post", `${USER_BASE_URL}/v1/system/return-code/list/all`, {
      ...config,
    });
  },

  /**
   * 查询AppInfo信息（简单检索）
   * @param data 接入授权列表查询
   */
  listAppInfoByAbbr(data: AppInfoListParam, config?: AxiosRequestConfig) {
    return http.request<AppInfoDto[]>("post", `${USER_BASE_URL}/v1/system/appinfo/list/abbr`, {
      data,
      ...config,
    });
  },

  /**
   * 分页查询AppInfo信息
   * @param data 接入授权列表查询
   */
  listAppInfoByPage(data: AppInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultAppInfoDto>("post", `${USER_BASE_URL}/v1/system/appinfo/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 查询AppInfo信息（模板列表）
   */
  listAppInfoByTemplate(config?: AxiosRequestConfig) {
    return http.request<AppInfoDto[]>("post", `${USER_BASE_URL}/v1/system/appinfo/list/template`, {
      ...config,
    });
  },

  /**
   * 关联资源：未关联的资源列表
   * @param data 应用ID
   */
  listAppNotRelationResource(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ResourceInfoDto[]>("post", `${USER_BASE_URL}/v1/system/appinfo/resource/relate/undelegated`, {
      data,
      ...config,
    });
  },

  /**
   * 关联资源：已关联的资源列表
   * @param data 应用ID
   */
  listAppRelationResource(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ResourceInfoDto[]>("post", `${USER_BASE_URL}/v1/system/appinfo/resource/relate/list`, {
      data,
      ...config,
    });
  },

  /**
   * 获取指定的地区下级区域
   * @param data 地区编码
   */
  listAreaByCode(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<SysAreaDto[]>("post", `${USER_BASE_URL}/v1/system/dictionary/list/area`, {
      data,
      ...config,
    });
  },

  /**
   * 获取所有的字典列表
   */
  listDictionaryByAll(config?: AxiosRequestConfig) {
    return http.request<SysDictionaryDto[]>("post", `${USER_BASE_URL}/v1/system/dictionary/list/all`, {
      ...config,
    });
  },

  /**
   * 获取指定开头的字典列表
   * @param data 系统字典请求参数
   */
  listDictionaryByCode(data: SysDictionarySearchParam, config?: AxiosRequestConfig) {
    return http.request<SysDictionaryDto[]>("post", `${USER_BASE_URL}/v1/system/dictionary/list/prefix`, {
      data,
      ...config,
    });
  },

  /**
   * 获取所有的字典列表（简版）
   */
  listDictionarySimpleByAll(config?: AxiosRequestConfig) {
    return http.request<SysDictionarySimpleDto[]>("post", `${USER_BASE_URL}/v1/system/dictionary/list/simple/all`, {
      ...config,
    });
  },

  /**
   * 获取指定开头的字典列表（简版）
   * @param data 系统字典请求参数
   */
  listDictionarySimpleByCode(data: SysDictionarySearchParam, config?: AxiosRequestConfig) {
    return http.request<SysDictionarySimpleDto[]>("post", `${USER_BASE_URL}/v1/system/dictionary/list/simple/prefix`, {
      data,
      ...config,
    });
  },

  /**
   * 获取指定范围内的节假日
   * @param data 节假日查询参数
   */
  listHoliday(data: SysHolidaySearchParam, config?: AxiosRequestConfig) {
    return http.request<SysHolidayDto[]>("post", `${USER_BASE_URL}/v1/system/holiday/list/all`, {
      data,
      ...config,
    });
  },

  /**
   * 关联模板：未关联的模板列表
   * @param data 应用ID
   */
  listNotRelateInherit(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<AppInfoDto[]>("post", `${USER_BASE_URL}/v1/system/appinfo/inherit/undelegated`, {
      data,
      ...config,
    });
  },

  /**
   * 获取通用配置信息（无需认证）
   * @param data 配置列表查询参数
   */
  listPublicSettings(data: SettingSearchParam, config?: AxiosRequestConfig) {
    return http.request<SettingDto[]>("post", `${USER_BASE_URL}/v1/system/settings/list/public`, {
      data,
      ...config,
    });
  },

  /**
   * 关联模板：已关联的模板列表
   * @param data 应用ID
   */
  listRelateInherit(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<AppInfoDto[]>("post", `${USER_BASE_URL}/v1/system/appinfo/inherit/relate`, {
      data,
      ...config,
    });
  },

  /**
   * 分页查询系统响应码
   * @param data 系统响应码查询参数
   */
  listReturnCodeByPage(data: SysReturnCodeSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultSysReturnCodeDto>("post", `${USER_BASE_URL}/v1/system/return-code/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 获取指定开头的配置信息
   * @param data 配置列表查询参数
   */
  listSettingsByCode(data: SettingSearchParam, config?: AxiosRequestConfig) {
    return http.request<SettingDto[]>("post", `${USER_BASE_URL}/v1/system/settings/list/prefix`, {
      data,
      ...config,
    });
  },

  /**
   * 保存字典信息
   * @param data 入参：系统字典信息
   */
  saveDictionaryInfo(data: SysDictionaryParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/dictionary/info/save`, {
      data,
      ...config,
    });
  },

  /**
   * 新增系统响应码
   * @param data 系统响应码请求参数
   */
  saveReturnCode(data: SysReturnCodeParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/return-code/save`, {
      data,
      ...config,
    });
  },

  /**
   * 修改配置信息
   * @param data null
   */
  saveSystemSetting(data: SettingSaveParam[], config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/settings/list/save`, {
      data,
      ...config,
    });
  },

  /**
   * 修改AppInfo信息
   * @param data 接入授权
   */
  updateAppInfo(data: AppInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/update`, {
      data,
      ...config,
    });
  },

  /**
   * 修改AppInfo状态
   * @param data 修改App状态信息
   */
  updateAppInfoState(data: AppInfoStateParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/update/status`, {
      data,
      ...config,
    });
  },

  /**
   * 修改AppInfo模板类型
   * @param data 接入授权
   */
  updateAppInfoTemplateType(data: AppInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/update/template`, {
      data,
      ...config,
    });
  },

  /**
   * 修改节假日信息
   * @param data 节假日信息
   */
  updateHolidayInfo(data: SysHolidayInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/holiday/update`, {
      data,
      ...config,
    });
  },

  /**
   * 资源信息：修改
   * @param data 添加/修改资源
   */
  updateResourceInfo4App(data: ResourceInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/system/appinfo/resource/update`, {
      data,
      ...config,
    });
  },
};

export default SystemAPI;

/**
 * 接入授权
 */
export interface AppInfoDto {
  /** 名称 */
  appName?: string;
  /** appkey */
  appkey?: string;
  /** 创建时间 */
  createTime?: string;
  /** 主键 */
  id: string;
  /** 所属机构ID */
  instituteId?: string;
  /** 所属机构名称 */
  instituteName?: string;
  /** 授权根模块（平台） */
  moduleId?: string;
  /** 授权根模块（平台）名称 */
  moduleName?: string;
  /** secret */
  secret?: string;
  /** 可用状态（001） */
  status?: string;
  /** 状态备注 */
  statusMemo?: string;
  /** 状态时间 */
  statusTime?: string;
  /** 模板类型（006） */
  templateType?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 接入授权列表查询
 */
export interface AppInfoListParam {
  /** APP名称 */
  appName?: string;
  /** appkey */
  appkey?: string;
  /** 机构id */
  instituteId?: string;
  /** 关键字 */
  keyword?: string;
  /** 授权根模块 */
  moduleId?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 模板类型 */
  templateType?: string;
}

/**
 * 接入授权
 */
export interface AppInfoParam {
  /** 名称 */
  appName: string;
  /** appkey */
  appkey?: string;
  /** 主键 */
  id?: string;
  /** 所属机构 */
  instituteId?: string;
  /** 授权根模块 */
  moduleId?: string;
  /** secret */
  secret?: string;
  /** 模板类型 */
  templateType?: string;
}

/**
 * 修改App状态信息
 */
export interface AppInfoStateParam {
  /** id */
  id: string;
  /** 状态 */
  status: string;
  /** 状态备注 */
  statusMemo?: string;
}

/**
 * APP授权继承
 */
export interface AppInhertAddParam {
  /** 接入ID */
  appId: string;
  /** 父级APPID */
  parentIdList: string[];
}

/**
 * APP授权
 */
export interface AppPermissionAddParam {
  /** 接入ID */
  appId: string;
  /** 资源集合 */
  resourceIdList: string[];
}

/**
 * 复制APP授权
 */
export interface AppPermissionCopyParam {
  /** 源AppId */
  fromAppId: string;
  /** 目标AppId */
  toAppId: string;
}

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 资源信息
 */
export interface ResourceInfoDto {
  /** 主键 */
  id: string;
  /** 关联表ID */
  relateId?: string;
  /** 资源名称 */
  resourceName?: string;
  /** 资源URL */
  resourceUrl?: string;
}

/**
 * 配置信息
 */
export interface SettingDto {
  /** 配置标识 */
  configCode: string;
  /** 配置名称 */
  configName?: string;
  /** 配置内容 */
  configValue?: string;
  /** 备注 */
  description?: string;
  /** 配置来源：USER、INSTITUTE、SYSTEM */
  source?: string;
}

/**
 * 地区信息
 */
export interface SysAreaDto {
  /** 简称 */
  abbrName?: string;
  /** 下级区域 */
  children?: SysAreaDto[];
  /** 行政编码 */
  districtCode?: string;
  /** 全称 */
  fullName?: string;
  /** 长途区号 */
  phoneCode?: string;
  /** 短称 */
  shortName?: string;
}

/**
 * 出参：系统字典信息
 */
export interface SysDictionaryDto {
  /** 子节点 */
  children?: SysDictionaryDto[];
  /** 字典编码 */
  dicCode: string;
  /** 作用范围（003） */
  dicType?: string;
  /** 字典内容 */
  dicValue: string;
  /** 字典ID */
  id: string;
  /** 显示顺序 */
  sortIdx?: number;
  /** 标签样式 */
  tagStyle?: string;
}

/**
 * 出参：系统字典信息（简版）
 */
export interface SysDictionarySimpleDto {
  /** 子节点 */
  children?: SysDictionarySimpleDto[];
  /** 字典编码 */
  dicCode: string;
  /** 字典内容 */
  dicValue: string;
  /** 标签样式 */
  tagStyle?: string;
}

/**
 * 节假日信息
 */
export interface SysHolidayDto {
  /** 日期类型（007） */
  dateType: string;
  /** 具体日期 */
  dateValue: string;
  /** 备注 */
  description?: string;
  /** ID */
  id: string;
}

/**
 * 系统响应码
 */
export interface SysReturnCodeDto {
  /** 备注 */
  description?: string;
  /** ID */
  id: string;
  /** 响应码 */
  returnCode: string;
  /** 响应描述 */
  returnValue?: string;
}

/**
 * 分页信息
 */
export interface PageResultAppInfoDto {
  /** 是否有下一页 */
  nextPage?: boolean;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数据量 */
  pageSize?: number;
  /** 总页数 */
  pages?: number;
  /** 是否有上一页 */
  prevPage?: boolean;
  /** 数据集 */
  result?: AppInfoDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultSysReturnCodeDto {
  /** 是否有下一页 */
  nextPage?: boolean;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数据量 */
  pageSize?: number;
  /** 总页数 */
  pages?: number;
  /** 是否有上一页 */
  prevPage?: boolean;
  /** 数据集 */
  result?: SysReturnCodeDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 添加/修改资源
 */
export interface ResourceInfoParam {
  /** 主键 */
  id?: string;
  /** 关联模块/资源ID */
  relateId?: string;
  /** 资源名称 */
  resourceName: string;
  /** 资源URL */
  resourceUrl: string;
}

/**
 * 配置编码查询参数
 */
export interface SettingCodeParam {
  /** 配置标识 */
  configCode: string;
  /** 机构ID（机构配置专用，可选） */
  instituteId?: string;
}

/**
 * 配置保存参数
 */
export interface SettingSaveParam {
  /** 配置标识 */
  configCode: string;
  /** 配置名称 */
  configName?: string;
  /** 配置值 */
  configValue?: string;
  /** 备注 */
  description?: string;
  /** 机构ID（机构配置专用，可选） */
  instituteId?: string;
  /** 作用范围（003001内置/003002通用/003003私有） */
  publicType?: string;
}

/**
 * 配置列表查询参数
 */
export interface SettingSearchParam {
  /** 机构ID（机构配置专用，可选） */
  instituteId?: string;
  /** 配置标识前缀（必须输入） */
  prefix: string;
}

/**
 * 入参：系统字典信息
 */
export interface SysDictionaryParam {
  /** 字典编码 */
  dicCode: string;
  /** 作用范围 */
  dicType?: string;
  /** 字典内容 */
  dicValue: string;
  /** 字典ID */
  id?: string;
  /** 显示顺序 */
  sortIdx?: number;
  /** 标签样式 */
  tagStyle?: string;
}

/**
 * 系统字典请求参数
 */
export interface SysDictionarySearchParam {
  /** 系统字典code */
  itemCode: string;
}

/**
 * 节假日信息
 */
export interface SysHolidayInfoParam {
  /** 日期类型（007） */
  dateType: string;
  /** 具体日期 */
  dateValue: string;
  /** 备注 */
  description?: string;
  /** ID */
  id?: string;
}

/**
 * 节假日查询参数
 */
export interface SysHolidaySearchParam {
  /** 结束日期 */
  endDate?: string;
  /** 开始日期 */
  startDate?: string;
}

/**
 * 系统响应码请求参数
 */
export interface SysReturnCodeParam {
  /** 备注 */
  description?: string;
  /** 响应码 */
  returnCode: string;
  /** 响应描述 */
  returnValue?: string;
}

/**
 * 系统响应码查询参数
 */
export interface SysReturnCodeSearchParam {
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 响应码（模糊匹配） */
  returnCode?: string;
}
