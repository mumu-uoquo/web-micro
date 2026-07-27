<template>
  <el-container class="standalone-layout">
    <el-aside width="220px" class="standalone-layout__aside">
      <div class="standalone-layout__brand">业务管理平台</div>
      <el-scrollbar>
        <el-menu router :default-active="route.path" class="standalone-layout__menu">
          <template v-for="section in menuSections" :key="section.key">
            <el-menu-item v-if="section.path" :index="section.path">
              {{ section.title }}
            </el-menu-item>
            <el-sub-menu v-else :index="section.key">
              <template #title>{{ section.title }}</template>
              <el-menu-item
                v-for="item in section.children"
                :key="item.path"
                :index="item.path"
              >
                {{ item.title }}
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container class="standalone-layout__body">
      <el-header class="standalone-layout__header">
        <span class="standalone-layout__title">{{ pageTitle }}</span>
        <div class="standalone-layout__user">
          <span>{{ displayName }}</span>
          <el-button type="danger" plain size="small" :loading="loggingOut" @click="handleLogout">
            退出
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthAPI from '@/api/auth'
import { useUserStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loggingOut = ref(false)

interface MenuEntry {
  path: string
  title: string
  order: number
}

interface MenuSection {
  key: string
  title: string
  order: number
  path?: string
  children: MenuEntry[]
}

/** 根据 router/routes.ts 中的 meta 自动生成独立运行菜单。 */
const menuSections = computed<MenuSection[]>(() => {
  const routes = router.getRoutes().filter((item) => item.meta.standaloneMenu === true)
  const sections: MenuSection[] = []
  const groups = new Map<string, MenuSection>()

  routes.forEach((item) => {
    const title = String(item.meta.title || item.path)
    const group = typeof item.meta.menuGroup === 'string' ? item.meta.menuGroup : ''
    const groupOrder = Number(item.meta.menuGroupOrder ?? 0)
    const order = Number(item.meta.menuOrder ?? 0)

    if (!group) {
      sections.push({ key: item.path, title, path: item.path, order: groupOrder, children: [] })
      return
    }

    let section = groups.get(group)
    if (!section) {
      section = { key: `group:${group}`, title: group, order: groupOrder, children: [] }
      groups.set(group, section)
      sections.push(section)
    }
    section.children.push({ path: item.path, title, order })
  })

  sections.forEach((section) => section.children.sort((a, b) => a.order - b.order))
  return sections.sort((a, b) => a.order - b.order)
})

const displayName = computed(
  () =>
    userStore.userInfo.realName ||
    userStore.userInfo.userName ||
    userStore.userInfo.phone ||
    '当前用户'
)

const pageTitle = computed(() => String(route.meta.title || route.meta.menuGroup || '业务管理平台'))

onMounted(() => {
  if (!userStore.userInfo.id) {
    userStore.getUserInfo().catch(() => undefined)
  }
})

async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await AuthAPI.logout()
  } catch {
    // 即使服务端退出失败，也清理本地登录态
  } finally {
    userStore.resetAllState()
    loggingOut.value = false
    await router.replace('/login')
  }
}
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
  flex: 0 0 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.standalone-layout__menu {
  border-right: 0;
  background: transparent;

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

.standalone-layout__user {
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
