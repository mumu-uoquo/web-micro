/**
 * store/index.js
 * Vuex 根 store，注册所有命名空间模块
 *
 * 模块说明：
 *   auth         - token、userInfo、登录/登出
 *   menu         - menus、permissions、activeMenuCode
 *   app          - layout.fullscreen（无导航栏模式）
 *   notification - notifications、unreadCount、EventSource（SSE）
 */

import Vue from 'vue'
import Vuex from 'vuex'

import auth from './modules/auth'
import menu from './modules/menu'
import app from './modules/app'
import notification from './modules/notification'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    auth,
    menu,
    app,
    notification
  },
  // 开发环境开启严格模式，防止在 mutation 外部直接修改 state
  strict: process.env.NODE_ENV !== 'production'
})
