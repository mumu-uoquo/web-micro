<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-message">抱歉，您访问的页面不存在</p>
      <router-link to="/" class="home-link">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Page404",
});
</script>

<style lang="scss" scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;

  .error-content {
    text-align: center;

    .error-code {
      margin: 0 0 16px;
      font-size: 72px;
      font-weight: bold;
      color: var(--el-color-primary, #409eff);
      line-height: 1;
    }

    .error-message {
      margin: 0 0 24px;
      font-size: 16px;
      color: var(--el-text-color-secondary, #909399);
    }

    .home-link {
      display: inline-block;
      padding: 8px 24px;
      font-size: 14px;
      color: #fff;
      text-decoration: none;
      background-color: var(--el-color-primary, #409eff);
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-color-primary-light-3, #79bbff);
      }
    }
  }
}
</style>
