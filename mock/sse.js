/**
 * mock/sse.js
 * SSE 消息 mock 流
 * GET /api/sse/notification
 *
 * 客户端通过 EventSource 连接后，每隔 10 秒推送一条 mock 消息事件。
 * 连接断开时自动清理定时器。
 */

const MESSAGE_TYPES = ['info', 'warning', 'success', 'error']

let _msgCounter = 0

/**
 * 生成一条 mock 消息
 */
function generateMessage() {
  _msgCounter++
  const type = MESSAGE_TYPES[_msgCounter % MESSAGE_TYPES.length]
  return {
    id: `msg-${Date.now()}-${_msgCounter}`,
    type,
    title: `Mock 消息 #${_msgCounter}`,
    content: `这是第 ${_msgCounter} 条模拟推送消息（${type}）`,
    createdAt: new Date().toISOString(),
    read: false
  }
}

/**
 * SSE 路由处理函数
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function sseHandler(req, res) {
  // 设置 SSE 必要响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // 立即推送一条连接成功事件
  const connectMsg = {
    id: `connect-${Date.now()}`,
    type: 'info',
    title: 'SSE 连接成功',
    content: 'Mock SSE 服务已连接，将定期推送消息。',
    createdAt: new Date().toISOString(),
    read: false
  }
  res.write(`event: message\n`)
  res.write(`data: ${JSON.stringify(connectMsg)}\n\n`)

  // 每 10 秒推送一条消息
  const intervalId = setInterval(() => {
    const msg = generateMessage()
    res.write(`event: message\n`)
    res.write(`data: ${JSON.stringify(msg)}\n\n`)
  }, 10000)

  // 每 30 秒推送一次心跳，防止连接超时
  const heartbeatId = setInterval(() => {
    res.write(`: heartbeat\n\n`)
  }, 30000)

  // 客户端断开时清理资源
  req.on('close', () => {
    clearInterval(intervalId)
    clearInterval(heartbeatId)
    res.end()
  })
}

module.exports = { sseHandler }
