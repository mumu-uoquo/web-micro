<template>
  <div class="center-collapse" @click="toggleSidebar">
    <el-icon
      :class="['w-[16px]', 'h-[16px]', 'text-primary']"
      :style="{ transform: isSidebarOpen ? 'none' : 'rotateY(180deg)' }"
      :size="16"
    >
      <DArrowLeft />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { DArrowLeft } from "@element-plus/icons-vue";
import { useLayout } from "@/layouts/useLayout";
const { isSidebarOpen, toggleSidebar } = useLayout();
</script>

<style lang="scss" scoped>
.center-collapse {
  position: absolute;
  top: 50%;
  right: 2px;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 34px;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--pure-border-color);
  border-radius: 4px;
  transform: translate(12px, -50%);
}
</style>
