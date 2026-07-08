/**
 * 应用常量定义
 *
 * @description
 * 包含应用中所有的常量定义，包括角色、存储键名等
 *
 * 存储键命名规范：
 * - 使用小写 + 冒号分隔 + 名称空间
 * - 格式：myapp:user:token
 * - 便于清理和避免冲突
 * - 当需要版本升级、兼容旧数据，可在 key 中加入版本如 myapp:v2:user:token。
 */

/**
 * 应用存储前缀
 */
export const APP_PREFIX = "uoquo";

/**
 * 超级管理员角色标识
 *
 * @description
 * 拥有系统最高权限，可以访问所有资源
 */
export const ROLE_ROOT = "ROOT";

// UOQUO扩展
export const ROOT_ROLE_ID = "34N7ZK5JENGWEKM1";

/**
 * 平台租户ID
 *
 * @description
 * 用于前端识别平台租户（不参与套餐/菜单配置）
 */
export const PLATFORM_TENANT_ID = 0;

/**
 * 存储键名常量
 *
 * @description
 * 统一管理所有 localStorage/sessionStorage 的键名
 * 命名规则：{APP_PREFIX}:{分类}:{具体名称}
 */
export const STORAGE_KEYS = {
  // ===== 认证相关 =====
  ACCESS_TOKEN: `${APP_PREFIX}:auth:access_token`,
  REFRESH_TOKEN: `${APP_PREFIX}:auth:refresh_token`,
  REMEMBER_ME: `${APP_PREFIX}:auth:remember_me`,

  // ===== 租户相关 =====
  TENANT_ID: `${APP_PREFIX}:tenant:id`,
  TENANT_INFO: `${APP_PREFIX}:tenant:info`,

  // ===== 系统相关 =====
  DICT_CACHE: `${APP_PREFIX}:system:dict_cache`,
  RETURN_CODE_CACHE: `${APP_PREFIX}:system:return_code_cache`,

  // ===== UI 设置 =====
  SHOW_TAGS_VIEW: `${APP_PREFIX}:ui:show_tags_view`,
  SHOW_APP_LOGO: `${APP_PREFIX}:ui:show_app_logo`,
  SHOW_WATERMARK: `${APP_PREFIX}:ui:show_watermark`,
  PAGE_SWITCHING_ANIMATION: `${APP_PREFIX}:ui:page_switching_animation`,
  LAYOUT: `${APP_PREFIX}:ui:layout`,
  SIDEBAR_COLOR_SCHEME: `${APP_PREFIX}:ui:sidebar_color_scheme`,
  THEME: `${APP_PREFIX}:ui:theme`,
  THEME_COLOR: `${APP_PREFIX}:ui:theme_color`,
  GRAY_MODE: `${APP_PREFIX}:ui:gray_mode`,
  COLOR_WEAK: `${APP_PREFIX}:ui:color_weak`,

  // ===== 应用状态 =====
  DEVICE: `${APP_PREFIX}:app:device`,
  SIZE: `${APP_PREFIX}:app:size`,
  LANGUAGE: `${APP_PREFIX}:app:language`,
  SIDEBAR_STATUS: `${APP_PREFIX}:app:sidebar_status`,
  ACTIVE_TOP_MENU_PATH: `${APP_PREFIX}:app:active_top_menu_path`,
} as const;

/**
 * 存储键名类型
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
