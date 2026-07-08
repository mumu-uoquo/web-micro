import type { Directive, DirectiveBinding } from "vue";

import { usePermissionStore, useUserStore } from "@/stores";
import { ROOT_ROLE_ID } from "@/constants";

/**
 * 按钮权限：判断是否有指定资源的权限（指令）
 * 用途：用于控制元素是否可见
 * 用法：
 *    <el-button v-has-perm="'sys:user:add'">添加</el-button>
 *    <el-button v-hasPerm="['sys:user:add', 'sys:user:edit']">详情</el-button>
 */
export const hasPerm: Directive = {
  async mounted(el: HTMLElement, binding: DirectiveBinding) {
    const requiredPerms = binding.value;

    // 校验传入的权限值是否合法
    if (!requiredPerms || (typeof requiredPerms !== "string" && !Array.isArray(requiredPerms))) {
      throw new Error(
        "需要提供权限标识！例如：v-has-perm=\"'sys:user:add'\" 或 v-has-perm=\"['sys:user:add', 'sys:user:edit']\""
      );
    }

    // 超级管理员拥有所有权限
    const { currentRoleId } = await useUserStore().getUserInfo();
    if (ROOT_ROLE_ID == currentRoleId) {
      return;
    }

    // 检查权限

    const perms = usePermissionStore().permsInfo;
    const hasAuth = Array.isArray(requiredPerms)
      ? requiredPerms.some((perm) => perms.includes(perm))
      : perms.includes(requiredPerms);

    // 如果没有权限，移除该元素
    if (!hasAuth && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};

/**
 * 角色权限指令: 判断是否有指定角色的权限（指令）
 * 用途：用于控制元素是否可见
 * 用法：
 *    <el-button v-has-role="'ADMIN'">添加</el-button>
 *    <el-button v-hasRole="['ADMIN', 'USER_MANAGER']">详情</el-button>
 */
export const hasRole: Directive = {
  async mounted(el: HTMLElement, binding: DirectiveBinding) {
    const requiredRoles = binding.value;

    // 校验传入的角色值是否合法
    if (!requiredRoles || (typeof requiredRoles !== "string" && !Array.isArray(requiredRoles))) {
      throw new Error(
        "需要提供角色标识！例如：v-has-role=\"'ADMIN'\" 或 v-has-role=\"['ADMIN', 'TEST']\""
      );
    }

    // 超级管理员拥有所有权限
    const { currentRoleId } = await useUserStore().getUserInfo();

    if (ROOT_ROLE_ID == currentRoleId) {
      return;
    }

    // 检查是否有对应角色权限
    const hasAuth = Array.isArray(requiredRoles)
      ? requiredRoles.some((role) => role == currentRoleId)
      : requiredRoles == currentRoleId;

    // 如果没有权限，移除元素
    if (!hasAuth && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
};

/**
 * 判断是否有权限（非指令）
 * 用途：用于控制元素的 disabled 属性（元素可见，不一定可用）
 * 用法：<el-button :disabled="!hasAuth('sys:user:add')">添加</el-button>
 */
export function hasAuth(value: string | string[], type: "perm" | "role" = "perm") {
  const { currentRoleId } = useUserStore().userInfo;
  if (!value) {
    return false;
  }
  if (type === "perm") {
    //  资源权限（超管用于全部资源）

    if (ROOT_ROLE_ID == currentRoleId) {
      return true;
    }
    const perms = usePermissionStore().permsInfo;
    return Array.isArray(value)
      ? value.some((perm) => perms.includes(perm))
      : perms.includes(value);
  } else {
    //  角色权限
    return Array.isArray(value)
      ? value.some((role) => role == currentRoleId)
      : value == currentRoleId;
  }
}
