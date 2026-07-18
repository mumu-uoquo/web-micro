<template>
  <div v-loading="loading" class="frame" :element-loading-text="t('status.pureLoad')">
    <iframe ref="frameRef" :src="frameSrc" class="frame-iframe" />
  </div>
</template>

<script setup lang="ts">
import { ref, unref, onMounted, nextTick } from "vue";
import { type LocationQuery } from "vue-router";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  src?: string;
  params?: LocationQuery;
}
const props = withDefaults(defineProps<Props>(), {});

/* ***************************** 页面初始化 ********************************* */
const loading = ref(true);
const frameSrc = ref<string>("");
const frameRef = ref<HTMLElement | null>(null);
const fallbackTimer = ref<number | null>(null);

/**
 * 清理定时器
 */
function clearFallbackTimer() {
  if (fallbackTimer.value) {
    clearTimeout(fallbackTimer.value);
    fallbackTimer.value = null;
  }
}

/**
 * 隐藏加载层
 */
function hideLoading() {
  loading.value = false;
  clearFallbackTimer();
}

/**
 * 初始化
 */
function init() {
  nextTick(() => {
    const iframe = unref(frameRef);
    if (!iframe) return;
    const _frame = iframe as any;
    if (_frame.attachEvent) {
      _frame.attachEvent("onload", hideLoading);
    } else {
      iframe.onload = hideLoading;
    }
  });
}

/* ***************************** URL及参数处理 ********************************* */
/**
 * 参数处理
 */
function handleParams(params: LocationQuery): Record<string, string> {
  const _params = {} as Record<string, string>;
  Object.entries(params).map(([key, val]: any) => {
    // TODO 需要处理 val 中的变量 ${}
    _params[key] = val;
  });
  return _params;
}

/**
 * 内容加载
 */
function loadFrameSrc(url: string, params: Record<string, string>) {
  loading.value = true;
  clearFallbackTimer();

  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += (url.includes("?") ? "&" : "?") + queryString;
  }
  // url += (url.includes("?") ? "&" : "?") + `t=${Date.now()}`;
  // console.log("frame.vue loadFrameSrc:", url);
  frameSrc.value = url;
  fallbackTimer.value = window.setTimeout(() => {
    if (loading.value) {
      hideLoading();
    }
  }, 1500);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
defineOptions({
  name: "IFrame",
});
watch(
  () => props.src,
  () => {
    if (props.src) {
      loadFrameSrc(props.src, handleParams(props.params || {}));
    }
  },
  { immediate: true }
);
onMounted(() => {
  init();
});
// 组件卸载时清理
onUnmounted(() => {
  // 清理 iframe 防止内存泄漏
  if (frameRef.value) {
    frameSrc.value = "about:blank";
  }
});
</script>

<style lang="scss" scoped>
.frame {
  position: absolute;
  inset: 0;

  .frame-iframe {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 0;
  }
}

.main-content {
  margin: 2px 0 0 !important;
}
</style>
