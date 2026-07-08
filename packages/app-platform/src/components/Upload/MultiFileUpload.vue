<!-- 图片上传组件 -->
<template>
  <el-upload
    v-model:file-list="fileList"
    list-type="picture-card"
    :show-file-list="true"
    :accept="props.accept"
    :limit="props.limit"
    :before-upload="handleBeforeUpload"
    :http-request="handleUpload"
    :on-success="onSuccess"
    :on-error="onError"
    :on-exceed="onExceed"
    :multiple="false"
    :disabled="uploadDisabled"
  >
    <el-icon><Plus /></el-icon>
    <template #file="{ file, index }">
      <div v-if="file.status === 'ready'">
        <el-progress :percentage="progressPercent" :status="progressStatus" :show-text="false" :width="progressWidth" type="circle" />
      </div>
      <div v-else>
        <el-image v-if="(file as any).isPicture" :src="(file as any).showPath" fit="contain" class="el-upload-list__item-image">
          <template #error><el-text class="el-upload-list__item-name">{{ file.name }}</el-text></template>
        </el-image>
        <el-text v-else class="el-upload-list__item-name">{{ file.name }}</el-text>
        <span class="el-upload-list__item-actions">
          <span v-if="(file as any).isPicture" @click="handlePreviewShown(index)"><el-icon><ZoomIn /></el-icon></span>
          <span v-else-if="(file as any).showPath" @click="handlePreviewDown(index)"><el-icon><Download /></el-icon></span>
          <span @click="handleRemove(index)"><el-icon><Delete /></el-icon></span>
        </span>
      </div>
    </template>
  </el-upload>
  <el-image-viewer v-if="previewVisible" :url-list="previewList" :initial-index="previewIndex" :zoom-rate="1.2" @close="handlePreviewClose" />
</template>
<script setup lang="ts">
import { Plus, Delete, ZoomIn, Download } from "@element-plus/icons-vue";
import { UploadRawFile, UploadRequestOptions, UploadUserFile } from "element-plus";
import DfsAPI, { UploadFileDto } from "@/api/dfs";
import FileUtil from "@/utils/file";

const props = withDefaults(
  defineProps<{
    data?: Record<string, any>;
    limit?: number;
    maxFileSize?: number;
    accept?: string;
    style?: Record<string, string | number>;
  }>(),
  { data: () => ({}), limit: 10, maxFileSize: 5, accept: "*", style: () => ({ width: "80px", height: "80px" }) }
);

interface UploadFileInfo extends UploadUserFile {
  fileId?: string; fileMd5?: string; filePath: string; showPath?: string;
  fileSize?: number; fileType?: string; uploadCode?: string; isPicture?: boolean;
}
const fileList = ref<UploadFileInfo[]>([]);
const uploadDisabled = ref(false);

function handleBeforeUpload(file: UploadRawFile) {
  const acceptTypes = props.accept.split(",").map((t) => t.trim());
  const isValidType = acceptTypes.some((type) => {
    if (!type || type === "*") return true;
    if (type === "image/*") return file.type.startsWith("image/");
    if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
    return file.type === type;
  });
  if (!isValidType) { ElMessage.warning(`上传文件的格式不正确，仅支持：${props.accept}`); return false; }
  if (file.size > props.maxFileSize * 1024 * 1024) { ElMessage.warning("上传文件不能大于" + props.maxFileSize + "M"); return false; }
  return true;
}
function onExceed() { ElMessage.warning("最多只能上传" + props.limit + "张图片"); }

function handleUpload(options: UploadRequestOptions) {
  return new Promise((resolve, reject) => {
    progressOnStart();
    FileUtil.upload(options.file, { fileName: options.file.name, fileContent: "", finalFile: false }, progressOnChange)
      .then((res) => { progressOnSuccess(); resolve(res); })
      .catch((error) => { progressOnError(); reject(error); });
  });
}

