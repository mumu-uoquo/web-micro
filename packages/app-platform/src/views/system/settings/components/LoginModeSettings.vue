<template>
  <div v-loading="loading">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <!-- ───────────── 登录方式选择 ───────────── -->
      <el-form-item label="常规登录" prop="normalModes">
        <el-checkbox-group
          v-model="normalModes"
          class="login-mode-group"
          @change="handleNormalModesChange"
        >
          <el-checkbox value="account">账号密码</el-checkbox>
          <el-checkbox value="sms">手机短信</el-checkbox>
          <el-checkbox value="wechat">
            微信扫码
            <el-tooltip content="需要服务器能访问 https://api.weixin.qq.com" placement="top">
              <el-icon class="mode-tip-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </el-checkbox>
          <el-checkbox value="wecom">
            企微扫码
            <el-tooltip content="需要服务器能访问 https://qyapi.weixin.qq.com" placement="top">
              <el-icon class="mode-tip-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="紧急登录">
        <div class="emergency-modes">
          <div class="emergency-mode-item">
            <el-checkbox v-model="form.emergEnable" @change="handleMfaChange">
              MFA认证
              <el-tooltip content="用户需要开启并绑定了MFA功能" placement="top">
                <el-icon class="mode-tip-icon"><InfoFilled /></el-icon>
              </el-tooltip>
            </el-checkbox>
            <el-alert
              v-if="form.emergEnable"
              class="emergency-mode-alert"
              type="warning"
              show-icon
              :closable="false"
              title="仅通过账号和 MFA 验证码校验，存在被破解的风险，请谨慎开启。"
            />
          </div>
        </div>
      </el-form-item>

      <!-- ───────────── 具体配置 ───────────── -->
      <!-- SMS Config -->
      <template v-if="form.smsEnable">
        <el-divider content-position="left">手机短信配置</el-divider>
        <el-form-item label="平台类型" prop="smsPlatform">
          <el-select v-model="form.smsPlatform" placeholder="请选择平台类型">
            <el-option label="阿里云" value="aliyun" />
            <el-option label="腾讯云" value="tencent" />
            <el-option label="华为云" value="huawei" />
          </el-select>
        </el-form-item>
        <el-form-item label="AppID" prop="smsAppId">
          <el-input v-model="form.smsAppId" placeholder="请输入 AppID" />
        </el-form-item>
        <el-form-item label="AppSecret" prop="smsAppSecret">
          <el-input v-model="form.smsAppSecret" placeholder="请输入 AppSecret" />
        </el-form-item>
        <el-form-item label="签名" prop="smsSign">
          <el-input v-model="form.smsSign" placeholder="请输入签名" />
        </el-form-item>
        <el-form-item label="模板ID" prop="smsTemplateId">
          <el-input v-model="form.smsTemplateId" placeholder="请输入模板ID" />
        </el-form-item>
      </template>

      <!-- WeChat Config -->
      <template v-if="form.wechatEnable">
        <el-divider content-position="left">微信扫码配置</el-divider>
        <el-form-item label="渲染模式" prop="wechatRenderType">
          <el-radio-group v-model="form.wechatRenderType">
            <el-radio value="wxjs">微信官方 JS-SDK</el-radio>
            <el-radio value="oauth">微信 OAuth2.0 URL</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="AppID" prop="wechatAppId">
          <el-input v-model="form.wechatAppId" placeholder="请输入 AppID" />
        </el-form-item>
        <el-form-item label="AppSecret" prop="wechatAppSecret">
          <el-input v-model="form.wechatAppSecret" placeholder="请输入 AppSecret" />
        </el-form-item>
        <el-form-item label="回调地址" prop="wechatCallbackUrl">
          <el-input v-model="form.wechatCallbackUrl" :placeholder="wechatCallbackPlaceholder" />
          <div v-if="form.wechatRenderType === 'wxjs'" class="field-hint">
            <el-icon class="hint-icon"><InfoFilled /></el-icon>
            回调地址的协议和域名须与当前网站一致，且与微信平台配置的“授权回调域”保持一致，建议为
            <el-text type="primary" size="small">{{ currentOrigin }}</el-text>
          </div>
          <div v-else class="field-hint">
            <el-icon class="hint-icon"><InfoFilled /></el-icon>
            回调地址的域名须与与微信平台配置的“可信域名”保持一致
          </div>
        </el-form-item>
      </template>

      <!-- WeCom Config -->
      <template v-if="form.wecomEnable">
        <el-divider content-position="left">企业微信配置</el-divider>
        <el-form-item label="渲染模式" prop="wecomRenderType">
          <el-radio-group v-model="form.wecomRenderType">
            <el-radio value="wxjs">微信官方 JS-SDK</el-radio>
            <el-radio value="oauth">微信 OAuth2.0 URL</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="CorpID" prop="wecomCorpId">
          <el-input v-model="form.wecomCorpId" placeholder="请输入企业 CorpID" />
        </el-form-item>
        <el-form-item label="AgentID" prop="wecomAgentId">
          <el-input v-model="form.wecomAgentId" placeholder="请输入应用 AgentID" />
        </el-form-item>
        <el-form-item label="Secret" prop="wecomSecret">
          <el-input v-model="form.wecomSecret" placeholder="请输入应用 Secret" />
        </el-form-item>
        <el-form-item label="回调地址" prop="wecomRedirectUri">
          <el-input v-model="form.wecomRedirectUri" :placeholder="wecomCallbackPlaceholder" />
          <div v-if="form.wecomRenderType === 'wxjs'" class="field-hint">
            <el-icon class="hint-icon"><InfoFilled /></el-icon>
            回调地址的协议和域名须与当前网站一致，且与微信平台配置的“授权回调域”保持一致，建议为
            <el-text type="primary" size="small">{{ currentOrigin }}</el-text>
          </div>
          <div v-else class="field-hint">
            <el-icon class="hint-icon"><InfoFilled /></el-icon>
            回调地址的域名须与与微信平台配置的“可信域名”保持一致
          </div>
        </el-form-item>
      </template>

      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { InfoFilled } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import SystemAPI from "@/api/system";
