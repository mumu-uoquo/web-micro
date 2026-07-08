/**
 * mock/index.js
 * Mock Server 入口
 *
 * 使用 express 提供以下 mock 路由：
 *   GET  /api/menu                  —— 菜单树
 *   POST /api/auth/login            —— 登录第一步（账密）
 *   POST /api/auth/mfa              —— 登录第二步（MFA 验证码）
 *   POST /api/auth/logout           —— 退出登录
 *   POST /api/auth/refresh          —— token 刷新
 *   GET  /api/sse/notification      —— SSE 消息推送流
 *
 * 启动方式：node mock/index.js
 * 默认端口：3001（可通过 MOCK_PORT 环境变量覆盖）
 */

'use strict'

const express = require('express')
const path = require('path')
const { loginStep1, loginMfa, logout, refreshToken } = require('./auth')
const { sseHandler } = require('./sse')

const app = express()
const PORT = process.env.MOCK_PORT || 3001

// ── 中间件 ──────────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 全局 CORS（开发环境允许所有来源）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})

// ── 菜单路由 ────────────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  const menuData = require('./menu.json')
  res.json(menuData)
})

// ── 鉴权路由 ────────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginStep1)
app.post('/api/auth/mfa', loginMfa)
app.post('/api/auth/logout', logout)
app.post('/api/auth/refresh', refreshToken)

// ── SSE 路由 ─────────────────────────────────────────────────────────────────
app.get('/api/sse/notification', sseHandler)

// ── 404 兜底 ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: '40400',
    code: '40400',
    level: 'ERROR',
    message: `Mock 路由未找到：${req.method} ${req.path}`
  })
})

// ── 启动服务 ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Mock Server] 启动成功，监听端口 ${PORT}`)
  console.log(`  GET  http://localhost:${PORT}/api/menu`)
  console.log(`  POST http://localhost:${PORT}/api/auth/login`)
  console.log(`  POST http://localhost:${PORT}/api/auth/mfa`)
  console.log(`  POST http://localhost:${PORT}/api/auth/logout`)
  console.log(`  POST http://localhost:${PORT}/api/auth/refresh`)
  console.log(`  GET  http://localhost:${PORT}/api/sse/notification`)
})

module.exports = app
