/**
 * store/modules/app.js
 * 应用布局模块：管理无导航栏模式标志
 *
 * layout.fullscreen = true 时，Shell 组件隐藏 Header 与 Sidebar
 * 此处"无导航栏"指隐藏布局导航区域，不调用浏览器原生 Fullscreen API
 */

const state = {
  layout: {
    /** 无导航栏模式标志；true 时 Shell 隐藏 Header/Sidebar */
    fullscreen: false
  }
}

const mutations = {
  /**
   * 切换无导航栏模式
   * @param {boolean} val - true 隐藏导航栏，false 恢复正常布局
   */
  SET_FULLSCREEN(state, val) {
    state.layout.fullscreen = val
  }
}

export default {
  namespaced: true,
  state,
  mutations
}
