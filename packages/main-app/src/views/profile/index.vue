<template>
  <el-container class="profile-page">
    <!-- 左侧固定栏 -->
    <el-aside class="profile-sidebar">
      <ProfileSidebar :user-info="userInfo" :loading="loading" @refresh="fetchUserInfo" />
    </el-aside>

    <!-- 右侧滚动内容区 -->
    <el-main class="profile-content">
      <SecuritySection :user-info="userInfo" @refresh="fetchUserInfo" />

      <NotificationSection />

      <!-- 预留：第三方账号绑定 -->
      <el-card>
        <template #header>
          <span>第三方账号绑定</span>
        </template>
        <div>敬请期待</div>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import UserAPI, { type UserInfoDto } from "@/api/user";
import ProfileSidebar from "./components/ProfileSidebar.vue";
import SecuritySection from "./components/SecuritySection.vue";
import NotificationSection from "./components/NotificationSection.vue";

/**
 * 获取用户信息
 */
const userInfo = ref<UserInfoDto | null>(null);
const loading = ref(false);
async function fetchUserInfo() {
  loading.value = true;
  try {
    userInfo.value = await UserAPI.getUserProfileInfo();
  } finally {
    loading.value = false;
  }
}

/* ***************************** 监听器等（需放在最后） ********************************* */
// 页面挂载时自动获取
onMounted(async () => {
  const [userInfoResult] = await Promise.allSettled([fetchUserInfo()]);
  if (userInfoResult.status === "rejected") {
    const err = userInfoResult.reason as any;
    ElMessage.error(err?.message ?? "获取用户信息失败");
  }
});
</script>

<style scoped>
.profile-page {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  min-height: 100%;
  padding: 20px;
}

.profile-sidebar {
  position: sticky;
  top: 20px;
  flex: 0 0 300px;
  width: 300px;
}

.profile-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  padding: 0;
  /* max-height: calc(100vh - 100px); */
  overflow-y: auto;
}
</style>
