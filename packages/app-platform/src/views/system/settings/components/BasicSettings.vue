<template>
  <div v-loading="loading">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="是否允许注册">
        <el-switch v-model="form.registerEnable" />
      </el-form-item>
      <el-form-item label="开启水印">
        <el-switch v-model="form.watermarkEnable" />
      </el-form-item>
      <el-form-item label="系统标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入系统标题" />
      </el-form-item>
      <el-divider content-position="left">微信消息推送</el-divider>
      <el-form-item label="TOKEN令牌" prop="wechatPushToken">
        <el-input v-model="form.wechatPushToken" placeholder="请输入微信推送 Token" />
      </el-form-item>
      <el-form-item label="消息AES秘钥" prop="wechatPushAesKey">
        <el-input v-model="form.wechatPushAesKey" placeholder="请输入微信推送 EncodingAESKey" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import SystemAPI from "@/api/system";
import type { SettingSaveParam, SettingDto } from "@/api/system";
import { decrypt } from "@web-micro/shared";

/**
 * 对配置项的 configValue 做 taes 解密
 * - 空值直接返回原值
 * - 解密失败时降级返回原文
 */
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

interface BasicForm {
  registerEnable: boolean;
  watermarkEnable: boolean;
  title: string;
  wechatPushToken: string;
  wechatPushAesKey: string;
}

const CONFIG_MAP: Record<
  string,
  {
    field: keyof BasicForm;
    fromValue: (v: string | undefined) => any;
    toValue: (v: any) => string;
  }
> = {
  "sys.register.enabled": {
    field: "registerEnable",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "sys.watermark.enabled": {
    field: "watermarkEnable",
    fromValue: (v) => v === "true",
    toValue: (v) => String(v),
  },
  "sys.title": {
    field: "title",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "sys.wechat.push.token": {
    field: "wechatPushToken",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
  "sys.wechat.push.aeskey": {
    field: "wechatPushAesKey",
    fromValue: (v) => v ?? "",
    toValue: (v) => v,
  },
};

const form = reactive<BasicForm>({
  registerEnable: true,
  watermarkEnable: false,
  title: "",
  wechatPushToken: "",
  wechatPushAesKey: "",
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);

const rules: FormRules = {
  title: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (!value || value.trim() === "") {
          callback(new Error("系统标题不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

function settingsToForm(settings: SettingDto[]) {
  for (const item of settings) {
    const mapping = CONFIG_MAP[item.configCode];
    if (mapping) {
      (form as any)[mapping.field] = mapping.fromValue(item.configValue);
    }
  }
}

function formToSettings(): SettingSaveParam[] {
  return Object.entries(CONFIG_MAP).map(([configCode, mapping]) => ({
    configCode,
    configValue: mapping.toValue((form as any)[mapping.field]),
  }));
}

async function loadSettings() {
  loading.value = true;
  try {
    const data = await SystemAPI.listSettingsByCode({ prefix: "sys." });
    settingsToForm(decryptSettings(data));
  } catch {
    ElMessage.error("加载配置失败，请刷新重试");
  } finally {
    loading.value = false;
  }
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

onMounted(() => {
  loadSettings();
});
</script>
