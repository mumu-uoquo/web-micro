<template>
  <el-config-provider :locale="appStore.locale">
    <StandaloneLayout v-if="showStandaloneLayout" />
    <div v-else class="wh-full">
      <CachedRouterView v-if="runningInQiankun" />
      <router-view v-else />
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
const showStandaloneLayout = computed(() => !runningInQiankun && route.path !== "/login");
</script>
