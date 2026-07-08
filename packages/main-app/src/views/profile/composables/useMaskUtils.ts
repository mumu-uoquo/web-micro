/**
 * 脱敏工具函数
 * Requirements: 1.5, 1.6, 1.7, 5.2, 5.4
 */

/**
 * 真实姓名脱敏
 * - 两字姓名：保留第一个字，其余用 * 代替（如"张*"）
 * - 三字及以上：保留首尾字，中间字符全部用 * 代替（如"张*明"）
 */
export function maskRealName(name: string): string {
  if (!name || name.length < 2) return name;
  if (name.length === 2) {
    return name[0] + "*";
  }
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

/**
 * 手机号脱敏
 * 将中间4位（第4-7位）替换为 *（如"138****8888"）
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(7);
}

/**
 * 邮箱脱敏
 * 保留 @ 前用户名的前3位，其余字符用 * 代替（如"zha***@example.com"）
 */
export function maskEmail(email: string): string {
  if (!email) return email;
  const atIndex = email.indexOf("@");
  if (atIndex < 0) return email;
  const username = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (username.length <= 3) return email;
  return username.slice(0, 3) + "*".repeat(username.length - 3) + domain;
}

export function useMaskUtils() {
  return { maskRealName, maskPhone, maskEmail };
}
