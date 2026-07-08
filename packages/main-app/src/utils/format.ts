/**
 * 数据格式化相关工具函数
 */

/**
 * 格式化增长率
 * 保留两位小数，去掉末尾的 0，取绝对值
 *
 * @param growthRate 增长率（小数形式，如 0.15 表示 15%）
 * @returns 格式化后的增长率字符串
 *
 * @example
 * ```ts
 * formatGrowthRate(0.1234);  // "12.34%"
 * formatGrowthRate(0.1000);  // "10%"
 * formatGrowthRate(0);       // "-"
 * formatGrowthRate(-0.05);   // "5%"（取绝对值）
 * ```
 */
export function formatGrowthRate(growthRate: number): string {
  if (growthRate === 0) {
    return "-";
  }

  const formattedRate = Math.abs(growthRate * 100)
    .toFixed(2)
    .replace(/\.?0+$/, "");

  return formattedRate + "%";
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 保留小数位数，默认 2
 * @returns 格式化后的文件大小字符串
 *
 * @example
 * ```ts
 * formatFileSize(1024);      // "1 KB"
 * formatFileSize(1048576);   // "1 MB"
 * formatFileSize(1234567);   // "1.18 MB"
 * ```
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

/**
 * 格式化数字，添加千分位分隔符
 * @param num 数字
 * @returns 格式化后的字符串
 *
 * @example
 * ```ts
 * formatNumber(1234567);     // "1,234,567"
 * formatNumber(1234567.89);  // "1,234,567.89"
 * ```
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 格式化金额（人民币）
 * @param amount 金额
 * @param decimals 保留小数位数，默认 2
 * @returns 格式化后的金额字符串
 *
 * @example
 * ```ts
 * formatCurrency(1234567);      // "¥1,234,567.00"
 * formatCurrency(1234567.8);    // "¥1,234,567.80"
 * formatCurrency(1234567, 0);   // "¥1,234,567"
 * ```
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "¥" + formatted;
}

/**
 * 日期格式化（默认：YYYY-MM-DD HH:mm:ss）
 */
export function formatDate(
  timestamp: any,
  format = "YYYY-MM-DD HH:mm:ss",
  defaultValue = ""
): string {
  if (!timestamp) {
    return defaultValue;
  }
  // 转换为Date对象
  const date: Date | null = parseDate(timestamp);
  if (!date) {
    return defaultValue;
  }
  // 格式化为时间戳
  if (format === "timestamp") {
    return String(date.getTime());
  }
  // 格式化为其他格式
  const year = String(date.getFullYear()); // 获取年份 (e.g., 2023)
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 获取月份 (0-11, 需要加1)
  const day = String(date.getDate()).padStart(2, "0"); // 获取日期 (1-31)
  const hours = String(date.getHours()).padStart(2, "0"); // 获取小时 (0-23)
  const minutes = String(date.getMinutes()).padStart(2, "0"); // 获取分钟 (0-59)
  const seconds = String(date.getSeconds()).padStart(2, "0"); // 获取分钟 (0-59)

  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * 日期解析
 */
export function parseDate(timestamp: any, format = "YYYY-MM-DD HH:mm:ss"): Date | null {
  if (!timestamp) {
    return null;
  }
  // 时间戳处理
  if (timestamp instanceof Date) {
    return timestamp as Date;
  } else if (typeof timestamp === "number") {
    return new Date(timestamp);
  }
  const tt = Number(timestamp);
  if (tt) {
    return new Date(tt);
  }
  // 其他格式处理
  const formatTokens = format.match(/(YYYY|MM|DD|HH|mm|ss)/g) || [];
  const pattern = format
    .replace(/YYYY/g, "(\\d{4})")
    .replace(/MM/g, "(\\d{2})")
    .replace(/DD/g, "(\\d{2})")
    .replace(/HH/g, "(\\d{2})")
    .replace(/mm/g, "(\\d{2})")
    .replace(/ss/g, "(\\d{2})");
  const regex = new RegExp(`^${pattern}$`);
  const matches = timestamp.match(regex);
  if (!matches) {
    return null;
  }

  const dateValues: Record<string, number | undefined> = {
    YYYY: undefined,
    MM: undefined,
    DD: undefined,
    HH: undefined,
    mm: undefined,
    ss: undefined,
  };
  formatTokens.forEach((key, i) => {
    dateValues[key] = parseInt(matches[i + 1], 10);
  });
  return new Date(
    dateValues["YYYY"] || new Date().getFullYear(),
    (dateValues["MM"] || 1) - 1,
    dateValues["DD"] || 1,
    dateValues["HH"] || 0,
    dateValues["mm"] || 0,
    dateValues["ss"] || 0
  );
}
