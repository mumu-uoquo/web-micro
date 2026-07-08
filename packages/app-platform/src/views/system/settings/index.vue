<template>
  <div class="app-container">
    <el-card shadow="never" body-style="height:83vh" class="table-container">
      <el-tabs tab-position="left">
        <el-tab-pane label="基本设置"><BasicSettings /></el-tab-pane>
        <el-tab-pane label="安全设置"><SecuritySettings /></el-tab-pane>
        <el-tab-pane label="登录模式"><LoginModeSettings /></el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import BasicSettings from "./components/BasicSettings.vue";
import SecuritySettings from "./components/SecuritySettings.vue";
import LoginModeSettings from "./components/LoginModeSettings.vue";
</script>