import type { SettingSaveParam, SettingDto } from "@/api/system";
import { decrypt } from "@web-micro/shared";

function decryptSettings(settings: SettingDto[]): SettingDto[] {
  return settings.map((item) => {
    if (!item.configValue) return item;
    try {
      return { ...item, configValue: decrypt.taes(item.configValue) || item.configValue };
    } catch {
      return item;
    }
  });
}

interface LoginModeForm {
  passwordEnable: boolean;
  smsEnable: boolean;
  wechatEnable: boolean;
  wecomEnable: boolean;
  smsPlatform: string;
  smsAppId: string;
  smsAppSecret: string;
  smsSign: string;
  smsTemplateId: string;
  wechatRenderType: string;
  wechatAppId: string;
  wechatAppSecret: string;
  wechatCallbackUrl: string;
  wecomRenderType: string;
  wecomCorpId: string;
  wecomAgentId: string;
  wecomSecret: string;
  wecomRedirectUri: string;
  emergEnable: boolean;
}

const CONFIG_MAP: Record<
  string,
  {
    field: keyof LoginModeForm;
    fromValue: (v: string | undefined) => any;
    toValue: (v: any) => string;
  }
> = {
  "login.account.enabled": {
    field: "passwordEnable",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "login.sms.enabled": {
    field: "smsEnable",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "login.wechat.enabled": {
    field: "wechatEnable",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "login.wecom.enabled": {
    field: "wecomEnable",
    fromValue: (v) => v === "true",
    toValue: (v) => String(v),
  },
  "login.emerg.enabled": {
    field: "emergEnable",
    fromValue: (v) => v === "true",
    toValue: (v) => String(v),
  },
  "login.sms.platform": {
    field: "smsPlatform",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.sms.appid": {
    field: "smsAppId",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.sms.secret": {
    field: "smsAppSecret",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.sms.sign": {
    field: "smsSign",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.sms.template": {
    field: "smsTemplateId",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.wechat.render-type": {
    field: "wechatRenderType",
    fromValue: (v) => v ?? "wxjs",
    toValue: (v) => v,
  },
  "login.wechat.appid": {
    field: "wechatAppId",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.wechat.secret": {
    field: "wechatAppSecret",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.wechat.redirect-uri": {
    field: "wechatCallbackUrl",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.wecom.render-type": {
    field: "wecomRenderType",
    fromValue: (v) => v ?? "wxjs",
    toValue: (v) => v,
  },
  "login.wecom.corpid": {
    field: "wecomCorpId",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.wecom.agentid": {
    field: "wecomAgentId",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.wecom.secret": {
    field: "wecomSecret",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "login.wecom.redirect-uri": {
    field: "wecomRedirectUri",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
};

const form = reactive<LoginModeForm>({
  passwordEnable: true,
  smsEnable: false,
  wechatEnable: false,
  wecomEnable: false,
  smsPlatform: "",
  smsAppId: "",
  smsAppSecret: "",
  smsSign: "",
  smsTemplateId: "",
  wechatRenderType: "wxjs",
  wechatAppId: "",
  wechatAppSecret: "",
  wechatCallbackUrl: "",
  wecomRenderType: "wxjs",
  wecomCorpId: "",
  wecomAgentId: "",
  wecomSecret: "",
  wecomRedirectUri: "",
  emergEnable: false,
});

/** 当前浏览器 origin，用于引导填写与浏览器一致的回调地址 */
const currentOrigin = window.location.origin;

const wechatCallbackPlaceholder = computed(() =>
  form.wechatRenderType === "wxjs"
    ? `请输入回调地址，如 ${currentOrigin}/callback`
    : "请输入回调地址，如 https://example.com/callback"
);

const wecomCallbackPlaceholder = computed(() =>
  form.wecomRenderType === "wxjs"
    ? `请输入回调地址，如 ${currentOrigin}/callback`
    : "请输入回调地址，如 https://example.com/callback"
);

function buildNormalModes(): string[] {
  const modes: string[] = [];
  if (form.passwordEnable) modes.push("account");
  if (form.smsEnable) modes.push("sms");
  if (form.wechatEnable) modes.push("wechat");
  if (form.wecomEnable) modes.push("wecom");
  return modes;
}

const normalModes = ref<string[]>(buildNormalModes());

watch(
  normalModes,
  (val) => {
    form.passwordEnable = val.includes("account");
    form.smsEnable = val.includes("sms");
    form.wechatEnable = val.includes("wechat");
    form.wecomEnable = val.includes("wecom");
  },
  { deep: true }
);

function handleNormalModesChange(val: (string | number | boolean)[]) {
  if ((val as string[]).length === 0) {
    nextTick(() => {
      normalModes.value = buildNormalModes();
    });
    ElMessage.warning("至少需要保留一种常规登录方式");
  }
}

function handleMfaChange(val: string | number | boolean) {
  if (val) {
    ElMessage.warning("MFA认证存在被破解的风险，请谨慎开启");
  }
}

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);

const rules: FormRules = {
  normalModes: [
    {
      validator: (_rule, _value, callback) => {
        if (normalModes.value.length === 0) {
          callback(new Error("至少需要保留一种常规登录方式"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
  smsPlatform: [
    {
      validator: (_rule, value, callback) => {
        if (form.smsEnable && (!value || value.trim() === "")) {
          callback(new Error("平台类型不能为空"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
  smsAppId: [
    {
      validator: (_rule, value, callback) => {
        if (form.smsEnable && (!value || value.trim() === "")) {
          callback(new Error("AppID 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  smsAppSecret: [
    {
      validator: (_rule, value, callback) => {
        if (form.smsEnable && (!value || value.trim() === "")) {
          callback(new Error("AppSecret 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  smsSign: [
    {
      validator: (_rule, value, callback) => {
        if (form.smsEnable && (!value || value.trim() === "")) {
          callback(new Error("签名不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  smsTemplateId: [
    {
      validator: (_rule, value, callback) => {
        if (form.smsEnable && (!value || value.trim() === "")) {
          callback(new Error("模板ID 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  wechatAppId: [
    {
      validator: (_rule, value, callback) => {
        if (form.wechatEnable && (!value || value.trim() === "")) {
          callback(new Error("AppID 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  wechatAppSecret: [
    {
      validator: (_rule, value, callback) => {
        if (form.wechatEnable && (!value || value.trim() === "")) {
          callback(new Error("AppSecret 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  wechatCallbackUrl: [
    {
      validator: (_rule, value, callback) => {
        if (!form.wechatEnable) return callback();
        if (!value || value.trim() === "") return callback(new Error("回调地址不能为空"));
        if (!/^https?:\/\//.test(value)) return callback(new Error("回调地址格式不正确"));
        if (form.wechatRenderType === "wxjs" && !value.startsWith(currentOrigin)) {
          return callback(new Error(`wxjs 模式下回调地址须以 ${currentOrigin} 开头`));
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  wecomCorpId: [
    {
      validator: (_rule, value, callback) => {
        if (form.wecomEnable && (!value || value.trim() === "")) {
          callback(new Error("CorpID 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  wecomAgentId: [
    {
      validator: (_rule, value, callback) => {
        if (form.wecomEnable && (!value || value.trim() === "")) {
          callback(new Error("AgentID 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  wecomSecret: [
    {
      validator: (_rule, value, callback) => {
        if (form.wecomEnable && (!value || value.trim() === "")) {
          callback(new Error("Secret 不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  wecomRedirectUri: [
    {
      validator: (_rule, value, callback) => {
        if (!form.wecomEnable) return callback();
        if (!value || value.trim() === "") return callback(new Error("回调地址不能为空"));
        if (!/^https?:\/\//.test(value)) return callback(new Error("回调地址格式不正确"));
        if (form.wecomRenderType === "wxjs" && !value.startsWith(currentOrigin)) {
          return callback(new Error(`wxjs 模式下回调地址须以 ${currentOrigin} 开头`));
        }
        callback();
      },
      trigger: "blur",
    },
  ],
};

function settingsToForm(settings: SettingDto[]) {
  const mapByLowerCode = new Map(
    Object.entries(CONFIG_MAP).map(([code, mapping]) => [code.toLowerCase(), mapping])
  );
  for (const item of settings) {
    const mapping = mapByLowerCode.get(item.configCode?.toLowerCase());
    if (mapping) {
      (form as any)[mapping.field] = mapping.fromValue(item.configValue);
    }
  }
  normalModes.value = buildNormalModes();
}

function formToSettings(): SettingSaveParam[] {
  return Object.entries(CONFIG_MAP).map(([configCode, mapping]) => ({
    configCode,
    configValue: mapping.toValue((form as any)[mapping.field]),
  }));
}

async function handleSave() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      await SystemAPI.saveSystemSetting(formToSettings());
      ElMessage.success("保存成功");
    } catch {
      ElMessage.error("保存失败，请重试");
    } finally {
      saving.value = false;
    }
  });
}

onMounted(async () => {
  loading.value = true;
  try {
    const data = await SystemAPI.listSettingsByCode({ prefix: "login." });
    settingsToForm(decryptSettings(data));
  } catch {
    ElMessage.error("加载配置失败，请刷新重试");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.login-mode-group {
  display: flex;
  gap: 16px;
}

.mode-tip-icon {
  margin-left: 2px;
  vertical-align: middle;
  color: var(--el-color-info);
  cursor: help;
}

.emergency-modes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.emergency-mode-item {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 32px;
}

.emergency-mode-alert {
  flex: 1;
}

.emergency-mode-alert.el-alert {
  padding-top: 4px;
  padding-bottom: 4px;
}

.field-hint {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hint-icon {
  flex-shrink: 0;
  color: var(--el-color-info);
}
</style>
