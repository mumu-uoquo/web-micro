<template>
  <el-dialog
    :model-value="visible"
    :title="currentPhone ? '更换手机号' : '绑定手机号'"
    width="480px"
    destroy-on-close
    draggable
    @update:model-value="handleVisibleChange"
  >
    <el-form ref="formRef" :model="formModel" label-width="100px" class="phone-form">
      <el-form-item label="手机号" prop="phone" :rules="phoneRules">
        <el-input v-model="formModel.phone" clearable placeholder="请输入手机号" maxlength="11" />
      </el-form-item>
      <el-form-item label="验证码" prop="captcha" :rules="captchaRules">
        <el-input v-model="formModel.captcha" clearable placeholder="请输入验证码" maxlength="6">
          <template #append>
            <el-button
              type="primary"
              :disabled="sendingCaptcha || countdown > 0"
              :loading="sendingCaptcha"
              @click="handleSendCaptcha"
            >
              {{ countdown > 0 ? `${countdown}s` : "发送验证码" }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormItemRule } from "element-plus";
import UserAPI, { type UpdatePhoneParam } from "@/api/user";

/* ***************************** 参数定义 ********************************* */
interface Props {
  visible: boolean;
  currentPhone?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [val: boolean];
  success: [];
}>();

const formRef = ref<FormInstance | null>(null);
const formModel = reactive<UpdatePhoneParam>({
  phone: "",
  captcha: "",
});

// 手机号格式校验规则
const phoneRules: FormItemRule[] = [
  { required: true, message: "请输入手机号", trigger: "blur" },
  {
    pattern: /^1[3-9]\d{9}$/,
    message: "请输入正确的手机号格式",
    trigger: "blur",
  },
];

// 验证码校验规则
const captchaRules: FormItemRule[] = [
  { required: true, message: "请输入验证码", trigger: "blur" },
  { pattern: /^\d{6}$/, message: "请输入6位数字验证码", trigger: "blur" },
];

/* ***************************** 计时器 ********************************* */
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;
/**
 * 开始倒计时
 */
function startCountdown() {
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      stopCountdown();
    }
  }, 1000);
}

/**
 * 停止倒计时
 */
function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.value = 0;
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
  formModel.phone = "";
  formModel.captcha = "";
  stopCountdown();
}

/**
 * 按钮：发送验证码
 */
const sendingCaptcha = ref(false);
async function handleSendCaptcha() {
  // 先验证手机号格式
  try {
    await formRef.value?.validateField("phone");
  } catch {
    return;
  }
  // 获取验证码
  sendingCaptcha.value = true;
  UserAPI.sendPhoneCaptcha({ phone: formModel.phone })
    .then((data) => {
      ElMessage.success(data ?? "验证码已发送");
      // 开始倒计时
      startCountdown();
    })
    .catch((err: any) => {
      ElMessage.error(err?.message ?? "验证码发送失败");
    })
    .finally(() => {
      sendingCaptcha.value = false;
    });
}

/**
 * 按钮：取消
 */
function handleCancel() {
  emit("update:visible", false);
}

/**
 * 按钮：表单提交
 * Validates: Requirements 5.13
 */
const submitting = ref(false);
async function handleSubmit() {
  // 表单校验
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  // 提交保存
  submitting.value = true;
  UserAPI.updateSelfPhone(formModel, { silent: true })
    .then(() => {
      ElMessage.success("手机号修改成功");
      emit("update:visible", false);
      emit("success");
    })
    .catch((err: any) => {
      ElMessage.error(err?.message ?? "手机号修改失败");
    })
    .finally(() => {
      submitting.value = false;
    });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
watch(
  () => props.visible,
  (val) => {
    if (val && props.currentPhone) {
      formModel.phone = props.currentPhone;
    }
    if (!val) {
      stopCountdown();
    }
  },
  { immediate: true }
);
</script>

<style scoped></style>
