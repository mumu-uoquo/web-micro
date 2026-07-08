import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 企业管理（超管）
 */
const AdminInstituteAPI = {
  /**
   * 新增企业信息
   * @param data 企业信息
   */
  addInstituteInfo(data: InstituteInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/institute/add`, {
      data,
      ...config,
    });
  },

  /**
   * 删除分区信息
   * @param data 分区ID
   */
  deleteAreaInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/institute/area/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除部门信息
   * @param data 部门ID
   */
  deleteDepartmentInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/institute/department/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除企业信息
   * @param data 企业ID
   */
  deleteInstituteInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/institute/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 企业信息详情
   * @param data 企业ID
   */
  getInstituteInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<InstituteInfoDto>("post", `${USER_BASE_URL}/admin/v1/institute/info`, {
      data,
      ...config,
    });
  },

  /**
   * 企业列表（简单检索）
   * @param data 企业查询
   */
  listInstituteByAbbr(data: InstituteListParam, config?: AxiosRequestConfig) {
    return http.request<InstituteInfoDto[]>("post", `${USER_BASE_URL}/admin/v1/institute/list/abbr`, {
      data,
      ...config,
    });
  },

  /**
   * 企业列表（分页）
   * @param data 企业查询
   */
  listInstituteByPage(data: InstituteListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultInstituteInfoDto>("post", `${USER_BASE_URL}/admin/v1/institute/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 企业列表（树状）
   */
  listInstituteByTree(config?: AxiosRequestConfig) {
    return http.request<InstituteTreeDto[]>("post", `${USER_BASE_URL}/admin/v1/institute/list/tree`, {
      ...config,
    });
  },

  /**
   * 修改企业信息
   * @param data 企业信息
   */
  updateInstituteInfo(data: InstituteInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/institute/update`, {
      data,
      ...config,
    });
  },

  /**
   * 更新状态
   * @param data 修改企业状态信息
   */
  updateInstituteState(data: InstituteStateParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/institute/update/status`, {
      data,
      ...config,
    });
  },
};

export default AdminInstituteAPI;

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 机构信息
 */
export interface InstituteInfoDto {
  /** 企业地址 */
  address?: string;
  /** 创建时间 */
  createTime?: string;
  /** 备注 */
  description?: string;
  /** 行政编码 */
  districtCode?: string;
  /** 主键 */
  id: string;
  /** 企业编码 */
  instituteCode?: string;
  /** 企业名称 */
  instituteName: string;
  /** 企业类型（020） */
  instituteType?: string;
  /** 纬度 */
  locationLat?: string;
  /** 经度 */
  locationLng?: string;
  /** 父级ID */
  parentId?: string;
  /** 父级名称 */
  parentName?: string;
  /** 授权分组（004） */
  roleGroup?: string;
  /** 企业简称 */
  shortName?: string;
  /** 状态 */
  status?: string;
  /** 状态备注 */
  statusMemo?: string;
  /** 三方ID */
  thirdId?: string;
  /** 更新时间 */
  updateTime?: string;
}

/**
 * 企业信息
 */
export interface InstituteInfoParam {
  /** 企业地址 */
  address?: string;
  /** 备注 */
  description?: string;
  /** 行政编码 */
  districtCode?: string;
  /** id */
  id?: string;
  /** 企业编码 */
  instituteCode?: string;
  /** 企业名称 */
  instituteName: string;
  /** 企业类型（020） */
  instituteType?: string;
  /** 纬度 */
  locationLat?: string;
  /** 经度 */
  locationLng?: string;
  /** 父级ID */
  parentId?: string;
  /** 授权分组（004） */
  roleGroup?: string;
  /** 企业简称 */
  shortName?: string;
  /** 三方ID */
  thirdId?: string;
}

/**
 * 企业查询
 */
export interface InstituteListParam {
  /** 企业名称 */
  instituteName?: string;
  /** 企业类型（020） */
  instituteType?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 父级ID */
  parentId?: string;
  /** 授权分组（004） */
  roleGroup?: string;
}

/**
 * 修改企业状态信息
 */
export interface InstituteStateParam {
  /** 主键 */
  id: string;
  /** 状态 */
  status: string;
  /** 状态备注 */
  statusMemo?: string;
}

/**
 * 机构树状信息
 */
export interface InstituteTreeDto {
  /** 子机构信息 */
  children?: InstituteTreeDto[];
  /** id */
  id: string;
  /** 企业名称 */
  instituteName: string;
  /** 企业类型（020） */
  instituteType?: string;
  /** 父级ID */
  parentId?: string;
  /** 企业简称 */
  shortName?: string;
}

/**
 * 分页信息
 */
export interface PageResultInstituteInfoDto {
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
  result?: InstituteInfoDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}
