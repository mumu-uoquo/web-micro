/**
 * qiankun 子应用注册配置
 *
 * @description
 * 注册 app-platform 子应用，配置 beforeMount 钩子注入最新 token/userInfo/permissions；
 * 启动 qiankun，开启 experimentalStyleIsolation CSS Scoping 样式隔离。
 *
 * Requirements: 3.7, 5.1
 */

import { registerMicroApps, start } from "qiankun";

export function setupMicroApps() {
  registerMicroApps(
    [
      {
        name: "app-platform",
        // Dev: http://localhost:7101  Prod: 由 VITE_SUB_APP_ENTRY 环境变量控制
        entry: import.meta.env.VITE_SUB_APP_ENTRY ?? "http://localhost:7101",
        container: "#sub-app-container",
        activeRule: "/platform", // 所有 /platform/* 路由激活子应用
        props: {}, // 初始 props 为空，beforeMount 钩子注入最新状态
      },
    ],
    {
      beforeMount: [
        async (app) => {
          // 在挂载子应用前，将最新 Pinia store 状态注入 props
          const { getGlobalActions } = await import("./global-state");
          const actions = getGlobalActions();
          const { token, userInfo, permissions } = actions.getState();
          // qiankun 通过 props 将状态传递给子应用 mount(props)
          if (app.props) {
            Object.assign(app.props, { token, userInfo, permissions });
          } else {
            app.props = { token, userInfo, permissions };
          }
        },
      ],
    }
  );

  start({
    sandbox: {
      experimentalStyleIsolation: true, // CSS Scoping 样式隔离
    },
  });
}
