const { defineConfig } = require('@vue/cli-service')

// 互斥模式：通过单一环境变量 VUE_APP_USE_MOCK 决定
// true  → Mock_Mode：devServer.before 注册 Mock_Server，proxy 为 undefined
// false → Proxy_Mode：devServer.before 为 undefined，proxy 代理到真实后端
const USE_MOCK = process.env.VUE_APP_USE_MOCK === 'true'

// 仅在 Mock_Mode 下加载 Mock_Server，避免 Proxy_Mode 下引入无关依赖
let setupMocks
if (USE_MOCK) {
  try {
    setupMocks = require('../../mock')
  } catch (e) {
    console.warn('[main-app] Mock_Mode 已启用，但未找到 mock/index.js：', e.message)
    setupMocks = null
  }
}

// 子应用入口地址（用于健康检查警告）
const SUB_ENTRY = process.env.VUE_APP_SUB_ENTRY || '//localhost:8081'

module.exports = defineConfig({
  outputDir: 'dist',
  publicPath: '/',

  configureWebpack: {
    // Element UI 通过 CDN 引入，从 externals 排除以减少打包体积
    externals: {
      'element-ui': 'ELEMENT'
    }
  },

  devServer: {
    port: 8080,

    // 开发环境 CORS 头，允许子应用跨域请求主应用资源
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },

    // Mock_Mode：注册 Mock_Server；Proxy_Mode：此项为 undefined
    before: USE_MOCK && setupMocks
      ? (app) => {
          setupMocks(app)
          console.log('[main-app] Mock_Mode 已启用，所有接口由 Mock_Server 处理')
        }
      : undefined,

    // Proxy_Mode：代理到真实后端；Mock_Mode：此项为 undefined
    // 互斥原则保证：USE_MOCK=true 时 proxy 为 undefined，USE_MOCK=false 时 before 为 undefined
    proxy: USE_MOCK ? undefined : {
      '/api': {
        target: process.env.VUE_APP_PROXY_TARGET || 'http://localhost:9000',
        changeOrigin: true,
        logLevel: 'warn',
        pathRewrite: { '^/api': '/api' }
      }
    },

    // 子应用不可达时仅记录警告，不阻塞主应用启动
    onAfterSetupMiddleware() {
      const http = require('http')
      // 解析子应用入口地址（//host:port 格式）
      const entryUrl = SUB_ENTRY.startsWith('//') ? 'http:' + SUB_ENTRY : SUB_ENTRY
      let parsedUrl
      try {
        parsedUrl = new URL(entryUrl)
      } catch {
        console.warn(`[main-app] 无法解析子应用入口地址：${SUB_ENTRY}`)
        return
      }
      const req = http.request(
        { hostname: parsedUrl.hostname, port: parsedUrl.port || 80, path: '/', method: 'HEAD', timeout: 3000 },
        () => { /* 子应用可达，无需任何操作 */ }
      )
      req.on('error', () => {
        console.warn(
          `[main-app] 警告：子应用入口 ${SUB_ENTRY} 不可达，` +
          '对应子应用将无法加载，但主应用启动不受影响'
        )
      })
      req.on('timeout', () => {
        req.destroy()
        console.warn(
          `[main-app] 警告：子应用入口 ${SUB_ENTRY} 连接超时，` +
          '对应子应用将无法加载，但主应用启动不受影响'
        )
      })
      req.end()
    }
  }
})
