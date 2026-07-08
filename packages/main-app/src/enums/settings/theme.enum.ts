/**
 * 主题枚举
 */
export const enum ThemeMode {
  /**
   * 明亮主题
   */
  LIGHT = "light",
  /**
   * 暗黑主题
   */
  DARK = "dark",

  /**
   * 系统自动
   */
  AUTO = "auto",
}

/**
 * 侧边栏配色方案枚举
 */
export const enum SidebarColor {
  /**
   * 经典蓝
   */
  CLASSIC_BLUE = "classic-blue",
  /**
   * 极简白
   */
  MINIMAL_WHITE = "minimal-white",
}

/**
 * 水印模式枚举
 */
export const enum WatermarkMode {
  /**
   * 无水印
   */
  DISABLE = "disable",

  /**
   * 系统标题
   */
  TITLE = "title",

  /**
   * 账户信息
   */
  ACCOUNT = "account",

  /**
   * 账户+动态时间戳
   */
  ACCOUNT_TIME = "timestamp",
}
