import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 部门信息相关
 */
const DepartmentAPI = {
  /**
   * 新增分区信息
   * @param data 分区信息
   */
  addAreaInfo(data: AreaInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/department/area/add`, {
      data,
      ...config,
    });
  },

  /**
   * 新增部门信息
   * @param data 部门信息
   */
  addDepartmentInfo(data: DepartmentInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/department/add`, {
      data,
      ...config,
    });
  },

  /**
   * 删除分区信息
   * @param data 分区ID
   */
  deleteAreaInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/department/area/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除部门信息
   * @param data 部门ID
   */
  deleteDepartmentInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/department/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 分区列表
   * @param data 企业ID
   */
  listArea(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<AreaInfoDto[]>("post", `${USER_BASE_URL}/v1/department/area/list`, {
      data,
      ...config,
    });
  },

  /**
   * 部门列表（树状）
   * @param data 企业ID
   */
  listDepartmentByTree(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<DepartmentTreeDto[]>("post", `${USER_BASE_URL}/v1/department/list/tree`, {
      data,
      ...config,
    });
  },

  /**
   * 取消部门关联的分区
   * @param data 部门ID
   */
  unlinkDepartmentAreaInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/department/area/unlink`, {
      data,
      ...config,
    });
  },

  /**
   * 修改分区信息
   * @param data 分区信息
   */
  updateAreaInfo(data: AreaInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/department/area/update`, {
      data,
      ...config,
    });
  },

  /**
   * 修改部门信息
   * @param data 部门信息
   */
  updateDepartmentInfo(data: DepartmentInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/department/update`, {
      data,
      ...config,
    });
  },
};

export default DepartmentAPI;

/**
 * 分区信息
 */
export interface AreaInfoParam {
  /** 详细地址 */
  address?: string;
  /** 区域编码 */
  areaCode?: string;
  /** 区域名称 */
  areaName: string;
  /** 默认标识 */
  defaulted?: boolean;
  /** 备注 */
  description?: string;
  /** id */
  id?: string;
  /** 所属企业 */
  instituteId: string;
  /** 三方ID（数据同步） */
  thirdId?: string;
}

/**
 * 部门信息
 */
export interface DepartmentInfoParam {
  /** 详细地址 */
  address?: string;
  /** 所属区域 */
  areaId?: string;
  /** 默认标识 */
  defaulted?: boolean;
  /** 部门编码 */
  deptCode?: string;
  /** 部门名称 */
  deptName: string;
  /** 备注 */
  description?: string;
  /** id */
  id?: string;
  /** 所属企业 */
  instituteId: string;
  /** 父级ID */
  parentId?: string;
  /** 三方ID（数据同步） */
  thirdId?: string;
}

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 分区信息
 */
export interface AreaInfoDto {
  /** 详细地址 */
  address?: string;
  /** 区域编码 */
  areaCode?: string;
  /** 区域名称 */
  areaName: string;
  /** 默认标识 */
  defaulted?: boolean;
  /** 备注 */
  description?: string;
  /** id */
  id: string;
  /** 所属企业 */
  instituteId: string;
  /** 三方ID（数据同步） */
  thirdId?: string;
}

/**
 * 部门树状信息
 */
export interface DepartmentTreeDto {
  /** 详细地址 */
  address?: string;
  /** 所属区域 */
  areaId?: string;
  /** 所属区域名称 */
  areaName?: string;
  /** 子节点信息 */
  children?: DepartmentTreeDto[];
  /** 默认标识 */
  defaulted?: boolean;
  /** 部门编码 */
  deptCode?: string;
  /** 部门名称 */
  deptName: string;
  /** 备注 */
  description?: string;
  /** id */
  id: string;
  /** 所属企业 */
  instituteId?: string;
  /** 父级ID */
  parentId?: string;
  /** 三方ID（数据同步） */
  thirdId?: string;
}
