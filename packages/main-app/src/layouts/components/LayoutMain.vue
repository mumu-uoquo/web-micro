<template>
  <section class="app-main" :style="{ height: appMainHeight }">
    <!--
      子应用挂载点始终保留在 DOM 中，供 qiankun 查找。
      容器元素是模块级常驻的（见 @/micro/containers），挂载后才放入此处；
      布局切换导致本组件重建时，同一批容器被移动到新的位置，已挂载的子应用不会丢失。
      多实例：每个子应用一个独立容器，只显示当前地址所属的子应用，其余保持挂载但隐藏。
      单实例：所有子应用共用一个容器。
    -->
    <div v-show="microAppRouteActive" ref="subAppHostRef" class="sub-app-host"></div>

    <!-- 微应用路由由 qiankun 渲染，避免宿主 Page404 与子应用争用内容区 -->
    <router-view>
      <template #default="{ Component, route }">
        <transition :name="transitionName" mode="out-in">
          <keep-alive :include="cachedViews">
            <component
              :is="currentComponent(Component, route)"
              v-if="!isMicroAppRoute(route.path, route.meta.microApp)"
              :key="route.path"
            />
          </keep-alive>
        </transition>
      </template>
    </router-view>

    <!-- 返回顶部按钮 -->
    <el-backtop target=".app-main">
      <div class="i-svg:backtop w-6 h-6" />
    </el-backtop>
  </section>
</template>

<script setup lang="ts">
import { useRoute, type RouteLocationNormalized } from "vue-router";
import { useSettingsStore, useTagsViewStore } from "@/stores";
import {
  MICRO_APP_CONFIGS,
  MULTI_INSTANCE_ENABLED,
  getSubAppContainerId,
  isMicroAppRoute,
} from "@/micro/config";
import { getPersistentSubAppContainer } from "@/micro/containers";
import variables from "@/styles/variables.module.scss";
import Error404 from "@/views/error/404.vue";

const route = useRoute();
const microAppRouteActive = computed(() => isMicroAppRoute(route.path, route.meta.microApp));

// 常驻容器：多实例每个子应用一个，单实例共用 #sub-app-container（与 MICRO_APP_CONFIGS 中的 container 一致）
const subAppContainers: { name?: string; el: HTMLElement }[] = MULTI_INSTANCE_ENABLED
  ? MICRO_APP_CONFIGS.map((config) => ({
      name: config.name,
      el: getPersistentSubAppContainer(getSubAppContainerId(config.name)),
    }))
  : [{ name: undefined, el: getPersistentSubAppContainer("sub-app-container") }];

const subAppHostRef = ref<HTMLElement>();

// appendChild 对已在其他位置的节点是移动而非复制，旧布局销毁后容器及其内容原样保留
onMounted(() => {
  const host = subAppHostRef.value;
  if (!host) return;
  subAppContainers.forEach(({ el }) => host.appendChild(el));
});

// 多实例：只显示当前地址所属的子应用
watchEffect(() => {
  if (!MULTI_INSTANCE_ENABLED) return;
  subAppContainers.forEach(({ name, el }) => {
    el.style.display = isMicroAppRoute(route.path, name) ? "" : "none";
  });
});

// 多实例：当前地址所属的子应用。容器从隐藏变为显示时，子应用内部的 onActivated 不会触发，
// 图表、表格等依赖容器尺寸的组件可能在隐藏期间量到 0，这里派发一次 resize 让它们重新布局。
const activeMicroAppName = computed(() =>
  MULTI_INSTANCE_ENABLED
    ? MICRO_APP_CONFIGS.find((config) => isMicroAppRoute(route.path, config.name))?.name
    : undefined
);
watch(activeMicroAppName, (name) => {
  if (name) nextTick(() => window.dispatchEvent(new Event("resize")));
});
const tagsViewStore = useTagsViewStore();
const { visitedViews, cachedViews } = toRefs(tagsViewStore);

const settingsStore = useSettingsStore();

// 路由组件包装器仅服务于仍在标签/KeepAlive 中或当前正在展示的页面。
// 标签关闭后及时删除，避免动态路由 path 对应的组件闭包永久滞留。
const wrapperMap = new Map<string, Component>();
const currentComponent = (
  component: Component,
  route: RouteLocationNormalized
): Component | undefined => {
  if (!component) return;

  const componentName = route.path;
  let wrapper = wrapperMap.get(componentName);

  if (!wrapper) {
    wrapper = {
      name: componentName,
      render: () => {
        try {
          return h(component, { key: componentName });
        } catch (error) {
          console.error(`Error rendering component for route: ${componentName}`, error);
          return h(Error404);
        }
      },
    };
    wrapperMap.set(componentName, wrapper);
  }

  return wrapper;
};

watchEffect(() => {
  const retainedPaths = new Set([
    route.path,
    ...visitedViews.value.map((view) => view.path),
    ...cachedViews.value,
  ]);

  for (const path of wrapperMap.keys()) {
    if (!retainedPaths.has(path)) {
      wrapperMap.delete(path);
    }
  }
});

onBeforeUnmount(() => {
  wrapperMap.clear();
});

const appMainHeight = computed(() => {
  if (settingsStore.showTagsView) {
    return `calc(100vh - ${variables["navbar-height"]} - ${variables["tags-view-height"]})`;
  } else {
    return `calc(100vh - ${variables["navbar-height"]})`;
  }
});

// 页面切换动画名称
const transitionName = computed(() => {
  return settingsStore.pageSwitchingAnimation ?? "";
});
</script>

<style lang="scss" scoped>
.app-main {
  position: relative;
  padding: 20px;
  overflow-y: auto;
  background-color: var(--page-bg);

  /* 宿主不生成盒子，容器的尺寸仍相对于 .app-main */
  .sub-app-host {
    display: contents;
  }
  /* 容器由脚本创建，不带 scoped 属性，需用 :deep 命中 */
  .sub-app-host :deep(.sub-app-container) {
    width: 100%;
    height: 100%;
  }
  .sub-app-host :deep(.sub-app-container [data-name]),
  .sub-app-host :deep(.sub-app-container #app) {
    width: 100%;
    height: 100%;
  }

  /* fade */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease-in-out;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* fade-slide */
  .fade-slide-leave-active,
  .fade-slide-enter-active {
    transition: all 0.3s;
  }
  .fade-slide-enter-from {
    opacity: 0;
    transform: translateX(-30px);
  }
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(30px);
  }

  /* fade-scale */
  .fade-scale-leave-active,
  .fade-scale-enter-active {
    transition: all 0.28s;
  }
  .fade-scale-enter-from {
    opacity: 0;
    transform: scale(1.2);
  }
  .fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.8);
  }
}
</style>
