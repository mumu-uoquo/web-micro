/**
 * store/modules/notification.js
 * 消息通知模块：管理 SSE 消息列表、未读计数与 EventSource 实例
 *
 * 由 NotificationBell 组件在 mounted 时通过 SET_EVENT_SOURCE 注入 EventSource 实例
 * 退出登录时由 auth/logout 调用 closeSSE action 关闭连接
 */

const state = {
  /** 消息列表（最新消息在数组头部） */
  notifications: [],
  /** 未读消息计数 */
  unreadCount: 0,
  /** EventSource 实例引用，null 表示未连接 */
  eventSource: null
}

const mutations = {
  /**
   * 新增一条消息通知（插入头部并递增未读计数）
   * @param {object} msg - 消息对象
   */
  ADD_NOTIFICATION(state, msg) {
    state.notifications.unshift(msg)
    state.unreadCount++
  },

  /**
   * 保存 EventSource 实例引用
   * @param {EventSource|null} es
   */
  SET_EVENT_SOURCE(state, es) {
    state.eventSource = es
  },

  /**
   * 关闭 SSE 连接并清空实例引用
   */
  CLOSE_SSE(state) {
    if (state.eventSource) {
      state.eventSource.close()
    }
    state.eventSource = null
  },

  /**
   * 标记所有消息为已读，将未读计数清零
   */
  MARK_ALL_READ(state) {
    state.unreadCount = 0
  }
}

const actions = {
  /**
   * 关闭 SSE 连接（供 auth/logout 跨模块调用）
   */
  closeSSE({ commit }) {
    commit('CLOSE_SSE')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
