import type { App, Directive, DirectiveBinding } from "vue";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { ROOT_ROLE_ID } from "@/utils";

/** 按钮类型模块（权限码） */
const MODULE_TYPE_BUTTON = "005002";
/** 独立运行时，权限缓存的本地存储键 */
const PERMS_STORAGE_KEY = "app-platform:permissions";

interface PermissionModuleNode {
  moduleCode?: string;
  moduleType?: string;
  children?: PermissionModuleNode[];
}

/**
 * 从本地存储恢复权限缓存（仅独立运行时使用）。
 * qiankun 模式下权限由主应用通过 Global_State 下发，无需读取本地缓存。
 */
function loadCachedState(): { perms: string[]; roleId: string } {
  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    return { perms: [], roleId: "" };
  }
  try {
    const raw = localStorage.getItem(PERMS_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        perms: Array.isArray(data?.perms) ? data.perms : [],
        roleId: typeof data?.roleId === "string" ? data.roleId : "",
      };
    }
  } catch {
    // 缓存损坏时忽略，视为无权限
  }
  return { perms: [], roleId: "" };
}

const cached = loadCachedState();
// 当前权限码列表，由 Global_State 同步回调或登录后的权限缓存更新
let currentPermissions: string[] = cached.perms;
// 当前操作的角色ID（超级管理员拥有全部权限）
let currentRoleId = cached.roleId;

/**
 * 更新权限列表（由 main.ts 的 Global_State 同步回调调用）
 */
export function updatePermissions(perms: string[]) {
  currentPermissions = perms;
}

/**
 * 更新当前角色（由 main.ts 的 Global_State 同步回调调用）
 */
export function updateCurrentRole(roleId?: string) {
  currentRoleId = roleId || "";
}

/**
 * 从 permission 接口返回的模块树中提取按钮权限码（moduleType=005002）
 */
export function extractPermissionCodes(modules: PermissionModuleNode[] | undefined): string[] {
  const codes = new Set<string>();
  const walk = (nodes?: PermissionModuleNode[]) => {
    nodes?.forEach((node) => {
      if (node.moduleType === MODULE_TYPE_BUTTON && node.moduleCode) {
        codes.add(node.moduleCode);
      }
      walk(node.children);
    });
  };
  walk(modules);
  return [...codes];
}

/**
 * 缓存当前角色的权限（独立运行时，登录后调用 permission 接口得到结果后写入）
 * 同时写入本地存储，页面刷新后可恢复
 */
export function cachePermissions(perms: string[], roleId: string) {
  currentPermissions = perms;
  currentRoleId = roleId;
  try {
    localStorage.setItem(PERMS_STORAGE_KEY, JSON.stringify({ roleId, perms }));
  } catch {
    // 存储不可用时仅保留内存缓存
  }
}

/**
 * 清除权限缓存（登出时调用）
 */
export function clearPermissions() {
  currentPermissions = [];
  currentRoleId = "";
  try {
    localStorage.removeItem(PERMS_STORAGE_KEY);
  } catch {
    // 忽略
  }
}

/**
 * 判断是否拥有指定权限码
 */
function checkPerm(value: string | string[]): boolean {
  // 超级管理员拥有所有权限
  if (currentRoleId && currentRoleId === ROOT_ROLE_ID) {
    return true;
  }
  return Array.isArray(value)
    ? value.some((perm) => currentPermissions.includes(perm))
    : currentPermissions.includes(value);
}

/**
 * 判断是否有权限（非指令）
 * 用途：用于控制元素的 disabled 属性或条件渲染
 * 用法：<el-button :disabled="!hasAuth('sys:user:add')">添加</el-button>
 */
export function hasAuth(value: string | string[], _type: "perm" | "role" = "perm"): boolean {
  if (!value) return false;
  return checkPerm(value);
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

    if (!checkPerm(requiredPerms) && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};

/**
 * 初始化权限指令（供 main.ts 调用）
 *
 * @param app Vue 应用实例
 * @param initialProps qiankun 挂载时传入的初始属性（含 permissions 字段）
 */
export function setupPermissionDirective(app: App, initialProps: { permissions?: string[] } = {}) {
  // 仅在显式传入非空权限时覆盖，避免独立运行时抹掉本地缓存的权限
  if (Array.isArray(initialProps.permissions) && initialProps.permissions.length > 0) {
    currentPermissions = initialProps.permissions;
  }

  app.directive("permission", permission);
  app.directive("hasPerm", hasPerm);
  app.directive("has-perm", hasPerm);
}
