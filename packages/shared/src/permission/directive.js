import { hasPermission } from './index.js'

/**
 * v-permission 自定义指令（Vue 2）
 *
 * 用法：<button v-permission="'system-module-add'">新增</button>
 *
 * - 当前用户不拥有该权限码时，从 DOM 中移除元素（非 display:none）
 * - 当权限列表更新时（update 钩子），重新评估并保留或移除元素
 */
export const permissionDirective = {
  /**
   * 元素插入父节点后调用
   * @param {HTMLElement} el
   * @param {import('vue').VNodeDirective} binding
   */
  inserted(el, binding) {
    const code = binding.value
    if (!hasPermission(code)) {
      // 从 DOM 中物理移除，而非隐藏（requirements 6.4）
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    }
  },

  /**
   * 所在组件的 VNode 更新后调用（含权限列表变化场景）
   * @param {HTMLElement} el
   * @param {import('vue').VNodeDirective} binding
   */
  update(el, binding) {
    const code = binding.value
    if (!hasPermission(code)) {
      // 若元素仍在 DOM 中，则移除
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    }
    // 若权限恢复，元素无法自动插回（已从 DOM 移除）
    // 权限恢复场景需由上层组件通过 v-if 重新渲染来实现
  }
}
