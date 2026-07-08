import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mockDevServerPlugin } from 'vite-plugin-mock-dev-server'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  const useMock = env.VITE_APP_USE_MOCK === 'true'
  const hasProxy = !!(env.VITE_APP_BASE_API && env.VITE_APP_API_URL)

  // 两者同时存在时输出警告并以 mock 模式优先
  if (useMock && hasProxy) {
    console.warn(
      '[app-platform] VITE_APP_USE_MOCK=true 与 proxy 配置同时存在，将以 mock 模式优先，proxy 已禁用。'
    )
  }

  return {
    // base 由环境变量控制，默认 '/'
    base: env.VITE_APP_PUBLIC_PATH || '/',

    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },

    plugins: [
      vue(),
      // 自动导入 Vue、VueUse、Pinia、vue-router 等常用 API
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          'pinia',
          { '@vueuse/core': ['useStorage', 'useDebounceFn', 'useClipboard', 'onClickOutside'] },
          { 'vue-i18n': ['useI18n'] },
        ],
        resolvers: [ElementPlusResolver()],
        dts: false,
      }),
      // 自动导入 Element Plus 组件
      Components({
        resolvers: [ElementPlusResolver()],
        dts: false,
      }),
      // VITE_APP_USE_MOCK=true 时启用 mock-dev-server
      // 使用 prefix 而非 server.proxy，因为 mock 模式下 proxy 被禁用
      ...(useMock ? [mockDevServerPlugin({ prefix: env.VITE_APP_BASE_API || '/api' })] : []),
    ],

    server: {
      port: 7101,
      // qiankun 要求：允许主应用跨域加载子应用资源
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      // mock 模式时禁用 proxy；否则代理到真实后端
      ...(!useMock && hasProxy
        ? {
            proxy: {
              [env.VITE_APP_BASE_API]: {
                target: env.VITE_APP_API_URL,
                changeOrigin: true,
                rewrite: (path: string) =>
                  path.replace(new RegExp(`^${env.VITE_APP_BASE_API}`), ''),
              },
            },
          }
        : {}),
    },

    build: {
      outDir: 'dist',
      // lib 模式：qiankun 要求 UMD 输出，name 必须与 registerMicroApps 的 name 一致
      lib: {
        entry: resolve(__dirname, 'src/main.ts'),
        name: 'app-platform',
        formats: ['umd'],
        fileName: () => 'app-platform.umd.js',
      },
      rollupOptions: {
        // 排除主应用已提供的依赖，避免重复打包
        external: ['vue', 'vue-router', 'pinia', 'element-plus'],
        output: {
          // UMD 格式全局变量映射（运行时从主应用全局作用域读取）
          globals: {
            vue: 'Vue',
            'vue-router': 'VueRouter',
            pinia: 'Pinia',
            'element-plus': 'ElementPlus',
          },
        },
      },
    },
  }
})
