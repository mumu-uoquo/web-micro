/**
 * 字典枚举（只留代码中写死的部分）
 */
export const enum DictionaryEnum {
  /** ********** 001 可用状态（通用） ********** **/
  STATE = "001",
  // 正常
  STATE_NORMAL = "001001",
  // 停用
  STATE_DISABLE = "001002",

  /** ********** 002 密码强度 ********** **/
  // 弱
  PASSWORD_WEAK = "002003",
  // 中
  PASSWORD_MIDDLE = "002006",
  // 强
  PASSWORD_STRONG = "002009",

  /** ********** 003 作用范围 ********** **/
  // 内置
  ROLE_TYPE_INNER = "003001",
  // 通用
  ROLE_TYPE_NORMAL = "003002",
  // 私有
  ROLE_TYPE_PRIVATE = "003003",

  /** ********** 004 角色分组 ********** **/
  ROLE_GROUP = "004",
  // 常规
  ROLE_GROUP_NORMAL = "004002",

  /** ********** 005 模块类型 ********** **/
  // 菜单
  MODULE_TYPE_MENU = "005001",
  // 按钮
  MODULE_TYPE_BUTTON = "005002",

  /** ********** 006 模板类型 ********** **/
  // 不是模板
  TEMPLATE_TYPE_NONE = "006001",
  // 内置模板
  TEMPLATE_TYPE_INNER = "006002",
  // 系统模板
  TEMPLATE_TYPE_SYSTEM = "006003",
  // 普通模板
  TEMPLATE_TYPE_NORMAL = "006010",

  /** ********** 007 日期类型 ********** **/
  DAY_TYPE = "007",
  // 工作日
  DAY_TYPE_WORKDAY = "007001",
  // 节假日
  DAY_TYPE_HOLIDAY = "007002",
  // 周六日
  DAY_TYPE_WEEKEND = "007003",

  /** ********** 008 优先级别 ********** **/
  PRIOR_LEVEL = "008",
  // 一般
  PRIOR_LEVEL_NORMAL = "008030",

  /** ********** 009 业务类型 ********** **/
  BUSINESS_TYPE = "009",

  /** ********** 010 操作类型 ********** **/
  OPERATION_TYPE = "010",

  /** ********** 020 消息分类 ********** **/
  MESSAGE_CATEGORY = "020",
  // 通知公告
  MESSAGE_CATEGORY_NOTICE = "020001",
  // 系统消息
  MESSAGE_CATEGORY_SYSTEM = "020002",
  // 待办任务
  MESSAGE_CATEGORY_TODO = "020003",

  /** ********** 021 推送方式 ********** **/
  PUSH_WAY = "021",
  // 不限
  PUSH_WAY_UNLIMITED = "021001",
  // 短信
  PUSH_WAY_SMS = "021003",

  /** ********** 023 发布状态 ********** **/
  PUSH_STATUS = "023",
  // 待发布
  PUSH_STATUS_WAITING = "023001",
  // 已发布
  PUSH_STATUS_PUBLISH = "023002",

  /** ********** 024 发布范围 ********** **/
  PUSH_RANGE = "024",
  // 所有人员
  PUSH_RANGE_ALL = "024001",

  /** ********** 120 企业类型 ********** **/
  INSTITUTE_TYPE = "120",
  // 常规
  INSTITUTE_TYPE_NORMAL = "120002",

  /** ********** 121 企业状态 ********** **/
  INSTITUTE_STATUS = "121",
  // 正常
  INSTITUTE_STATUS_NORMAL = "121060",
  // 停用
  INSTITUTE_STATUS_DISABLE = "121070",
}
