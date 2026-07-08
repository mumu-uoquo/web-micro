<template>
  <el-config-provider :locale="locale" :size="size">
    <!-- 开启水印-->
    <el-watermark
      :font="{ color: fontColor }"
      :content="showWatermark ? watermarkContent : ''"
      :z-index="9999"
      class="wh-full"
    >
      <router-view />
    </el-watermark>
  </el-config-provider>
</template>

<script setup lang="ts">
import { useAppStore, useSettingsStore, useUserStore } from "@/stores";
import { ThemeMode, ComponentSize, WatermarkMode } from "@/enums";
import { defaults as defaultSettings } from "@/settings";
import { formatDate } from "@/utils/format";

const appStore = useAppStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const locale = computed(() => appStore.locale);
const size = computed(() => appStore.size as ComponentSize);
const showWatermark = computed(() => settingsStore.showWatermark);

// 明亮/暗黑主题水印字体颜色适配
const fontColor = computed(() => {
  return settingsStore.resolvedTheme === ThemeMode.DARK
    ? "rgba(255, 255, 255, .15)"
    : "rgba(0, 0, 0, .15)";
});

const route = useRoute();

// 不需要水印的路由白名单
const noWatermarkRoutes = ["/", "/login", "/403", "/404"];

/* ***************************** 水印内容 ********************************* */
/**
 * 水印内容
 * 关键：创建响应式的用户名和时间戳变量
 */
const timestamp = ref(Date.now());
const watermarkContent = computed(() => {
  // 不开启水印
  if (
    !settingsStore.showWatermark ||
    (defaultSettings.watermarkMode as string) === WatermarkMode.DISABLE
  ) {
    return "";
  }
  // 当前路由不需要水印
  if (noWatermarkRoutes.some((path) => route.path.startsWith(path))) {
    return "";
  }
  // 如果已经登录，则优先显示用户名
  if (userStore.userInfo.realName) {
    if ((defaultSettings.watermarkMode as string) === WatermarkMode.ACCOUNT) {
      return `${userStore.userInfo.realName} ${userStore.userInfo.phone}`;
    } else if ((defaultSettings.watermarkMode as string) === WatermarkMode.ACCOUNT_TIME) {
      return `${userStore.userInfo.realName} ${formatDate(timestamp.value)}`;
    }
  }
  // 默认显示系统名称
  return defaultSettings.watermarkContent;
});

/**
 * 刷新水印
 * 通过改变响应式数据触发重新计算
 */
const refreshWatermark = () => {
  timestamp.value = Date.now();
};

/**
 * 处理更新间隔变化
 */
let timer: ReturnType<typeof setInterval> | null = null;
const handleIntervalChange = (interval: number) => {
  // 清除之前的定时器
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // 设置新的定时器
  if (interval > 0) {
    timer = setInterval(() => {
      refreshWatermark();
    }, interval);
  }
};

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 组件挂载时
 */
onMounted(() => {
  if (timer) {
    clearInterval(timer);
  }
  // 立即刷新水印
  refreshWatermark();
  // 每10秒刷新一次水印
  if ((defaultSettings.watermarkMode as string) === WatermarkMode.ACCOUNT_TIME) {
    handleIntervalChange(10000);
  }
});
/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>
