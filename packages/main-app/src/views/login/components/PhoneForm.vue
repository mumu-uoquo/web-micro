<template>
  <el-form
    ref="phoneFormRef"
    :model="formData"
    :rules="formRules"
    :validate-on-rule-change="false"
    size="large"
  >
    <h3 class="login-form__title text-center">{{ t("login.phoneLogin") }}</h3>

    <!-- 手机号 -->
    <el-form-item prop="phone">
      <el-input v-model.trim="formData.phone" :placeholder="t('login.phone')" maxlength="11">
        <template #prefix>
          <el-icon><Iphone /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <!-- 图形验证码（人机校验，发送短信前必填） -->
    <el-form-item prop="captcha">
      <div flex items-center gap-10px w-full>
        <el-input
          v-model.trim="formData.captcha"
          :placeholder="t('login.captchaCode')"
          clearable
          class="flex-1"
        >
          <template #prefix>
            <div class="i-svg:captcha" />
          </template>
        </el-input>
        <div cursor-pointer h-44px w-140px flex-center @click="getCaptcha">
          <el-icon v-if="captchaLoading" class="is-loading" size="20"><Loading /></el-icon>
          <img
            v-else-if="captchaBase64"
            border-rd-4px
            w-full
            h-full
            block
            object-cover
            shadow="[0_0_0_1px_var(--el-border-color)_inset]"
            :src="captchaBase64"
            alt="captcha"
            title="点击刷新验证码"
            @error="getCaptcha"
          />
          <el-text v-else type="info" size="small">点击获取验证码</el-text>
        </div>
      </div>
    </el-form-item>

    <!-- 短信验证码 -->
    <el-form-item prop="smsCode">
      <div flex items-center gap-10px w-full>
        <el-input
          v-model.trim="formData.smsCode"
          :placeholder="t('login.smsCode')"
          class="flex-1"
          maxlength="6"
          @keyup.enter="handleSubmit"
        >
          <template #prefix>
            <el-icon><ChatDotRound /></el-icon>
          </template>
        </el-input>
        <el-button
          :disabled="countdown > 0 || sendingCode"
          :loading="sendingCode"
          class="sms-btn"
          @click="sendSmsCode"
        >
          {{ countdown > 0 ? `${countdown}s` : t("login.sendCode") }}
        </el-button>
      </div>
    </el-form-item>

    <div class="flex-x-between w-full">
      <el-checkbox v-model="formData.rememberMe">
        {{ t("login.rememberMe") }}
      </el-checkbox>
    </div>

    <!-- 登录按钮 -->
    <el-form-item>
      <el-button :loading="loading" type="primary" class="w-full" @click="handleSubmit">
        {{ t("login.login") }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { Iphone, ChatDotRound, Loading } from "@element-plus/icons-vue";
import { useUserStore, useSettingsStore } from "@/stores";
import { AuthStorage } from "@web-micro/shared";
import { encrypt } from "@web-micro/shared";
import { appConfig } from "@/settings";
import AuthAPI, { type SmsLoginParam, type PhoneCaptchaParam } from "@/api/auth";

/* ***************************** 参数定义 ********************************* */
const emits = defineEmits<{
  /** 登录成功 */
  (e: "on-submit"): void;
  /** 切换视图（返回账号登录等） */
  (e: "update:modelValue", value: string): void;
  /** 需要 MFA 二次认证，携带临时 token */
  (e: "need-mfa", tempToken: string): void;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

// 短信验证码场景标识，需与获取图形验证码时保持一致
const SMS_SCENE = "sms_login";

const loading = ref(false); // 登录按钮 loading
const sendingCode = ref(false); // 发送短信 loading
const captchaLoading = ref(false); // 图形验证码 loading
const captchaBase64 = ref<string>(""); // 图形验证码 base64
const countdown = ref(0); // 短信倒计时

const formData = ref({
  phone: "",
  captcha: "",
  smsCode: "",
  rememberMe: AuthStorage.getRememberMe(),
});

const phoneFormRef = ref(ElForm);

const formRules = reactive({
  phone: [
    { required: true, trigger: "blur", message: t("login.message.phone.required") },
    {
      pattern: /^1[3-9]\d{9}$/,
      trigger: "blur",
      message: t("login.message.phone.invalid"),
    },
  ],
  captcha: [{ required: true, trigger: "blur", message: t("login.message.captchaCode.required") }],
  smsCode: [{ required: true, trigger: "blur", message: t("login.message.smsCode.required") }],
});

/* ***************************** 图形验证码 ********************************* */
/**
 * 获取图形验证码（人机校验）
 */
function getCaptcha() {
  captchaLoading.value = true;
  AuthAPI.getCaptcha({ scene: SMS_SCENE })
    .then((data) => {
      formData.value.captcha = "";
      captchaBase64.value = data;
    })
    .catch(() => {
      // do nothing
    })
    .finally(() => (captchaLoading.value = false));
}

/* ***************************** 短信验证码 ********************************* */
let timer: ReturnType<typeof setInterval> | null = null;

function startCountdown() {
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer!);
      timer = null;
    }
  }, 1000);
}

/**
 * 发送短信验证码（需先通过手机号 + 图形验证码校验）
 */
async function sendSmsCode() {
  try {
    await phoneFormRef.value?.validateField(["phone", "captcha"]);
  } catch {
    return;
  }
  sendingCode.value = true;
  try {
    const reqData: PhoneCaptchaParam = {
      // 手机号 RSA 加密后传输
      phone: encrypt.rsa(formData.value.phone, settingsStore.rsaPublicKey),
      captcha: formData.value.captcha,
      scene: SMS_SCENE,
    };
    const messge = await AuthAPI.sendSmsCaptcha(reqData);
    ElMessage.success(messge ?? t("login.codeSent"));
    startCountdown();
  } catch {
    // 失败刷新图形验证码
    getCaptcha();
  } finally {
    sendingCode.value = false;
  }
}

/* ***************************** 登录提交 ********************************* */
const handleSubmit = useDebounceFn(async () => {
  try {
    await phoneFormRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const reqData: SmsLoginParam = {
      // 手机号 RSA 加密后传输
      phone: encrypt.rsa(formData.value.phone, settingsStore.rsaPublicKey),
      smsCode: formData.value.smsCode,
      rememberMe: formData.value.rememberMe,
      appVersion: appConfig.version,
    };
    const data = await AuthAPI.smsLogin(reqData);
    AuthStorage.setRememberMe(formData.value.rememberMe);

    // 开启双因子认证时需要 MFA 二次认证，accessToken 即为 MFA 的临时 token
    if (data.totpStatus === "enabled") {
      emits("need-mfa", data.accessToken || "");
    } else {
      userStore.setUserInfo(data);
      emits("on-submit");
    }
  } catch {
    // 登录失败刷新图形验证码
    getCaptcha();
  } finally {
    loading.value = false;
  }
}, 500);

/* ***************************** 生命周期 ********************************* */
onMounted(() => {
  getCaptcha();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.sms-btn {
  flex-shrink: 0;
  width: 120px;
  height: 40px;
}
</style>
