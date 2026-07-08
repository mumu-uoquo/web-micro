/**
 * 响应码枚举
 */
export const enum ResultEnum {
  /**
   * 成功
   */
  SUCCESS = "00000",

  /**
   * 系统错误
   */
  SYSTEM_ERROR = "01500",

  /**
   * 签名参数为空（需回到登录页面）
   */
  PARAM_SIGN_EMPTY = "02001",

  /**
   * 令牌为空（需回到登录页面）
   */
  TOKEN_EMPTY = "02005",

  /**
   * 令牌无效或过期（需尝试刷新令牌）
   */
  TOKEN_INVALID = "02006",

  /**
   * 账户未登录（需回到登录页面）
   */
  NOT_LOGIN = "02020",

  /**
   * 异地登录强制退出（需回到登录页面）
   */
  TOKEN_KICK_OUT = "02021",
}
