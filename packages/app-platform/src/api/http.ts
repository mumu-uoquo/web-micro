import { createHttpInstance } from '@web-micro/shared'

// Sub_App 不直接刷新 token，委托给主应用通过 Global_State 下发
export const http = createHttpInstance(
  {
    baseURL: import.meta.env.VITE_APP_BASE_API,
    timeout: 15000,
  },
  {
    refreshToken: () => Promise.reject(new Error('Sub_App 不直接刷新 token')),
  },
)

export default http
