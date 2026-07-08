<!-- 文件列表查看组件 -->
<template>
  <ul class="el-upload-list el-upload-list--picture-card">
    <li v-for="(file, index) in fileList" :key="file.id" class="el-upload-list__item is-success">
      <img v-if="file.isPicture" class="el-upload-list__item-thumbnail" :src="file.showPath" />
      <span v-else>{{ file.fileName }}</span>
      <span class="el-upload-list__item-actions">
        <span v-if="file.isPicture" @click="handlePreviewShown(index)">
          <el-icon><ZoomIn /></el-icon>
        </span>
        <span @click="handlePreviewDown(file)">
          <el-icon><Download /></el-icon>
        </span>
      </span>
    </li>
  </ul>

  <el-image-viewer
    v-if="previewVisible"
    :url-list="previewList"
    :initial-index="previewIndex"
    :zoom-rate="1.2"
    @close="handlePreviewClose"
  />
</template>
<script setup lang="ts">
import { ZoomIn, Download } from "@element-plus/icons-vue";
import { UploadFileDto } from "@/api/dfs";
import FileUtil from "@/utils/file";

const emits = defineEmits(["on-download"]);
const props = defineProps({
  style: {
    type: Object,
    default: () => ({ width: "80px", height: "80px" }),
  },
});
const modelValue = defineModel("modelValue", {
  type: [Array] as PropType<UploadFileDto[]>,
  default: () => [],
});
interface UploadFileInfo extends UploadFileDto {
  isPicture?: boolean;
}
const fileList = ref<UploadFileInfo[]>([]);
const previewVisible = ref(false);
const previewIndex = ref(0);
const previewList = ref<string[]>([]);

const handlePreviewShown = (index: number) => {
  const imageUrl = fileList.value[index].showPath;
  previewIndex.value = previewList.value.findIndex((url) => url === imageUrl);
  previewVisible.value = true;
};
const handlePreviewDown = (row: UploadFileDto) => { emits("on-download", row); };
const handlePreviewClose = () => { previewVisible.value = false; };

watch(
  modelValue,
  (newVal) => {
    if (!newVal || newVal.length === 0) {
      fileList.value = [];
      previewList.value = [];
      return;
    }
    fileList.value = newVal.map((file) => {
      const temp = Object.assign({}, file) as UploadFileInfo;
      temp.isPicture = FileUtil.isPicture("", temp.filePath);
      return temp;
    });
    previewList.value = fileList.value.filter((f) => f.isPicture).map((f) => f.showPath || "");
  },
  { immediate: true }
);

onMounted(() => {});
defineExpose({});
</script>
<style lang="scss" scoped>
.el-upload-list :deep(.el-upload-list__item) {
  width: v-bind("props.style.width");
  height: v-bind("props.style.height");
}
</style>
