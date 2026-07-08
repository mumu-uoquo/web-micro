import { http } from "@/api/http";
import type { TenantInfo } from "./types";

const TENANT_BASE_URL = "/api/v1/tenants";

/**
 * 租户 API（主应用使用，供 TenantStore）
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
   * @param tenantId 目标租户ID
   */
  switchTenant(tenantId: number) {
    return http.request<TenantInfo>("post", `${TENANT_BASE_URL}/${tenantId}/switch`);
  },
};

export default TenantAPI;

// 重导出类型
export * from "./types";
