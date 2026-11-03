<template>
  <BaseLayout>
    <!-- 顶部菜单栏 -->
    <div v-show="!appStore.contentFullscreen" class="layout__header">
      <div class="layout__header-content">
        <div v-if="showLogo" class="layout__header-logo">
          <LayoutLogo :collapse="isLogoCollapsed" />
        </div>

        <!-- 顶部菜单 -->
        <div class="layout__header-menu">
          <el-menu
            mode="horizontal"
            :default-active="activeTopMenuPath"
            :background-color="useMenuColors ? variables['menu-background'] : undefined"
            :text-color="useMenuColors ? variables['menu-text'] : undefined"
            :active-text-color="useMenuColors ? variables['menu-active-text'] : undefined"
            @select="handleTopMenuSelect"
          >
            <el-menu-item v-for="item in topMenuItems" :key="item.path" :index="item.path">
              <template v-if="item.meta">
                <MenuIcon :icon="item.meta.icon" />
                <span v-if="item.meta.title" class="ml-1">
                  {{ translateRouteTitle(item.meta.title) }}
                </span>
              </template>
            </el-menu-item>
          </el-menu>
        </div>

        <div class="layout__header-actions">
          <LayoutToolbar />
        </div>
      </div>
    </div>

    <!-- 主内容区容器 -->
    <div class="layout__container">
      <!-- 左侧菜单栏 -->
      <div
        v-show="!appStore.contentFullscreen"
        class="layout__sidebar--left"
        :class="{ 'layout__sidebar--collapsed': !isSidebarOpen }"
      >
        <el-scrollbar>
          <el-menu
            :default-active="activeSideMenuPath"
            :collapse="!isSidebarOpen"
            :collapse-transition="false"
            :unique-opened="false"
            :background-color="variables['menu-background']"
            :text-color="variables['menu-text']"
            :active-text-color="variables['menu-active-text']"
          >
            <LayoutSidebarItem
              v-for="item in sideMenuRoutes"
              :key="item.path"
              :item="item"
              :base-path="resolvePath(item.path)"
            />
          </el-menu>
        </el-scrollbar>
        <div class="layout__sidebar-toggle">
          <Hamburger :is-active="isSidebarOpen" @toggle-click="toggleSidebar" />
        </div>
      </div>

      <!-- 主内容区 -->
      <div :class="{ hasTagsView: showTagsView }" class="layout__main">
        <LayoutTagsView v-if="showTagsView" />
        <LayoutMain />
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import type { LocationQueryRaw, RouteRecordRaw } from "vue-router";
import { useWindowSize } from "@vueuse/core";
import { resolve } from "path-browserify";
import { useLayout } from "./useLayout";
import { useAppStore, usePermissionStore, useSettingsStore } from "@/stores";
import { isExternal, translateRouteTitle } from "@/utils";
import { SidebarColor, ThemeMode } from "@/enums";
import BaseLayout from "./BaseLayout.vue";
import LayoutLogo from "./components/LayoutLogo.vue";
import LayoutToolbar from "./components/LayoutToolbar/index.vue";
import LayoutTagsView from "./components/LayoutTagsView.vue";
import LayoutMain from "./components/LayoutMain.vue";
import LayoutSidebarItem from "./components/LayoutSidebarItem.vue";
import Hamburger from "./components/Hamburger/index.vue";
import variables from "@/styles/variables.module.scss";
import MenuIcon from "@/components/MenuIcon/index.vue";

const router = useRouter();
const route = useRoute();
const { width } = useWindowSize();

const appStore = useAppStore();
const permissionStore = usePermissionStore();
const settingsStore = useSettingsStore();

const { showTagsView, showLogo, isSidebarOpen, toggleSidebar, sideMenuRoutes, activeTopMenuPath } =
  useLayout();

const isLogoCollapsed = computed(() => width.value < 768);

// 是否使用深色菜单配色（暗色主题或经典蓝侧边栏）
const useMenuColors = computed(
  () =>
    settingsStore.resolvedTheme === ThemeMode.DARK ||
    settingsStore.sidebarColorScheme === SidebarColor.CLASSIC_BLUE
);

// 顶部菜单项（保持与后台配置一致的层级，不做单子菜单上提）
const topMenuItems = computed(() => permissionStore.routes.filter((item) => !item.meta?.hidden));

// 左侧菜单激活路径
const activeSideMenuPath = computed(() => {
  const { meta, path } = route;
  return typeof meta?.activeMenu === "string" ? meta.activeMenu : path;
});

// 解析左侧菜单路径
function resolvePath(routePath: string) {
  if (isExternal(routePath)) {
    return routePath;
  }
  // 绝对路径原样返回；相对路径基于顶级菜单拼接。
  // 顶级菜单为 "/" 时（如欢迎页），不能直接字符串拼接，否则会得到 "//welcome"。
  return resolve(activeTopMenuPath.value || "/", routePath);
}

/**
 * 根据当前访问路径查找所属的顶级菜单路径。
 *
 * 菜单路径带有微应用前缀（如 /platform/account/user），且子菜单路径不一定以父菜单路径开头
 * （如 /home 下的 /dashboard/index），因此不能用路径第一段推断，而是在路由树中查找：
 * 1. 优先精确匹配（路径等于某个菜单节点）
 * 2. 其次取最长前缀匹配（详情页等不在菜单中的子页面）
 */
