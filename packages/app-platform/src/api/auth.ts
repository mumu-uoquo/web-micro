import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 用户认证相关
 */
const AuthAPI = {
  /**
   * 用户账号登录
   * @param data 账号密码登录
   */
  accountLogin(data: AccountLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/account/login`, {
      data,
      ...config,
    });
  },

  /**
   * 凭证绑定
   * @param data 凭证绑定（账号密码 + tempToken）
   */
  credentialBind(data: CredentialBindParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/credential/bind`, {
      data,
      ...config,
    });
  },

  /**
   * 第三方扫码登录配置
   * @param data 第三方扫码登录配置
   */
  credentialConfig(data: CredentialConfigParam, config?: AxiosRequestConfig) {
    return http.request<CredentialConfigDto>("post", `${USER_BASE_URL}/v1/auth/credential/config`, {
      data,
      ...config,
    });
  },

  /**
   * 第三方凭证登录
   * @param data 第三方凭证登录
   */
  credentialLogin(data: CredentialLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/credential/login`, {
      data,
      ...config,
    });
  },

  /**
   * 第三方扫码登录状态轮询
   * @param data 第三方扫码登录状态
   */
  credentialStatus(data: CredentialStatusParam, config?: AxiosRequestConfig) {
    return http.request<CredentialStatusDto>("post", `${USER_BASE_URL}/v1/auth/credential/status`, {
      data,
      ...config,
    });
  },

  /**
   * 仅需账号和MFA验证码即可登录。连续5次出错该账号24小时内不能使用紧急登录功能。
   * @param data 紧急登录参数
   */
  emergencyLogin(data: EmergencyLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/emergency/login`, {
      data,
      ...config,
    });
  },

  /**
   * scene 需与后续流程一致：login=密码出错触发, register=用户注册, sms_login=短信登录发码前人机验证（非 login 场景的验证码 key 会按 scene 隔离）
   * @param data 获取图形验证码
   */
  getCaptcha(data: CaptchaParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/captcha`, {
      data,
      ...config,
    });
  },

  /**
   * 当前用户信息
   */
  getInfo(config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/info`, {
      ...config,
    });
  },

  /**
   * 用户登出
   */
  logout(config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/logout`, {
      ...config,
    });
  },

  /**
   * 验证MFA（登录二次验证）
   * @param data TOTP双因子验证登录
   */
  mfaLogin(data: MfaLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/mfa/login`, {
      data,
      ...config,
    });
  },

  /**
   * 获取运维登录二维码
   * @param data 获取运维登录二维码
   */
  opsConfig(data: OpsConfigParam, config?: AxiosRequestConfig) {
    return http.request<OpsConfigDto>("post", `${USER_BASE_URL}/v1/auth/ops/config`, {
      data,
      ...config,
    });
  },

  /**
   * 运维登录
   * @param data 运维登录
   */
  opsLogin(data: OpsLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/ops/login`, {
      data,
      ...config,
    });
  },

  /**
   * 根据角色获取功能列表（注：仅用于切换角色）
   * @param data 角色ID
   */
  permission(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ModuleTreeDto[]>("post", `${USER_BASE_URL}/v1/auth/account/permission`, {
      data,
      ...config,
    });
  },

  /**
   * 用户注册
   * @param data 用户注册
   */
  register(data: RegisterParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/register`, {
      data,
      ...config,
    });
  },

  /**
   * 密码找回
   * @param data 密码找回
   */
  resetPassword(data: ResetPasswordParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/password/reset`, {
      data,
      ...config,
    });
  },

  /**
   * 必须携带图像验证码进行人机交互验证
   * @param data 获取手机短信验证码
   */
  sendSmsCaptcha(data: PhoneCaptchaParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/phone/captcha`, {
      data,
      ...config,
    });
  },

  /**
   * 手机号短信码登录
   * @param data 手机号短信码登录
   */
  smsLogin(data: SmsLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/phone/login`, {
      data,
      ...config,
    });
  },

  /**
   * 刷新token登录
   * @param data 刷新Token登录
   */
  tokenLogin(data: TokenLoginParam, config?: AxiosRequestConfig) {
    return http.request<TokenDto>("post", `${USER_BASE_URL}/v1/auth/token/login`, {
      data,
      ...config,
    });
  },
};

export default AuthAPI;

/**
 * 账号密码登录
 */
export interface AccountLoginParam {
  /** 登录账号 */
  account: string;
  /** 发起方版本 */
  appVersion?: string;
  /** 验证码 */
  captcha?: string;
  /** 登录密码 */
  password: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * 获取图形验证码
 */
export interface CaptchaParam {
  /** 使用场景：login / register / phone */
  scene?: string;
}

/**
 * 凭证绑定（账号密码 + tempToken）
 */
export interface CredentialBindParam {
  /** 登录账号（手机号或用户名） */
  account: string;
  /** 发起方版本 */
  appVersion?: string;
  /** 验证码（非必填） */
  captcha?: string;
  /** 登录密码（RSA 加密） */
  password: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** 凭证登录返回的临时Token */
  tempToken: string;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * 第三方扫码登录配置
 */
export interface CredentialConfigDto {
  /** 企业微信应用 agentId（仅 wecom 返回） */
  agentId?: string;
  /** 应用 appid（微信 appid 或企业微信 corpid） */
  appid?: string;
  /** 授权回调地址 */
  redirectUri?: string;
  /** 渲染方式：wxjs=集成微信官方 JS（WxLogin / 企微 JS-SDK），oauth=自行拼接 OAuth2 URL 并展示二维码 */
  renderType?: string;
  /** 场景（wechat/wecom） */
  scene?: string;
  /** 本次授权的 state（用于回调与状态轮询） */
  state?: string;
}

/**
 * 第三方扫码登录配置
 */
export interface CredentialConfigParam {
  /** 场景（wechat/wecom） */
  scene: string;
}

/**
 * 第三方凭证登录
 */
export interface CredentialLoginParam {
  /** 发起方版本 */
  appVersion?: string;
  /** 凭证类型（wechat/wecom） */
  credentialType: string;
  /** 凭证标识值（如微信 openid） */
  credentialValue: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** 授权 state（须与 /credential/config 下发的一致） */
  state: string;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * 第三方扫码登录状态
 */
export interface CredentialStatusDto {
  /** 第三方回调的 code（confirmed 时有值） */
  code?: string;
  /** 状态：waiting=等待授权，confirmed=已回调拿到 code */
  status?: string;
}

/**
 * 第三方扫码登录状态
 */
export interface CredentialStatusParam {
  /** 场景（wechat/wecom） */
  scene: string;
  /** 本次授权的 state（用于回调与状态轮询） */
  state: string;
}

/**
 * 紧急登录参数
 */
export interface EmergencyLoginParam {
  /** 登录账号 */
  account: string;
  /** 发起方版本 */
  appVersion?: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** MFA动态验证码 */
  totpCode: string;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
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
 * TOTP双因子验证登录
 */
export interface MfaLoginParam {
  /** 发起方版本 */
  appVersion?: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** TOTP验证临时Token */
  tempToken: string;
  /** 双因子动态码 */
  totpCode: string;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * 运维登录二维码配置
 */
export interface OpsConfigDto {
  /** 二维码图片（base64 data uri） */
  qrCode?: string;
}

/**
 * 获取运维登录二维码
 */
export interface OpsConfigParam {
  /** 运维账号 */
  account: string;
  /** 手机号 */
  phone: string;
}

/**
 * 运维登录
 */
export interface OpsLoginParam {
  /** 运维账号 */
  account: string;
  /** 发起方版本 */
  appVersion?: string;
  /** 动态口令 */
  dynamicCode: string;
  /** 手机号 */
  phone: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * 获取手机短信验证码
 */
export interface PhoneCaptchaParam {
  /** 图形验证码（若当前场景需要则必填） */
  captcha?: string;
  /** 手机号（RSA 加密） */
  phone: string;
  /** 使用场景：sms_login / register（需与获取图形验证码时的 scene 一致） */
  scene: string;
}

/**
 * 用户注册
 */
export interface RegisterParam {
  /** 用户所属机构id */
  instituteId: string;
  /** 用户密码（RSA 加密） */
  password: string;
  /** 手机号（RSA 加密） */
  phone: string;
  /** 真实姓名 */
  realName?: string;
  /** 短信验证码 */
  smsCode: string;
  /** 用户账号 */
  userName: string;
}

/**
 * 密码找回
 */
export interface ResetPasswordParam {
  /** 新密码（RSA 加密） */
  newPassword: string;
  /** 手机号（RSA 加密） */
  phone: string;
  /** 短信验证码 */
  smsCode: string;
}

/**
 * 手机号短信码登录
 */
export interface SmsLoginParam {
  /** 发起方版本 */
  appVersion?: string;
  /** 手机号（RSA 加密） */
  phone: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** 短信验证码 */
  smsCode: string;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * 出参：Token信息
 */
export interface TokenDto {
  /** 会话token */
  accessToken: string;
  /** 过期时间（秒） */
  expireTime: number;
  /** 刷新token */
  refreshToken: string;
}

/**
 * 刷新Token登录
 */
export interface TokenLoginParam {
  /** 发起方版本 */
  appVersion?: string;
  /** 当前角色 */
  currentRoleId?: string;
  /** 刷新token */
  refreshToken: string;
  /** 是否记住 */
  rememberMe?: boolean;
  /** UA（主要用于移动端登录） */
  userAgent?: string;
}

/**
 * 用户认证信息
 */
export interface UserAuthDto {
  /** 会话token */
  accessToken?: string;
  /** 用户头像 */
  avatar?: string;
  /** 当前角色 */
  currentRoleId?: string;
  /** 邮箱 */
  email?: string;
  /** 过期时间（秒） */
  expireTime?: number;
  /** 分组列表 */
  groupList?: GroupDto[];
  /** 用户id */
  id: string;
  /** 用户所属机构id */
  instituteId: string;
  /** 用户所属机构名称 */
  instituteName?: string;
  /** 电话 */
  phone?: string;
  /** 真实姓名 */
  realName?: string;
  /** 推介码 */
  referralCode?: string;
  /** 刷新token */
  refreshToken?: string;
  /** 机构的授权分组（004） */
  roleGroup?: string;
  /** 角色列表 */
  roleList?: UserRoleDto[];
  /** 服务器时间 */
  serverTime?: string;
  /** 用户状态 */
  status?: string;
  /** 双因子状态（disabled-未开启，unbound-未绑定，enabled-已绑定） */
  totpStatus?: string;
  /** 用户姓名（登录账号） */
  userName?: string;
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

/**
 * 用户角色信息
 */
export interface UserRoleDto {
  /** 角色id */
  id: string;
  /** 角色名字 */
  roleName: string;
}
