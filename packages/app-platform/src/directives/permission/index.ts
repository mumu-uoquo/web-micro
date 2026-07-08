import type { Directive, DirectiveBinding } from "vue";

// 响应式权限数组，由 onGlobalStateChange 回调更新
let currentPermissions: string[] = [];

/**
 * 更新权限列表（由 main.ts 的 Global_State 同步回调调用）
 */
export function updatePermissions(perms: string[]) {
  currentPermissions = perms;
}

/**
 * 判断是否有权限（非指令）
 * 用途：用于控制元素的 disabled 属性或条件渲染
 * 用法：<el-button :disabled="!hasAuth('sys:user:add')">添加</el-button>
 */
export function hasAuth(value: string | string[], _type: "perm" | "role" = "perm"): boolean {
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.some((perm) => currentPermissions.includes(perm));
  }
  return currentPermissions.includes(value);
}

/**
 * v-permission 指令：无权限时移除 DOM 元素（不使用 display:none）
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (!binding.value) {
      el.parentNode?.removeChild(el);
      return;
    }
    if (!hasAuth(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (!binding.value) {
      el.parentNode?.removeChild(el);
      return;
    }
    if (!hasAuth(binding.value) && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};

/**
 * v-hasPerm 指令（兼容 CURD 组件使用的指令名）
 */
export const hasPerm: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const requiredPerms = binding.value;
    if (!requiredPerms) return;

    const hasPermission = Array.isArray(requiredPerms)
      ? requiredPerms.some((perm: string) => currentPermissions.includes(perm))
      : currentPermissions.includes(requiredPerms);

    if (!hasPermission && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};

/**
 * 初始化权限指令（供 main.ts 的 setupPermissionDirective 调用）
 */
import type { App } from "vue";

export function setupPermissionDirective(app: App, initialPermissions: string[] = []) {
  currentPermissions = initialPermissions;

  app.directive("permission", permission);
  app.directive("hasPerm", hasPerm);
  app.directive("has-perm", hasPerm);
}
