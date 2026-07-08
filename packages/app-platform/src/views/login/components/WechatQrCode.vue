<template>
  <div class="wechat-qr" :class="{ 'wechat-qr--wxjs': renderType === 'wxjs' }">
    <h3 v-if="renderType === 'oauth'" class="login-form__title text-center">
      {{ t("login.wechatLogin") }}
    </h3>

    <div class="qr-wrapper">
      <!-- 二维码容器 -->
      <div class="qr-box" :class="{ expired: isExpired }">
        <!--
          renderType === 'wxjs'：微信官方 WxLogin JS 渲染 iframe
          renderType === 'oauth'：自行拼接 OAuth2 URL 并用 qrcode 库生成二维码
        -->
        <div v-if="renderType === 'wxjs'" :id="CONTAINER_ID" class="qr-frame" />
        <canvas v-else ref="canvasRef" class="qr-canvas" />

        <!-- 加载遮罩 -->
        <div v-if="loading" class="qr-overlay">
          <el-icon class="is-loading" size="32"><Loading /></el-icon>
        </div>

        <!-- 过期/错误遮罩 -->
        <Transition name="fade">
          <div v-if="isExpired" class="qr-overlay qr-expired-mask" @click="refresh">
            <el-icon size="28"><RefreshRight /></el-icon>
            <span>{{ t("login.qr.expired") }}</span>
            <span class="qr-expired-mask__sub">{{ t("login.qr.clickRefresh") }}</span>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading, RefreshRight } from "@element-plus/icons-vue";
import QRCode from "qrcode";
import { useUserStore, useSettingsStore } from "@/stores";
import { AuthStorage } from "@web-micro/shared";
import { encrypt } from "@web-micro/shared";
import { appConfig } from "@/settings";
import AuthAPI, { type CredentialConfigDto } from "@/api/auth";

const emits = defineEmits<{
  /** 登录成功 */
  (e: "on-submit"): void;
  /** 切换其他视图 */
  (e: "update:modelValue", value: string): void;
  /** 需要绑定账号（未找到关联账号），携带绑定用临时 token 和凭证类型 */
  (e: "need-bind", tempToken: string, provider: string): void;
  /** 需要 MFA 二次认证，携带临时 token */
  (e: "need-mfa", tempToken: string): void;
}>();

const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

// 凭证类型 / 场景
const SCENE = "wechat";
// 二维码本地有效期（秒），超时后重新拉取配置生成新码
const QR_TTL = 300;
// WxLogin 二维码挂载点 id（仅 wxjs 模式使用）
const CONTAINER_ID = "wx-login-container";
// 微信官方 JS（仅 wxjs 模式按需加载）
const WX_LOGIN_JS = "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js";

const loading = ref(true);
const isExpired = ref(false);
const currentState = ref<string>("");
/** 当前渲染方式，由 config 接口返回决定，默认 wxjs 保持向后兼容 */
const renderType = ref<"wxjs" | "oauth">("wxjs");

/** canvas ref（仅 oauth 模式使用） */
const canvasRef = ref<HTMLCanvasElement | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let expireTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (expireTimer) {
    clearTimeout(expireTimer);
    expireTimer = null;
  }
}

/* ===================== wxjs 模式：加载微信官方 JS ===================== */
let wxScriptPromise: Promise<void> | null = null;
function loadWxLoginScript(): Promise<void> {
  if ((window as any).WxLogin) return Promise.resolve();
  if (wxScriptPromise) return wxScriptPromise;
  wxScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WX_LOGIN_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      wxScriptPromise = null;
      reject(new Error("wxLogin.js 加载失败"));
    };
    document.head.appendChild(script);
  });
  return wxScriptPromise;
}

async function renderWxjsQrCode(cfg: CredentialConfigDto) {
  await loadWxLoginScript();
  await nextTick();
  const el = document.getElementById(CONTAINER_ID);
  if (el) el.innerHTML = "";
  const isDark = document.documentElement.classList.contains("dark");
  new (window as any).WxLogin({
    self_redirect: true,
    id: CONTAINER_ID,
    appid: cfg.appid || "",
    scope: "snsapi_login",
    redirect_uri: encodeURIComponent(cfg.redirectUri || ""),
    state: cfg.state || "",
    style: isDark ? "white" : "black",
    stylelite: 1,
  });
}

