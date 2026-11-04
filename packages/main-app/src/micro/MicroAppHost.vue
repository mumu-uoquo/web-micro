<template>
  <!--
    子应用的全屏承载页（无 Layout）。用于不经过主框架、直接由子应用渲染的页面，
    如弹窗打开的 /<子应用前缀>/visitor/**。
    容器与 LayoutMain 共用同一批常驻元素（见 @/micro/containers），qiankun 按容器选择器查找并挂载。
  -->
  <div ref="hostRef" class="micro-app-host" />
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import {
  MICRO_APP_CONFIGS,
  MULTI_INSTANCE_ENABLED,
  getSubAppContainerId,
  isMicroAppRoute,
} from "./config";
import { getPersistentSubAppContainer } from "./containers";

defineOptions({ name: "MicroAppHost" });

const route = useRoute();
const hostRef = ref<HTMLElement>();

// 多实例：每个子应用一个独立容器；单实例：共用 #sub-app-container（与 MICRO_APP_CONFIGS 中的 container 一致）
const containers: { name?: string; el: HTMLElement }[] = MULTI_INSTANCE_ENABLED
  ? MICRO_APP_CONFIGS.map((config) => ({
      name: config.name,
      el: getPersistentSubAppContainer(getSubAppContainerId(config.name)),
    }))
  : [{ name: undefined, el: getPersistentSubAppContainer("sub-app-container") }];

// appendChild 对已在其他位置的节点是移动而非复制
onMounted(() => {
  const host = hostRef.value;
  if (!host) return;
  containers.forEach(({ el }) => host.appendChild(el));
});

// 多实例：只显示当前地址所属的子应用
watchEffect(() => {
  if (!MULTI_INSTANCE_ENABLED) return;
  containers.forEach(({ name, el }) => {
    el.style.display = isMicroAppRoute(route.path, name) ? "" : "none";
  });
});
</script>

<style lang="scss" scoped>
.micro-app-host {
  width: 100%;
  height: 100vh;

  /* 容器由脚本创建，不带 scoped 属性，需用 :deep 命中 */
  :deep(.sub-app-container) {
    width: 100%;
    height: 100%;
  }

  :deep(.sub-app-container [data-name]),
  :deep(.sub-app-container #app) {
    width: 100%;
    height: 100%;
  }
}
</style>
