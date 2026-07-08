const TAB_TICKET_KEY = '_tab_ticket'
const TAB_TICKET_TTL = 30 * 1000 // 30 seconds

interface TabTicket {
  token: string
  timestamp: number
}

/**
 * 写入 Tab_Ticket（新标签页鉴权）
 * @param token 当前用户的 access_token
 */
export function writeTabTicket(token: string): void {
  const ticket: TabTicket = {
    token,
    timestamp: Date.now(),
  }
  sessionStorage.setItem(TAB_TICKET_KEY, JSON.stringify(ticket))
}

/**
 * 消费 Tab_Ticket（一次性）
 * 读取后立即删除，验证时间戳是否在 30s 内
 * @returns 有效则返回 token，否则返回 null
 */
export function consumeTabTicket(): string | null {
  const raw = sessionStorage.getItem(TAB_TICKET_KEY)
  // 立即删除，保证一次性消费
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
