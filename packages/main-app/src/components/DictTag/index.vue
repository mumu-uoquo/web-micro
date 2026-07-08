<template>
  <template v-if="tagType && props.type === 'tag'">
    <el-tag :type="tagType" :size="tagSize" :class="props.class">{{ label }}</el-tag>
  </template>
  <template v-else>
    <span :class="props.class">{{ label }}</span>
  </template>
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import { useDictStore } from "@/stores";
const dictStore = useDictStore();

const props = defineProps({
  code: String, // 字典编码
  // 标签大小
  size: {
    type: String as PropType<"default" | "large" | "small">,
    default: "default",
  },
  // 标签样式
  class: {
    type: String,
    default: "",
  },
  // 标签类型（默认tag）
  type: {
    type: String as PropType<"tag" | "txt">,
    default: "tag",
  },
});
const label = ref<string>("");
const tagType = ref<"success" | "warning" | "info" | "primary" | "danger" | "" | undefined>(); // 标签类型
const tagSize = ref<"default" | "large" | "small">(props.size); // 标签大小

/**
 * 根据字典项的值获取对应的 label 和 tagType
 * @param dictCode 字典编码
 * @param value 字典项的值
 * @returns 包含 label 和 tagType 的对象
 */
const getLabelAndTagByValue = async (dictCode: string) => {
  // 按需加载字典数据
  await dictStore.loadDictionary(dictCode);
  // 从缓存中获取字典数据
  const dictItem = dictStore.getDictionary(dictCode);
  return {
    label: dictItem?.dicValue || dictCode,
    tagType: dictItem?.tagStyle || "",
  };
};
/**
 * 更新 label 和 tagType
 */
const updateLabelAndTag = async () => {
  if (!props.code) {
    label.value = "";
    tagType.value = "";
    return;
  }
  const { label: newLabel, tagType: newTagType } = await getLabelAndTagByValue(props.code);
  label.value = newLabel;
  tagType.value = newTagType as typeof tagType.value;
};

// 初始化或code变化时更新标签和标签样式
watch(
  [() => props.code],
  async () => {
    if (props.code) {
      await updateLabelAndTag();
    }
  },
  { immediate: true }
);
</script>
