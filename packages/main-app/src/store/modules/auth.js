/**
 * store/modules/auth.js
 * 认证模块：管理 token 与用户信息，处理登录/登出逻辑
 */

import { login as apiLogin } from '@/api/auth'

const state = {
  token: localStorage.getItem('auth_token') || '',
  userInfo: {}
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_USER_INFO(state, info) {
    state.userInfo = info
  }
}

const actions = {
  /**
   * 登录：调用登录 API，写入 token 与用户信息
   * @param {object} credentials - { username, password } 或两步登录凭证
   */
  async login({ commit }, credentials) {
    const data = await apiLogin(credentials)
    const token = data.token || data.access_token || ''
    commit('SET_TOKEN', token)
    commit('SET_USER_INFO', data.userInfo || data.user || {})
    localStorage.setItem('auth_token', token)
    return data
  },

  /**
   * 登出：关闭 SSE、清除 Global_State、清除本地存储、重置 Vuex、跳转登录页
   * 依赖 globalState actions 与 router（在 main.js 中通过插件注入，延迟导入避免循环依赖）
   */
  async logout({ commit, dispatch }) {
    // 1. 关闭 SSE 连接
    dispatch('notification/closeSSE', null, { root: true })

    // 2. 清除 Global_State（延迟导入避免循环依赖）
    try {
      const { actions: globalStateActions } = await import('@/utils/globalState')
      globalStateActions.setGlobalState({
        token: '',
        userInfo: {},
        menus: [],
        permissions: []
      })
    } catch (e) {
      // globalState 尚未初始化时忽略
      console.warn('[auth/logout] globalState not available:', e.message)
    }

    // 3. 清除本地存储
    localStorage.removeItem('auth_token')

    // 4. 重置 Vuex
    commit('SET_TOKEN', '')
    commit('SET_USER_INFO', {})
    commit('menu/SET_MENUS', [], { root: true })
    commit('menu/SET_PERMISSIONS', [], { root: true })

    // 5. 重置无导航栏状态
    commit('app/SET_FULLSCREEN', false, { root: true })

    // 6. 跳转登录页（延迟导入避免循环依赖）
    try {
      const router = (await import('@/router')).default
      router.push('/login').catch(() => {})
    } catch (e) {
      console.warn('[auth/logout] router not available:', e.message)
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
