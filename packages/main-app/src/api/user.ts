import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 用户信息、用户管理、用户配置
 */
const UserAPI = {
  /**
   * 新增用户信息
   * @param data 新增用户信息
   */
  addUserInfo(data: UserAddParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/add`, {
      data,
      ...config,
    });
  },

  /**
   * 绑定TOTP
   * @param data TOTP 绑定参数
   */
  bindMfa(data: TotpBindParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/mfa/bind`, {
      data,
      ...config,
    });
  },

  /**
   * 删除用户信息
   * @param data 用户ID
   */
  deleteUserInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 删除用户配置
   * @param data 配置编码查询参数
   */
  deleteUserSetting(data: SettingCodeParam, config?: AxiosRequestConfig) {
    return http.request<void>("post", `${USER_BASE_URL}/v1/user/settings/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 获取TOTP二维码
   */
  getMfaQrCode(config?: AxiosRequestConfig) {
    return http.request<TotpDto>("post", `${USER_BASE_URL}/v1/user/profile/mfa/qrcode`, {
      ...config,
    });
  },

  /**
   * 用户详情查询
   * @param data 用户ID
   */
  getUserInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<UserInfoDto>("post", `${USER_BASE_URL}/v1/user/info`, {
      data,
      ...config,
    });
  },

  /**
   * 用户详情查询
   */
  getUserProfileInfo(config?: AxiosRequestConfig) {
    return http.request<UserInfoDto>("post", `${USER_BASE_URL}/v1/user/profile/info`, {
      ...config,
    });
  },

  /**
   * 查询单个用户配置
   * @param data 配置编码查询参数
   */
  getUserSetting(data: SettingCodeParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/settings/code`, {
      data,
      ...config,
    });
  },

  /**
   * 用户列表（简单检索）
   * @param data 用户列表查询
   */
  listUserByAbbr(data: UserListParam, config?: AxiosRequestConfig) {
    return http.request<UserInfoDto[]>("post", `${USER_BASE_URL}/v1/user/list/abbr`, {
      data,
      ...config,
    });
  },

  /**
   * 获取分组列表
   * @param data 机构ID
   */
  listUserGroup(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<GroupDto[]>("post", `${USER_BASE_URL}/v1/user/group/list`, {
      data,
      ...config,
    });
  },

  /**
   * 列表查询
   * @param data 用户列表查询
   */
  listUserInfoByPage(data: UserListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultUserInfoDto>("post", `${USER_BASE_URL}/v1/user/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 查询用户配置列表
   * @param data 配置列表查询参数
   */
  listUserSettings(data: SettingSearchParam, config?: AxiosRequestConfig) {
    return http.request<SettingDto[]>("post", `${USER_BASE_URL}/v1/user/settings/list`, {
      data,
      ...config,
    });
  },

  /**
   * 新增或修改用户配置
   * @param data null
   */
  saveUserSetting(data: SettingSaveParam[], config?: AxiosRequestConfig) {
    return http.request<void>("post", `${USER_BASE_URL}/v1/user/settings/save`, {
      data,
      ...config,
    });
  },

  /**
   * 发送邮箱验证码
   * @param data 发送邮箱验证码
   */
  sendEmailCaptcha(data: SendEmailCodeParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/email/captcha`, {
      data,
      ...config,
    });
  },

  /**
   * 发送手机验证码
   * @param data 发送手机验证码
   */
  sendPhoneCaptcha(data: SendPhoneCodeParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/phone/captcha`, {
      data,
      ...config,
    });
  },

  /**
   * 更新头像
   * @param data 修改用户头像
   */
  updateSelfAvatar(data: UpdateAvatarParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/update/avatar`, {
      data,
      ...config,
    });
  },

  /**
   * 更换邮箱
   * @param data 更换邮箱
   */
  updateSelfEmail(data: UpdateEmailParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/update/email`, {
      data,
      ...config,
    });
  },

  /**
   * 修改自己的密码
   * @param data 新增用户信息
   */
  updateSelfPassword(data: ChangePasswordParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/update/password`, {
      data,
      ...config,
    });
  },

  /**
   * 更换手机号
   * @param data 更换手机号
   */
  updateSelfPhone(data: UpdatePhoneParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/update/phone`, {
      data,
      ...config,
    });
  },

  /**
   * 更新真实姓名
   * @param data 更新用户真实姓名
   */
  updateSelfRealName(data: UpdateRealNameParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/profile/update/realName`, {
      data,
      ...config,
    });
  },

  /**
   * 修改用户信息
   * @param data 修改用户信息
   */
  updateUserInfo(data: UserUpdateParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/update`, {
      data,
      ...config,
    });
  },

  /**
   * 修改用户密码
   * @param data 新增用户信息
   */
  updateUserPassword(data: ChangePasswordParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/update/password`, {
      data,
      ...config,
    });
  },

  /**
   * 更新状态
   * @param data 修改用户状态信息
   */
  updateUserState(data: UserStateParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/user/update/status`, {
      data,
      ...config,
    });
  },
};

export default UserAPI;

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
 * 发送邮箱验证码
 */
export interface SendEmailCodeParam {
  /** 邮箱 */
  email: string;
}

/**
 * 发送手机验证码
 */
export interface SendPhoneCodeParam {
  /** 手机号 */
  phone: string;
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
 * TOTP 绑定参数
 */
export interface TotpBindParam {
  /** TOTP 动态码 */
  totpCode: string;
}

/**
 * TOTP 二维码信息
 */
export interface TotpDto {
  /** otpauth URI（用于生成二维码） */
  otpAuthUri?: string;
  /** 二维码 Base64 图片 */
  qrCodeBase64?: string;
}

/**
 * 修改用户头像
 */
export interface UpdateAvatarParam {
  /** 用户头像 */
  avatar: string;
}

/**
 * 更换邮箱
 */
export interface UpdateEmailParam {
  /** 验证码 */
  captcha: string;
  /** 邮箱 */
  email: string;
}

/**
 * 更换手机号
 */
export interface UpdatePhoneParam {
  /** 验证码 */
  captcha: string;
  /** 手机号 */
  phone: string;
}

/**
 * 更新用户真实姓名
 */
export interface UpdateRealNameParam {
  /** 真实姓名 */
  realName: string;
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
 * 用户角色信息
 */
export interface UserRoleDto {
  /** 角色id */
  id: string;
  /** 角色名字 */
  roleName: string;
}
