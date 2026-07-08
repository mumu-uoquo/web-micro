import type { App, DirectiveBinding } from 'vue'

// 响应式权限数组，由 onGlobalStateChange 回调更新
let currentPermissions: string[] = []

/**
 * 更新权限列表（由 main.ts 的 Global_State 同步回调调用）
 */
export function updatePermissions(perms: string[]): void {
  currentPermissions = perms
}

/**
 * 判断是否有权限
 * 空值/null/undefined 均视为无权限，返回 false
 */
function hasPermission(code: string | null | undefined): boolean {
  if (!code) return false
  return currentPermissions.includes(code)
}

/**
 * 注册 v-permission 自定义指令并初始化权限列表
 *
 * @param app - Vue 应用实例
 * @param initialProps - 挂载时从 qiankun props 传入的初始属性（含 permissions 字段）
 *
 * 指令行为：
 * - 有权限 → 保留 DOM 元素
 * - 无权限（含 binding.value 为空/null/undefined）→ 调用 el.parentNode?.removeChild(el)，不使用 display:none
 * - 不抛出异常
 */
export function setupPermissionDirective(
  app: App,
  initialProps: { permissions?: string[] }
): void {
  // 初始化权限数组
  currentPermissions = initialProps.permissions ?? []

  app.directive('permission', {
    mounted(el: HTMLElement, binding: DirectiveBinding<string | null | undefined>) {
      if (!hasPermission(binding.value)) {
        el.parentNode?.removeChild(el)
      }
    },
    updated(el: HTMLElement, binding: DirectiveBinding<string | null | undefined>) {
      if (!hasPermission(binding.value) && el.parentNode) {
        el.parentNode.removeChild(el)
      }
    },
  })
}
