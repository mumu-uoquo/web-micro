/** 将集中配置注册到 qiankun。 */

import { registerMicroApps, start } from "qiankun";
import {
  MICRO_APP_CONFIGS,
  MULTI_INSTANCE_ENABLED,
  createHashActiveRule,
  resolveMicroAppContainer,
  resolveMicroAppEntry,
} from "./config";

export function setupMicroApps() {
  registerMicroApps(
    MICRO_APP_CONFIGS.map((config) => ({
      name: config.name,
      entry: resolveMicroAppEntry(config),
      container: resolveMicroAppContainer(config),
      activeRule: createHashActiveRule(config.activeRule),
      // single-spa 支持函数式 customProps；qiankun 类型声明仅允许 object。
      props: config.props as unknown as Record<string, unknown>,
    }))
  );

  start({
    // 单实例下 qiankun 要求新应用等待上一个应用卸载；多实例下各应用使用独立容器，需关闭该限制。
    singular: !MULTI_INSTANCE_ENABLED,
    sandbox: {
      experimentalStyleIsolation: true,
    },
  });
}
