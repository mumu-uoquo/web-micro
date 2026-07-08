import { createHttpInstance } from '@web-micro/shared'
import type { UserStoreAdapter } from '@web-micro/shared'
import { useUserStore } from '@/stores'

/**
 * main-app 的 UserStore 适配器
 * 将 Pinia useUserStore().refreshToken() 包装为 UserStoreAdapter 接口
 */
const userStoreAdapter: UserStoreAdapter = {
  refreshToken: () => useUserStore().refreshToken(),
}

/**
 * main-app 全局 HTTP 实例
 *
 * 通过 createHttpInstance 工厂函数创建，注入 userStore 适配器以支持
 * Token 自动刷新队列机制。
 *
 * Requirements: 2.2, 3.4
 */
export const http = createHttpInstance(
  {
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 15000,
  },
  userStoreAdapter,
)

export default http
