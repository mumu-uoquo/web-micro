/**
 * 认证相关 API
 *
 * 迁移自 packages/main-app/src/api/auth.ts
 * 调整：http import 指向 app-platform 本地 src/api/http.ts
 *
 * Requirements: 6.1, 6.4, 6.5
 */
import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";

export const USER_BASE_URL = "/health/api/platform";

const AuthAPI = {
  accountLogin(data: AccountLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/account/login`, {
      data,
      ...config,
    });
  },

  credentialBind(data: CredentialBindParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/credential/bind`, {
      data,
      ...config,
    });
  },

  credentialConfig(data: CredentialConfigParam, config?: AxiosRequestConfig) {
    return http.request<CredentialConfigDto>("post", `${USER_BASE_URL}/v1/auth/credential/config`, {
      data,
      ...config,
    });
  },

  credentialLogin(data: CredentialLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/credential/login`, {
      data,
      ...config,
    });
  },

  credentialStatus(data: CredentialStatusParam, config?: AxiosRequestConfig) {
    return http.request<CredentialStatusDto>("post", `${USER_BASE_URL}/v1/auth/credential/status`, {
      data,
      ...config,
    });
  },

  emergencyLogin(data: EmergencyLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/emergency/login`, {
      data,
      ...config,
    });
  },

  getCaptcha(data: CaptchaParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/captcha`, {
      data,
      ...config,
    });
  },

  getInfo(config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/info`, {
      ...config,
    });
  },

  logout(config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/logout`, {
      ...config,
    });
  },

  mfaLogin(data: MfaLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/mfa/login`, {
      data,
      ...config,
    });
  },

  opsConfig(data: OpsConfigParam, config?: AxiosRequestConfig) {
    return http.request<OpsConfigDto>("post", `${USER_BASE_URL}/v1/auth/ops/config`, {
      data,
      ...config,
    });
  },

  opsLogin(data: OpsLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/ops/login`, {
      data,
      ...config,
    });
  },

  permission(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<ModuleTreeDto[]>("post", `${USER_BASE_URL}/v1/auth/account/permission`, {
      data,
      ...config,
    });
  },

  register(data: RegisterParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/register`, {
      data,
      ...config,
    });
  },

  resetPassword(data: ResetPasswordParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/password/reset`, {
      data,
      ...config,
    });
  },

  sendSmsCaptcha(data: PhoneCaptchaParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/auth/phone/captcha`, {
      data,
      ...config,
    });
  },

  smsLogin(data: SmsLoginParam, config?: AxiosRequestConfig) {
    return http.request<UserAuthDto>("post", `${USER_BASE_URL}/v1/auth/phone/login`, {
      data,
      ...config,
    });
  },

  tokenLogin(data: TokenLoginParam, config?: AxiosRequestConfig) {
    return http.request<TokenDto>("post", `${USER_BASE_URL}/v1/auth/token/login`, {
      data,
      ...config,
    });
  },

  loadServerSettings(config?: AxiosRequestConfig) {
    return http.request<ServerSettingsDto>("post", `${USER_BASE_URL}/v1/auth/settings`, {
      ...config,
    });
  },
};

export default AuthAPI;

// ── Types ──────────────────────────────────────────────────────────────────

export interface AccountLoginParam {
  account: string;
  appVersion?: string;
  captcha?: string;
  password: string;
  rememberMe?: boolean;
  userAgent?: string;
}

export interface CaptchaParam {
  scene?: string;
}

export interface CredentialBindParam {
  account: string;
  appVersion?: string;
  captcha?: string;
  password: string;
  rememberMe?: boolean;
  tempToken: string;
  userAgent?: string;
}

export interface CredentialConfigDto {
  agentId?: string;
  appid?: string;
  redirectUri?: string;
  renderType?: "wxjs" | "oauth";
  scene?: string;
  state?: string;
}

export interface CredentialConfigParam {
  scene: string;
}

export interface CredentialLoginParam {
  appVersion?: string;
  credentialType: string;
  credentialValue: string;
  rememberMe?: boolean;
  state: string;
  userAgent?: string;
}

export interface CredentialStatusDto {
  code?: string;
  status?: string;
}

export interface CredentialStatusParam {
  scene: string;
  state: string;
}

export interface EmergencyLoginParam {
  account: string;
  appVersion?: string;
  rememberMe?: boolean;
  totpCode: string;
  userAgent?: string;
}

export interface IdParam {
  id: string;
}

export interface ModuleTreeDto {
  children?: ModuleTreeDto[];
  description?: string;
  icon?: string;
  id: string;
  menuName?: string;
  moduleCode?: string;
  moduleName?: string;
  moduleType?: string;
  params?: ModuleParam[];
  parentId?: string;
  path?: string;
  popup?: boolean;
  sortIdx?: number;
  url?: string;
  visible?: boolean;
}

export interface MfaLoginParam {
  appVersion?: string;
  rememberMe?: boolean;
  tempToken: string;
  totpCode: string;
  userAgent?: string;
}

export interface OpsConfigDto {
  qrCode?: string;
}

export interface OpsConfigParam {
  account: string;
  phone: string;
}

export interface OpsLoginParam {
  account: string;
  appVersion?: string;
  dynamicCode: string;
  phone: string;
  rememberMe?: boolean;
  userAgent?: string;
}

export interface PhoneCaptchaParam {
  captcha?: string;
  phone: string;
  scene: string;
}

export interface RegisterParam {
  instituteId: string;
  password: string;
  phone: string;
  realName?: string;
  smsCode: string;
  userName: string;
}

export interface ResetPasswordParam {
  newPassword: string;
  phone: string;
  smsCode: string;
}

export interface SmsLoginParam {
  appVersion?: string;
  phone: string;
  rememberMe?: boolean;
  smsCode: string;
  userAgent?: string;
}

export interface TokenDto {
  accessToken: string;
  expireTime: number;
  refreshToken: string;
}

export interface TokenLoginParam {
  appVersion?: string;
  currentRoleId?: string;
  refreshToken: string;
  rememberMe?: boolean;
  userAgent?: string;
}

export interface UserAuthDto {
  accessToken?: string;
  avatar?: string;
  currentRoleId?: string;
  email?: string;
  expireTime?: number;
  groupList?: GroupDto[];
  id: string;
  instituteId: string;
  instituteName?: string;
  phone?: string;
  realName?: string;
  referralCode?: string;
  refreshToken?: string;
  roleGroup?: string;
  roleList?: UserRoleDto[];
  serverTime?: string;
  status?: string;
  totpStatus?: string;
  userName?: string;
}

export interface GroupDto {
  deptId?: string;
  deptName?: string;
  groupName: string;
  id: string;
  instituteId?: string;
  instituteName?: string;
}

export interface ModuleParam {
  description?: string;
  enabled?: boolean;
  key: string;
  val: string;
}

export interface UserRoleDto {
  id: string;
  roleName: string;
}

export interface ServerSettingsDto {
  rsaPublicKey?: string;
  aesKey?: string;
  serverTimestamp?: number;
  loginModes?: string[];
  captchaEnabled?: boolean;
  tenantEnabled?: boolean;
}
