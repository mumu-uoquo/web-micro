<template>
  <el-form ref="formRef" :model="formData" :rules="rules" size="large">
    <h3 class="login-form__title text-center">{{ t("login.emergencyLogin") }}</h3>

    <div style="margin-bottom: 16px">
      <el-alert type="warning" show-icon :closable="false" :title="t('login.emerg.alert')" />
    </div>

    <el-form-item prop="account">
      <el-input v-model.trim="formData.account" :placeholder="t('login.emerg.username')" clearable>
        <template #prefix>
          <el-icon><User /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item prop="totpCode">
      <el-input
        v-model="formData.totpCode"
        :placeholder="t('login.emerg.totpCode')"
        maxlength="6"
        @input="handleTotpInput"
        @keyup.enter="handleSubmit"
      >
        <template #prefix><span class="i-svg:site-mfa" /></template>
      </el-input>
    </el-form-item>

    <div class="flex-x-between w-full" style="margin-bottom: 4px">
      <el-checkbox v-model="formData.rememberMe">{{ t("login.rememberMe") }}</el-checkbox>
    </div>

    <el-form-item>
      <el-button type="primary" class="w-full" :loading="loading" @click="handleSubmit">
        {{ t("login.login") }}
      </el-button>
    </el-form-item>
  </el-form>
</template>
<script setup lang="ts">
import { User } from "@element-plus/icons-vue";
import { useUserStore, useSettingsStore } from "@/stores";
import { AuthStorage } from "@web-micro/shared";
import { encrypt } from "@web-micro/shared";
import { appConfig } from "@/settings";
import AuthAPI from "@/api/auth";

const emits = defineEmits<{
  (e: "on-submit"): void;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const loading = ref(false);

const formData = reactive({
  account: "",
  totpCode: "",
  rememberMe: AuthStorage.getRememberMe(),
});

const formRef = ref();

const rules = {
  account: [{ required: true, message: t("login.message.username.required"), trigger: "blur" }],
  totpCode: [
    { required: true, message: t("login.emerg.message.totpCode.required"), trigger: "blur" },
    { pattern: /^\d{6}$/, message: t("login.emerg.message.totpCode.invalid"), trigger: "blur" },
  ],
};

function handleTotpInput(value: string) {
  formData.totpCode = value.replace(/\D/g, "");
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const data = await AuthAPI.emergencyLogin({
      account: encrypt.rsa(formData.account, settingsStore.rsaPublicKey),
      totpCode: encrypt.rsa(formData.totpCode, settingsStore.rsaPublicKey),
      rememberMe: formData.rememberMe,
      appVersion: appConfig.version,
    });
    AuthStorage.setRememberMe(formData.rememberMe);
    userStore.setUserInfo(data);
    emits("on-submit");
  } catch {
    formData.totpCode = "";
  } finally {
    loading.value = false;
  }
}
</script>
