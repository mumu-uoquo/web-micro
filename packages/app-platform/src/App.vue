<template>
  <el-config-provider :locale="appStore.locale">
    <!-- 开发调试（独立运行）：登录页单独渲染，其余页面带侧边栏布局 -->
    <template v-if="!runningInQiankun">
      <StandaloneLayout v-if="showStandaloneLayout" />
      <div v-else class="wh-full">
        <router-view />
      </div>
    </template>
    <!-- 生产（qiankun 挂载）：仅渲染业务页面，布局由主应用提供 -->
    <div v-else class="wh-full">
      <CachedRouterView />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import CachedRouterView from "@/components/CachedRouterView.vue";
import StandaloneLayout from "@/layouts/StandaloneLayout.vue";
import { useAppStore } from "@/stores";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";

const route = useRoute();
const appStore = useAppStore();
const runningInQiankun = Boolean(qiankunWindow.__POWERED_BY_QIANKUN__);
const showStandaloneLayout = computed(() => route.path !== "/login");
</script>
