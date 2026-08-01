/**
 * 应用启动入口
 *
 * @description
 * Vue3 应用初始化，包括样式、插件、配置的加载，以及 qiankun 微前端子应用注册。
 *
 * 初始化顺序：
 * 1. setupRouter  — 路由（含 permission.ts 守卫）
 * 2. setupStore   — Pinia stores
 * 3. setupI18n    — 国际化
 * 4. 全局组件 / 第三方插件
 * 5. setupPermissionGuard — 路由守卫
 * 6. setupMicroApps       — qiankun 注册（必须在 store 初始化之后）
 * 7. initAppGlobalState   — Global_State 初始化
 * 8. app.mount('#app')
 *
 * Requirements: 3.7, 3.8
 */

import { createApp } from "vue";
import App from "./App.vue";

// ===== 样式导入 =====
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@/styles/index.scss";
import "uno.css";
import "animate.css";

// ===== 核心配置 =====
import { setupDirective } from "@/directives";
import router, { setupRouter } from "@/router";
import { setupStore } from "@/stores";
import { setupI18n } from "@/plugins/i18n";

// ===== 全局组件 =====
import * as ElementPlusIcons from "@element-plus/icons-vue";

// ===== 路由守卫 =====
import { setupPermissionGuard } from "@/router/permission";

// ===== qiankun 微前端 =====
import { setupMicroApps } from "@/micro/register";
import { initAppGlobalState } from "@/micro/global-state";

// 创建 Vue 应用实例
const app = createApp(App);

// 1️⃣ 核心配置
setupDirective(app);
setupRouter(app);
setupStore(app);
setupI18n(app);

// 2️⃣ 全局组件（Element Plus 图标）
Object.entries(ElementPlusIcons).forEach(([name, comp]) => app.component(name, comp));

// 3️⃣ 路由守卫
setupPermissionGuard();

// 4️⃣ 先初始化 Global_State，确保 qiankun 首次挂载能读取已持久化的 token
initAppGlobalState();

// 5️⃣ 先挂载宿主；等待首轮路由完成后，布局中的子应用容器已进入 DOM
app.mount("#app");

// 6️⃣ 注册并启动 qiankun；首次直达 /#/platform/** 时也能找到容器
void router
  .isReady()
  .then(() => setupMicroApps())
  .catch((error) => console.error("[Main_App] qiankun 启动失败:", error));
