<template>
  <el-container class="standalone-layout">
    <el-aside width="220px" class="standalone-layout__aside">
      <div class="standalone-layout__brand">
        <img :src="logo" alt="logo" class="standalone-layout__logo" />
        <span class="standalone-layout__brand-text">{{ appConfig.title }}</span>
      </div>
      <el-scrollbar>
        <el-menu
          router
          :default-active="route.path"
          :default-openeds="defaultOpeneds"
          class="standalone-layout__menu"
        >
          <template v-for="section in menuSections" :key="section.key">
            <!-- 无分组：直接作为一级菜单 -->
            <el-menu-item v-if="section.path" :index="section.path">
              <MenuIcon :icon="section.icon" />
              <span class="ml-1">{{ translateRouteTitle(section.title) }}</span>
            </el-menu-item>
            <!-- 有分组：子菜单 -->
            <el-sub-menu v-else :index="section.key">
              <template #title>
                <MenuIcon :icon="section.icon" />
                <span class="ml-1">{{ translateRouteTitle(section.title) }}</span>
              </template>
              <el-menu-item v-for="item in section.children" :key="item.path" :index="item.path">
                <MenuIcon :icon="item.icon" />
                <span class="ml-1">{{ translateRouteTitle(item.title) }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container class="standalone-layout__body">
      <el-header class="standalone-layout__header">
        <span class="standalone-layout__title">{{ pageTitle }}</span>
        <div class="standalone-layout__tools">
          <LangSelect size="text-20px" />
          <span>{{ displayName }}</span>
          <el-button type="danger" plain size="small" :loading="loggingOut" @click="handleLogout">
            {{ t("navbar.logout") }}
          </el-button>
        </div>
      </el-header>
      <el-main class="standalone-layout__main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import logo from "@/assets/images/logo.png";
import { appConfig } from "@/settings";
import { translateRouteTitle } from "@/utils";
import { useUserStore } from "@/stores";
import AuthAPI from "@/api/auth";
import MenuIcon from "@/components/MenuIcon/index.vue";
import LangSelect from "@/components/LangSelect/index.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const loggingOut = ref(false);

const displayName = computed(
  () =>
    userStore.userInfo.realName ||
    userStore.userInfo.userName ||
    userStore.userInfo.phone ||
    "当前用户"
);

onMounted(() => {
  // 已有 token（如从主应用新标签页带票据进入）但还没有用户信息时，补取一次
  if (!userStore.userInfo.id) {
    userStore.getUserInfo().catch(() => undefined);
  }
});

/** 退出登录（仅开发调试模式）：调用服务端退出，清理本地登录态并回到登录页 */
async function handleLogout() {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await AuthAPI.logout();
  } catch {
    // 即使服务端退出失败，也清理本地登录态
  } finally {
    userStore.resetAllState();
    loggingOut.value = false;
    await router.replace("/login");
  }
}

interface MenuEntry {
  path: string;
  title: string;
  icon?: string;
  order: number;
}

interface MenuSection {
  key: string;
  title: string;
  icon?: string;
  order: number;
  path?: string;
  children: MenuEntry[];
}

/** 根据 router/routes.ts 中的 meta 自动生成独立运行菜单（支持分组、图标、i18n 标题）。 */
const menuSections = computed<MenuSection[]>(() => {
  const routes = router.getRoutes().filter((item) => item.meta.standaloneMenu === true);
  const sections: MenuSection[] = [];
  const groups = new Map<string, MenuSection>();

  routes.forEach((item) => {
    const title = String(item.meta.title || item.path);
    const icon = typeof item.meta.icon === "string" ? item.meta.icon : undefined;
    const group = typeof item.meta.menuGroup === "string" ? item.meta.menuGroup : "";
    const groupOrder = Number(item.meta.menuGroupOrder ?? 0);
    const order = Number(item.meta.menuOrder ?? 0);

    if (!group) {
      sections.push({
        key: item.path,
        title,
        icon,
        path: item.path,
        order: groupOrder,
        children: [],
      });
      return;
    }

    let section = groups.get(group);
    if (!section) {
      section = {
        key: `group:${group}`,
        title: group,
        icon: typeof item.meta.menuGroupIcon === "string" ? item.meta.menuGroupIcon : undefined,
        order: groupOrder,
        children: [],
      };
      groups.set(group, section);
      sections.push(section);
    }
    section.children.push({ path: item.path, title, icon, order });
  });

  sections.forEach((section) => section.children.sort((a, b) => a.order - b.order));
  return sections.sort((a, b) => a.order - b.order);
});

/** 默认展开所有分组 */
const defaultOpeneds = computed(() =>
  menuSections.value.filter((section) => !section.path).map((section) => section.key)
);

const pageTitle = computed(() =>
  translateRouteTitle(route.meta.title || route.meta.menuGroup || appConfig.title)
);
</script>

<style scoped lang="scss">
.standalone-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.standalone-layout__aside {
  display: flex;
  flex-direction: column;
  color: #e5e7eb;
  background: #172033;
}

.standalone-layout__brand {
  display: flex;
  flex: 0 0 60px;
  gap: 10px;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.standalone-layout__logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.standalone-layout__brand-text {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.standalone-layout__menu {
  background: transparent;
  border-right: 0;

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    color: #cbd5e1;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    color: #fff;
    background: rgb(255 255 255 / 8%);
  }

  :deep(.el-menu-item.is-active) {
    color: #fff;
    background: var(--el-color-primary);
  }
}

.standalone-layout__body {
  min-width: 0;
}

.standalone-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.standalone-layout__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.standalone-layout__tools {
  display: flex;
  gap: 14px;
  align-items: center;
  color: var(--el-text-color-regular);
}

.standalone-layout__main {
  min-width: 0;
  padding: 20px;
  overflow: auto;
}

@media (max-width: 768px) {
  .standalone-layout__aside {
    width: 180px !important;
  }

  .standalone-layout__header {
    padding: 0 16px;
  }

  .standalone-layout__main {
    padding: 12px;
  }
}
</style>
