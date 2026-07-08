/**
 * API 通用类型定义
 */

/**
 * 通用 API 响应结构
 */
export interface ApiResponse<T = any> {
  /** 响应状态码 */
  status: string;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message: string;
}

/**
 * 基础分页查询参数
 */
export interface BaseQueryParams {
  /** 页码 */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
}

/**
 * 分页结果
 */
export interface PageResult<T> {
  /** 数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 当前页条数 */
  size?: number;
}

/**
 * 下拉选项类型
 */
export interface OptionItem {
  /** 显示标签 */
  label: string;
  /** 选项值 */
  value: string | number;
  /** 扩展字段 */
  [key: string]: any;
}

/**
 * Excel 导入结果
 */
export interface ExcelResult {
  /** 成功条数 */
  successCount: number;
  /** 失败条数 */
  failCount: number;
  /** 失败数据 */
  failList?: any[];
}
