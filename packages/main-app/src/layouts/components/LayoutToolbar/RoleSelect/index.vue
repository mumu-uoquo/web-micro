<template>
  <el-tooltip :content="currentRoleName" placement="bottom">
    <div v-if="roleList.length <= 1" class="tenant-switcher">
      <div class="tenant-switcher__trigger">
        <span class="tenant-switcher__label">{{ currentRoleName }}</span>
      </div>
    </div>
    <el-dropdown
      v-else
      class="tenant-switcher"
      trigger="click"
      :hide-on-click="true"
      @command="handleRoleChangeClick"
    >
      <!-- 显示当前角色名 -->
      <div class="tenant-switcher__trigger">
        <span class="tenant-switcher__label">{{ currentRoleName }}</span>
        <el-icon class="tenant-switcher__icon"><ArrowDown /></el-icon>
      </div>
      <!-- 仅显示图标
      <el-icon><Money /></el-icon>
      -->
      <template #dropdown>
        <el-dropdown-menu class="tenant-switcher__menu">
          <el-dropdown-item
            v-for="item in roleList"
            :key="item.id"
            :command="item.id"
            :disabled="item.id == userInfo.currentRoleId"
          >
            {{ item.roleName }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores";
import type { UserAuthDto, UserRoleDto } from "@/api/auth";

const userStore = useUserStore();
const router = useRouter();

// 当前用户
const userInfo = ref<UserAuthDto>({ id: "", instituteId: "" });
// 当前的角色名称
const currentRoleName = ref<string | undefined>("");
// 拥有的角色列表
const roleList = ref<UserRoleDto[]>([]);

/**
 * 刷新用户信息
 */
async function refreshUserInfo() {
  userInfo.value = await userStore.getUserInfo();
  currentRoleName.value = userInfo.value.roleList?.find(
    (item) => item.id === userInfo.value.currentRoleId
  )?.roleName;
  roleList.value = userInfo.value.roleList ? userInfo.value.roleList : [];
}
/**
 * 切换角色
 */
function handleRoleChangeClick(roleId: string) {
  userStore.changeRole(roleId).then(() => {
    currentRoleName.value = userInfo.value.roleList?.find((item) => item.id === roleId)?.roleName;
    ElMessage({
      message: `成功切换到[ ${currentRoleName.value} ]角色`,
      type: "success",
    });
    router.push({ path: "/", replace: true });
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面加载时
 */
onMounted(() => {
  refreshUserInfo();
});
</script>

<style scoped lang="scss">
.tenant-switcher {
  display: flex;
  align-items: center;
  height: 100%;

  &__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 10px;
    cursor: pointer;
    user-select: none;
    border-radius: 8px;
    transition: background 0.2s;
  }

  &__label {
    max-width: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    line-height: 1;
    white-space: nowrap;
  }

  &__icon {
    margin-left: 6px;
    font-size: 12px;
    opacity: 0.8;
  }

  &:hover {
    .tenant-switcher__trigger {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  :deep(.el-dropdown-menu__item.is-active) {
    font-weight: 600;
    color: var(--el-color-primary);
  }
}
</style>
