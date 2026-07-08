/**
 * mock/auth.js
 * 登录两步（账密 + MFA）、logout、token 刷新 mock 实现
 */

// 内存中保存 session（仅 mock 场景）
const sessions = {}

/**
 * 生成随机 ID
 */
function randomId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * 生成 mock JWT token（base64 payload 编码，无签名校验）
 */
function generateToken(username) {
  const payload = {
    sub: username,
    username,
    exp: Math.floor(Date.now() / 1000) + 86400 // 24h
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `mock.${encoded}.signature`
}

/**
 * POST /api/auth/login  —— 第一步：账号密码校验
 * Body: { username, password }
 * Response: { sessionId }
 */
function loginStep1(req, res) {
  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({
      status: '40001',
      code: '40001',
      level: 'ERROR',
      message: '账号或密码不能为空'
    })
  }

  // mock：固定账号 admin/123456，其他账号密码不限（开发用）
  if (username === 'admin' && password !== '123456') {
    return res.status(200).json({
      status: '40101',
      code: '40101',
      level: 'ERROR',
      message: '账号或密码错误'
    })
  }

  const sessionId = randomId()
  sessions[sessionId] = { username, createdAt: Date.now() }

  return res.status(200).json({
    status: '00000',
    code: '00000',
    level: 'SUCCESS',
    message: '请求成功',
    data: { sessionId }
  })
}

/**
 * POST /api/auth/mfa  —— 第二步：MFA 验证码校验
 * Body: { sessionId, mfaCode }
 * Response: { token }
 */
function loginMfa(req, res) {
  const { sessionId, mfaCode } = req.body || {}

  if (!sessionId || !sessions[sessionId]) {
    return res.status(200).json({
      status: '40102',
      code: '40102',
      level: 'ERROR',
      message: '会话已过期，请重新登录'
    })
  }

  // mock：任意 6 位数字验证码均通过（123456 或随意6位数）
  if (!mfaCode || !/^\d{6}$/.test(mfaCode)) {
    return res.status(200).json({
      status: '40103',
      code: '40103',
      level: 'ERROR',
      message: 'MFA 验证码格式错误，请输入 6 位数字'
    })
  }

  const { username } = sessions[sessionId]
  delete sessions[sessionId]

  const token = generateToken(username)

  return res.status(200).json({
    status: '00000',
    code: '00000',
    level: 'SUCCESS',
    message: '请求成功',
    data: { token }
  })
}

/**
 * POST /api/auth/logout  —— 退出登录
 * Response: {}
 */
function logout(req, res) {
  return res.status(200).json({
    status: '00000',
    code: '00000',
    level: 'SUCCESS',
    message: '已退出登录',
    data: null
  })
}

/**
 * POST /api/auth/refresh  —— token 刷新
 * Header: Authorization: Bearer <old_token>
 * Response: { token }
 */
function refreshToken(req, res) {
  const authHeader = req.headers['authorization'] || ''
  const oldToken = authHeader.replace(/^Bearer\s+/i, '')

  if (!oldToken || !oldToken.startsWith('mock.')) {
    return res.status(401).json({
      status: '40100',
      code: '40100',
      level: 'ERROR',
      message: 'token 无效或已过期'
    })
  }

  // 解析 mock token 中的 username
  let username = 'unknown'
  try {
    const parts = oldToken.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
    username = payload.username || 'unknown'
  } catch (_) {
    // 解析失败，使用默认 username
  }

  const newToken = generateToken(username)

  return res.status(200).json({
    status: '00000',
    code: '00000',
    level: 'SUCCESS',
    message: '请求成功',
    data: { token: newToken }
  })
}

module.exports = { loginStep1, loginMfa, logout, refreshToken }
