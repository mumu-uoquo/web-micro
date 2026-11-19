<template>
  <el-config-provider :locale="appStore.locale">
    <!-- 开发调试（独立运行）：登录页单独渲染，其余页面带侧边栏布局 -->
    <template v-if="!runningInQiankun">
      <!-- 等初始路由解析完成后再选择布局，避免先闪出主布局并触发 auth/info -->
      <template v-if="routerReady">
        <StandaloneLayout v-if="showStandaloneLayout" />
        <div v-else class="wh-full">
          <router-view />
        </div>
      </template>
    </template>
    <!-- 生产（qiankun 挂载）：仅渲染业务页面，布局由主应用提供 -->
    <div v-else class="wh-full">
      <CachedRouterView />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import CachedRouterView from "@/components/CachedRouterView.vue";
import StandaloneLayout from "@/layouts/StandaloneLayout.vue";
import { useAppStore } from "@/stores";
import { isVisitorPath } from "@/router/config";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const runningInQiankun = Boolean(qiankunWindow.__POWERED_BY_QIANKUN__);
const routerReady = ref(false);
router.isReady().then(() => {
  routerReady.value = true;
});
// 登录页和访客页（免登录的全屏页面）不带侧边栏布局
const showStandaloneLayout = computed(() => route.path !== "/login" && !isVisitorPath(route.path));
</script>
