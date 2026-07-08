import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 超管用户管理
 */
const AdminUserAPI = {
  /**
   * 新增用户信息
   * @param data 新增用户信息
   */
  addUserInfo(data: UserAddParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/user/add`, {
      data,
      ...config,
    });
  },

  /**
   * 删除用户信息
   * @param data 用户ID
   */
  deleteUserInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/user/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 用户详情查询
   * @param data 用户ID
   */
  getUserInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<UserInfoDto>("post", `${USER_BASE_URL}/admin/v1/user/info`, {
      data,
      ...config,
    });
  },

  /**
   * 用户列表（简单检索）
   * @param data 用户列表查询
   */
  listUserByAbbr(data: UserListParam, config?: AxiosRequestConfig) {
    return http.request<UserInfoDto[]>("post", `${USER_BASE_URL}/admin/v1/user/list/abbr`, {
      data,
      ...config,
    });
  },

  /**
   * 列表查询
   * @param data 用户列表查询
   */
  listUserInfoByPage(data: UserListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultUserInfoDto>("post", `${USER_BASE_URL}/admin/v1/user/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 修改用户信息
   * @param data 修改用户信息
   */
  updateUserInfo(data: UserUpdateParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/user/update`, {
      data,
      ...config,
    });
  },

  /**
   * 修改用户密码
   * @param data 新增用户信息
   */
  updateUserPassword(data: ChangePasswordParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/user/update/password`, {
      data,
      ...config,
    });
  },

  /**
   * 更新状态
   * @param data 修改用户状态信息
   */
  updateUserState(data: UserStateParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/user/update/status`, {
      data,
      ...config,
    });
  },
};

export default AdminUserAPI;

/**
 * 新增用户信息
 */
export interface ChangePasswordParam {
  /** 用户id */
  id?: string;
  /** 新密碼 */
  newPassword: string;
  /** 新密码强度 */
  newPwdLevel?: string;
  /** 旧密碼 */
  oldPassword?: string;
}

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 用户信息
 */
export interface UserInfoDto {
  /** 用户头像 */
  avatar?: string;
  /** 创建时间 */
  createTime?: string;
  /** 所属部门 */
  deptId?: string;
  /** 所属部门名称 */
  deptName?: string;
  /** 邮箱 */
  email?: string;
  /** 用户id */
  id: string;
  /** 用户所属机构id */
  instituteId: string;
  /** 用户所属机构名称 */
  instituteName?: string;
  /** 最后登录ip */
  lastedLoginIp?: string;
  /** 最后登录时间 */
  lastedLoginTime?: string;
  /** 连续登录错误次数 */
  loginErrorCount?: number;
  /** 电话 */
  phone?: string;
  /** 密码修改时间 */
  pwdEditTime?: string;
  /** 密码是否过期 */
  pwdExpired?: boolean;
  /** 密码强度（002） */
  pwdLevel?: string;
  /** 真实姓名 */
  realName?: string;
  /** 推介码 */
  referralCode?: string;
  /** 可用状态（001） */
  status?: string;
  /** 状态变更备注 */
  statusMemo?: string;
  /** 状态变更时间 */
  statusTime?: string;
  /** 三方ID */
  thirdId?: string;
  /** 用户编号 */
  userCode?: string;
  /** 用户所属分组 */
  userGroupList?: GroupDto[];
  /** 用户账号 */
  userName?: string;
  /** 用户所属角色 */
  userRoleList?: UserRoleDto[];
}

/**
 * 分页信息
 */
export interface PageResultUserInfoDto {
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
  result?: UserInfoDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 新增用户信息
 */
export interface UserAddParam {
  /** 用户头像 */
  avatar?: string;
  /** 所属部门 */
  deptId?: string;
  /** 邮箱 */
  email?: string;
  /** 用户所属机构id */
  instituteId: string;
  /** 用戶密码 */
  password: string;
  /** 电话 */
  phone: string;
  /** 密码强度 */
  pwdLevel?: string;
  /** 真实姓名 */
  realName?: string;
  /** 三方ID */
  thirdId?: string;
  /** 用户编号 */
  userCode?: string;
  /** 用户分组列表 */
  userGroupIdList?: string[];
  /** 用户账号 */
  userName: string;
  /** 用户角色列表 */
  userRoleIdList?: string[];
}

/**
 * 用户列表查询
 */
export interface UserListParam {
  /** 结束时间 */
  createTimeEnd?: string;
  /** 起始时间 */
  createTimeStart?: string;
  /** 所属部门 */
  deptId?: string;
  /** 机构id */
  instituteId?: string;
  /** 父机构id */
  instituteParentId?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 真实姓名 */
  realName?: string;
  /** 用户姓名 */
  userName?: string;
}

/**
 * 修改用户状态信息
 */
export interface UserStateParam {
  /** 用户id */
  id: string;
  /** 状态 */
  status: string;
  /** 状态备注 */
  statusMemo?: string;
}

/**
 * 修改用户信息
 */
export interface UserUpdateParam {
  /** 用户头像 */
  avatar?: string;
  /** 所属部门 */
  deptId?: string;
  /** 邮箱 */
  email?: string;
  /** 用户id */
  id: string;
  /** 用戶密码 */
  password?: string;
  /** 电话 */
  phone?: string;
  /** 密码强度 */
  pwdLevel?: string;
  /** 真实姓名 */
  realName?: string;
  /** 三方ID */
  thirdId?: string;
  /** 用户编号 */
  userCode?: string;
  /** 用户分组列表 */
  userGroupIdList?: string[];
  /** 用户账号 */
  userName?: string;
  /** 用户角色列表 */
  userRoleIdList?: string[];
}

/**
 * 分组信息
 */
export interface GroupDto {
  /** 所属部门 */
  deptId?: string;
  /** 所属部门名称 */
  deptName?: string;
  /** 分组名字 */
  groupName: string;
  /** 分组id */
  id: string;
  /** 用户所属机构id */
  instituteId?: string;
  /** 用户所属机构名称 */
  instituteName?: string;
}

/**
 * 用户角色信息
 */
export interface UserRoleDto {
  /** 角色id */
  id: string;
  /** 角色名字 */
  roleName: string;
}
