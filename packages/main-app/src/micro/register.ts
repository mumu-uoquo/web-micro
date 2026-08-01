/** 将集中配置注册到 qiankun。 */

import { registerMicroApps, start } from "qiankun";
import { MICRO_APP_CONFIGS, createHashActiveRule, resolveMicroAppEntry } from "./config";

export function setupMicroApps() {
  registerMicroApps(
    MICRO_APP_CONFIGS.map((config) => ({
      name: config.name,
      entry: resolveMicroAppEntry(config),
      container: config.container,
      activeRule: createHashActiveRule(config.activeRule),
      // single-spa 支持函数式 customProps；qiankun 类型声明仅允许 object。
      props: config.props as unknown as Record<string, unknown>,
    }))
  );

  start({
    sandbox: {
      experimentalStyleIsolation: true,
    },
  });
}