function findTopMenuPath(targetPath: string): string | undefined {
  const found: { exact?: string; prefix?: string; prefixLength: number } = { prefixLength: -1 };

  const walk = (list: RouteRecordRaw[], base: string, topPath?: string) => {
    for (const item of list) {
      if (found.exact || isExternal(item.path)) continue;

      const fullPath = resolve(base, item.path);
      const currentTop = topPath ?? item.path;

      if (fullPath === targetPath) {
        found.exact = currentTop;
        return;
      }
      if (
        fullPath !== "/" &&
        targetPath.startsWith(`${fullPath}/`) &&
        fullPath.length > found.prefixLength
      ) {
        found.prefix = currentTop;
        found.prefixLength = fullPath.length;
      }
      if (item.children?.length) {
        walk(item.children, fullPath, currentTop);
      }
    }
  };

  // 使用完整路由表（含隐藏的 "/" 根路由），保证欢迎页、个人中心也能找到所属菜单
  walk(permissionStore.routes, "/");
  return found.exact ?? found.prefix;
}

// 顶部菜单点击
function handleTopMenuSelect(menuPath: string) {
  if (menuPath === activeTopMenuPath.value) return;

  appStore.activeTopMenu(menuPath);
  permissionStore.setMixLayoutSideMenus(menuPath);
  navigateToFirstMenu(permissionStore.mixLayoutSideMenus);
}

// 导航到第一个可访问菜单
function navigateToFirstMenu(menus: RouteRecordRaw[]) {
  if (!menus.length) return;

  const [first] = menus;
  if (first.children?.length) {
    navigateToFirstMenu(first.children as RouteRecordRaw[]);
  } else if (first.name) {
    router.push({
      name: first.name,
      query:
        typeof first.meta?.params === "object"
          ? (first.meta.params as LocationQueryRaw)
          : undefined,
    });
  }
}

// 监听路由变化，同步顶部菜单状态
watch(
  () => route.path,
  (newPath) => {
    // 详情页等可通过 meta.activeMenu 指定所属菜单，优先按它查找
    const activeMenu = typeof route.meta?.activeMenu === "string" ? route.meta.activeMenu : "";
    // 找不到所属菜单时（如 404 页）保持当前顶部菜单不变
    const topMenuPath =
      (activeMenu && findTopMenuPath(activeMenu)) ||
      findTopMenuPath(newPath) ||
      activeTopMenuPath.value;
    if (!topMenuPath) return;

    const isTopMenuChanged = topMenuPath !== activeTopMenuPath.value;

    if (isTopMenuChanged) {
      appStore.activeTopMenu(topMenuPath);
    }

    // 切换布局（如左侧 -> 混合）时，activeTopMenuPath 可能已是正确值，
    // 但 mixLayoutSideMenus 仍为空，需要补一次初始化。
    if (isTopMenuChanged || permissionStore.mixLayoutSideMenus.length === 0) {
      permissionStore.setMixLayoutSideMenus(topMenuPath);
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.layout {
  &__header {
    position: sticky;
    top: 0;
    z-index: 999;
    width: 100%;
    height: $navbar-height;
    background-color: var(--menu-background);
    border-bottom: 1px solid var(--card-border);
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 6%);

    &-content {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0;
    }

    &-logo {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    &-menu {
      display: flex;
      flex: 1;
      align-items: center;
      min-width: 0;
      height: 100%;
      overflow: hidden;

      :deep(.el-menu) {
        height: 100%;
        background-color: transparent;
        border: none;
      }

      :deep(.el-menu--horizontal) {
        display: flex;
        align-items: center;
        height: 100%;

        .el-menu-item {
          height: 100%;
          line-height: $navbar-height;
          border-bottom: none;

          &.is-active {
            background-color: rgba(255, 255, 255, 0.12);
            border-bottom: 2px solid var(--el-color-primary);
          }
        }
      }
    }

    &-actions {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      height: 100%;
      padding: 0 16px;
    }
  }

  &__container {
    display: flex;
    height: calc(100vh - $navbar-height);
    padding-top: 0;

    .layout__sidebar--left {
      position: relative;
      width: $sidebar-width;
      height: 100%;
      background-color: var(--menu-background);
      border-right: 1px solid var(--card-border);
      transition: width 0.28s;

      &.layout__sidebar--collapsed {
        width: $sidebar-width-collapsed !important;
      }

      :deep(.el-scrollbar) {
        height: calc(100vh - $navbar-height - 50px);
      }

      :deep(.el-menu) {
        height: 100%;
        border: none;
      }

      .layout__sidebar-toggle {
        position: absolute;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 50px;
        line-height: 50px;
        background-color: var(--menu-background);
        box-shadow: 0 0 6px -2px var(--el-color-primary);
      }
    }

    .layout__main {
      flex: 1;
      min-width: 0;
      height: 100%;
      margin-left: 0;
      overflow-y: auto;
    }
  }
}

:deep(.mobile) {
  .layout__container {
    .layout__sidebar--left {
      position: fixed;
      top: $navbar-height;
      bottom: 0;
      left: 0;
      z-index: 1000;
      transition: transform 0.28s;
    }
  }

  &.hideSidebar {
    .layout__sidebar--left {
      width: $sidebar-width !important;
      transform: translateX(-$sidebar-width);
    }
  }
}

:deep(.hasTagsView) {
  .app-main {
    height: calc(100vh - $navbar-height - $tags-view-height) !important;
  }
}
</style>
