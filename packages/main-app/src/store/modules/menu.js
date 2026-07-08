/**
 * store/modules/menu.js
 * 菜单模块：管理权限菜单树、按钮权限码列表与当前激活菜单
 *
 * loadMenus action 执行以下流水线：
 *   getMenuTree API → parseMenuTree → sortMenuTree → filterVisibleMenus → collectPermissions
 *
 * Menu_API 失败时展示错误页面，不降级到本地数据
 */

import { getMenuTree } from '@/api/menu'
import {
  parseMenuTree,
  sortMenuTree,
  filterVisibleMenus,
  collectPermissions
} from '@/utils/menu'

const state = {
  /** 可渲染菜单树（005001 节点，已过滤 visible=false） */
  menus: [],
  /** 按钮权限码数组（005002 节点的 moduleCode） */
  permissions: [],
  /** 当前激活菜单的 moduleCode */
  activeMenuCode: ''
}

const mutations = {
  SET_MENUS(state, menus) {
    state.menus = menus
  },
  SET_PERMISSIONS(state, permissions) {
    state.permissions = permissions
  },
  SET_ACTIVE_MENU_CODE(state, code) {
    state.activeMenuCode = code
  }
}

const actions = {
  /**
   * 加载菜单数据：调用 Menu_API，执行解析流水线，存入 store
   * 失败时直接抛出错误（由调用方展示错误页面，不执行降级）
   */
  async loadMenus({ commit }) {
    // 调用菜单接口，失败时异常向上冒泡
    const rawData = await getMenuTree()

    // 取响应体的 data 字段（后端通常包装为 { code, data, message }）
    const rawNodes = Array.isArray(rawData) ? rawData : (rawData.data || [])

    // 执行解析流水线
    const parsed = parseMenuTree(rawNodes)
    const sorted = sortMenuTree(parsed)
    const visibleMenus = filterVisibleMenus(sorted)
    const permissions = collectPermissions(sorted)

    commit('SET_MENUS', visibleMenus)
    commit('SET_PERMISSIONS', permissions)

    return { menus: visibleMenus, permissions }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
