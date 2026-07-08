// 权限码列表（由外部调用方通过 setPermissions 注入）
let _permissions = []

/**
 * 设置当前用户的权限码列表
 * @param {string[]} list - 权限码数组（来自 Global_State.permissions）
 */
export function setPermissions(list) {
  _permissions = list || []
}

/**
 * 检查当前用户是否拥有指定权限码
 * @param {string} code - 权限码（如 "system-module-add"）
 * @returns {boolean} - 拥有该权限则返回 true，否则返回 false
 */
export function hasPermission(code) {
  // 空字符串、null、undefined 均返回 false
  if (!code) return false
  return _permissions.includes(code)
}
