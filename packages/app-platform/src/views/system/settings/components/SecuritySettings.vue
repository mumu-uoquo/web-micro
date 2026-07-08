<template>
  <div v-loading="loading">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
      <el-form-item label="超时时间（分钟）" prop="sessionTimeout">
        <el-input-number v-model="form.sessionTimeout" :min="1" :precision="0" />
      </el-form-item>

      <el-form-item label="密码长度范围" prop="passwordMin">
        <el-slider v-model="form.passwordLength" range :min="1" :max="64" style="width: 300px" />
        <span style="margin-left: 12px">
          {{ form.passwordLength[0] }} ~ {{ form.passwordLength[1] }}
        </span>
      </el-form-item>

      <el-form-item label="允许的字符类型">
        <el-checkbox-group v-model="allowedChars">
          <el-checkbox value="uppercase">允许大写字母</el-checkbox>
          <el-checkbox value="lowercase">允许小写字母</el-checkbox>
          <el-checkbox value="digit">允许数字</el-checkbox>
          <el-checkbox value="special">允许特殊字符</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="用户名长度范围" prop="usernameMin">
        <el-slider v-model="form.usernameLength" range :min="1" :max="64" style="width: 300px" />
        <span style="margin-left: 12px">
          {{ form.usernameLength[0] }} ~ {{ form.usernameLength[1] }}
        </span>
      </el-form-item>

      <el-form-item label="双因子认证">
        <el-switch v-model="form.mfaEnabled" active-text="开启" inactive-text="关闭" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
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

interface SecurityForm {
  sessionTimeout: number;
  passwordLength: [number, number];
  allowUppercase: boolean;
  allowLowercase: boolean;
  allowDigit: boolean;
  allowSpecial: boolean;
  usernameLength: [number, number];
  mfaEnabled: boolean;
}

// CONFIG_MAP handles simple scalar fields only
const CONFIG_MAP: Record<
  string,
  {
    field: keyof Pick<
      SecurityForm,
      | "sessionTimeout"
      | "allowUppercase"
      | "allowLowercase"
      | "allowDigit"
      | "allowSpecial"
      | "mfaEnabled"
    >;
    fromValue: (v: string | undefined) => any;
    toValue: (v: any) => string;
  }
> = {
  "security.session.timeout": {
    field: "sessionTimeout",
    fromValue: (v) => (v !== undefined && v !== "" ? Number(v) : 30),
    toValue: (v) => String(v),
  },
  "security.password.allowUppercase": {
    field: "allowUppercase",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "security.password.allowLowercase": {
    field: "allowLowercase",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "security.password.allowDigit": {
    field: "allowDigit",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "security.password.allowSpecial": {
    field: "allowSpecial",
    fromValue: (v) => v === "true",
    toValue: (v) => String(v),
  },
  "security.mfa.enabled": {
    field: "mfaEnabled",
    fromValue: (v) => v === "true",
    toValue: (v) => String(v),
  },
};

const form = reactive<SecurityForm>({
  sessionTimeout: 30,
  passwordLength: [8, 20],
  allowUppercase: true,
  allowLowercase: true,
  allowDigit: true,
  allowSpecial: false,
  usernameLength: [4, 20],
  mfaEnabled: false,
});

// Computed model for checkbox-group
const allowedChars = computed<string[]>({
  get() {
    const result: string[] = [];
    if (form.allowUppercase) result.push("uppercase");
    if (form.allowLowercase) result.push("lowercase");
    if (form.allowDigit) result.push("digit");
    if (form.allowSpecial) result.push("special");
    return result;
  },
  set(val: string[]) {
    form.allowUppercase = val.includes("uppercase");
    form.allowLowercase = val.includes("lowercase");
    form.allowDigit = val.includes("digit");
    form.allowSpecial = val.includes("special");
  },
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);

const rules: FormRules = {
  sessionTimeout: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (!Number.isInteger(value) || value < 1) {
          callback(new Error("超时时间必须为正整数"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  passwordMin: [
    {
      validator: (_rule, _value, callback) => {
        if (form.passwordLength[0] > form.passwordLength[1]) {
          callback(new Error("密码最小长度不能大于最大长度"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
  usernameMin: [
    {
      validator: (_rule, _value, callback) => {
        if (form.usernameLength[0] > form.usernameLength[1]) {
          callback(new Error("用户名最小长度不能大于最大长度"));
        } else {
          callback();
        }
      },
      trigger: "change",
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
  // Handle array fields separately
  const minPwd = settings.find((s) => s.configCode === "security.password.minLength");
  const maxPwd = settings.find((s) => s.configCode === "security.password.maxLength");
  const minUsr = settings.find((s) => s.configCode === "security.username.minLength");
  const maxUsr = settings.find((s) => s.configCode === "security.username.maxLength");

  form.passwordLength = [
    minPwd?.configValue ? Number(minPwd.configValue) : 8,
    maxPwd?.configValue ? Number(maxPwd.configValue) : 20,
  ];
  form.usernameLength = [
    minUsr?.configValue ? Number(minUsr.configValue) : 4,
    maxUsr?.configValue ? Number(maxUsr.configValue) : 20,
  ];
}

function formToSettings(): SettingSaveParam[] {
  const params: SettingSaveParam[] = Object.entries(CONFIG_MAP).map(([configCode, mapping]) => ({
    configCode,
    configValue: mapping.toValue((form as any)[mapping.field]),
  }));

  // Add array fields
  params.push(
    { configCode: "security.password.minLength", configValue: String(form.passwordLength[0]) },
    { configCode: "security.password.maxLength", configValue: String(form.passwordLength[1]) },
    { configCode: "security.username.minLength", configValue: String(form.usernameLength[0]) },
    { configCode: "security.username.maxLength", configValue: String(form.usernameLength[1]) }
  );

  return params;
}

async function loadSettings() {
  loading.value = true;
  try {
    const data = await SystemAPI.listSettingsByCode({ prefix: "security." });
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
