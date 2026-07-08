/**
 * mock/auth.mock.js
 * 登录两步（账密 + MFA）、logout、token 刷新 mock 接口
 * 格式：vite-plugin-mock-dev-server defineMock
 */

import { defineMock } from 'vite-plugin-mock-dev-server'

// 内存中保存 session（仅 mock 场景）
const sessions = {}

function randomId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function generateToken(username) {
  const payload = {
    sub: username,
    username,
    exp: Math.floor(Date.now() / 1000) + 86400 // 24h
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `mock.${encoded}.signature`
}

export default defineMock([
  /**
   * POST /api/auth/login  —— 第一步：账号密码校验
   */
  {
    url: '/api/auth/login',
    method: 'POST',
    body(request) {
      const { username, password } = request.body || {}

      if (!username || !password) {
        return {
          status: '40001',
          code: '40001',
          level: 'ERROR',
          message: '账号或密码不能为空'
        }
      }

      // mock：固定账号 admin/123456，其他账号密码不限（开发用）
      if (username === 'admin' && password !== '123456') {
        return {
          status: '40101',
          code: '40101',
          level: 'ERROR',
          message: '账号或密码错误'
        }
      }

      const sessionId = randomId()
      sessions[sessionId] = { username, createdAt: Date.now() }

      return {
        status: '00000',
        code: '00000',
        level: 'SUCCESS',
        message: '请求成功',
        data: { sessionId }
      }
    }
  },

  /**
   * POST /api/auth/mfa  —— 第二步：MFA 验证码校验
   */
  {
    url: '/api/auth/mfa',
    method: 'POST',
    body(request) {
      const { sessionId, mfaCode } = request.body || {}

      if (!sessionId || !sessions[sessionId]) {
        return {
          status: '40102',
          code: '40102',
          level: 'ERROR',
          message: '会话已过期，请重新登录'
        }
      }

      // mock：任意 6 位数字验证码均通过
      if (!mfaCode || !/^\d{6}$/.test(mfaCode)) {
        return {
          status: '40103',
          code: '40103',
          level: 'ERROR',
          message: 'MFA 验证码格式错误，请输入 6 位数字'
        }
      }

      const { username } = sessions[sessionId]
      delete sessions[sessionId]

      const token = generateToken(username)

      return {
        status: '00000',
        code: '00000',
        level: 'SUCCESS',
        message: '请求成功',
        data: { token }
      }
    }
  },

  /**
   * POST /api/auth/logout  —— 退出登录
   */
  {
    url: '/api/auth/logout',
    method: 'POST',
    body: {
      status: '00000',
      code: '00000',
      level: 'SUCCESS',
      message: '已退出登录',
      data: null
    }
  },

  /**
   * POST /api/auth/refresh  —— token 刷新
   */
  {
    url: '/api/auth/refresh',
    method: 'POST',
    body(request) {
      const authHeader = request.headers['authorization'] || ''
      const oldToken = authHeader.replace(/^Bearer\s+/i, '')

      if (!oldToken || !oldToken.startsWith('mock.')) {
        return {
          status: '40100',
          code: '40100',
          level: 'ERROR',
          message: 'token 无效或已过期'
        }
      }

      let username = 'unknown'
      try {
        const parts = oldToken.split('.')
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
        username = payload.username || 'unknown'
      } catch (_) {
        // 解析失败，使用默认 username
      }

      const newToken = generateToken(username)

      return {
        status: '00000',
        code: '00000',
        level: 'SUCCESS',
        message: '请求成功',
        data: { token: newToken }
      }
    }
  }
])
