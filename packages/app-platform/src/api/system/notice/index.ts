import { http } from "@/api/http";
import type { NoticeQueryParams, NoticeForm, NoticeItem, NoticeDetail } from "./types";

const NOTICE_BASE_URL = "/api/v1/notices";

const NoticeAPI = {
  /** 获取通知公告分页数据 */
  getPage(queryParams?: NoticeQueryParams) {
    return http.request<PageResult<NoticeItem>>("get", `${NOTICE_BASE_URL}`, {
      params: queryParams,
    });
  },
  /** 获取通知公告表单数据 */
  getFormData(id: string) {
    return http.request<NoticeForm>("get", `${NOTICE_BASE_URL}/${id}/form`);
  },
  /** 添加通知公告 */
  create(data: NoticeForm) {
    return http.request<string>("post", `${NOTICE_BASE_URL}`, { data });
  },
  /** 更新通知公告 */
  update(id: string, data: NoticeForm) {
    return http.request<string>("put", `${NOTICE_BASE_URL}/${id}`, { data });
  },
  /** 批量删除通知公告，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return http.request<string>("delete", `${NOTICE_BASE_URL}/${ids}`);
  },
  /** 发布通知 */
  publish(id: string) {
    return http.request<string>("put", `${NOTICE_BASE_URL}/${id}/publish`);
  },
  /** 撤回通知 */
  revoke(id: string) {
    return http.request<string>("put", `${NOTICE_BASE_URL}/${id}/revoke`);
  },
  /** 查看通知 */
  getDetail(id: string) {
    return http.request<NoticeDetail>("get", `${NOTICE_BASE_URL}/${id}/detail`);
  },
  /** 全部已读 */
  readAll() {
    return http.request<string>("put", `${NOTICE_BASE_URL}/read-all`);
  },
  /** 获取我的通知分页列表 */
  getMyNoticePage(queryParams?: NoticeQueryParams) {
    return http.request<PageResult<NoticeItem>>("get", `${NOTICE_BASE_URL}/my`, {
      params: queryParams,
    });
  },
};

export default NoticeAPI;

// 重导出类型
export * from "./types";
