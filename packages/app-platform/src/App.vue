<template>
  <el-config-provider :locale="appStore.locale">
    <StandaloneLayout v-if="showStandaloneLayout" />
    <div v-else class="wh-full">
      <router-view />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import StandaloneLayout from "@/layouts/StandaloneLayout.vue";
import { useAppStore } from "@/stores";

const route = useRoute();
const appStore = useAppStore();
const showStandaloneLayout = computed(
  () => !window.__POWERED_BY_QIANKUN__ && route.path !== "/login"
);
</script>