const onSuccess = (fileInfo: UploadFileDto, uploadFile: UploadUserFile) => {
  ElMessage.success("上传成功");
  uploadDisabled.value = fileList.value.length >= props.limit;
  const file = fileList.value.find((f) => f.uid === uploadFile.uid);
  if (!file) return;
  file.status = "success";
  file.fileMd5 = fileInfo.fileMd5; file.fileSize = fileInfo.fileSize; file.fileType = fileInfo.fileType;
  file.filePath = fileInfo.filePath; file.showPath = fileInfo.showPath; file.uploadCode = fileInfo.uploadCode;
  file.isPicture = FileUtil.isPicture(uploadFile.raw!.type, uploadFile.name);
  if (file.isPicture) previewList.value.push(fileInfo.showPath);
};
const onError = (error: any) => { console.log("onError", error); };

function handleRemove(index: number) {
  const fileInfo = fileList.value[index];
  if (!fileInfo) return;
  if (!fileInfo.uploadCode) { _removeFileList(index, fileInfo); return; }
  DfsAPI.clearTempFile({ uploadCodes: [fileInfo.uploadCode] }).then(() => _removeFileList(index, fileInfo));
}
function _removeFileList(index: number, file: UploadFileInfo) {
  fileList.value.splice(index, 1);
  const preIdx = previewList.value.findIndex((url) => url === file.showPath);
  if (preIdx !== -1) previewList.value.splice(preIdx, 1);
  uploadDisabled.value = fileList.value.length >= props.limit;
}

const showProgress = ref(false);
const progressPercent = ref(0);
const progressStatus = ref<"" | "success" | "warning">("");
const progressWidth = ref(40);
function progressOnStart() { showProgress.value = true; progressStatus.value = ""; progressPercent.value = 0; }
function progressOnChange(percent: number) { progressPercent.value = parseInt(percent.toFixed(0)); }
function progressOnSuccess() { progressStatus.value = "success"; progressPercent.value = 100; setTimeout(() => { showProgress.value = false; }, 1000); }
function progressOnError() { progressStatus.value = "warning"; setTimeout(() => { showProgress.value = false; }, 1000); }

const clear = (clearTempFile: boolean = true) => {
  if (clearTempFile) {
    const codes = fileList.value.filter((f) => f.uploadCode).map((f) => f.uploadCode || "");
    if (codes.length > 0) DfsAPI.clearTempFile({ uploadCodes: codes });
  }
  fileList.value = []; previewList.value = [];
};

const getFileList = (): UploadFileDto[] => fileList.value.map((file) => ({
  id: file.fileId, fileName: file.name, fileMd5: file.fileMd5, fileSize: file.fileSize,
  fileType: file.fileType, filePath: file.filePath, showPath: file.showPath, uploadCode: file.uploadCode,
} as UploadFileDto));

const setFileList = (list: UploadFileDto[]) => {
  if (!list || list.length === 0) { fileList.value = []; previewList.value = []; return; }
  fileList.value = list.map((file) => {
    const temp = Object.assign({}, file) as unknown as UploadFileInfo;
    temp.url = file.showPath; temp.name = file.fileName || ""; temp.fileId = file.id;
    temp.isPicture = FileUtil.isPicture("", temp.filePath);
    return temp;
  });
  previewList.value = fileList.value.filter((f) => f.isPicture).map((f) => f.showPath || "");
};

const previewVisible = ref(false);
const previewIndex = ref(0);
const previewList = ref<string[]>([]);
const handlePreviewShown = (index: number) => {
  previewIndex.value = previewList.value.findIndex((url) => url === fileList.value[index].showPath);
  previewVisible.value = true;
};
const handlePreviewDown = (index: number) => { window.open(fileList.value[index].showPath); };
const handlePreviewClose = () => { previewVisible.value = false; };

onMounted(() => {});
defineExpose({ clear, getFileList, setFileList });
</script>
<style lang="scss" scoped>
:deep(.el-upload--picture-card),
:deep(.el-upload-list__item) {
  width: v-bind("props.style.width");
  height: v-bind("props.style.height");
}
:deep(.el-upload--picture-card) { margin: 0 8px 8px 0; }
:deep(.el-upload-list__item) {
  line-height: initial;
  .el-upload-list__item-image { width: 100%; height: 100%; object-fit: contain; }
  .el-upload-list__item-name { display: inline; }
}
</style>
