/**
 * utils/globalState.js
 * qiankun Global_State 封装
 *
 * 初始状态涵盖 token、userInfo、menus、permissions、navigate、fullscreen。
 * 监听子应用发出的 navigate（跨子应用路由跳转）与 fullscreen（无导航栏切换）信号。
 *
 * 注意：router 与 store 均使用动态 import 避免循环依赖。
 */

import { initGlobalState } from 'qiankun'

const initialState = {
  token: '',
  userInfo: {},
  menus: [],
  permissions: [],
  navigate: null,
  fullscreen: null
}

const actions = initGlobalState(initialState)

// 主应用监听子应用发来的 Global_State 变更
actions.onGlobalStateChange((state, prev) => {
  // 子应用请求跨子应用路由跳转（Requirements 7.5）
  if (state.navigate && state.navigate.path !== prev.navigate?.path) {
    // 动态导入 router，避免与 router/index.js 产生循环依赖
    import('@/router')
      .then(m => m.default.push(state.navigate.path).catch(() => {}))
      .catch(e => console.warn('[globalState] router import failed:', e.message))
  }

  // 子应用请求切换无导航栏模式（Requirements 8.10）
  if (state.fullscreen !== null && state.fullscreen !== prev.fullscreen) {
    // 动态导入 store，避免与 store/index.js 产生循环依赖
    import('@/store')
      .then(m => m.default.commit('app/SET_FULLSCREEN', state.fullscreen))
      .catch(e => console.warn('[globalState] store import failed:', e.message))
  }
}, true)

export { actions }
export default actions
