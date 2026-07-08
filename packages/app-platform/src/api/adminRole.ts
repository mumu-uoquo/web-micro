import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 角色管理（超管）
 */
const AdminRoleAPI = {
  /**
   * 新增角色信息
   * @param data 新增/修改角色
   */
  addRoleInfo(data: RoleInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/role/add`, {
      data,
      ...config,
    });
  },

  /**
   * 删除角色信息
   * @param data 角色ID
   */
  deleteRoleInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/role/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 角色详情查询
   * @param data 角色ID
   */
  getRoleInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<RoleInfoDto>("post", `${USER_BASE_URL}/admin/v1/role/info`, {
      data,
      ...config,
    });
  },

  /**
   * 模块树查询
   */
  listModuleByTree(config?: AxiosRequestConfig) {
    return http.request<ModuleTreeDto[]>("post", `${USER_BASE_URL}/admin/v1/role/module/tree`, {
      ...config,
    });
  },

  /**
   * 列表查询
   * @param data 角色查询
   */
  listRoleInfoByPage(data: RoleListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultRoleInfoDto>("post", `${USER_BASE_URL}/admin/v1/role/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 获取角色的模块信息
   * @param data 角色ID
   */
  listRoleSelectedModule(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ModuleInfoDto[]>("post", `${USER_BASE_URL}/admin/v1/role/module/selected`, {
      data,
      ...config,
    });
  },

  /**
   * 修改角色的模块信息
   * @param data 角色模块关联
   */
  updateModuleRoleRelation(data: RoleModuleParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/role/module/update`, {
      data,
      ...config,
    });
  },

  /**
   * 修改角色信息
   * @param data 新增/修改角色
   */
  updateRoleInfo(data: RoleInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/role/update`, {
      data,
      ...config,
    });
  },
};

export default AdminRoleAPI;

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
 * 分页信息
 */
export interface PageResultRoleInfoDto {
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
  result?: RoleInfoDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 角色信息
 */
export interface RoleInfoDto {
  /** 角色描述 */
  description?: string;
  /** 主键 */
  id: string;
  /** 所属机构 */
  instituteId?: string;
  /** 所属机构名称 */
  instituteName?: string;
  /** 角色等级（越小越高） */
  roleGrade?: number;
  /** 授权分组（004） */
  roleGroup?: string;
  /** 角色名字 */
  roleName: string;
  /** 作用范围（003） */
  roleType?: string;
}

/**
 * 新增/修改角色
 */
export interface RoleInfoParam {
  /** 角色描述 */
  description?: string;
  /** 复制来源 */
  fromRoleId?: string;
  /** 主键 */
  id?: string;
  /** 机构id */
  instituteId?: string;
  /** 角色等级（越小越高） */
  roleGrade?: number;
  /** 角色名称 */
  roleName: string;
  /** 作用范围（003） */
  roleType?: string;
}

/**
 * 角色查询
 */
export interface RoleListParam {
  /** 所属机构 */
  instituteId?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 角色等级 */
  roleGrade?: number;
  /** 角色分组 */
  roleGroup?: string;
  /** 角色名称 */
  roleName?: string;
  /** 作用范围 */
  roleType?: string;
}

/**
 * 角色模块关联
 */
export interface RoleModuleParam {
  /** 模块id集合 */
  moduleIds: string[];
  /** 角色id */
  roleId: string;
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
