<!-- 单图上传组件 -->
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
        <el-image
          v-if="currentFile.isPicture"
          :src="currentFile.showPath"
          fit="contain"
          class="el-upload-thumbnail__image"
        >
          <template #error>
            <el-text class="el-upload-thumbnail__name">{{ currentFile.name }}</el-text>
          </template>
        </el-image>
        <el-text v-else class="el-upload-thumbnail__name">{{ currentFile.name }}</el-text>
        <el-icon class="single-upload__delete-btn" @click.stop="handleDelete">
          <CircleCloseFilled />
        </el-icon>
      </div>
      <div v-else style="line-height: normal">
        <el-progress
          v-if="showProgress"
          :percentage="progressPercent"
          :status="progressStatus"
          :show-text="false"
          :width="40"
          type="circle"
        />
        <el-icon v-else class="single-upload__add-btn"><Plus /></el-icon>
      </div>
      <el-icon
        v-if="currentFile.uploadCode || currentFile.fileId != initFile.fileId"
        class="single-upload__undo-btn"
        @click.stop="handleUndo"
      >
        <RefreshLeft />
      </el-icon>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { Plus, CircleCloseFilled, RefreshLeft } from "@element-plus/icons-vue";
import { UploadRawFile, UploadRequestOptions, UploadUserFile } from "element-plus";
import DfsAPI, { UploadFileDto } from "@/api/dfs";
import FileUtil from "@/utils/file";

const props = withDefaults(
  defineProps<{
    data?: Record<string, any>;
    maxFileSize?: number;
    accept?: string;
    style?: Record<string, string | number>;
  }>(),
  {
    data: () => ({}),
    maxFileSize: 5,
    accept: "*",
    style: () => ({ width: "150px", height: "150px" }),
  }
);

interface UploadFileInfo extends UploadUserFile {
  fileId?: string;
  fileMd5?: string;
  filePath: string;
  showPath?: string;
  fileSize?: number;
  fileType?: string;
  uploadCode?: string;
  isPicture?: boolean;
}

const currentFile = ref<UploadFileInfo>({ filePath: "", name: "" });
const initFile = ref<UploadFileInfo>({ filePath: "", name: "" });

function handleBeforeUpload(file: UploadRawFile) {
  const acceptTypes = props.accept.split(",").map((type) => type.trim());
  const isValidType = acceptTypes.some((type) => {
    if (!type || type === "" || type === "*") return true;
    if (type === "image/*") return file.type.startsWith("image/");
    if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
    return file.type === type;
  });
  if (!isValidType) { ElMessage.warning(`上传文件的格式不正确，仅支持：${props.accept}`); return false; }
  if (file.size > props.maxFileSize * 1024 * 1024) { ElMessage.warning("上传文件不能大于" + props.maxFileSize + "M"); return false; }
  if (currentFile.value.uploadCode) DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] });
  return true;
}

function handleUpload(options: UploadRequestOptions) {
  return new Promise((resolve, reject) => {
    const file = options.file;
    progressOnStart();
    FileUtil.upload(file, { fileName: file.name, fileContent: "", finalFile: true }, progressOnChange)
      .then((res) => { progressOnSuccess(); resolve(res); })
      .catch((error) => { progressOnError(); reject(error); });
  });
}

const onSuccess = (fileInfo: UploadFileDto, uploadFile: UploadUserFile) => {
  ElMessage.success("上传成功");
  currentFile.value = Object.assign(fileInfo, uploadFile);
  currentFile.value.isPicture = FileUtil.isPicture(uploadFile.raw!.type, uploadFile.name);
};

const onError = (error: any) => { console.log("onError", error); };

function handleDelete() {
  if (!currentFile.value?.uploadCode) { currentFile.value = { filePath: "", name: "" }; return; }
  DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] }).finally(() => {
    currentFile.value = { filePath: "", name: "" };
  });
}

function handleUndo() {
  if (!currentFile.value?.uploadCode) { currentFile.value = Object.assign({ name: "" }, initFile.value); return; }
  DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] }).finally(() => {
    currentFile.value = Object.assign({}, initFile.value);
  });
}

const showProgress = ref(false);
const progressPercent = ref(0);
const progressStatus = ref<"" | "success" | "warning">("");
function progressOnStart() { showProgress.value = true; progressStatus.value = ""; progressPercent.value = 0; }
function progressOnChange(percent: number) { progressPercent.value = parseInt(percent.toFixed(0)); }
function progressOnSuccess() { progressStatus.value = "success"; progressPercent.value = 100; setTimeout(() => { showProgress.value = false; }, 1000); }
function progressOnError() { progressStatus.value = "warning"; setTimeout(() => { showProgress.value = false; }, 1000); }

const clear = (clearTempFile: boolean = true) => {
  if (clearTempFile && currentFile.value.uploadCode) DfsAPI.clearTempFile({ uploadCodes: [currentFile.value.uploadCode] });
  currentFile.value = { filePath: "", name: "" };
  showProgress.value = false;
};

const getFile = (): UploadFileDto => {
  if (!currentFile.value) return {} as UploadFileDto;
  return {
    id: currentFile.value.fileId,
    fileName: currentFile.value.name,
    fileMd5: currentFile.value.fileMd5,
    fileSize: currentFile.value.fileSize,
    fileType: currentFile.value.fileType,
    filePath: currentFile.value.filePath,
    showPath: currentFile.value.showPath,
    uploadCode: currentFile.value.uploadCode,
  } as UploadFileDto;
};

const setFile = (file: UploadFileDto) => {
  const temp = Object.assign({}, file) as unknown as UploadFileInfo;
  if (file) {
    temp.url = file.showPath;
    temp.name = file.fileName || "";
    temp.fileId = file.id;
    temp.isPicture = FileUtil.isPicture("", temp.filePath);
  }
  initFile.value = Object.assign({}, temp);
  currentFile.value = temp;
};

onMounted(() => {});
defineExpose({ clear, getFile, setFile });
</script>

<style scoped lang="scss">
:deep(.el-upload--picture-card),
:deep(.el-upload-thumbnail) {
  width: v-bind("props.style.width");
  height: v-bind("props.style.height");
}
.el-upload-thumbnail {
  line-height: initial;
  &__image { width: 100%; height: 100%; object-fit: contain; }
  &__name { display: inline-block; padding-top: 18px; }
}
.single-upload {
  position: relative;
  margin: 0 8px 8px 0;
  overflow: hidden;
  cursor: pointer;
  border: 1px var(--el-border-color) solid;
  border-radius: 5px;
  &:hover { border-color: var(--el-color-primary); }
  &__undo-btn, &__delete-btn {
    position: absolute;
    top: 1px;
    font-size: 16px;
    color: #ff7901;
    cursor: pointer;
    background: #fff;
    border-radius: 100%;
    :hover { color: #ff4500; }
  }
  &__undo-btn { left: 1px; }
  &__delete-btn { right: 1px; }
}
.single-upload__add-btn { font-size: 28px; color: var(--el-text-color-secondary); }
</style>
