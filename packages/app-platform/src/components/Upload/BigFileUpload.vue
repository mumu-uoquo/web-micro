<!-- 大文件上传组件 -->
<template>
  <el-upload
    v-model="currentFile"
    class="single-upload"
    list-type="picture-card"
    :show-file-list="false"
    :accept="props.accept"
    :before-upload="handleBeforeUpload"
    :http-request="handleUpload"
    :on-success="onSuccess"
    :on-error="onError"
  >
    <template #default>
      <div v-if="currentFile.name" class="el-upload-thumbnail">
        <el-image v-if="currentFile.isPicture" :src="currentFile.showPath" fit="contain" class="el-upload-thumbnail__image">
          <template #error><el-text class="el-upload-thumbnail__name">{{ currentFile.name }}</el-text></template>
        </el-image>
        <el-text v-else class="el-upload-thumbnail__name">{{ currentFile.name }}</el-text>
        <el-icon class="single-upload__delete-btn" @click.stop="handleDelete"><CircleCloseFilled /></el-icon>
      </div>
      <div v-else style="line-height: normal">
        <el-progress v-if="showProgress" :percentage="progressPercent" :status="progressStatus" :show-text="false" :width="40" type="circle" />
        <el-icon v-else class="single-upload__add-btn"><Plus /></el-icon>
      </div>
      <el-icon v-if="currentFile.uploadCode || currentFile.fileId != initFile.fileId" class="single-upload__undo-btn" @click.stop="handleUndo">
        <RefreshLeft />
      </el-icon>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { Plus, CircleCloseFilled, RefreshLeft } from "@element-plus/icons-vue";
import { UploadRawFile, UploadRequestOptions, UploadUserFile } from "element-plus";
import DfsAPI, { UploadFileDto, UploadConfigDto } from "@/api/dfs";
import FileUtil from "@/utils/file";
// Import adjustment: @/utils/http → @/api/http
import { http } from "@/api/http";

const props = withDefaults(
  defineProps<{
    url: string;
    data?: Record<string, any>;
    maxFileSize?: number;
    accept?: string;
    style?: CSSProperties | Record<string, string | number>;
  }>(),
  { data: () => ({}), maxFileSize: 20, accept: "*", style: () => ({ width: "150px", height: "150px" }) }
);

interface UploadFileInfo extends UploadUserFile {
  fileId?: string; fileMd5?: string; filePath: string; showPath?: string;
  fileSize?: number; fileType?: string; uploadCode?: string; isPicture?: boolean;
}

const currentFile = ref<UploadFileInfo>({ filePath: "", name: "" });
const initFile = ref<UploadFileInfo>({ filePath: "", name: "" });

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
  if (currentFile.value.uploadCode) DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] });
  return true;
}

async function handleUpload(options: UploadRequestOptions) {
  progressOnStart();
  const file = options.file;
  const param = Object.assign({}, props.data, { fileName: file.name, fileSize: file.size, fileMd5: "" });
  const config: UploadConfigDto = await http.request<UploadConfigDto>("post", props.url, { data: param });

  const chunkList = config.chunkList || [];
  const chunkSize = config.chunkSize || 1024 * 1024 * 5;
  if (chunkList.length === 0) {
    const chunkTotal = Math.ceil(file.size / chunkSize);
    for (let i = 0; i < chunkTotal; i++) chunkList.push(i);
  }
  chunkList.push(-1);
  progressOnChange((1 / chunkList.length) * 100);

  let index = 0, retry = 0;
  let chunkIndex = chunkList[index];
  while (chunkIndex !== -1) {
    const startPos = chunkIndex * chunkSize;
    const endsPos = Math.min(file.size, (chunkIndex + 1) * chunkSize);
    const data: Blob = file.slice(startPos, endsPos);
    try {
      await DfsAPI.uploadByChunk(data, { uploadCode: config.uploadCode, chunkIndex, chunkSize: data.size });
      retry = 0;
      chunkIndex = chunkList[++index];
      progressOnChange(((index + 1) / chunkList.length) * 100);
    } catch (error) {
      if (++retry < 3) { await new Promise((r) => setTimeout(r, 1000)); continue; }
      DfsAPI.clearTempFile({ uploadCodes: [config.uploadCode || ""] });
      throw error;
    }
  }
  const dto = {
    uploadCode: config.uploadCode, fileMd5: param.fileMd5, fileName: param.fileName,
    fileSize: param.fileSize, fileType: FileUtil.getSuffix(param.fileName),
  } as UploadFileDto;
  dto.filePath = `${config.uploadCode}.${dto.fileType}`;
  dto.showPath = `/temp/${config.uploadCode}.tmp`;
  return dto;
}

