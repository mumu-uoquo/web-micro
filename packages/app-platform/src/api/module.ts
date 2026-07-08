import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 模块管理
 */
const ModuleAPI = {
  /**
   * 模块信息：新增
   * @param data 添加/修改模块
   */
  addModuleInfo(data: ModuleInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/add`, {
      data,
      ...config,
    });
  },

  /**
   * 关联资源：添加关联资源
   * @param data 模块资源关联
   */
  addModuleRelationResource(data: ModuleResourceParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/resource/relate/add`, {
      data,
      ...config,
    });
  },

  /**
   * 资源信息：新增
   * @param data 添加/修改资源
   */
  addResourceInfo(data: ResourceInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/resource/add`, {
      data,
      ...config,
    });
  },

  /**
   * 模块信息：删除
   * @param data 模块ID
   */
  deleteModuleInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 关联资源：删除关联资源
   * @param data 模块与资源的关联ID
   */
  deleteModuleRelationResource(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/resource/relate/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 资源信息：删除
   * @param data 资源ID
   */
  deleteResourceInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/resource/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 模块查询：详情查询
   * @param data 模块ID
   */
  getModuleInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ModuleInfoDto>("post", `${USER_BASE_URL}/v1/module/info`, {
      data,
      ...config,
    });
  },

  /**
   * 模块查询：根列表
   */
  listModuleByRoot(config?: AxiosRequestConfig) {
    return http.request<ModuleInfoDto[]>("post", `${USER_BASE_URL}/v1/module/list/root`, {
      ...config,
    });
  },

  /**
   * 模块查询：树查询
   */
  listModuleInfoByTree(config?: AxiosRequestConfig) {
    return http.request<ModuleTreeDto[]>("post", `${USER_BASE_URL}/v1/module/tree`, {
      ...config,
    });
  },

  /**
   * 关联资源：未关联的资源列表
   * @param data 模块ID
   */
  listModuleNotRelationResource(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ResourceInfoDto[]>("post", `${USER_BASE_URL}/v1/module/resource/relate/undelegated`, {
      data,
      ...config,
    });
  },

  /**
   * 关联资源：已关联的资源列表
   * @param data 模块ID
   */
  listModuleRelationResource(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ResourceInfoDto[]>("post", `${USER_BASE_URL}/v1/module/resource/relate/list`, {
      data,
      ...config,
    });
  },

  /**
   * 模块信息：修改
   * @param data 添加/修改模块
   */
  updateModuleInfo(data: ModuleInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/update`, {
      data,
      ...config,
    });
  },

  /**
   * 资源信息：修改
   * @param data 添加/修改资源
   */
  updateResourceInfo(data: ResourceInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/module/resource/update`, {
      data,
      ...config,
    });
  },
};

export default ModuleAPI;

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 模块信息（列表）
 */
export interface ModuleInfoDto {
  /** 备注描述 */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 主键 */
  id: string;
  /** 菜单名称 */
  menuName?: string;
  /** 模块编码 */
  moduleCode?: string;
  /** 模块名字 */
  moduleName?: string;
  /** 模块类型 */
  moduleType?: string;
  /** 请求参数 */
  params?: ModuleParam[];
  /** 父模块id */
  parentId?: string;
  /** 菜单路由 */
  path?: string;
  /** 是否新页打开 */
  popup?: boolean;
  /** 授权角色 */
  roleIdList?: string[];
  /** 排序 */
  sortIdx?: number;
  /** 跳转链接 */
  url?: string;
  /** 是否可见 */
  visible?: boolean;
}

/**
 * 模块信息（树状）
 */
export interface ModuleTreeDto {
  /** 子节点 */
  children?: ModuleTreeDto[];
  /** 备注描述 */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 主键 */
  id: string;
  /** 菜单名称 */
  menuName?: string;
  /** 模块编码 */
  moduleCode?: string;
  /** 模块名字 */
  moduleName?: string;
  /** 模块类型 */
  moduleType?: string;
  /** 请求参数 */
  params?: ModuleParam[];
  /** 父模块id */
  parentId?: string;
  /** 菜单路由 */
  path?: string;
  /** 是否新页打开 */
  popup?: boolean;
  /** 排序 */
  sortIdx?: number;
  /** 跳转链接 */
  url?: string;
  /** 是否可见 */
  visible?: boolean;
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
 * 添加/修改模块
 */
export interface ModuleInfoParam {
  /** 备注描述 */
  description?: string;
  /** 图标 */
  icon?: string;
  /** 主键 */
  id?: string;
  /** 菜单名称 */
  menuName?: string;
  /** 模块编码 */
  moduleCode: string;
  /** 模块名字 */
  moduleName: string;
  /** 模块类型 */
  moduleType: string;
  /** 请求参数 */
  params?: ModuleParam[];
  /** 父模块id */
  parentId?: string;
  /** 菜单路由 */
  path?: string;
  /** 是否新页打开 */
  popup?: boolean;
  /** 授权角色（仅当前模块，不级联处理） */
  roleIdList?: string[];
  /** 排序 */
  sortIdx?: number;
  /** 跳转链接 */
  url?: string;
  /** 是否可见 */
  visible?: boolean;
}

/**
 * 模块资源关联
 */
export interface ModuleResourceParam {
  /** 模块id */
  moduleId: string;
  /** 资源集合 */
  resourceIdList: string[];
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
 * 请求参数
 */
export interface ModuleParam {
  /** 说明 */
  description?: string;
  /** 是否可见 */
  enabled?: boolean;
  /** 键 */
  key: string;
  /** 值 */
  val: string;
}
