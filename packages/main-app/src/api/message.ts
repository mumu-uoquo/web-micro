/**
 * 消息相关类型定义（供主应用 SSE 模块使用）
 * 完整消息 API 请使用 app-platform 子应用中的实现
 */

import type { AxiosRequestConfig } from "axios";
import { http } from "@/api/http";

const MSG_BASE_URL = "/health/api/platform";

/**
 * 消息 API（主应用使用，供 NoticeDropdown）
 */
const MessageAPI = {
  /**
   * 获取我的未读消息列表
   */
  listMyMessageByUnread(data: Record<string, unknown>, config?: AxiosRequestConfig) {
    return http.request<MsgInfoViewDto[]>("post", `${MSG_BASE_URL}/v1/message/my/unread`, {
      data,
      ...config,
    });
  },

  /**
   * 阅读消息
   */
  viewMessage(data: { id: string }, config?: AxiosRequestConfig) {
    return http.request<MsgInfoViewDto>("post", `${MSG_BASE_URL}/v1/message/view`, {
      data,
      ...config,
    });
  },
};

export default MessageAPI;

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
  /** 未读数（SSE 推送携带） */
  unreadCount?: number;
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
