import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import yaml from "@rollup/plugin-yaml";
import UnoCSS from "unocss/vite";
import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import qiankun from "vite-plugin-qiankun";

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());

  const useMock = env.VITE_APP_USE_MOCK === "true";
  const hasProxy = !!(env.VITE_APP_BASE_API && env.VITE_APP_API_URL);

  // 两者同时存在时输出警告并以 mock 模式优先
  if (useMock && hasProxy) {
    console.warn(
      "[app-platform] VITE_APP_USE_MOCK=true 与 proxy 配置同时存在，将以 mock 模式优先，proxy 已禁用。"
    );
  }

  return {
    // base 由环境变量控制，默认 '/'
    base: env.VITE_APP_PUBLIC_PATH || "/",

    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },

    plugins: [
      vue(),
      yaml(),
      UnoCSS(),
      // 开发和生产均需启用：开发态桥接 ESM 生命周期，生产构建转换 HTML Entry。
      qiankun("app-platform", { useDevMode: command === "serve" }),
      // 自动导入 Vue、VueUse、Pinia、vue-router 等常用 API
      AutoImport({
        imports: [
          "vue",
          "vue-router",
          "pinia",
          { "@vueuse/core": ["useStorage", "useDebounceFn", "useClipboard", "onClickOutside"] },
          { "vue-i18n": ["useI18n"] },
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
      ...(useMock ? [mockDevServerPlugin({ prefix: env.VITE_APP_BASE_API || "/api" })] : []),
    ],

    server: {
      port: 7101,
      // qiankun 要求：允许主应用跨域加载子应用资源
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      // mock 模式时禁用 proxy；否则代理到真实后端
      ...(!useMock && hasProxy
        ? {
            proxy: {
              [env.VITE_APP_BASE_API]: {
                target: env.VITE_APP_API_URL,
                changeOrigin: true,
                rewrite: (path: string) =>
                  path.replace(new RegExp(`^${env.VITE_APP_BASE_API}`), ""),
              },
            },
          }
        : {}),
    },

    build: {
      outDir: "dist",
      rolldownOptions: {
        onwarn(warning, warn) {
          // @vueuse/core 的 #__PURE__ 注释位置不符合 Rolldown 规范，属已知兼容问题，忽略即可
          if (warning.code === "INVALID_ANNOTATION") return;
          warn(warning);
        },
      },
    },
  };
});
