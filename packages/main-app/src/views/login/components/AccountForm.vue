<template>
  <h3 class="login-form__title text-center">{{ t("login.login") }}</h3>
  <el-form
    ref="loginFormRef"
    :model="loginData"
    :rules="loginRules"
    :validate-on-rule-change="false"
    size="large"
  >
    <!-- 用户名 -->
    <el-form-item prop="account">
      <el-input v-model.trim="loginData.account" :placeholder="t('login.account.username')">
        <template #prefix>
          <el-icon><User /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <!-- 密码 -->
    <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
      <el-form-item prop="password">
        <el-input
          v-model.trim="loginData.password"
          :placeholder="t('login.account.password')"
          type="password"
          show-password
          @keyup.enter="handleLoginSubmit"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </el-input>
      </el-form-item>
    </el-tooltip>

    <!-- 验证码 -->
    <el-form-item v-if="captchaBase64" prop="captcha">
      <div flex items-center gap-10px>
        <el-input
          v-model.trim="loginData.captcha"
          :placeholder="t('login.captchaCode')"
          clearable
          class="flex-1"
          @keyup.enter="handleLoginSubmit"
        >
          <template #prefix>
            <div class="i-svg:captcha" />
          </template>
        </el-input>
        <div cursor-pointer h-44px w-140px flex-center @click="getCaptcha">
          <el-icon v-if="captchLoading" class="is-loading" size="20"><Loading /></el-icon>
          <img
            v-else-if="captchaBase64"
            border-rd-4px
            w-full
            h-full
            block
            object-cover
            shadow="[0_0_0_1px_var(--el-border-color)_inset]"
            :src="captchaBase64"
            alt="captchaCode"
            title="点击刷新验证码"
            @error="getCaptcha"
          />
          <el-text v-else type="info" size="small">点击获取验证码</el-text>
        </div>
      </div>
    </el-form-item>

    <div class="flex-x-between w-full">
      <el-checkbox v-model="loginData.rememberMe">
        {{ t("login.rememberMe") }}
      </el-checkbox>
      <el-link type="primary" underline="never" @click="showForm('resetPwd')">
        {{ t("login.account.forgetPassword") }}
      </el-link>
    </div>

    <!-- 登录按钮 -->
    <el-form-item>
      <el-button :loading="loading" type="primary" class="w-full" @click="handleLoginSubmit">
        {{ t("login.login") }}
      </el-button>
    </el-form-item>
  </el-form>

  <div v-if="settingsStore.registerEnabled" flex-center gap-10px>
    <el-text size="default">{{ t("login.account.noAccount") }}</el-text>
    <el-link type="primary" underline="never" @click="showForm('register')">
      {{ t("login.account.reg") }}
    </el-link>
  </div>
</template>

<script setup lang="ts">
import { User, Lock, Loading } from "@element-plus/icons-vue";
import { useUserStore, useSettingsStore } from "@/stores";
import { appConfig } from "@/settings";
import { encrypt } from "@web-micro/shared";
import { AuthStorage } from "@web-micro/shared";
import AuthAPI, { type AccountLoginParam } from "@/api/auth";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit", "on-show-form", "need-mfa"]);

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const loading = ref(false); // 按钮 loading 状态
const isCapsLock = ref(false); // 是否大写锁定
const captchaBase64 = ref(); // 验证码图片Base64字符串

const { t } = useI18n();

/**
 * 切换到其他表单（注册 / 忘记密码）
 */
function showForm(type: "register" | "resetPwd", payload?: string) {
  emits("on-show-form", type, payload);
}

/* ***************************** 表单信息 ********************************* */
// 初始表单数据
const rememberMe = AuthStorage.getRememberMe();
const loginData = ref<AccountLoginParam>({
  account: "",
  password: "",
  captcha: "",
  rememberMe,
});
// 表单校验规则
const baseRules = reactive({
  account: [{ required: true, trigger: "blur", message: t("login.message.username.required") }],
  password: [
    { required: true, trigger: "blur", message: t("login.message.password.required") },
    { min: 6, message: t("login.message.password.min"), trigger: "blur" },
  ],
});
const captchaRule = reactive({
  captcha: [{ required: true, trigger: "blur", message: t("login.message.captchaCode.required") }],
});
// 动态计算登录规则
const loginRules = computed(() => {
  if (captchaBase64.value) {
    // 如果有验证码图片，则验证码必填
    return { ...baseRules, ...captchaRule };
  } else {
    return { ...baseRules };
  }
});

/**
 * 登录表单提交（防抖）
 */
const loginFormRef = ref(ElForm);
const handleLoginSubmit = useDebounceFn(async () => {
  // 表单校验
  try {
    await loginFormRef.value?.validate();
  } catch {
    return;
  }
  // 登录提交
  loading.value = true;
  const reqData = {
    account: loginData.value.account,
    password: loginData.value.password,
    captcha: loginData.value.captcha,
    rememberMe: loginData.value.rememberMe,
    appVersion: appConfig.version,
  } as AccountLoginParam;
  try {
    reqData.account = encrypt.rsa(reqData.account || "", settingsStore.rsaPublicKey);
    reqData.password = encrypt.password(reqData.password || "", settingsStore.rsaPublicKey);
    const userDto = await AuthAPI.accountLogin(reqData);
    AuthStorage.setRememberMe(reqData.rememberMe);
    if (userDto.totpStatus === "enabled") {
      // 开启双因子认证，触发通用 MFA 流程
      emits("need-mfa", userDto.accessToken || "");
    } else {
      // 保存用户信息，跳转首页
      userStore.setUserInfo(userDto);
      emits("on-submit");
    }
  } catch {
    getCaptcha();
  } finally {
    loading.value = false;
  }
}, 500);

/**
 * 获取验证码
 */
const captchLoading = ref(false);
function getCaptcha() {
  captchLoading.value = true;
  AuthAPI.getCaptcha({ scene: "login" })
    .then((data) => {
      loginData.value.captcha = "";
      captchaBase64.value = data;
    })
    .catch(() => {
      // do nothing
    })
    .finally(() => (captchLoading.value = false));
}

// 全局监听 mousedown 和 keydown，实时同步 CapsLock 状态
// mousedown 早于 focus 触发，能捕获触发 focus 的那次点击
const onMousedown = (e: MouseEvent) => {
  if (typeof e.getModifierState === "function") {
    isCapsLock.value = e.getModifierState("CapsLock");
  }
};
const onKeydown = (e: KeyboardEvent) => {
  if (typeof e.getModifierState === "function") {
    isCapsLock.value = e.getModifierState("CapsLock");
  }
};
onMounted(() => {
  window.addEventListener("mousedown", onMousedown);
  window.addEventListener("keydown", onKeydown);
});
onUnmounted(() => {
  window.removeEventListener("mousedown", onMousedown);
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style lang="scss" scoped>
/*
.input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}
.captcha-img {
  width: 120px;
  height: 30px;
  margin: 4px;
  cursor: pointer;
}
  */
</style>
