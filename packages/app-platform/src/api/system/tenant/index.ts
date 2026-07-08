import { http } from "@/api/http";
import type {
  TenantCreateForm,
  TenantForm,
  TenantInfo,
  TenantCreateResult,
  TenantQueryParams,
  TenantItem,
} from "./types";

const TENANT_BASE_URL = "/api/v1/tenants";

/**
 * 租户信息
 */

const TenantAPI = {
  /**
   * 获取当前用户可访问的租户列表
   */
  getTenantList() {
    return http.request<TenantInfo[]>("get", `${TENANT_BASE_URL}/options`);
  },

  /**
   * 获取当前租户信息
   */
  getCurrentTenant() {
    return http.request<TenantInfo>("get", `${TENANT_BASE_URL}/current`);
  },

  /**
   * 切换租户
   *
   * @param tenantId 目标租户ID
   */
  switchTenant(tenantId: number) {
    return http.request<TenantInfo>("post", `${TENANT_BASE_URL}/${tenantId}/switch`);
  },

  /** 获取租户分页数据（平台租户管理） */
  getPage(queryParams?: TenantQueryParams) {
    return http.request<PageResult<TenantItem>>("get", `${TENANT_BASE_URL}`, {
      params: queryParams,
    });
  },

  /** 获取租户表单数据 */
  getFormData(tenantId: string) {
    return http.request<TenantForm>("get", `${TENANT_BASE_URL}/${tenantId}/form`);
  },

  /** 新增租户并初始化默认数据 */
  create(data: TenantCreateForm) {
    return http.request<TenantCreateResult>("post", `${TENANT_BASE_URL}`, {
      data,
    });
  },

  /** 修改租户 */
  update(tenantId: string, data: TenantForm) {
    return http.request<TenantCreateResult>("put", `${TENANT_BASE_URL}/${tenantId}/form`, {
      data,
    });
  },

  /** 删除租户（批量） */
  deleteByIds(ids: string) {
    return http.request<TenantCreateResult>("delete", `${TENANT_BASE_URL}/${ids}`);
  },

  /** 修改租户状态 */
  updateStatus(tenantId: string, status: number) {
    return http.request<TenantCreateResult>("put", `${TENANT_BASE_URL}/${tenantId}/status`, {
      params: { status },
    });
  },

  /** 获取租户菜单ID集合 */
  getTenantMenuIds(tenantId: number) {
    return http.request<number[]>("get", `${TENANT_BASE_URL}/${tenantId}/menuIds`);
  },

  /** 更新租户菜单 */
  updateTenantMenus(tenantId: number, menuIds: number[]) {
    return http.request<TenantCreateResult>("put", `${TENANT_BASE_URL}/${tenantId}/menus`, {
      data: menuIds,
    });
  },
};

export default TenantAPI;

// 重导出类型
export * from "./types";
