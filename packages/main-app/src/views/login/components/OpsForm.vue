<template>
  <!-- 外层容器：position:relative，作为弹窗的定位基准 -->
  <div ref="wrapRef" class="ops-form-wrap">
    <el-form ref="formRef" :model="form" :rules="rules" size="large">
      <h3 class="login-form__title text-center">运维登录</h3>

      <el-form-item prop="account">
        <el-input v-model.trim="form.account" placeholder="请输入登录账号" clearable>
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="phone">
        <el-input v-model.trim="form.phone" placeholder="请输入运维手机号" maxlength="11" clearable>
          <template #prefix>
            <el-icon><Iphone /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="dynamicCode">
        <div class="dynamic-code-row">
          <el-input
            v-model.trim="form.dynamicCode"
            placeholder="请输入动态口令"
            maxlength="20"
            class="flex-1"
            @keyup.enter="handleSubmit"
          >
            <template #prefix>
              <span class="i-svg:site-mfa" />
            </template>
          </el-input>
          <el-tooltip content="获取动态口令二维码" placement="top">
            <el-button class="qr-trigger-btn" :disabled="qrVisible" @click.stop="toggleQr">
              <el-icon><Grid /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" class="w-full" :loading="loading" @click="handleSubmit">
          登录
        </el-button>
      </el-form-item>
      <div flex-center mt-4px>
        <el-link type="info" underline="never" @click="emits('on-cancel')">取消</el-link>
      </div>
    </el-form>

    <!-- 二维码 dialog -->
    <el-dialog
      v-model="qrVisible"
      title="扫码获取动态口令"
      width="300px"
      :close-on-click-modal="false"
      :modal="false"
      :modal-penetrable="true"
      :append-to="wrapRef ?? undefined"
      class="ops-qr-dialog"
      @closed="clearExpireTimer"
    >
      <div class="qr-dialog-body">
        <div class="ops-qr-img-wrap" :class="{ expired: qrExpired }">
          <img
            v-if="qrBase64 && !qrExpired"
            :src="qrBase64"
            class="ops-qr-img"
            alt="动态口令二维码"
          />
          <el-icon v-else-if="qrLoading" class="is-loading ops-qr-loading" size="32">
            <Loading />
          </el-icon>
          <Transition name="ops-fade">
            <div v-if="qrExpired" class="ops-qr-expired-mask" @click="loadQrCode">
              <el-icon size="24"><RefreshRight /></el-icon>
              <span>已失效，点击刷新</span>
            </div>
          </Transition>
        </div>
        <el-text size="small" type="info" class="ops-qr-guide">使用企业微信扫码</el-text>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { User, Iphone, Grid, Loading, RefreshRight } from "@element-plus/icons-vue";
import { useUserStore, useSettingsStore } from "@/stores";
import { encrypt } from "@web-micro/shared";
import { appConfig } from "@/settings";
import AuthAPI from "@/api/auth";
const emits = defineEmits<{
  (e: "on-submit"): void;
  (e: "on-cancel"): void;
}>();

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const formRef = ref();
const loading = ref(false);
const form = reactive({ account: "", phone: "", dynamicCode: "" });
const rules = {
  account: [{ required: true, message: "请输入运维账号", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号格式", trigger: "blur" },
  ],
  dynamicCode: [{ required: true, message: "请输入动态口令", trigger: "blur" }],
};

// ── 二维码弹窗 ──────────────────────────────────────
// 二维码本地有效期（秒），超时后重新拉取配置生成新码
const QR_TTL = 300;
const qrVisible = ref(false);
const qrLoading = ref(false);
const qrExpired = ref(false);
const qrBase64 = ref("");
const wrapRef = ref<HTMLElement | null>(null);

let expireTimer: ReturnType<typeof setTimeout> | null = null;

function clearExpireTimer() {
  if (expireTimer) {
    clearTimeout(expireTimer);
    expireTimer = null;
  }
}

async function loadQrCode() {
  clearExpireTimer();
  qrLoading.value = true;
  qrExpired.value = false;
  qrBase64.value = "";
  try {
    const data = await AuthAPI.opsConfig({
      account: encrypt.rsa(form.account, settingsStore.rsaPublicKey),
      phone: encrypt.rsa(form.phone, settingsStore.rsaPublicKey),
    });
    qrBase64.value = data.qrCode ?? "";
    expireTimer = setTimeout(() => {
      qrExpired.value = true;
    }, QR_TTL * 1000);
  } catch {
    qrExpired.value = true;
  } finally {
    qrLoading.value = false;
  }
}

/** 校验账号和手机号后打开弹窗，按钮 disabled 直到关闭 */
async function toggleQr() {
  try {
    await formRef.value?.validateField(["account", "phone"]);
  } catch {
    return;
  }
  qrVisible.value = true;
  loadQrCode();
}

async function handleSubmit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const data = await AuthAPI.opsLogin({
      account: encrypt.rsa(form.account, settingsStore.rsaPublicKey),
      phone: encrypt.rsa(form.phone, settingsStore.rsaPublicKey),
      dynamicCode: encrypt.rsa(form.dynamicCode, settingsStore.rsaPublicKey),
      appVersion: appConfig.version,
    });
    userStore.setUserInfo(data);
    emits("on-submit");
  } catch {
    form.dynamicCode = "";
  } finally {
    loading.value = false;
  }
}

onUnmounted(() => {
  clearExpireTimer();
});
</script>

<style lang="scss" scoped>
.ops-form-wrap {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  background: var(--el-bg-color);
  border-radius: 20px;
  backdrop-filter: blur(6px);
}

.dynamic-code-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.qr-trigger-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 0;
}

.qr-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.ops-qr-img-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240px;
  height: 240px;
  overflow: hidden;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: border-color 0.3s;

  &.expired {
    border-color: var(--el-color-danger-light-5);
  }
}

.ops-qr-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ops-qr-loading {
  color: var(--el-text-color-placeholder);
}

.ops-qr-expired-mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 60%);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  transition: background 0.2s;

  &:hover {
    background: rgb(0 0 0 / 72%);
  }
}

.ops-qr-guide {
  font-size: 11px;
  text-align: center;
}

.ops-fade-enter-active,
.ops-fade-leave-active {
  transition: opacity 0.25s;
}

.ops-fade-enter-from,
.ops-fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
/* append-to wrapRef 后，dialog 插入 ops-form-wrap 内，相对其 position:relative 定位 */
.ops-qr-dialog.el-dialog {
  position: absolute;
  top: 4px;
  left: 50%;
  margin: 0;
  transform: translateX(-50%);

  .el-dialog__header {
    padding-top: 0;
  }
  .el-dialog__body {
    padding-bottom: 0;
  }
}
</style>
