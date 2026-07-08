<template>
  <el-dialog
    :model-value="visible"
    :title="currentEmail ? '更换邮箱' : '绑定邮箱'"
    width="480px"
    destroy-on-close
    draggable
    @update:model-value="handleVisibleChange"
  >
    <el-form ref="formRef" :model="formModel" label-width="100px" class="email-form">
      <el-form-item label="邮箱" prop="email" :rules="emailRules">
        <el-input v-model="formModel.email" clearable placeholder="请输入邮箱" />
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
import UserAPI, { type UpdateEmailParam } from "@/api/user";

/* ***************************** 参数定义 ********************************* */
interface Props {
  visible: boolean;
  currentEmail?: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [val: boolean];
  success: [];
}>();

const formRef = ref<FormInstance | null>(null);
const formModel = reactive<UpdateEmailParam>({
  email: "",
  captcha: "",
});

// 邮箱格式校验规则
const emailRules: FormItemRule[] = [
  { required: true, message: "请输入邮箱", trigger: "blur" },
  {
    type: "email",
    message: "请输入正确的邮箱格式",
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
  formModel.email = "";
  formModel.captcha = "";
  stopCountdown();
}

/**
 * 按钮：发送验证码
 */
const sendingCaptcha = ref(false);
async function handleSendCaptcha() {
  // 验证邮箱格式
  try {
    await formRef.value?.validateField("email");
  } catch {
    return;
  }
  // 获取验证码
  sendingCaptcha.value = true;
  UserAPI.sendEmailCaptcha({ email: formModel.email })
    .then((data) => {
      ElMessage.success(data ?? "验证码已发送");
      // 开始倒计时
      startCountdown();
    })
    .catch((err) => {
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
  UserAPI.updateSelfEmail(formModel, { silent: true })
    .then(() => {
      ElMessage.success("邮箱修改成功");
      emit("update:visible", false);
      emit("success"); // 由父组件刷新用户、分值等信息
    })
    .catch((err) => {
      ElMessage.error(err?.message ?? "邮箱修改失败");
    })
    .finally(() => {
      submitting.value = false;
    });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
watch(
  () => props.visible,
  (val) => {
    if (val && props.currentEmail) {
      formModel.email = props.currentEmail;
    }
    if (!val) {
      stopCountdown();
    }
  },
  { immediate: true }
);
</script>

<style scoped></style>
