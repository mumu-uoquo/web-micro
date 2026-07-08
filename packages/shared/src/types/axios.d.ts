import 'axios'

// 扩展 Axios 配置类型，添加自定义标记
declare module 'axios' {
  interface AxiosRequestConfig {
    /** 是否静默（不弹全局提示） */
    silent?: boolean
    /** 是否重试（用于 token 刷新后自动重试） */
    _retry?: boolean
    /** 是否跳过请求队列（用于登录等白名单接口） */
    _skipQueue?: boolean
  }
}
