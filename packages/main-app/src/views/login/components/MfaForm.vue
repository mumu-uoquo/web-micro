<template>
  <div>
    <h3 class="login-form__title text-center">{{ t("login.mfa.title") }}</h3>
    <el-form ref="mfaFormRef" :model="formData" :rules="rules" size="large">
      <el-form-item prop="totpCode">
        <el-input
          v-model="totpCode"
          placeholder="请输入 6 位动态验证码"
          maxlength="6"
          @input="handleInput"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
      <el-text v-if="errorMsg" type="danger">{{ errorMsg }}</el-text>
      <el-form-item>
        <el-button type="primary" class="w-full" :loading="loading" @click="handleSubmit">
          验证
        </el-button>
      </el-form-item>
    </el-form>

    <div flex-center gap-10px>
      <el-text size="default">验证码有误？</el-text>
      <el-link type="primary" underline="never" @click="toLogin">返回重新登录</el-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore, useSettingsStore } from "@/stores";
import { encrypt } from "@web-micro/shared";
import { appConfig } from "@/settings";
import AuthAPI, { type MfaLoginParam } from "@/api/auth";

/* ***************************** 参数定义 ********************************* */
const props = defineProps<{
  tempToken: string;
  returnTo?: string;
}>();

const emits = defineEmits<{
  "update:modelValue": [value: string];
  "mfa-success": [];
}>();

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();

/* ***************************** 内部状态 ********************************* */
const totpCode = ref<string>("");
const loading = ref<boolean>(false);
const errorMsg = ref<string>("");

const formData = computed(() => ({ totpCode: totpCode.value }));

const rules = {
  totpCode: [
    { required: true, message: "请输入动态验证码", trigger: "blur" },
    { pattern: /^\d{6}$/, message: "请输入 6 位数字验证码", trigger: "blur" },
  ],
};

const mfaFormRef = ref();

/* ***************************** 方法定义 ********************************* */
/** 输入过滤：仅允许数字 */
function handleInput(value: string) {
  totpCode.value = value.replace(/\D/g, "");
}

/** 提交验证 */
async function handleSubmit() {
  try {
    await mfaFormRef.value.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const reqData = {
      tempToken: props.tempToken,
      totpCode: encrypt.rsa(totpCode.value, settingsStore.rsaPublicKey),
      appVersion: appConfig.version,
    } as MfaLoginParam;
    const data = await AuthAPI.mfaLogin(reqData);
    userStore.setUserInfo(data);
    emits("mfa-success");
  } catch (error: any) {
    totpCode.value = "";
    errorMsg.value = error;
    loading.value = false;
  }
}

/** 返回登录 */
function toLogin() {
  totpCode.value = "";
  errorMsg.value = "";
  loading.value = false;
  emits("update:modelValue", props.returnTo ?? "account");
}
</script>
