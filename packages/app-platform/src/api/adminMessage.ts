import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 超管消息管理
 */
const AdminMessageAPI = {
  /**
   * 消息管理：新增消息
   * @param data 消息记录
   */
  addMessage(data: MsgInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/message/add`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：删除
   * @param data 消息ID
   */
  deleteMessage(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/message/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 消息详情：删除接收人
   * @param data 消息记录列表查询
   */
  deleteReceiver4Message(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/message/info/receivers/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：下载附件
   * @param data 附件ID
   */
  downloadAttachment(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<any>("post", `${USER_BASE_URL}/admin/v1/message/attachment/download`, {
      data,
      ...config,
      responseType: "blob",
    });
  },

  /**
   * 消息管理：详情查询
   * @param data 消息ID
   */
  getMessage(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<MsgInfoDto>("post", `${USER_BASE_URL}/admin/v1/message/info`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：列表查询
   * @param data 消息记录列表查询
   */
  listMessageInfoByPage(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgInfoDto>("post", `${USER_BASE_URL}/admin/v1/message/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 消息详情：推送日志
   * @param data 消息记录列表查询
   */
  listPushLogByMessageId(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgPushLogDto>("post", `${USER_BASE_URL}/admin/v1/message/info/push/logs`, {
      data,
      ...config,
    });
  },

  /**
   * 消息详情：收件列表
   * @param data 消息记录列表查询
   */
  listReceiverByMessageId(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgReceiverDto>("post", `${USER_BASE_URL}/admin/v1/message/info/receivers`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：发布
   * @param data 消息记录
   */
  publishMessage(data: MsgInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/message/publish`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：搜索发布目标
   * @param data 发布目标搜索
   */
  searchReceiverByRange(data: MsgReceiverSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgReceiverSearchDto>("post", `${USER_BASE_URL}/admin/v1/message/receiver/search`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：修改
   * @param data 消息记录
   */
  updateMessage(data: MsgInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/message/update`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：撤回
   * @param data 消息ID
   */
  withdrawMessage(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/admin/v1/message/withdraw`, {
      data,
      ...config,
    });
  },
};

export default AdminMessageAPI;

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 消息记录
 */
export interface MsgInfoDto {
  /** 附件列表 */
  attachments?: MsgAttachmentDto[];
  /** 业务扩展 */
  businessExtend?: object;
  /** 业务ID */
  businessId?: string;
  /** 业务类型（009） */
  businessType?: string;
  /** 创建时间 */
  createTime?: string;
  /** 创建人 */
  createUser?: string;
  /** 创建人名称 */
  createUserName?: string;
  /** 备注 */
  description?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 消息ID */
  id: string;
  /** 消息内容 */
  messageContent: string;
  /** 消息级别（008） */
  messageLevel: string;
  /** 消息标题 */
  messageTitle: string;
  /** 消息分类（020） */
  messageType: string;
  /** 推送方式（021） */
  pushWay?: string;
  /** 接收人ID列表（为空表示全员） */
  receiverIds?: string;
  /** 目标所属机构 */
  receiverInstituteId?: string;
  /** 目标所属机构名称 */
  receiverInstituteName?: string;
  /** 发布范围（024） */
  receiverRange?: string;
  /** 发送人ID */
  senderId?: string;
  /** 发送人名称 */
  senderName?: string;
  /** 发送时间 */
  senderTime?: string;
  /** 发布状态（023） */
  status?: string;
  /** 状态备注 */
  statusMemo?: string;
  /** 状态时间 */
  statusTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 更新人 */
  updateUser?: string;
  /** 更新人名称 */
  updateUserName?: string;
}

/**
 * 消息记录列表查询
 */
export interface MsgInfoListParam {
  /** 业务类型（009） */
  businessType?: string;
  /** 创建结束时间 */
  createTimeEnd?: string;
  /** 创建起始时间 */
  createTimeStart?: string;
  /** 创建人 */
  createUser?: string;
  /** 过期结束时间 */
  expireTimeEnd?: string;
  /** 过期起始时间 */
  expireTimeStart?: string;
  /** 消息内容 */
  messageContent?: string;
  /** 消息ID */
  messageId?: string;
  /** 消息级别（008） */
  messageLevel?: string;
  /** 消息标题 */
  messageTitle?: string;
  /** 消息分类（020） */
  messageType?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 是否处理 */
  processedState?: boolean;
  /** 推送方式（021） */
  pushWay?: string;
  /** 是否已读 */
  readState?: boolean;
  /** 接收人ID */
  receiverId?: string;
  /** 发送结束时间 */
  senderTimeEnd?: string;
  /** 发送起始时间 */
  senderTimeStart?: string;
  /** 发布状态（023） */
  status?: string;
}

/**
 * 消息记录
 */
export interface MsgInfoParam {
  /** 附件列表 */
  attachments?: MsgAttachmentParam[];
  /** 业务扩展 */
  businessExtend?: object;
  /** 业务ID */
  businessId?: string;
  /** 业务类型（009） */
  businessType?: string;
  /** 备注 */
  description?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 消息ID */
  id?: string;
  /** 消息内容 */
  messageContent: string;
  /** 消息级别（008） */
  messageLevel: string;
  /** 消息标题 */
  messageTitle: string;
  /** 消息分类（020） */
  messageType: string;
  /** 推送方式（021） */
  pushWay: string;
  /** 目标ID集合 */
  receiverIds?: string;
  /** 目标所属机构ID */
  receiverInstituteId?: string;
  /** 目标所属机构名称 */
  receiverInstituteName?: string;
  /** 发布范围（024） */
  receiverRange?: string;
  /** 发布状态（023） */
  status?: string;
  /** 模板ID */
  templateId?: string;
}

/**
 * 发布目标搜索
 */
export interface MsgReceiverSearchParam {
  /** 所属机构 */
  instituteId?: string;
  /** 关键字 */
  keywords?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 发布范围（024） */
  receiverRange: string;
}

/**
 * 分页信息
 */
export interface PageResultMsgInfoDto {
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
  result?: MsgInfoDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultMsgPushLogDto {
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
  result?: MsgPushLogDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultMsgReceiverDto {
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
  result?: MsgReceiverDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 分页信息
 */
export interface PageResultMsgReceiverSearchDto {
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
  result?: MsgReceiverSearchDto[];
  /** 当前页数量 */
  size?: number;
  /** 总数据量 */
  total?: number;
}

/**
 * 消息附件
 */
export interface MsgAttachmentDto {
  /** 创建时间 */
  createTime?: string;
  /** 下载次数 */
  downloadCount?: number;
  /** 文件MD5 */
  fileMd5?: string;
  /** 文件名 */
  fileName: string;
  /** 文件相对路径（含文件名） */
  filePath: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 文件类型 */
  fileType?: string;
  /** 附件ID */
  id: string;
  /** 消息ID */
  messageId?: string;
  /** 文件显示路径（含文件名） */
  showPath: string;
}

/**
 * 消息附件
 */
export interface MsgAttachmentParam {
  /** 文件MD5 */
  fileMd5?: string;
  /** 文件名 */
  fileName?: string;
  /** 文件相对路径（含文件名） */
  filePath?: string;
  /** 文件大小（字节） */
  fileSize?: number;
  /** 文件类型 */
  fileType?: string;
  /** 附件ID */
  id?: string;
  /** 消息ID */
  messageId?: string;
  /** 文件上传码 */
  uploadCode?: string;
}

/**
 * 消息推送日志
 */
export interface MsgPushLogDto {
  /** 创建时间 */
  createTime?: string;
  /** 备注 */
  description?: string;
  /** 日志ID */
  id: string;
  /** 消息ID */
  messageId?: string;
  /** 推送结果 */
  pushResult?: string;
  /** 推送状态（022） */
  pushStatus?: string;
  /** 推送时间 */
  pushTime?: string;
  /** 推送方式（021） */
  pushWay?: string;
  /** 接收人ID */
  receiverId?: string;
  /** 接收人姓名 */
  receiverName?: string;
  /** 重试次数 */
  retryCount?: number;
}

/**
 * 消息接收
 */
export interface MsgReceiverDto {
  /** 创建时间 */
  createTime?: string;
  /** 删除标识 */
  deleteState?: number;
  /** 备注 */
  description?: string;
  /** 主键ID */
  id: string;
  /** 消息ID */
  messageId?: string;
  /** 处理结果 */
  processedResult?: string;
  /** 是否处理 */
  processedState?: boolean;
  /** 处理时间 */
  processedTime?: string;
  /** 是否已读 */
  readState?: boolean;
  /** 阅读时间 */
  readTime?: string;
  /** 接收人ID */
  receiverId?: string;
  /** 接收人姓名 */
  receiverName?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 更新人 */
  updateUser?: string;
}

/**
 * 发布目标记录
 */
export interface MsgReceiverSearchDto {
  /** 主键ID */
  id?: string;
  /** 显示名称 */
  name?: string;
}
