<template>
  <div>
    <h3 class="login-form__title text-center">{{ t("login.resetPwd.title") }}</h3>

    <el-form
      ref="formRef"
      :model="model"
      :rules="rules"
      :validate-on-rule-change="false"
      size="large"
    >
      <!-- 手机号 -->
      <el-form-item prop="phone">
        <el-input v-model.trim="model.phone" :placeholder="t('login.phone')" maxlength="11">
          <template #prefix>
            <el-icon><Iphone /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 图形验证码（人机校验） -->
      <el-form-item prop="captcha">
        <div flex items-center gap-10px w-full>
          <el-input
            v-model.trim="model.captcha"
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
            v-model.trim="model.smsCode"
            :placeholder="t('login.smsCode')"
            class="flex-1"
            maxlength="6"
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

      <!-- 新密码 -->
      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="newPassword">
          <el-input
            v-model.trim="model.newPassword"
            :placeholder="t('login.resetPwd.newPassword')"
            type="password"
            show-password
            @keyup="checkCapsLock"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <!-- 确认密码 -->
      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="confirmPassword">
          <el-input
            v-model.trim="model.confirmPassword"
            :placeholder="t('login.message.password.confirm')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="submit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <!-- 重置按钮 -->
      <el-form-item>
        <el-button :loading="loading" type="warning" class="w-full" @click="submit">
          {{ t("login.resetPwd.title") }}
        </el-button>
      </el-form-item>
    </el-form>

    <div flex-center gap-10px>
      <el-text size="default">{{ t("login.resetPwd.thinkOfPasswd") }}</el-text>
      <el-link type="primary" underline="never" @click="toLogin">{{ t("login.login") }}</el-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, Loading, Iphone, ChatDotRound } from "@element-plus/icons-vue";
import { useSettingsStore } from "@/stores";
import { encrypt } from "@web-micro/shared";
import AuthAPI, { type ResetPasswordParam } from "@/api/auth";

const { t } = useI18n();
const settingsStore = useSettingsStore();

const emit = defineEmits(["update:modelValue"]);
const toLogin = () => emit("update:modelValue", "account");

// 短信验证码场景，需与获取图形验证码时保持一致
const SMS_SCENE = "reset_password";

const formRef = ref(ElForm);
const loading = ref(false); // 重置按钮 loading
const sendingCode = ref(false); // 发送短信 loading
const captchaLoading = ref(false); // 图形验证码 loading
const isCapsLock = ref(false); // 大写锁定
const captchaBase64 = ref<string>(""); // 图形验证码 base64
const countdown = ref(0); // 短信倒计时

const model = ref({
  phone: "",
  captcha: "",
  smsCode: "",
  newPassword: "",
  confirmPassword: "",
});

const rules = computed(() => ({
  phone: [
    { required: true, trigger: "blur", message: t("login.message.phone.required") },
    { pattern: /^1[3-9]\d{9}$/, trigger: "blur", message: t("login.message.phone.invalid") },
  ],
  captcha: [{ required: true, trigger: "blur", message: t("login.message.captchaCode.required") }],
  smsCode: [{ required: true, trigger: "blur", message: t("login.message.smsCode.required") }],
  newPassword: [
    { required: true, trigger: "blur", message: t("login.message.newPassword.required") },
    { min: 6, trigger: "blur", message: t("login.message.password.min") },
  ],
  confirmPassword: [
    { required: true, trigger: "blur", message: t("login.message.password.confirm") },
    {
      validator: (_: any, value: string, callback: any) => {
        if (value !== model.value.newPassword) {
          callback(new Error(t("login.message.password.inconformity")));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
}));

/* ***************************** 图形验证码 ********************************* */
function getCaptcha() {
  captchaLoading.value = true;
  AuthAPI.getCaptcha({ scene: SMS_SCENE })
    .then((data) => {
      model.value.captcha = "";
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

async function sendSmsCode() {
  try {
    await formRef.value?.validateField(["phone", "captcha"]);
  } catch {
    return;
  }
  sendingCode.value = true;
  try {
    const message = await AuthAPI.sendSmsCaptcha({
      // 手机号 RSA 加密后传输
      phone: encrypt.rsa(model.value.phone, settingsStore.rsaPublicKey),
      captcha: model.value.captcha,
      scene: SMS_SCENE,
    });
    ElMessage.success(message ?? t("login.codeSent"));
    startCountdown();
  } catch {
    getCaptcha();
  } finally {
    sendingCode.value = false;
  }
}

/* ***************************** 提交重置 ********************************* */
const submit = useDebounceFn(async () => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const reqData: ResetPasswordParam = {
      // 手机号、新密码 RSA 加密后传输
      phone: encrypt.rsa(model.value.phone, settingsStore.rsaPublicKey),
      smsCode: model.value.smsCode,
      newPassword: encrypt.password(model.value.newPassword, settingsStore.rsaPublicKey),
    };
    await AuthAPI.resetPassword(reqData);
    ElMessage.success(t("login.resetPwd.success"));
    toLogin();
  } catch {
    getCaptcha();
  } finally {
    loading.value = false;
  }
}, 500);

/* ***************************** 其他 ********************************* */
function checkCapsLock(event: KeyboardEvent) {
  if (event instanceof KeyboardEvent) {
    isCapsLock.value = event.getModifierState("CapsLock");
  }
}

onMounted(() => getCaptcha());
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
