import axios from 'axios'

// Global_State token 引用（由外部调用方注入）
let _getGlobalToken = null

/**
 * 注入 Global_State token 获取函数
 * 主应用在初始化时调用此函数，传入从 Global_State 读取 token 的方法
 * @param {() => string | null} fn
 */
export function setGlobalTokenGetter(fn) {
  _getGlobalToken = fn
}

/**
 * 创建 axios 实例工厂函数
 *
 * 请求拦截器：Global_State token 优先，其次 localStorage；无 token 时不添加 Authorization 头
 * 响应拦截器：HTTP 非 2xx 统一转为 rejected Promise；401 时清除 auth_token 并重定向 /login
 *
 * @param {{ baseURL?: string, timeout?: number }} config
 * @returns {import('axios').AxiosInstance}
 * @throws {Error} timeout 超出 100ms–60000ms 范围时抛出
 */
export function createRequest(config = {}) {
  const { baseURL = '', timeout = 10000 } = config

  if (timeout < 100 || timeout > 60000) {
    throw new Error('timeout 必须在 100ms ~ 60000ms 范围内')
  }

  const instance = axios.create({ baseURL, timeout })

  // 请求拦截器：注入 token（Global_State 优先于 localStorage）
  instance.interceptors.request.use(cfg => {
    const gsToken = _getGlobalToken ? _getGlobalToken() : null
    const lsToken = typeof localStorage !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null
    const token = gsToken || lsToken
    if (token) {
      cfg.headers['Authorization'] = `Bearer ${token}`
    }
    // 无 token 时不添加 Authorization 头，正常发送
    return cfg
  })

  // 响应拦截器：HTTP 非 2xx 统一转为 rejected Promise
  instance.interceptors.response.use(
    response => response.data,
    error => {
      const status = error.response?.status
      // 401：token 过期或无效，清除本地存储并重定向至登录页
      if (status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return instance
}
