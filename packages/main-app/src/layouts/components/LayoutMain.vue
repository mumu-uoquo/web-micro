<template>
  <section class="app-main" :style="{ height: appMainHeight }">
    <!-- 子应用挂载点始终保留在 DOM 中，供 qiankun 查找 -->
    <div v-show="microAppRouteActive" id="sub-app-container"></div>

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
import { isMicroAppRoute } from "@/micro/config";
import variables from "@/styles/variables.module.scss";
import Error404 from "@/views/error/404.vue";

const route = useRoute();
const microAppRouteActive = computed(() => isMicroAppRoute(route.path, route.meta.microApp));
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

  #sub-app-container {
    width: 100%;
    height: 100%;
  }
  #sub-app-container :deep([data-name]),
  #sub-app-container :deep(#app) {
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
