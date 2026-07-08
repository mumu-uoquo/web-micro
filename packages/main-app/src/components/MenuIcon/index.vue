<!-- 菜单图标组件：支持 Element Plus 图标和 SVG 图标 -->
<template>
  <el-icon v-if="isElIcon">
    <component :is="resolveComponent(iconName!)" />
  </el-icon>
  <div v-else :class="`i-svg:${icon || 'menu'}`" />
</template>

<script setup lang="ts">
defineOptions({ name: "MenuIcon" });

const props = defineProps({
  /** 图标名称，el-icon 开头为 Element Plus 图标，其余为 SVG 图标 */
  icon: {
    type: String,
    default: "",
  },
});

const isElIcon = computed(() => props.icon?.startsWith("el-icon"));
const iconName = computed(() => props.icon?.replace("el-icon-", ""));
</script>
