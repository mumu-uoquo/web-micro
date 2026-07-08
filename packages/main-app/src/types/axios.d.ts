/**
 * Axios 类型扩展
 *
 * 扩展 AxiosRequestConfig 支持自定义字段。
 */
import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** 跳过 token 刷新队列（用于 tokenLogin / 白名单接口） */
    _skipQueue?: boolean;
    /** 标记为重试请求（防止无限重试） */
    _retry?: boolean;
    /** 静默模式：接口错误由调用方处理，不触发全局提示 */
    silent?: boolean;
  }
}
