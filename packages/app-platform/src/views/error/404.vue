<template>
  <div class="wh-full mx-auto flex-center flex-col lg:flex-row">
    <img class="min-w-[23.4375rem] sm:w-150" src="@/assets/images/error/404.svg" alt="404" />
    <div class="w-75">
      <div class="oops mb-5 text-[2rem] font-bold">OOPS</div>
      <div class="info text-gray mb-7 text-[0.8125rem]">
        该页面无法访问
        <el-link type="primary" href="https://www.youlai.tech" target="_blank">
          有来开源官网
        </el-link>
      </div>
      <div class="headline mb-2.5 text-xl font-bold text-[#222]">抱歉，您访问的页面不存在</div>
      <div class="info text-gray mb-4 text-[0.8125rem]">
        请确认您输入的网址是否正确，或者点击下方按钮返回首页
      </div>
      <div class="detail mb-4 text-[0.8125rem]">
        <div>子应用：{{ APP_NAME }}</div>
        <div>子应用内路径：{{ childPath }}</div>
        <div v-if="hostHash">宿主地址：{{ hostHash }}</div>
        <div>约定页面文件：{{ viewFile }}</div>
        <div class="detail-tip">
          该路径未在 {{ APP_NAME }} 的 src/router/routes.ts
          中注册。请核对「模块管理」中的微前端前缀、路由地址，是否与 routes.ts 及页面文件路径一致。
        </div>
      </div>
      <el-button round type="primary" class="btn h-9 w-28 mb-10" @click="back">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { HOST_ROUTE_PREFIX } from "@/router/config";

defineOptions({ name: "Page404" });

const APP_NAME = "app-platform";
const route = useRoute();
const router = useRouter();
const back = () => router.push("/");

// 子应用内路径（不含宿主前缀）
const childPath = computed(() => route.path);
// 宿主中的访问地址，仅在作为微应用运行时有意义
const hostHash = computed(() =>
  qiankunWindow.__POWERED_BY_QIANKUN__
    ? `#${HOST_ROUTE_PREFIX}${route.path === "/" ? "" : route.fullPath}`
    : ""
);
// 约定：路由地址 + ".vue" 即页面文件
const viewFile = computed(() => {
  const path = !route.path || route.path.endsWith("/") ? `${route.path}index` : route.path;
  return `src/views${path}.vue`;
});

watch(
  () => route.fullPath,
  () => {
    console.warn(
      `[${APP_NAME}] 路由未注册: ${route.fullPath}，约定页面文件: ${viewFile.value}。` +
        "请核对模块管理中的路由配置与 src/router/routes.ts。"
    );
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
@mixin slide-up-animation($delay: 0s) {
  opacity: 0;
  animation-name: slideUp;
  animation-duration: 0.5s;
  animation-delay: $delay;
  animation-fill-mode: forwards;
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(60px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.oops {
  color: var(--el-color-primary);
  @include slide-up-animation(0s);
}

.headline {
  @include slide-up-animation(0.1s);
}

.info {
  @include slide-up-animation(0.2s);
}

.detail {
  padding: 10px 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  word-break: break-all;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  @include slide-up-animation(0.25s);

  .detail-tip {
    margin-top: 6px;
    color: var(--el-text-color-secondary);
  }
}

.btn {
  @include slide-up-animation(0.3s);
}
</style>
