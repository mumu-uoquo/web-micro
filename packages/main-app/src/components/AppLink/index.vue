<template>
  <!-- 外部链接：新标签页打开 -->
  <a v-if="isExternalLink" v-bind="externalProps(to)">
    <slot />
  </a>
  <!--
    内部跳转：不渲染 href，只做应用内跳转。
    应用本身已有多标签页，不需要（也不支持）Ctrl/中键/右键「在浏览器新标签页打开」：
    新开的浏览器标签页是一次完整的主应用重新加载，未勾选「记住我」时没有令牌会被踢到登录页，
    并且会被当作主窗口，与现有的多标签、SSE 单连接设计冲突。
  -->
  <div v-else class="app-link" @click="navigate">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { isExternal } from "@/utils";

defineOptions({
  name: "AppLink",
  inheritAttrs: false,
});

const props = defineProps({
  to: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

const isExternalLink = computed(() => {
  return isExternal(props.to.path || "");
});

/** 外部链接的 <a> 属性 */
const externalProps = (to: any) => {
  const url = new URL(to.path, window.location.origin);
  const params = { ...to.query, ...to.params };
  Object.entries(params).map(([key, value]: any) => {
    url.searchParams.set(key, value);
  });
  return {
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
  };
};

/** 应用内跳转（与原 router-link 一致：只使用 path 和 query） */
function navigate() {
  router.push({ path: props.to.path, query: props.to.query }).catch(() => {});
}
</script>

<style lang="scss" scoped>
/* 原先是 <a>（内联）包裹 el-menu-item，这里用块级元素，宽度与菜单项一致 */
.app-link {
  display: block;
}
</style>
