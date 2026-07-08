<!--
  TextScroll 组件 - 文本滚动公告
-->
<template>
  <div
    ref="containerRef"
    class="text-scroll-container"
    :class="[`text-scroll--${props.type}`]"
    :typewriter="props.typewriter ? 'true' : undefined"
  >
    <!-- 左侧图标 -->
    <div class="left-icon">
      <el-icon><Bell /></el-icon>
    </div>
    <!-- 滚动内容容器 -->
    <div class="scroll-wrapper">
      <div
        ref="scrollContent"
        class="text-scroll-content"
        :class="{ scrolling: shouldScroll }"
        :style="scrollStyle"
      >
        <!-- 滚动内容，复制两份以实现无缝滚动 -->
        <div class="scroll-item" v-html="sanitizedContent" />
        <div class="scroll-item" v-html="sanitizedContent" />
      </div>
    </div>
    <!-- 可选的关闭按钮 -->
    <div v-if="showClose" class="right-icon" @click="handleRightIconClick">
      <el-icon><Close /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElementHover } from "@vueuse/core";

const emit = defineEmits(["close"]);

interface Props {
  /** 滚动文本内容（必填） */
  text: string;
  /** 滚动速度，数值越小滚动越快 */
  speed?: number;
  /** 滚动方向：左侧或右侧 */
  direction?: "left" | "right";
  /** 样式类型 */
  type?: "default" | "success" | "warning" | "danger" | "info";
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 是否启用打字机效果 */
  typewriter?: boolean;
  /** 打字机效果的速度，数值越小打字越快 */
  typewriterSpeed?: number;
}

// 定义组件属性及默认值
const props = withDefaults(defineProps<Props>(), {
  speed: 70,
  direction: "left",
  type: "default",
  showClose: false,
  typewriter: false,
  typewriterSpeed: 100,
});

// 容器元素引用
const containerRef = ref<HTMLElement | null>(null);
// 使用 vueuse 的 useElementHover 检测鼠标悬停状态
const isHovered = useElementHover(containerRef);
// 滚动内容元素引用
const scrollContent = ref<HTMLElement | null>(null);
// 动画持续时间（秒）
const animationDuration = ref(0);

const currentText = ref("");
let typewriterTimer: ReturnType<typeof setTimeout> | null = null;
const isTypewriterComplete = ref(false);

const shouldScroll = computed(() => {
  if (props.typewriter) {
    return !isHovered.value && isTypewriterComplete.value;
  }
  return !isHovered.value;
});

const sanitizedContent = computed(() => (props.typewriter ? currentText.value : props.text));

const scrollStyle = computed(() => ({
  "--animation-duration": `${animationDuration.value}s`,
  "--animation-play-state": shouldScroll.value ? "running" : "paused",
  "--animation-direction": props.direction === "left" ? "normal" : "reverse",
}));

const calculateDuration = () => {
  if (scrollContent.value) {
    const contentWidth = scrollContent.value.scrollWidth / 2;
    animationDuration.value = contentWidth / props.speed;
  }
};

const handleRightIconClick = () => {
  emit("close");
  if (containerRef.value) {
    containerRef.value.remove();
  }
};

const startTypewriter = () => {
  let index = 0;
  currentText.value = "";
  isTypewriterComplete.value = false;

  const type = () => {
    if (index < props.text.length) {
      currentText.value += props.text[index];
      index++;
      typewriterTimer = setTimeout(type, props.typewriterSpeed);
    } else {
      isTypewriterComplete.value = true;
    }
  };

  type();
};

onMounted(() => {
  calculateDuration();
  window.addEventListener("resize", calculateDuration);

  if (props.typewriter) {
    startTypewriter();
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", calculateDuration);
  if (typewriterTimer) {
    clearTimeout(typewriterTimer);
  }
});

watch(
  () => props.text,
  () => {
    if (props.typewriter) {
      if (typewriterTimer) {
        clearTimeout(typewriterTimer);
      }
      startTypewriter();
    }
  }
);
</script>

<style scoped lang="scss">
.text-scroll-container {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 16px;
  overflow: hidden;
  background-color: var(--el-color-primary-light-9) !important;
  border: 1px solid var(--main-color);
  border-radius: calc(var(--custom-radius) / 2 + 2px) !important;

  .left-icon,
  .right-icon {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 100%;
    text-align: center;
    background-color: var(--el-color-primary-light-9) !important;
  }

  .left-icon {
    left: 0;
  }

  .right-icon {
    right: 0;
    cursor: pointer;
    background-color: transparent !important;
  }

  .scroll-wrapper {
    flex: 1;
    margin-left: 34px;
    overflow: hidden;
  }

  .text-scroll-content {
    display: flex;
    height: 34px;
    line-height: 34px;
    white-space: nowrap;
    animation: scroll linear infinite;
    animation-duration: var(--animation-duration);
    animation-direction: var(--animation-direction);
    animation-play-state: var(--animation-play-state);

    .scroll-item {
      display: inline-block;
      min-width: 100%;
      padding: 0 10px;
      font-size: 14px;
      color: var(--el-color-primary-light-2) !important;
      text-align: left;
      text-align: center;

      :deep(a) {
        color: #fd4e4e !important;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  @keyframes scroll {
    0% {
      transform: translateX(0);
    }

    100% {
      transform: translateX(-100%);
    }
  }

  &.text-scroll--default {
    background-color: var(--el-color-primary-light-9) !important;
    border-color: var(--el-color-primary);

    .right-icon,
    .left-icon i {
      color: var(--el-color-primary) !important;
    }

    .scroll-item {
      color: var(--el-color-primary) !important;
    }
  }

  &.text-scroll--success {
    background-color: var(--el-color-success-light-9) !important;
    border-color: var(--el-color-success);

    .left-icon {
      background-color: var(--el-color-success-light-9) !important;

      i {
        color: var(--el-color-success);
      }
    }

    .scroll-item {
      color: var(--el-color-success) !important;
    }
  }

  &.text-scroll--warning {
    background-color: var(--el-color-warning-light-9) !important;
    border-color: var(--el-color-warning);

    .left-icon {
      background-color: var(--el-color-warning-light-9) !important;

      i {
        color: var(--el-color-warning);
      }
    }

    .scroll-item {
      color: var(--el-color-warning) !important;
    }
  }

  &.text-scroll--danger {
    background-color: var(--el-color-danger-light-9) !important;
    border-color: var(--el-color-danger);

    .left-icon {
      background-color: var(--el-color-danger-light-9) !important;

      i {
        color: var(--el-color-danger);
      }
    }

    .scroll-item {
      color: var(--el-color-danger) !important;
    }
  }

  &.text-scroll--info {
    background-color: var(--el-color-info-light-9) !important;
    border-color: var(--el-color-info);

    .left-icon {
      background-color: var(--el-color-info-light-9) !important;

      i {
        color: var(--el-color-info);
      }
    }

    .scroll-item {
      color: var(--el-color-info) !important;
    }
  }
}

.text-scroll-content .scroll-item {
  &::after {
    content: "";
    opacity: 0;
    animation: none;
  }
}

.text-scroll-container[typewriter] .text-scroll-content .scroll-item::after {
  content: "|";
  opacity: 0;
  animation: cursor 1s infinite;
}

@keyframes cursor {
  0%,
  100% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}
</style>
