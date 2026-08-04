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
import { ref, watch, shallowRef, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Page404 from "@/views/error/404.vue";
import { useSettingsStore } from "@/stores";

// 预加载所有动态页面组件
const dynamicComponents: Record<string, any> = import.meta.glob([
  "@/views/visitor/**/*.vue",
  "!@/views/visitor/dynamic.vue",
  "!@/views/visitor/**/components/*.vue",
]);

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const pageData = ref<any>(null); // 页面数据
const currentComponent = shallowRef(null); // 动态组件（浅层响应式，仅跟踪引用）

// 加载系统公共配置（visitor 路由不经过登录页，需在此处加载）
onMounted(() => {
  useSettingsStore().loadServerSettings();
});

/**
 * 根据路径动态加载组件或数据
 */
const loadDynamicPage = async () => {
  console.log("route path, params, query: ", route.path, route.params, route.query);
  // 1. 解析路径
  let path = route.path;
  if (!path || path?.endsWith("/")) {
    path += "index";
  }
  try {
    loading.value = true;

    // 2. 动态加载组件
    // 方案1：直接根据路径加载本地组件（适合静态页面适配）
    // 注意：Vite 动态导入需指定基础路径，避免完全动态路径
    const componentPath = `/src/views${path}.vue`;
    const componentModule = dynamicComponents[componentPath];
    if (componentModule) {
      const component = await componentModule();
      currentComponent.value = component.default;
    } else {
      throw new Error(`路径[ ${path} ]对应的页面不存在`);
    }

    // 方案2：通过后端接口获取页面配置（适合动态内容/多租户）
    // const res = await axios.get(`/api/pages/${pageKey}`);
    // pageData.value = res.data;
    // // 根据后端返回的组件名加载组件（需提前注册组件映射表）
    // currentComponent.value = componentsMap[res.data.component];
  } catch (error) {
    console.error(`动态页面[ /src/views${path}.vue ]加载失败:`, error);
    currentComponent.value = null; // 触发 404 显示
    router.push("/404");
  } finally {
    loading.value = false;
  }
};

// 监听路径变化，重新加载页面
watch(
  () => route.path,
  (_newVal, _oldVal) => {
    // console.log("route.path", oldVal, newVal);
    loadDynamicPage();
  },
  { immediate: true, deep: true }
);
// watch(
//   () => route.params,
//   (newVal, oldVal) => {
//     console.log("route.params", oldVal, newVal);
//     loadDynamicPage();
//   },
//   { immediate: true, deep: true }
// );
// watch(
//   () => route.query,
//   (newVal, oldVal) => {
//     console.log("route.query", oldVal, newVal);
//     loadDynamicPage();
//   },
//   { immediate: true, deep: true }
// );
</script>
