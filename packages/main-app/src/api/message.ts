import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";
export const USER_BASE_URL = "/health/api/platform";

/**
 * 消息管理
 */
const MessageAPI = {
  /**
   * 消息管理：新增消息
   * @param data 消息记录
   */
  addMessage(data: MsgInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/manage/add`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：新增
   * @param data 消息模板
   */
  addTemplateInfo(data: MsgTemplateInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/template/add`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：删除
   * @param data 消息ID
   */
  deleteMessage(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/manage/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：删除（全部）
   */
  deleteMessageAll(config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/delete/all`, {
      ...config,
    });
  },

  /**
   * 消息处理：删除（批量）
   * @param data 消息标记
   */
  deleteMessageBatch(data: MsgInfoMarkParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/delete/batch`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：删除（单条）
   * @param data 消息标记
   */
  deleteMessageOne(data: MsgInfoMarkParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/delete/one`, {
      data,
      ...config,
    });
  },

  /**
   * 消息详情：删除接收人
   * @param data 消息记录列表查询
   */
  deleteReceiver4Message(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/manage/info/receivers/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：删除
   * @param data 模板ID
   */
  deleteTemplateInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/template/delete`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：下载附件
   * @param data 附件ID
   */
  downloadAttachment(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<any>("post", `${USER_BASE_URL}/v1/message/view/attachment/download`, {
      data,
      ...config,
      responseType: "blob",
    });
  },

  /**
   * 消息详情：详情查询
   * @param data 消息ID
   */
  getMessage(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<MsgInfoDto>("post", `${USER_BASE_URL}/v1/message/manage/info`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：详情查询
   * @param data 模板ID
   */
  getTemplateInfo(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<MsgTemplateDto>("post", `${USER_BASE_URL}/v1/message/template/info`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：我的未读
   * @param data 消息记录列表查询
   */
  listMyMessageByUnread(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<MsgInfoViewDto[]>("post", `${USER_BASE_URL}/v1/message/view/list/unread`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：我收到的
   * @param data 消息记录列表查询
   */
  listMyReceiveMessageByPage(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgInfoViewDto>("post", `${USER_BASE_URL}/v1/message/view/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：我发布的
   * @param data 消息记录列表查询
   */
  listMySendMessageByPage(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgInfoDto>("post", `${USER_BASE_URL}/v1/message/manage/list/sent/page`, {
      data,
      ...config,
    });
  },

  /**
   * 消息详情：推送日志查询
   * @param data 消息记录列表查询
   */
  listPushLogByMessageId(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgPushLogDto>("post", `${USER_BASE_URL}/v1/message/manage/info/push/logs`, {
      data,
      ...config,
    });
  },

  /**
   * 消息详情：收件列表
   * @param data 消息记录列表查询
   */
  listReceiverByMessageId(data: MsgInfoListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgReceiverDto>("post", `${USER_BASE_URL}/v1/message/manage/info/receivers`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：列表查询
   * @param data 消息模板列表查询
   */
  listTemplateByPage(data: MsgTemplateListParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgTemplateDto>("post", `${USER_BASE_URL}/v1/message/template/list/page`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：按类型查询
   * @param data 消息模板列表查询
   */
  listTemplateByType(data: MsgTemplateListParam, config?: AxiosRequestConfig) {
    return http.request<MsgTemplateDto[]>("post", `${USER_BASE_URL}/v1/message/template/list/type`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：标记为处理（全部）
   */
  markMessageProcessAll(config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/process/all`, {
      ...config,
    });
  },

  /**
   * 消息处理：标记为处理（批量）
   * @param data 消息标记
   */
  markMessageProcessBatch(data: MsgInfoMarkParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/process/batch`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：处理（单条）
   * @param data 消息标记
   */
  markMessageProcessOne(data: MsgInfoMarkParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/process/one`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：标记为已读（全部）
   */
  markMessageReadAll(config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/read/all`, {
      ...config,
    });
  },

  /**
   * 消息处理：标记为已读（批量）
   * @param data 消息标记
   */
  markMessageReadBatch(data: MsgInfoMarkParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/read/batch`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：标记为已读（单条）
   * @param data 消息标记
   */
  markMessageReadOne(data: MsgInfoMarkParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/view/read/one`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：发布
   * @param data 消息记录
   */
  publishMessage(data: MsgInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/manage/publish`, {
      data,
      ...config,
    });
  },

  /**
   * 消息详情：消息重推
   * @param data 推送日志ID
   */
  retryPushByLogId(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/manage/info/retry/push`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：搜索发布目标
   * @param data 发布目标搜索
   */
  searchReceiverByRange(data: MsgReceiverSearchParam, config?: AxiosRequestConfig) {
    return http.request<PageResultMsgReceiverSearchDto>("post", `${USER_BASE_URL}/v1/message/manage/receiver/search`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：修改
   * @param data 消息记录
   */
  updateMessage(data: MsgInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/manage/update`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：更新默认模板
   * @param data 模板ID
   */
  updateTemplate2Default(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/template/update/defaulted`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：修改
   * @param data 消息模板
   */
  updateTemplateInfo(data: MsgTemplateInfoParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/template/update`, {
      data,
      ...config,
    });
  },

  /**
   * 消息模板：更新状态
   * @param data 消息模板状态更新
   */
  updateTemplateState(data: MsgTemplateStatusParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/template/update/status`, {
      data,
      ...config,
    });
  },

  /**
   * 消息处理：详情查看
   * @param data 消息ID
   */
  viewMessage(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<MsgInfoViewDto>("post", `${USER_BASE_URL}/v1/message/view/info`, {
      data,
      ...config,
    });
  },

  /**
   * 消息管理：撤回
   * @param data 消息ID
   */
  withdrawMessage(data: IdParam, config?: AxiosRequestConfig) {
    return http.request<string>("post", `${USER_BASE_URL}/v1/message/manage/withdraw`, {
      data,
      ...config,
    });
  },
};

export default MessageAPI;

/**
 * ID信息
 */
export interface IdParam {
  /** 主键 */
  id: string;
}

/**
 * 消息记录查看
 */
export interface MsgInfoViewDto {
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
  /** 备注 */
  description?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 消息内容 */
  messageContent: string;
  /** 消息ID */
  messageId: string;
  /** 消息级别（008） */
  messageLevel: string;
  /** 消息标题 */
  messageTitle: string;
  /** 消息分类（020） */
  messageType: string;
  /** 处理结果 */
  processedResult?: string;
  /** 是否处理 */
  processedState?: boolean;
  /** 处理时间 */
  processedTime?: string;
  /** 推送方式（021） */
  pushWay?: string;
  /** 是否已读 */
  readState?: boolean;
  /** 阅读时间 */
  readTime?: string;
  /** 接收人ID */
  receiverId?: string;
  /** 接收人姓名 */
  receiverName?: string;
  /** 消息接收ID */
  recordId: string;
  /** 发送人头像 */
  senderAvatar?: string;
  /** 发送人ID */
  senderId?: string;
  /** 发送人名称 */
  senderName?: string;
  /** 发送时间 */
  senderTime?: string;
}

/**
 * 消息模板
 */
export interface MsgTemplateDto {
  /** 内容模板 */
  contentTemplate?: string;
  /** 创建时间 */
  createTime?: string;
  /** 是否默认 */
  defaulted?: boolean;
  /** 备注 */
  description?: string;
  /** 模板ID */
  id: string;
  /** 消息分类（020） */
  messageType?: string;
  /** 推送方式（021） */
  pushWay?: string;
  /** 可用状态（001） */
  status?: string;
  /** 状态备注 */
  statusMemo?: string;
  /** 状态时间 */
  statusTime?: string;
  /** 模板编码 */
  templateCode?: string;
  /** 模板名称 */
  templateName?: string;
  /** 标题模板 */
  titleTemplate?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 变量说明 */
  variables?: MsgTemplateVariable[];
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
 * 消息标记
 */
export interface MsgInfoMarkParam {
  /** 备注描述 */
  description?: string;
  /** 消息ID */
  messageId?: string;
  /** 记录ID集合 */
  recordIds?: string[];
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
 * 消息模板
 */
export interface MsgTemplateInfoParam {
  /** 内容模板 */
  contentTemplate?: string;
  /** 是否默认 */
  defaulted?: boolean;
  /** 备注 */
  description?: string;
  /** 模板ID */
  id?: string;
  /** 消息分类（020） */
  messageType?: string;
  /** 推送方式（021） */
  pushWay?: string;
  /** 可用状态（001） */
  status?: string;
  /** 模板编码 */
  templateCode?: string;
  /** 模板名称 */
  templateName?: string;
  /** 标题模板 */
  titleTemplate?: string;
  /** 变量说明 */
  variables?: MsgTemplateVariable[];
}

/**
 * 消息模板列表查询
 */
export interface MsgTemplateListParam {
  /** 结束时间 */
  createTimeEnd?: string;
  /** 起始时间 */
  createTimeStart?: string;
  /** 是否默认 */
  defaulted?: boolean;
  /** 消息分类（020） */
  messageType?: string;
  /** 当前页码（从1开始） */
  pageNum?: number;
  /** 每页数量（默认10条） */
  pageSize?: number;
  /** 推送方式（021） */
  pushWay?: string;
  /** 可用状态（001） */
  status?: string;
  /** 模板编码 */
  templateCode?: string;
  /** 模板名称 */
  templateName?: string;
}

/**
 * 消息模板状态更新
 */
export interface MsgTemplateStatusParam {
  /** 模板ID */
  id: string;
  /** 可用状态（001） */
  status: string;
  /** 状态备注 */
  statusMemo?: string;
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
export interface PageResultMsgInfoViewDto {
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
  result?: MsgInfoViewDto[];
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
 * 分页信息
 */
export interface PageResultMsgTemplateDto {
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
  result?: MsgTemplateDto[];
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

/**
 * 模板变量对象
 */
export interface MsgTemplateVariable {
  /** 说明 */
  description?: string;
  /** 名称 */
  name?: string;
}
