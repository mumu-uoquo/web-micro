'use strict'

const { defineConfig } = require('@vue/cli-service')

const packageName = 'app-platform'

module.exports = defineConfig({
  // 生产环境使用子应用独立部署地址，开发环境使用根路径
  publicPath: process.env.NODE_ENV === 'production'
    ? process.env.VUE_APP_PUBLIC_PATH || '/'
    : '/',

  // 构建产物输出目录
  outputDir: 'dist',

  // 关闭生产环境 source map 以减小产物体积
  productionSourceMap: false,

  // 开发服务配置
  devServer: {
    // 子应用固定使用 8081 端口
    port: 8081,
    // 允许主应用（不同端口/域）跨域加载子应用资源
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },

  // webpack 配置：输出 UMD 格式（qiankun 要求）
  configureWebpack: {
    output: {
      // UMD 格式，qiankun 通过 window[library] 加载子应用导出的生命周期函数
      library: packageName,
      libraryTarget: 'umd',
      // 解决多实例下 jsonpFunction 冲突
      chunkLoadingGlobal: `webpackJsonp_${packageName}`
    },
    // externals：这些库由 Main_App 通过 CDN 提供，子应用不打包进产物
    externals: process.env.NODE_ENV === 'production'
      ? {
          vue: 'Vue',
          'vue-router': 'VueRouter',
          vuex: 'Vuex',
          'element-ui': 'ELEMENT'
        }
      : {}
  }
})
