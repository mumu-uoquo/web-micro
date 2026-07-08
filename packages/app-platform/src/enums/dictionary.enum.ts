/**
 * 字典枚举（只留代码中写死的部分）
 * 迁移自 web-monolith/src/enums/system/dictionary.enum.ts
 */
export const enum DictionaryEnum {
  /** ********** 001 可用状态（通用） ********** **/
  STATE = "001",
  STATE_NORMAL = "001001",
  STATE_DISABLE = "001002",

  /** ********** 002 密码强度 ********** **/
  PASSWORD_WEAK = "002003",
  PASSWORD_MIDDLE = "002006",
  PASSWORD_STRONG = "002009",

  /** ********** 003 作用范围 ********** **/
  ROLE_TYPE_INNER = "003001",
  ROLE_TYPE_NORMAL = "003002",
  ROLE_TYPE_PRIVATE = "003003",

  /** ********** 004 角色分组 ********** **/
  ROLE_GROUP = "004",
  ROLE_GROUP_NORMAL = "004002",

  /** ********** 005 模块类型 ********** **/
  MODULE_TYPE_MENU = "005001",
  MODULE_TYPE_BUTTON = "005002",

  /** ********** 006 模板类型 ********** **/
  TEMPLATE_TYPE_NONE = "006001",
  TEMPLATE_TYPE_INNER = "006002",
  TEMPLATE_TYPE_SYSTEM = "006003",
  TEMPLATE_TYPE_NORMAL = "006010",

  /** ********** 007 日期类型 ********** **/
  DAY_TYPE = "007",
  DAY_TYPE_WORKDAY = "007001",
  DAY_TYPE_HOLIDAY = "007002",
  DAY_TYPE_WEEKEND = "007003",

  /** ********** 008 优先级别 ********** **/
  PRIOR_LEVEL = "008",
  PRIOR_LEVEL_NORMAL = "008030",

  /** ********** 009 业务类型 ********** **/
  BUSINESS_TYPE = "009",

  /** ********** 010 操作类型 ********** **/
  OPERATION_TYPE = "010",

  /** ********** 020 消息分类 ********** **/
  MESSAGE_CATEGORY = "020",
  MESSAGE_CATEGORY_NOTICE = "020001",
  MESSAGE_CATEGORY_SYSTEM = "020002",
  MESSAGE_CATEGORY_TODO = "020003",

  /** ********** 021 推送方式 ********** **/
  PUSH_WAY = "021",
  PUSH_WAY_UNLIMITED = "021001",
  PUSH_WAY_SMS = "021003",

  /** ********** 023 发布状态 ********** **/
  PUSH_STATUS = "023",
  PUSH_STATUS_WAITING = "023001",
  PUSH_STATUS_PUBLISH = "023002",

  /** ********** 024 发布范围 ********** **/
  PUSH_RANGE = "024",
  PUSH_RANGE_ALL = "024001",

  /** ********** 120 企业类型 ********** **/
  INSTITUTE_TYPE = "120",
  INSTITUTE_TYPE_NORMAL = "120002",

  /** ********** 121 企业状态 ********** **/
  INSTITUTE_STATUS = "121",
  INSTITUTE_STATUS_NORMAL = "121060",
  INSTITUTE_STATUS_DISABLE = "121070",
}
