<template>
  <el-tooltip :content="isDark ? '切换浅色模式' : '切换深色模式'" placement="bottom">
    <el-button :icon="isDark ? 'Sunny' : 'Moon'" circle text @click="toggle" />
  </el-tooltip>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores";
import { ThemeMode } from "@/enums";

const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.resolvedTheme === ThemeMode.DARK);

function toggle() {
  settingsStore.theme = isDark.value ? ThemeMode.LIGHT : ThemeMode.DARK;
}
</script>
