/**
 * Tab_Ticket 工具函数（app-platform 本地副本）
 *
 * 因为 app-platform 无法直接 import packages/main-app 的代码，
 * 在此提供 consumeTabTicket 的本地实现，逻辑与 main-app/src/utils/ticket.ts 完全一致。
 *
 * Requirements: 11.2, 11.4, 11.5, 11.6
 */

const TAB_TICKET_KEY = '_tab_ticket'
const TAB_TICKET_TTL = 30 * 1000 // 30 秒

interface TabTicket {
  token: string
  timestamp: number
}

/**
 * 消费 Tab_Ticket（一次性）
 *
 * 从 sessionStorage 读取 `_tab_ticket` 键值后**立即删除**（保证一次性消费），
 * 验证时间戳是否在 30s 内——有效则返回 token，否则返回 null。
 *
 * @returns 有效 token 字符串，或 null
 */
export function consumeTabTicket(): string | null {
  const raw = sessionStorage.getItem(TAB_TICKET_KEY)
  // 立即删除，保证一次性消费（Requirements: 11.6）
  sessionStorage.removeItem(TAB_TICKET_KEY)

  if (!raw) return null

  try {
    const ticket: TabTicket = JSON.parse(raw)
    const now = Date.now()

    // 验证时间戳是否在有效期内（30s）
    if (now - ticket.timestamp > TAB_TICKET_TTL) {
      return null
    }

    return ticket.token || null
  } catch {
    return null
  }
}

/**
 * 判断当前窗口是否为主窗口
 * 主窗口条件：window.opener === null 且 URL 不含 _ticket 参数
 */
export function isMainWindow(): boolean {
  if (window.opener !== null) return false
  const url = new URL(window.location.href)
  return !url.searchParams.has('_ticket')
}
