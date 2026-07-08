<template>
  <component :is="linkType" v-bind="linkProps(to)">
    <slot />
  </component>
</template>

<script setup lang="ts">
defineOptions({
  name: "AppLink",
  inheritAttrs: false,
});

import { isExternal } from "@/utils/index";

const props = defineProps({
  to: {
    type: Object,
    required: true,
  },
});

const isExternalLink = computed(() => {
  return isExternal(props.to.path || "");
});

const linkType = computed(() => (isExternalLink.value ? "a" : "router-link"));

const linkProps = (to: any) => {
  // 外部链接
  if (isExternalLink.value) {
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
  }
  // 内部跳转
  return { to: { path: to.path, query: to.query } };
};
</script>
