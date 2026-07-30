import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 日志记录
 */
const AdminLogsAPI = {
  /**
   * 事件记录：详情
   * @param data 事件记录ID
   */
  getEventRecordById(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<BizEventRecordDto>("post", `${USER_BASE_URL}/admin/v1/logs/event/info`, {
      data,
      ...config,
    });
  },

  /**
   * 事件记录：重试列表
   * @param data 事件记录ID
   */
  listEventByRetry(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<BizEventRetryDto[]>("post", `${USER_BASE_URL}/admin/v1/logs/event/retry/list`, {
      data,
      ...config,
    });
  },

  /**
   * 事件记录：分页
   * @param data 入参：业务事件记录查询
   */
  listEventRecords(data: BizEventRecordSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultBizEventRecordDto>("post", `${USER_BASE_URL}/admin/v1/logs/event/list`, {
      data,
      ...config,
    });
  },

  /**
   * 登录日志：详情
   * @param data 登录日志ID
   */
  logsByAuthInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<LogUserLoginDto>("post", `${USER_BASE_URL}/admin/v1/logs/auth/info`, {
      data,
      ...config,
    });
  },

  /**
   * 登录日志：列表
   * @param data 入参：登录日志查询
   */
  logsByAuthList(data: LogsAuthSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultLogUserLoginDto>("post", `${USER_BASE_URL}/admin/v1/logs/auth/list`, {
      data,
      ...config,
    });
  },

  /**
   * 变更日志：列表
   * @param data 入参：业务日志查询
   */
  logsByChangeList(data: LogsBusinessSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultLogBusinessChangeDto>("post", `${USER_BASE_URL}/admin/v1/logs/change/list`, {
      data,
      ...config,
    });
  },

  /**
   * 访问日志：列表
   * @param data 入参：业务日志查询
   */
  logsByOperationList(data: LogsBusinessSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultLogBusinessAccessDto>("post", `${USER_BASE_URL}/admin/v1/logs/access/list`, {
      data,
      ...config,
    });
  },

  /**
   * 在线用户：踢出
   * @param data 在线日志ID
   */
  onlineKickOut(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<boolean>("post", `${USER_BASE_URL}/admin/v1/logs/online/kick`, {
      data,
      ...config,
    });
  },

  /**
   * 在线用户：列表
   * @param data 入参：在线用户列表查询
   */
  onlineList(data: OnlineUserSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultLogUserOnlineDto>("post", `${USER_BASE_URL}/admin/v1/logs/online/list`, {
      data,
      ...config,
    });
  },

  /**
   * 事件记录：重试
   * @param data 事件记录ID
   */
  retryEvent(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/logs/event/retry`, {
      data,
      ...config,
    });
  },
};

export default AdminLogsAPI;

/**
 * 出参：业务事件记录
 */
export interface BizEventRecordDto {
  /** 业务数据 ID */
  businessId?: string;
  /** 数据所属企业 ID */
  businessInstituteId?: string;
  /** 业务子类 */
  businessSubType?: string;
  /** 业务数据的表名 */
  businessTable?: string;
  /** 业务类型（009） */
  businessType?: string;
  /** 变更数据 */
  changeData?: object;
  /** 变更字段 */
  changeFields?: string;
  /** 备注 */
  description?: string;
  /** 日志 ID */
  id: string;
  /** 操作内容 */
  operationContent?: object;
  /** 操作描述 */
  operationDesc?: string;
  /** 操作状态（同响应码） */
  operationStatus?: string;
  /** 操作时间 */
  operationTime?: string;
  /** 操作类型（010） */
  operationType?: string;
  /** 操作人 ID */
  operatorId?: string;
  /** 操作人所属企业 ID */
  operatorInstituteId?: string;
  /** 操作人姓名 */
  operatorName?: string;
  /** 重试次数 */
  retryCount?: number;
  /** 最后重试操作人 ID */
  retryOperatorId?: string;
  /** 最后重试操作人姓名 */
  retryOperatorName?: string;
  /** 最后重试时间 */
  retryTime?: string;
  /** 会话 ID */
  token?: string;
  /** 请求追踪 ID */
  traceId?: string;
}

/**
 * 入参：业务事件记录查询
 */
export interface BizEventRecordSearchParam {
  /** 业务数据 ID */
  businessId?: string;
  /** 数据所属企业 ID */
  businessInstituteId?: string;
  /** 业务子类 */
  businessSubType?: string;
  /** 业务类型（009） */
  businessType?: string;
  /** 操作时间终止 */
  operationTimeEnd?: string;
  /** 操作时间起始 */
  operationTimeStart?: string;
  /** 操作类型（010） */
  operationType?: string;
  /** 操作人 ID */
  operatorId?: string;
  /** 操作人所属企业 ID */
  operatorInstituteId?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 会话ID */
  token?: string;
}

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 业务事件重试记录 DTO
 */
export interface BizEventRetryDto {
  /** 业务数据 ID */
  businessId?: string;
  /** 数据所属企业 ID */
  businessInstituteId?: string;
  /** 备注 */
  description?: string;
  /** 日志 ID */
  id: string;
  /** 操作描述 */
  operationDesc?: string;
  /** 操作状态（同响应码） */
  operationStatus?: string;
  /** 操作时间 */
  operationTime?: string;
  /** 操作类型（010） */
  operationType?: string;
  /** 操作人 ID */
  operatorId?: string;
  /** 操作人所属企业 ID */
  operatorInstituteId?: string;
  /** 操作人姓名 */
  operatorName?: string;
  /** 记录 ID */
  recordId?: string;
  /** 会话 ID */
  token?: string;
  /** 请求追踪 ID */
  traceId?: string;
}

/**
 * 用户登录记录
 */
export interface LogUserLoginDto {
  /** 操作端KEY */
  appKey?: string;
  /** 应用平台ID */
  appModuleId?: string;
  /** 应用平台名称 */
  appModuleName?: string;
  /** 操作端名称 */
  appName?: string;
  /** 操作端版本 */
  appVersion?: string;
  /** 备注 */
  description?: string;
  /** 设备系统 */
  deviceOs?: string;
  /** 登录设备 */
  deviceSn?: string;
  /** UserAgent信息 */
  deviceUa?: string;
  /** 记录id */
  id: string;
  /** 所属企业ID */
  instituteId?: string;
  /** 登录地点 */
  loginAddress?: string;
  /** 登录IP */
  loginIp?: string;
  /** 登录模式 */
  loginMode?: string;
  /** 登录参数 */
  loginParam?: object;
  /** 登录状态（同响应码） */
  loginStatus?: string;
  /** 登录时间 */
  loginTime?: string;
  /** 退出信息 */
  logoutDesc?: string;
  /** 退出状态（同响应码） */
  logoutStatus?: string;
  /** 退出时间 */
  logoutTime?: string;
  /** 会话ID */
  token?: string;
  /** 请求追踪ID */
  traceId: string;
  /** 用户ID */
  userId?: string;
  /** 用户名 */
  userName?: string;
}

/**
 * 入参：登录日志查询
 */
export interface LogsAuthSearchParam {
  /** 操作端KEY */
  appKey?: string;
  /** 应用平台ID */
  appModuleId?: string;
  /** 操作端版本 */
  appVersion?: string;
  /** 设备序号 */
  deviceSn?: string;
  /** 所属企业ID */
  instituteId?: string;
  /** 登录地点 */
  loginAddress?: string;
  /** 登录IP */
  loginIp?: string;
  /** 登录状态（080） */
  loginStatus?: string;
  /** 登录时间终止 */
  loginTimeEnd?: string;
  /** 登录时间起始 */
  loginTimeStart?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 会话ID */
  token?: string;
  /** 用户ID */
  userId?: string;
  /** 用户名称（精确匹配） */
  userName?: string;
}

/**
 * 入参：业务日志查询
 */
export interface LogsBusinessSearchParam {
  /** 业务ID */
  businessId?: string;
  /** 业务类型（009） */
  businessType?: string;
  /** 所属企业ID */
  instituteId?: string;
  /** 操作时间终止 */
  operationTimeEnd?: string;
  /** 操作时间起始 */
  operationTimeStart?: string;
  /** 操作类型（010） */
  operationType?: string;
  /** 操作人ID */
  operatorId?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 会话ID */
  token?: string;
}

/**
 * 入参：在线用户列表查询
 */
export interface OnlineUserSearchParam {
  /** 应用平台ID（精确匹配） */
  appModuleId?: string;
  /** 所属企业ID（精确匹配） */
  instituteId?: string;
  /** 登录IP（精确匹配） */
  loginIp?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 用户名（模糊匹配） */
  userName?: string;
}

/**
 * 分页信息
 */
export interface PageResultBizEventRecordDto {
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
  result?: BizEventRecordDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultLogBusinessAccessDto {
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
  result?: LogBusinessAccessDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultLogBusinessChangeDto {
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
  result?: LogBusinessChangeDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultLogUserLoginDto {
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
  result?: LogUserLoginDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultLogUserOnlineDto {
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
  result?: LogUserOnlineDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 出参：业务数据访问记录
 */
export interface LogBusinessAccessDto {
  /** 访问条件 */
  accessCondition?: string;
  /** 访问IP */
  accessIp?: string;
  /** 访问时间 */
  accessTime?: string;
  /** 访问类型（010） */
  accessType?: string;
  /** 业务ID */
  businessId?: string;
  /** 业务子类 */
  businessSubType?: string;
  /** 业务类型（009） */
  businessType?: string;
  /** 备注 */
  description?: string;
  /** 记录id */
  id: string;
  /** 操作人ID */
  operatorId?: string;
  /** 操作人姓名 */
  operatorName?: string;
  /** 数据表名 */
  tableName?: string;
  /** 会话ID */
  token: string;
  /** 请求追踪ID */
  traceId: string;
}

/**
 * 出参：业务数据变更记录
 */
export interface LogBusinessChangeDto {
  /** 变更后数据 */
  afterData?: object;
  /** 变更前数据 */
  beforeData?: object;
  /** 业务ID */
  businessId?: string;
  /** 业务子类 */
  businessSubType?: string;
  /** 业务类型（009） */
  businessType?: string;
  /** 变更字段 */
  changeFields?: string;
  /** 备注 */
  description?: string;
  /** 记录id */
  id: string;
  /** 操作描述 */
  operationDesc?: string;
  /** 操作时间 */
  operationTime?: string;
  /** 操作类型（010） */
  operationType?: string;
  /** 操作人ID */
  operatorId?: string;
  /** 操作人姓名 */
  operatorName?: string;
  /** 数据表名 */
  tableName?: string;
  /** 会话ID */
  token: string;
  /** 请求追踪ID */
  traceId: string;
}

/**
 * 在线用户记录
 */
export interface LogUserOnlineDto {
  /** 操作端KEY */
  appKey?: string;
  /** 应用平台ID */
  appModuleId?: string;
  /** 应用平台名称 */
  appModuleName?: string;
  /** 操作端名称 */
  appName?: string;
  /** 操作端版本 */
  appVersion?: string;
  /** 首次登录时间 */
  createTime?: string;
  /** 备注 */
  description?: string;
  /** 设备系统 */
  deviceOs?: string;
  /** 登录设备 */
  deviceSn?: string;
  /** UserAgent信息 */
  deviceUa?: string;
  /** 日志ID */
  id: string;
  /** 所属企业ID */
  instituteId?: string;
  /** 登录地点 */
  loginAddress?: string;
  /** 登录IP */
  loginIp?: string;
  /** 最近登录/token刷新时间 */
  loginTime?: string;
  /** 会话ID（access_token） */
  token: string;
  /** 用户ID */
  userId: string;
  /** 用户名 */
  userName?: string;
}
