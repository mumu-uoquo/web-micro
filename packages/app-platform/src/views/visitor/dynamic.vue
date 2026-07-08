<template>
  <div class="dynamic-page">
    <!-- 加载中状态 -->
    <div v-if="loading" class="w-full h-full text-center loading">加载中...</div>
    <!-- 动态组件 -->
    <component :is="currentComponent" v-else-if="currentComponent" :page-data="pageData" />
    <!-- 页面不存在 -->
    <div v-else class="w-full h-full text-center">
      <Page404 />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import Page404 from "@/views/error/404.vue";

// 预加载所有动态页面组件
const dynamicComponents: Record<string, any> = import.meta.glob([
  "@/views/visitor/**/*.vue",
  "!@/views/visitor/dynamic.vue",
  "!@/views/visitor/**/components/*.vue",
]);

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const pageData = ref<any>(null);
const currentComponent = shallowRef(null);

/**
 * 根据路径动态加载组件
 */
const loadDynamicPage = async () => {
  let path = route.path;
  if (!path || path?.endsWith("/")) {
    path += "index";
  }
  try {
    loading.value = true;
    const componentPath = `/src/views${path}.vue`;
    const componentModule = dynamicComponents[componentPath];
    if (componentModule) {
      const component = await componentModule();
      currentComponent.value = component.default;
    } else {
      throw new Error(`路径[ ${path} ]对应的页面不存在`);
    }
  } catch (error) {
    console.error(`动态页面加载失败:`, error);
    currentComponent.value = null;
    router.push("/404");
  } finally {
    loading.value = false;
  }
};

watch(
  () => route.path,
  () => {
    loadDynamicPage();
  },
  { immediate: true, deep: true }
);
</script>