/* ===================== oauth 模式：拼接 URL 并自绘二维码 ===================== */
/**
 * 微信公众号网页授权 URL
 * https://open.weixin.qq.com/connect/oauth2/authorize
 *   ?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code
 *   &scope=snsapi_base&state=STATE#wechat_redirect
 *
 * 参考：https://developers.weixin.qq.com/doc/service/guide/h5/auth.html
 */
function buildOAuthUrl(cfg: CredentialConfigDto): string {
  const params = new URLSearchParams({
    appid: cfg.appid || "",
    redirect_uri: cfg.redirectUri || "",
    response_type: "code",
    scope: "snsapi_base",
    state: cfg.state || "",
  });
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

async function renderOAuthQrCode(cfg: CredentialConfigDto) {
  await nextTick();
  if (!canvasRef.value) return;
  const isDark = document.documentElement.classList.contains("dark");
  await QRCode.toCanvas(canvasRef.value, buildOAuthUrl(cfg), {
    width: 260,
    margin: 2,
    color: {
      dark: isDark ? "#ffffff" : "#000000",
      light: isDark ? "#1e1e1e" : "#ffffff",
    },
  });
}

/* ===================== 主流程 ===================== */
async function loadQrCode() {
  clearTimers();
  loading.value = true;
  isExpired.value = false;
  try {
    const cfg = await AuthAPI.credentialConfig({ scene: SCENE });
    currentState.value = cfg.state || "";
    // 由后端 renderType 决定渲染方式，未返回时默认 wxjs（向后兼容）
    renderType.value = cfg.renderType ?? "wxjs";

    if (renderType.value === "oauth") {
      await renderOAuthQrCode(cfg);
      // oauth 模式需轮询状态
      startPolling();
    } else {
      await renderWxjsQrCode(cfg);
      // wxjs 模式由轮询驱动（WxLogin 的回调 URL 由后端处理后通过 credentialStatus 通知）
      startPolling();
    }

    loading.value = false;
    expireTimer = setTimeout(() => {
      isExpired.value = true;
      clearTimers();
    }, QR_TTL * 1000);
  } catch {
    loading.value = false;
    isExpired.value = true;
  }
}

function startPolling() {
  pollTimer = setInterval(async () => {
    try {
      const res = await AuthAPI.credentialStatus({ scene: SCENE, state: currentState.value });
      if (res.status === "confirmed" && res.code) {
        clearTimers();
        await doCredentialLogin(res.code);
      }
    } catch {
      // 忽略单次轮询错误，等待下一次
    }
  }, 2000);
}

async function doCredentialLogin(code: string) {
  try {
    const data = await AuthAPI.credentialLogin({
      credentialType: SCENE,
      credentialValue: encrypt.rsa(code, settingsStore.rsaPublicKey),
      state: currentState.value,
      rememberMe: AuthStorage.getRememberMe(),
      appVersion: appConfig.version,
    });
    if (data.totpStatus === "enabled") {
      emits("need-mfa", data.accessToken || "");
    } else if (!data.id) {
      emits("need-bind", data.accessToken || "", SCENE);
    } else {
      userStore.setUserInfo(data);
      emits("on-submit");
    }
  } catch {
    refresh();
  }
}

function refresh() {
  loadQrCode();
}

onMounted(() => {
  loadQrCode();
});

onUnmounted(() => {
  clearTimers();
});
</script>

<style lang="scss" scoped>
.wechat-qr {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

/* oauth 模式有 title */
.qr-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 278px;
  overflow: hidden;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  transition: border-color 0.3s;

  &.expired {
    border-color: var(--el-color-danger-light-5);
  }
}

/* wxjs 模式：无 title，qr-box 扩大 */
.wechat-qr--wxjs .qr-box {
  height: 350px;
}

/* wxjs 模式：iframe 容器 */
.qr-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 306px;

  :deep(iframe) {
    display: block;
    margin: 0 auto;
    border: 0;
  }
}

.wechat-qr--wxjs .qr-frame {
  height: 350px;
}

/* oauth 模式：canvas 二维码，限制在容器内不撑开布局 */
.qr-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.qr-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-blank);
}

.qr-expired-mask {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 60%);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  transition: background 0.2s;

  &:hover {
    background: rgb(0 0 0 / 72%);
  }

  &__sub {
    font-size: 11px;
    font-weight: 400;
    opacity: 0.8;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
