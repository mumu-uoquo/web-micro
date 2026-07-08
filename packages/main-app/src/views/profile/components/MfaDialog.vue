<template>
  <el-dialog
    :model-value="visible"
    title="双因子认证"
    width="480px"
    destroy-on-close
    draggable
    @update:model-value="handleVisibleChange"
  >
    <div v-if="loading" class="mfa-loading">
      <el-skeleton :rows="3" animated />
    </div>
    <template v-else>
      <!-- 二维码展示 -->
      <div v-if="qrCodeBase64" class="mfa-qrcode">
        <p class="mfa-tip">
          请使用验证器应用扫描以下二维码
          <br />
          （如：微信小程序“腾讯身份验证器”，Google Authenticator等）
        </p>
        <img :src="qrCodeBase64" alt="MFA QR Code" class="qr-image" />
      </div>

      <!-- 验证码输入 -->
      <el-form ref="formRef" :model="formModel" label-width="100px" class="verify-form">
        <el-form-item label="验证码" prop="totpCode" :rules="totpRules">
          <el-input
            v-model="formModel.totpCode"
            clearable
            placeholder="请输入6位验证码"
            maxlength="6"
          />
        </el-form-item>
      </el-form>
    </template>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="loading" @click="handleBind">
        确认绑定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormItemRule } from "element-plus";
import UserAPI, { type TotpBindParam } from "@/api/user";

/* ***************************** 参数定义 ********************************* */
interface Props {
  visible: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [val: boolean];
  success: [];
}>();

const formRef = ref<FormInstance | null>(null);
const formModel = reactive<TotpBindParam>({
  totpCode: "",
});

// 验证码校验规则
const totpRules: FormItemRule[] = [
  { required: true, message: "请输入验证码", trigger: "blur" },
  {
    pattern: /^\d{6}$/,
    message: "请输入6位数字验证码",
    trigger: "blur",
  },
];

/**
 * 获取 MFA 二维码
 * Validates: Requirements 5.19
 */
const loading = ref(false);
const qrCodeBase64 = ref<string>("");
async function fetchQrCode() {
  loading.value = true;
  try {
    const result = await UserAPI.getMfaQrCode();
    qrCodeBase64.value = result.qrCodeBase64 ?? "";
    if (qrCodeBase64.value == "") {
      ElMessage.error("获取二维码失败");
    }
  } catch (err: any) {
    ElMessage.error(err?.message ?? "获取二维码失败");
  } finally {
    loading.value = false;
  }
}

/* ***************************** 表单操作 ********************************* */
/**
 * 界面隐现
 */
function handleVisibleChange(val: boolean) {
  emit("update:visible", val);
  if (!val) {
    resetForm();
  }
}

/**
 * 重置表单
 */
function resetForm() {
  formRef.value?.resetFields();
  formModel.totpCode = "";
  qrCodeBase64.value = "";
}

/**
 * 按钮：取消
 */
function handleCancel() {
  emit("update:visible", false);
}

/**
 * 按钮：表单提交（绑定 MFA）
 * Validates: Requirements 5.19
 */
const submitting = ref(false);
async function handleBind() {
  // 表单校验
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  // 提交保存
  submitting.value = true;
  try {
    await UserAPI.bindMfa(formModel, { silent: true });
    ElMessage.success("双因子认证绑定成功");
    emit("update:visible", false);
    emit("success");
  } catch (err: any) {
    ElMessage.error(err?.message ?? "绑定失败");
  } finally {
    submitting.value = false;
  }
}

/* ***************************** 监听器等（需放在最后） ********************************* */
watch(
  () => props.visible,
  (val) => {
    // 弹窗打开时自动加载二维码
    if (val) {
      fetchQrCode();
    }
  }
);
</script>

<style scoped>
.mfa-loading {
  padding: 20px 0;
}

.mfa-qrcode {
  margin-bottom: 20px;
  text-align: center;
}

.mfa-tip {
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.qr-image {
  width: 200px;
  height: 200px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.verify-form {
  width: 350px;
}
</style>