const onSuccess = (fileInfo: UploadFileDto, uploadFile: UploadUserFile) => {
  progressOnSuccess();
  ElMessage.success("上传成功");
  currentFile.value = Object.assign(fileInfo, uploadFile);
  currentFile.value.isPicture = FileUtil.isPicture(uploadFile.raw!.type, uploadFile.name);
};
const onError = (error: any) => { progressOnError(); console.log("onError", error); };

function handleDelete() {
  if (!currentFile.value?.uploadCode) { currentFile.value = { filePath: "", name: "" }; return; }
  DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] }).finally(() => { currentFile.value = { filePath: "", name: "" }; });
}
function handleUndo() {
  if (!currentFile.value?.uploadCode) { currentFile.value = Object.assign({ name: "" }, initFile.value); return; }
  DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] }).finally(() => { currentFile.value = Object.assign({}, initFile.value); });
}

const showProgress = ref(false); const progressPercent = ref(0); const progressStatus = ref<"" | "success" | "warning">("");
function progressOnStart() { showProgress.value = true; progressStatus.value = ""; progressPercent.value = 0; }
function progressOnChange(percent: number) { progressPercent.value = parseInt(percent.toFixed(0)); }
function progressOnSuccess() { progressStatus.value = "success"; progressPercent.value = 100; setTimeout(() => { showProgress.value = false; }, 1000); }
function progressOnError() { progressStatus.value = "warning"; setTimeout(() => { showProgress.value = false; }, 1000); }

const clear = (clearTempFile: boolean = true) => {
  if (clearTempFile && currentFile.value.uploadCode) DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] });
  currentFile.value = { filePath: "", name: "" }; showProgress.value = false;
};
const getFile = (): UploadFileDto => {
  if (!currentFile.value) return {} as UploadFileDto;
  return { id: currentFile.value.fileId, fileName: currentFile.value.name, fileMd5: currentFile.value.fileMd5, fileSize: currentFile.value.fileSize, fileType: currentFile.value.fileType, filePath: currentFile.value.filePath, showPath: currentFile.value.showPath, uploadCode: currentFile.value.uploadCode } as UploadFileDto;
};
const setFile = (file: UploadFileDto) => {
  const temp = Object.assign({}, file) as unknown as UploadFileInfo;
  if (file) { temp.url = file.showPath; temp.name = file.fileName || ""; temp.fileId = file.id; temp.isPicture = FileUtil.isPicture("", temp.filePath); }
  initFile.value = Object.assign({}, temp); currentFile.value = temp; showProgress.value = false;
};

onMounted(() => {});
defineExpose({ clear, getFile, setFile });
</script>

<style scoped lang="scss">
:deep(.el-upload--picture-card), :deep(.el-upload-thumbnail) {
  width: v-bind("props.style.width"); height: v-bind("props.style.height");
}
.el-upload-thumbnail { line-height: initial; &__image { width: 100%; height: 100%; object-fit: contain; } &__name { display: inline-block; padding-top: 18px; } }
.single-upload {
  position: relative; margin: 0 8px 8px 0; overflow: hidden; cursor: pointer;
  border: 1px var(--el-border-color) solid; border-radius: 5px;
  &:hover { border-color: var(--el-color-primary); }
  &__undo-btn, &__delete-btn { position: absolute; top: 1px; font-size: 16px; color: #ff7901; cursor: pointer; background: #fff; border-radius: 100%; :hover { color: #ff4500; } }
  &__undo-btn { left: 1px; } &__delete-btn { right: 1px; }
}
.single-upload__add-btn { font-size: 28px; color: var(--el-text-color-secondary); }
</style>
