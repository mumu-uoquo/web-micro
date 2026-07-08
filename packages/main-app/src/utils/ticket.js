/**
 * Tab_Ticket 工具函数
 * 用于新标签页鉴权（Tab_Ticket 一次性凭证）与主窗口判断
 */

/**
 * 将 token 写入 sessionStorage._tab_ticket，并设置 30s 后自动清除
 * @param {string} token
 */
export function writeTabTicket(token) {
  sessionStorage.setItem('_tab_ticket', token)
  setTimeout(() => {
    sessionStorage.removeItem('_tab_ticket')
  }, 30000)
}

/**
 * 一次性读取并删除 Tab_Ticket
 * @returns {string|null} ticket value or null if not found
 */
export function consumeTabTicket() {
  const ticket = sessionStorage.getItem('_tab_ticket')
  if (ticket) {
    sessionStorage.removeItem('_tab_ticket')
  }
  return ticket || null
}

/**
 * 判断当前窗口是否为主窗口
 * 主窗口条件：window.opener === null 且 URL 不含查询参数 _ticket=1
 * @returns {boolean}
 */
export function isMainWindow() {
  if (window.opener !== null) return false
  const params = new URLSearchParams(window.location.search)
  return params.get('_ticket') !== '1'
}
