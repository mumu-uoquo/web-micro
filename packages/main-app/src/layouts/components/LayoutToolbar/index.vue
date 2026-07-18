<template>
  <div :class="['navbar-actions', navbarActionsClass]">
    <!-- 桌面端工具项 -->
    <template v-if="isDesktop">
      <!-- 搜索 -->
      <div class="navbar-actions__item">
        <CommandPalette />
      </div>

      <!-- 全屏 -->
      <div class="navbar-actions__item">
        <Fullscreen />
      </div>

      <!-- 布局大小 -->
      <div class="navbar-actions__item">
        <SizeSelect />
      </div>

      <!-- 语言选择 -->
      <div class="navbar-actions__item">
        <LangSelect />
      </div>

      <!-- 通知 -->
      <div class="navbar-actions__item">
        <NoticeDropdown />
      </div>

      <!-- 租户选择（如果启用多租户）-->
      <div v-if="showTenantSwitcher" class="navbar-actions__item">
        <TenantSwitcher @change="handleTenantChange" />
      </div>

      <!-- 角色切换 -->
      <div v-if="roleList.length > 1" class="navbar-actions__item">
        <RoleSelect />
      </div>
    </template>

    <!-- 小屏：消息入口（仅显示图标和数量，点击跳转消息页） -->
    <template v-if="!isDesktop">
      <div class="navbar-actions__item">
        <NoticeDropdown :mobile="true" />
      </div>
    </template>

    <!-- 用户菜单 -->
    <div class="navbar-actions__item">
      <el-dropdown trigger="click">
        <div class="user-profile" @click="refreshUserInfo">
          <!--
          <div style="width: 28px; height: 28px; overflow: hidden; border-radius: 50%">
            <img
              :src="userInfo.avatar"
              class="user-profile__avatar"
              style="width: 100%; height: 100%; object-fit: cover; object-position: center"
            />
          </div>
          -->
          <el-avatar
            :size="25"
            :src="userInfo.avatar ?? defaultAvatar"
            class="user-profile__avatar"
          />
          <span class="user-profile__name">{{ userInfo.realName }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>
              {{ userInfo.userName }}（{{ userInfo.phone }}）
            </el-dropdown-item>

            <el-dropdown-item divided @click="handleProfileClick">
              {{ t("navbar.profile") }}
            </el-dropdown-item>
            <el-dropdown-item @click="openChangePasswordDialog">密码修改</el-dropdown-item>

            <el-dropdown-item divided @click="logout">{{ t("navbar.logout") }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 系统设置 -->
    <div v-if="defaults.showSettings" class="navbar-actions__item" @click="handleSettingsClick">
      <div class="i-svg:setting" />
    </div>
  </div>

  <!-- 密码修改对话框 -->
  <ChangePasswordDialog ref="changePasswordDialogRef" />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { defaults } from "@/settings";
import { DeviceEnum, SidebarColor, ThemeMode, LayoutMode } from "@/enums";
import { useAppStore, useSettingsStore, useUserStore } from "@/stores";
import type { UserAuthDto, UserRoleDto } from "@/api/auth";
import { disconnectSse } from "@/composables/sse";
// 导入子组件
import CommandPalette from "./CommandPalette/index.vue";
import Fullscreen from "./Fullscreen/index.vue";
import SizeSelect from "./SizeSelect/index.vue";
import NoticeDropdown from "./NoticeDropdown/index.vue";
import TenantSwitcher from "./TenantSwitcher/index.vue";
import RoleSelect from "./RoleSelect/index.vue";
import ChangePasswordDialog from "./ChangePasswordDialog/index.vue";
import LangSelect from "@/components/LangSelect/index.vue";
import { useTenantStoreHook } from "@/stores";

const { t } = useI18n();
const appStore = useAppStore();
const settingStore = useSettingsStore();
const userStore = useUserStore();
const tenantStore = useTenantStoreHook();

const route = useRoute();
const router = useRouter();

// 是否为桌面设备
const isDesktop = computed(() => appStore.device === DeviceEnum.DESKTOP);

/* ***************************** 多租户 ********************************* */
// 是否显示租户选择
const canSwitchTenant = computed(() => (userStore.userInfo as any)?.canSwitchTenant === true);
const showTenantSwitcher = computed(() => {
  if (!canSwitchTenant.value) {
    return false;
  }
  return tenantStore.tenantList.length > 1;
});
/**
 * 切换租户
 */
function handleTenantChange(tenantId: number) {
  tenantStore.switchTenant(tenantId).then(
    () => {
      ElMessage.success("切换租户成功");
      window.location.href = "/";
    },
    (error: any) => {
      ElMessage.error(error.message || "切换租户失败");
    }
  );
}

/* ***************************** 用户信息 ********************************* */
// 默认头像
const defaultAvatar = ref(new URL("@/assets/images/avatar-default.png", import.meta.url).href);
// 当前用户
const userInfo = ref<UserAuthDto>({ id: "", instituteId: "" });
// // 当前的角色名称
// const currentRoleName = ref<string | undefined>("");
// 拥有的角色列表
const roleList = ref<UserRoleDto[]>([]);
/**
 * 刷新用户信息
 */
async function refreshUserInfo() {
  userInfo.value = await userStore.getUserInfo();
  // currentRoleName.value = userInfo.value.roleList?.find(
  //   (item: UserRoleDto) => item.id === userInfo.value.currentRoleId
  // )?.roleName;
  roleList.value = userInfo.value.roleList ? userInfo.value.roleList : [];
}

/**
 * 打开个人中心页面
 */
function handleProfileClick() {
  router.push({ name: "Profile" });
}

/**
 * 弹出改密窗口
 */
const changePasswordDialogRef = ref<InstanceType<typeof ChangePasswordDialog>>();
function openChangePasswordDialog() {
  changePasswordDialogRef.value?.openDialog();
}

/**
 * 退出登录
 */
function logout() {
  ElMessageBox.confirm("确定注销并退出系统吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    lockScroll: false,
  }).then(() => {
    // 断开 SSE 连接（事件订阅由各组件自行 cleanup）
    disconnectSse();
    userStore.logout().finally(() => {
      // 无论退出接口是否正常响应，都跳转到登录页面
      // 若当前已在 404/401 等错误页，退出后不再跳回错误页
      const redirect = ["/404", "/401"].includes(route.path) ? "/" : route.fullPath;
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
    });
  });
}

/* ***************************** 动态样式 ********************************* */
// 根据主题和侧边栏配色方案选择样式类
const navbarActionsClass = computed(() => {
  const { resolvedTheme, sidebarColorScheme, layout } = settingStore;

  // 暗黑主题下，所有布局都使用白色文字
  if (resolvedTheme === ThemeMode.DARK) {
    return "navbar-actions--white-text";
  }

  // 明亮主题下
  if (resolvedTheme === ThemeMode.LIGHT) {
    // 顶部布局和混合布局的顶部区域：
    // - 如果侧边栏是经典蓝色，使用白色文字
    // - 如果侧边栏是极简白色，使用深色文字
    if (layout === LayoutMode.TOP || layout === LayoutMode.MIX) {
      if (sidebarColorScheme === SidebarColor.CLASSIC_BLUE) {
        return "navbar-actions--white-text";
      } else {
        return "navbar-actions--dark-text";
      }
    }
  }

  return "navbar-actions--dark-text";
});

/**
 * 打开系统设置页面
 */
function handleSettingsClick() {
  settingStore.settingsVisible = true;
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面加载时
 */
onMounted(() => {
  refreshUserInfo();
});
</script>

<style lang="scss" scoped>
.navbar-actions {
  display: flex;
  align-items: center;
  min-height: 44px;

  &__item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px; /* 增加最小点击区域到44px，符合人机交互标准 */
    height: 44px;
    padding: 0 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;

    // 只对需要居中的子元素生效，不使用通配符避免影响选择器组件
    > [class^="i-svg:"] {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    // 确保 Element Plus 组件可以正常工作
    :deep(.el-dropdown),
    :deep(.el-tooltip) {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 44px;
    }

    :deep(.i-svg\:language) {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      font-size: 16px;
      line-height: 16px;
      background-size: 16px 16px;
    }

    // 图标样式
    :deep([class^="i-svg:"]) {
      font-size: 16px;
      line-height: 1;
      color: var(--el-text-color-secondary);
      transition: color 0.2s;
    }

    &:hover {
      background: var(--el-fill-color-light);

      :deep([class^="i-svg:"]) {
        color: var(--el-color-primary);
      }
    }
  }

  .user-profile {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 44px;
    padding: 0 8px;

    &__avatar {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }

    &__name {
      margin-left: 8px;
      color: var(--el-text-color-regular);
      white-space: nowrap;
      transition: color 0.3s;
    }
  }
}

// 白色文字样式（用于深色背景：暗黑主题、顶部布局、混合布局等）
.navbar-actions--white-text {
  .navbar-actions__item {
    :deep([class^="i-svg:"]) {
      color: color-mix(in srgb, var(--el-color-white) 85%, transparent);
    }

    &:hover {
      background: color-mix(in srgb, var(--el-color-white) 10%, transparent);

      :deep([class^="i-svg:"]) {
        color: var(--el-color-white);
      }
    }
  }

  .user-profile__name {
    color: color-mix(in srgb, var(--el-color-white) 85%, transparent);
  }

  // 租户选择器在白色文字模式下的样式
  ::v-deep(.tenant-switcher__trigger) {
    color: color-mix(in srgb, var(--el-color-white) 85%, transparent);
  }
  ::v-deep(.tenant-switcher__trigger .tenant-switcher__icon) {
    color: color-mix(in srgb, var(--el-color-white) 85%, transparent);
  }
  ::v-deep(.tenant-switcher__trigger:hover) {
    color: var(--el-color-white);
    background: color-mix(in srgb, var(--el-color-white) 10%, transparent);
  }
  ::v-deep(.tenant-switcher__trigger:hover .tenant-switcher__icon) {
    color: var(--el-color-white);
  }
}

// 深色文字样式（用于浅色背景：明亮主题下的左侧布局等）
.navbar-actions--dark-text {
  .navbar-actions__item {
    :deep([class^="i-svg:"]) {
      color: var(--el-text-color-secondary) !important;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.04);

      :deep([class^="i-svg:"]) {
        color: var(--el-color-primary) !important;
      }
    }
  }

  .user-profile__name {
    color: var(--el-text-color-regular) !important;
  }

  // 租户选择器在深色文字模式下的样式
  ::v-deep(.tenant-switcher__trigger) {
    color: var(--el-text-color-regular) !important;
  }
  ::v-deep(.tenant-switcher__trigger .tenant-switcher__icon) {
    color: var(--el-text-color-regular) !important;
  }
  ::v-deep(.tenant-switcher__trigger:hover) {
    color: var(--el-color-primary) !important;
    background: var(--el-fill-color-light);
  }
  ::v-deep(.tenant-switcher__trigger:hover .tenant-switcher__icon) {
    color: var(--el-color-primary) !important;
  }
}

// 确保下拉菜单中的图标不受影响
::v-deep(.el-dropdown-menu) {
  [class^="i-svg:"] {
    color: var(--el-text-color-regular) !important;

    &:hover {
      color: var(--el-color-primary) !important;
    }
  }
}
</style>
