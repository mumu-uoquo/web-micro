/**
 * mock/sse.mock.js
 * SSE 消息推送 mock 接口
 * 格式：vite-plugin-mock-dev-server defineMock
 *
 * GET /api/sse/notification
 * 连接成功后立即推送一条 info 事件，之后每 10 秒推送一条消息。
 */

import { defineMock } from 'vite-plugin-mock-dev-server'

const MESSAGE_TYPES = ['info', 'warning', 'success', 'error']
let _msgCounter = 0

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

export default defineMock({
  url: '/api/sse/notification',
  method: 'GET',
  /**
   * vite-plugin-mock-dev-server 通过 response 函数直接操作 Node.js
   * IncomingMessage / ServerResponse，支持 SSE 流响应。
   */
  response(request, response) {
    response.setHeader('Content-Type', 'text/event-stream')
    response.setHeader('Cache-Control', 'no-cache')
    response.setHeader('Connection', 'keep-alive')
    response.setHeader('Access-Control-Allow-Origin', '*')

    // 立即推送连接成功事件
    const connectMsg = {
      id: `connect-${Date.now()}`,
      type: 'info',
      title: 'SSE 连接成功',
      content: 'Mock SSE 服务已连接，将定期推送消息。',
      createdAt: new Date().toISOString(),
      read: false
    }
    response.write(`event: message\n`)
    response.write(`data: ${JSON.stringify(connectMsg)}\n\n`)

    // 每 10 秒推送一条消息
    const intervalId = setInterval(() => {
      const msg = generateMessage()
      response.write(`event: message\n`)
      response.write(`data: ${JSON.stringify(msg)}\n\n`)
    }, 10000)

    // 每 30 秒推送心跳，防止连接超时
    const heartbeatId = setInterval(() => {
      response.write(`: heartbeat\n\n`)
    }, 30000)

    // 客户端断开时清理资源
    request.on('close', () => {
      clearInterval(intervalId)
      clearInterval(heartbeatId)
      response.end()
    })
  }
})
