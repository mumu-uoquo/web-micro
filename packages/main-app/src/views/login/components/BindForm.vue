<template>
  <div class="bind-form">
    <!-- 头部说明 -->
    <div class="bind-header">
      <div class="bind-header__icon-wrap" :style="{ background: providerColor }">
        <span :class="providerIcon" class="bind-header__icon" />
      </div>
      <div class="bind-header__text">
        <h3 class="login-form__title">{{ t("login.bind.title") }}</h3>
        <el-text type="info" size="small">{{ t("login.bind.desc") }}</el-text>
      </div>
    </div>

    <el-form
      ref="bindFormRef"
      :model="formData"
      :rules="formRules"
      :validate-on-rule-change="false"
      size="large"
    >
      <!-- 账号 -->
      <el-form-item prop="account">
        <el-input
          v-model.trim="formData.account"
          :placeholder="t('login.bind.accountPlaceholder')"
          autocomplete="username"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- 密码 -->
      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="password">
          <el-input
            v-model.trim="formData.password"
            :placeholder="t('login.bind.passwordPlaceholder')"
            type="password"
            show-password
            autocomplete="current-password"
            @keyup.enter="handleSubmit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <!-- 绑定并登录 -->
      <el-form-item>
        <el-button :loading="loading" type="primary" class="w-full" @click="handleSubmit">
          {{ t("login.bind.submit") }}
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 返回 -->
    <div flex-center>
      <el-link
        type="primary"
        underline="never"
        @click="$emit('update:modelValue', props.returnTo ?? 'account')"
      >
        {{ t("login.backToAccount") }}
      </el-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Lock } from "@element-plus/icons-vue";
import { useUserStore, useSettingsStore } from "@/stores";
import { AuthStorage } from "@web-micro/shared";
import { encrypt } from "@web-micro/shared";
import { appConfig } from "@/settings";
import AuthAPI, { type CredentialBindParam } from "@/api/auth";

/* ------------------------------------------------------------------ */
/* Props & Emits                                                         */
/* ------------------------------------------------------------------ */
const props = defineProps<{
  /** 第三方凭证登录返回的临时 token，绑定时随账号密码一起提交 */
  tempToken: string;
  /** 第三方凭证类型（wechat / wecom 等），用于展示对应图标 */
  provider?: string;
  /** 返回的目标面板（默认 account） */
  returnTo?: string;
}>();

const emits = defineEmits<{
  /** 绑定并登录成功 */
  (e: "on-submit"): void;
  /** 切换视图，与其他表单保持相同的约定 */
  (e: "update:modelValue", value: string): void;
  /** 绑定后需要 MFA 二次认证，携带临时 token（通用） */
  (e: "need-mfa", tempToken: string): void;
}>();

/* ------------------------------------------------------------------ */
/* Composables                                                           */
/* ------------------------------------------------------------------ */
const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

/* ------------------------------------------------------------------ */
/* 第三方凭证图标（按 provider 区分）                                       */
/* ------------------------------------------------------------------ */
const PROVIDER_META: Record<string, { icon: string; color: string }> = {
  wechat: { icon: "i-svg:site-wechat", color: "#07c160" },
  wecom: { icon: "i-svg:site-wecom", color: "#ffffff" },
  qq: { icon: "i-svg:site-qq", color: "#12b7f5" },
  github: { icon: "i-svg:site-github", color: "#24292e" },
  gitee: { icon: "i-svg:site-gitee", color: "#c71d23" },
};
const providerIcon = computed(() => PROVIDER_META[props.provider || "wechat"]?.icon || "i-ep:link");
const providerColor = computed(
  () => PROVIDER_META[props.provider || "wechat"]?.color || "var(--el-color-primary)"
);

/* ------------------------------------------------------------------ */
/* 表单                                                                  */
/* ------------------------------------------------------------------ */
const bindFormRef = ref(ElForm);
const loading = ref(false);
const isCapsLock = ref(false);

const formData = ref({
  account: "",
  password: "",
});

const formRules = reactive({
  account: [{ required: true, trigger: "blur", message: t("login.bind.message.account.required") }],
  password: [
    { required: true, trigger: "blur", message: t("login.bind.message.password.required") },
    { min: 6, trigger: "blur", message: t("login.message.password.min") },
  ],
});

/* ------------------------------------------------------------------ */
/* 提交                                                                  */
/* ------------------------------------------------------------------ */
const handleSubmit = useDebounceFn(async () => {
  try {
    await bindFormRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const reqData: CredentialBindParam = {
      account: encrypt.rsa(formData.value.account, settingsStore.rsaPublicKey),
      password: encrypt.password(formData.value.password, settingsStore.rsaPublicKey),
      tempToken: props.tempToken, // 第三方凭证登录返回的临时 token
      rememberMe: AuthStorage.getRememberMe(),
      appVersion: appConfig.version,
    };
    const userDto = await AuthAPI.credentialBind(reqData);
    // userId（id）为空表示绑定后仍需 MFA 二次认证，accessToken 即为临时 token
    if (userDto.totpStatus === "enabled" || !userDto.id) {
      emits("need-mfa", userDto.accessToken || "");
      return;
    }
    userStore.setUserInfo(userDto);
    ElMessage.success(t("login.bind.success"));
    emits("on-submit");
  } catch {
    // error handled by request interceptor
  } finally {
    loading.value = false;
  }
}, 500);

/* ------------------------------------------------------------------ */
/* CapsLock 监听                                                          */
/* ------------------------------------------------------------------ */
const onKeydown = (e: KeyboardEvent) => {
  if (typeof e.getModifierState === "function") {
    isCapsLock.value = e.getModifierState("CapsLock");
  }
};
const onMousedown = (e: MouseEvent) => {
  if (typeof e.getModifierState === "function") {
    isCapsLock.value = e.getModifierState("CapsLock");
  }
};
onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("mousedown", onMousedown);
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("mousedown", onMousedown);
});
</script>

<style lang="scss" scoped>
.bind-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bind-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-5);
  border-radius: 10px;

  &__icon-wrap {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  &__icon {
    font-size: 22px;
    color: #fff;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .login-form__title {
      margin: 0;
      font-size: 0.95rem;
    }
  }
}
</style>
