<template>
  <div class="avatar-upload" @click="triggerFileSelect">
    <el-avatar :src="currentAvatar || defaultAvatar" :size="80" class="avatar-img" />
    <div class="avatar-overlay">
      <el-icon v-if="!uploading" class="camera-icon"><Camera /></el-icon>
      <el-icon v-else class="loading-icon is-loading"><Loading /></el-icon>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="file-input"
      @change="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Camera, Loading } from "@element-plus/icons-vue";
import defaultAvatar from "@/assets/images/avatar-default.png";
import UserAPI from "@/api/user";
import { validateAvatarFile } from "@/views/profile/composables/useValidators";

/* ***************************** 参数定义 ********************************* */
interface Props {
  currentAvatar: string;
}
defineProps<Props>();
const emit = defineEmits<{
  success: [];
  error: [msg: string];
}>();

/* ***************************** 头像修改 ********************************* */
/**
 * 文件选择
 */
const fileInputRef = ref<HTMLInputElement | null>(null);
function triggerFileSelect() {
  fileInputRef.value?.click();
}

/**
 * 文件上传
 */
const uploading = ref(false);
async function onFileChange(event: Event) {
  // 基本校验
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  // Reset input so same file can be selected again
  input.value = "";
  // Validate file size
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    ElMessage.warning(validation.message || "图片大小不能超过 2MB");
    return;
  }

  // 开始上传
  uploading.value = true;
  try {
    const base64WithPrefix = await toBase64(file);
    await UserAPI.updateSelfAvatar({ avatar: base64WithPrefix }, { silent: true });
    ElMessage.success("头像更新成功");
    emit("success");
  } catch (err: any) {
    const msg = err?.message ?? "头像上传失败";
    ElMessage.error(msg);
    emit("error", msg);
  } finally {
    uploading.value = false;
  }
}

/**
 * 将文件转换为Base64字符串
 * @param file 要转换的文件
 */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
</script>

<style scoped>
.avatar-upload {
  position: relative;
  display: inline-block;
  overflow: hidden;
  cursor: pointer;
  border-radius: 50%;
}

.avatar-img {
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-upload:hover .avatar-overlay {
  opacity: 1;
}

.camera-icon,
.loading-icon {
  font-size: 24px;
  color: #fff;
}

.file-input {
  display: none;
}
</style>
