<template>
  <!-- 菜单标题：过长时显示省略号，鼠标移入时用 tooltip 展示完整文本；文本未被截断时不弹出 -->
  <el-tooltip
    :content="text"
    :disabled="!overflowed"
    placement="right"
    :show-after="200"
    :hide-after="0"
    popper-class="menu-title-tooltip"
  >
    <span ref="textRef" class="menu-title-text ml-1">{{ text }}</span>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";

defineOptions({ name: "MenuTitle", inheritAttrs: false });

const props = defineProps({
  /** 已翻译的标题文本 */
  text: {
    type: String,
    default: "",
  },
});

const textRef = ref<HTMLElement>();
const overflowed = ref(false);

/** 文本被截断（实际宽度超过可见宽度）时才需要 tooltip */
function checkOverflow() {
  const el = textRef.value;
  overflowed.value = !!el && el.scrollWidth - el.clientWidth > 1;
}

// 侧边栏折叠 / 展开、子菜单展开时宽度会变化，需要重新判断
let observer: ResizeObserver | undefined;
onMounted(() => {
  checkOverflow();
  if (textRef.value && typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(checkOverflow);
    observer.observe(textRef.value);
  }
});
onBeforeUnmount(() => observer?.disconnect());

// 切换语言等导致文本变化时，可见宽度不变，ResizeObserver 不会触发
watch(
  () => props.text,
  () => nextTick(checkOverflow)
);
</script>

<style lang="scss" scoped>
/* .el-menu-item / .el-sub-menu__title 都是 flex 布局，文本需允许收缩才能出现省略号 */
.menu-title-text {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<style lang="scss">
/* tooltip 通过 popper-class 传递，渲染在 body 下，需要非 scoped 样式 */
.menu-title-tooltip {
  max-width: 320px;
  line-height: 1.5;
  word-break: break-all;
}
</style>
