import vue from "@vitejs/plugin-vue";
import { type ConfigEnv, type UserConfig, loadEnv, defineConfig, PluginOption } from "vite";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

import { mockDevServerPlugin } from "vite-plugin-mock-dev-server";

import UnoCSS from "unocss/vite";
import yaml from "@rollup/plugin-yaml";
import { resolve } from "path";
import { name, version } from "./package.json";

// 平台名称、版本信息
const __APP_INFO__ = {
  pkg: { name, version },
  buildTimestamp: Date.now(),
};

// ESM 模式下使用 import.meta.dirname（Node 20.11+）
const pathSrc = resolve(import.meta.dirname, "src");

// Vite配置  https://cn.vitejs.dev/config
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: "/",
    resolve: {
      alias: {
        "@": pathSrc,
      },
    },
    css: {
      preprocessorOptions: {
        // 定义全局 SCSS 变量
        scss: {
          additionalData: `@use "@/styles/base/variables.scss" as *;`,
        },
      },
    },
    server: {
      // 主机地址
      host: "0.0.0.0",
      // 端口号（主应用固定 7100）
      port: 7100,
      // 是否自动在浏览器中打开
      open: true,
      // 允许访问开发服务器的主机名（反向代理/隧道域名需在此放行）
      allowedHosts: [".kanebay.com", ".uoquo.loc", ".uoquo.com"],
      proxy: {
        // 代理前缀为 /dev-api 的请求
        [env.VITE_APP_BASE_API]: {
          changeOrigin: true,
          target: env.VITE_APP_API_URL,
          rewrite: (path: string) => path.replace(new RegExp(`^${env.VITE_APP_BASE_API}`), ""),
          // SSE 长连接配置：禁用代理超时，保持连接不被中断
          timeout: 0,
          proxyTimeout: 0,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("Connection", "keep-alive");
            });
            proxy.on("proxyRes", (proxyRes) => {
              if (proxyRes.headers["content-type"]?.includes("text/event-stream")) {
                proxyRes.headers["cache-control"] = "no-cache";
                proxyRes.headers["x-accel-buffering"] = "no";
              }
            });
          },
        },
      },
    },
    plugins: [
      vue(),
      // 主要用于语言包的读取
      yaml(),
      // MOCK 服务
      ...(env.VITE_MOCK_DEV_SERVER === "true" ? [mockDevServerPlugin()] : []),
      UnoCSS(),
      // API 自动导入配置
      AutoImport({
        imports: ["vue", "@vueuse/core", "pinia", "vue-router", "vue-i18n"],
        resolvers: [
          ElementPlusResolver({ importStyle: "sass" }),
        ],
        eslintrc: {
          enabled: false,
          filepath: "./.eslintrc-auto-import.json",
          globalsPropValue: true,
        },
        vueTemplate: true,
        dts: false,
      }),
      // 组件自动导入
      Components({
        resolvers: [
          ElementPlusResolver({ importStyle: "sass" }),
        ],
        dirs: ["src/components"],
        dts: false,
      }),
    ] as PluginOption[],
    // 预加载项目必需的依赖
    optimizeDeps: {
      include: [
        "vue",
        "vue-router",
        "element-plus",
        "pinia",
        "axios",
        "@vueuse/core",
        "codemirror-editor-vue3",
        "exceljs",
        "path-to-regexp",
        "echarts/core",
        "echarts/renderers",
        "echarts/charts",
        "echarts/components",
        "vue-i18n",
        "nprogress",
        "sortablejs",
        "qs",
        "vxe-table",
        "path-browserify",
        "lodash-es",
        "@element-plus/icons-vue",
        "element-plus/es",
        "element-plus/es/locale/lang/en",
        "element-plus/es/locale/lang/zh-cn",
        ...[
          "alert",
          "avatar",
          "backtop",
          "badge",
          "base",
          "breadcrumb",
          "breadcrumb-item",
          "button",
          "card",
          "cascader",
          "checkbox",
          "checkbox-group",
          "checkbox-button",
          "col",
          "color-picker",
          "config-provider",
          "date-picker",
          "descriptions",
          "descriptions-item",
          "dialog",
          "divider",
          "drawer",
          "dropdown",
          "dropdown-item",
          "dropdown-menu",
          "empty",
          "form",
          "form-item",
          "icon",
          "image",
          "image-viewer",
          "input",
          "input-number",
          "input-tag",
          "link",
          "loading",
          "menu",
          "menu-item",
          "message",
          "message-box",
          "notification",
          "option",
          "pagination",
          "popover",
          "progress",
          "radio",
          "radio-button",
          "radio-group",
          "row",
          "scrollbar",
          "select",
          "skeleton",
          "skeleton-item",
          "space",
          "step",
          "steps",
          "sub-menu",
          "switch",
          "tab-pane",
          "table",
          "table-column",
          "tabs",
          "tag",
          "text",
          "time-picker",
          "time-select",
          "timeline",
          "timeline-item",
          "tooltip",
          "tree",
          "tree-select",
          "upload",
          "watermark",
        ].map((c) => `element-plus/es/components/${c}/style/index`),
      ],
    },
    // 构建配置（标准 SPA 输出，不使用 lib/UMD 模式）
    build: {
      outDir: "dist",
      sourcemap: mode === "development",
      chunkSizeWarningLimit: 1200,
      reportCompressedSize: false,
      cssMinify: "lightningcss",
      rolldownOptions: {
        output: {
          entryFileNames: "js/[name].[hash].js",
          chunkFileNames: "js/[name].[hash].js",
          assetFileNames: (assetInfo: any) => {
            if (!assetInfo.name) {
              return "assets/[name].[hash][extname]";
            }
            const info = assetInfo.name.split(".");
            let extType = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              extType = "media";
            } else if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(assetInfo.name)) {
              extType = "img";
            } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              extType = "fonts";
            }
            return `${extType}/[name].[hash].[ext]`;
          },
        },
      },
    },
    define: {
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },
  };
});
