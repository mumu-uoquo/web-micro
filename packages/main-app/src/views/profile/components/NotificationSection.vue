<template>
  <el-card v-loading="loading">
    <template #header>
      <span>通知偏好</span>
    </template>

    <el-form label-width="100px">
      <!-- 全局通知开关 -->
      <el-form-item label="接收通知">
        <el-switch
          v-model="form.globalEnabled"
          :loading="savingKeys.has('globalEnabled')"
          @change="(val: string | number | boolean) => handleSave('globalEnabled', String(val))"
        />
        <div class="form-item-tip">关闭后将不再接收任何站内消息通知</div>
      </el-form-item>

      <!-- 免打扰时段 -->
      <el-form-item label="免扰时段">
        <div class="dnd-row">
          <el-switch
            v-model="form.dndEnabled"
            :disabled="!form.globalEnabled"
            :loading="savingKeys.has('dndEnabled')"
            @change="(val: string | number | boolean) => handleSave('dndEnabled', String(val))"
          />
          <el-time-picker
            v-model="form.dndStartTime"
            placeholder="开始时间"
            format="HH:mm"
            value-format="HH:mm"
            :disabled="!form.globalEnabled || !form.dndEnabled"
            class="dnd-time-picker"
            @change="(val: string | null) => handleSave('dndStartTime', val ?? '22:00')"
          />
          <span class="dnd-separator">至</span>
          <el-time-picker
            v-model="form.dndEndTime"
            placeholder="结束时间"
            format="HH:mm"
            value-format="HH:mm"
            :disabled="!form.globalEnabled || !form.dndEnabled"
            class="dnd-time-picker"
            @change="(val: string | null) => handleSave('dndEndTime', val ?? '08:00')"
          />
        </div>
        <div class="form-item-tip">免打扰时段内不会推送通知提醒</div>
      </el-form-item>

      <!-- 系统通知 -->
      <el-form-item label="系统通知">
        <el-switch
          v-model="form.systemEnabled"
          :disabled="!form.globalEnabled"
          :loading="savingKeys.has('systemEnabled')"
          @change="(val: string | number | boolean) => handleSave('systemEnabled', String(val))"
        />
        <div class="form-item-tip">版本更新、系统维护等公告通知</div>
      </el-form-item>

      <!-- 安全通知 -->
      <el-form-item label="安全通知">
        <el-switch
          v-model="form.securityEnabled"
          :disabled="!form.globalEnabled"
          :loading="savingKeys.has('securityEnabled')"
          @change="(val: string | number | boolean) => handleSave('securityEnabled', String(val))"
        />
        <div class="form-item-tip">登录提醒、密码修改、异地登录告警等</div>
      </el-form-item>

      <!-- 业务通知 -->
      <el-form-item label="业务通知">
        <el-switch
          v-model="form.businessEnabled"
          :disabled="!form.globalEnabled"
          :loading="savingKeys.has('businessEnabled')"
          @change="(val: string | number | boolean) => handleSave('businessEnabled', String(val))"
        />
        <div class="form-item-tip">审批提醒、任务分配、流程变更等</div>
      </el-form-item>

      <!-- 互动通知 -->
      <el-form-item label="互动通知">
        <el-switch
          v-model="form.interactionEnabled"
          :disabled="!form.globalEnabled"
          :loading="savingKeys.has('interactionEnabled')"
          @change="
            (val: string | number | boolean) => handleSave('interactionEnabled', String(val))
          "
        />
        <div class="form-item-tip">评论、@提及、回复等互动消息</div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import UserAPI from "@/api/user";
import type { SettingDto, SettingSaveParam } from "@/api/user";

/* ***************************** 配置映射 ********************************* */
const SETTING_PREFIX = "notification.";

interface NotificationForm {
  globalEnabled: boolean;
  dndEnabled: boolean;
  dndStartTime: string;
  dndEndTime: string;
  systemEnabled: boolean;
  securityEnabled: boolean;
  businessEnabled: boolean;
  interactionEnabled: boolean;
}

/**
 * 配置映射表：configCode → 表单字段
 * 参考 system/settings/SecuritySettings.vue 的 CONFIG_MAP 模式
 */
const CONFIG_MAP: Record<
  string,
  {
    field: keyof NotificationForm;
    fromValue: (v: string | undefined) => any;
    toValue: (v: any) => string;
  }
> = {
  "notification.global.enabled": {
    field: "globalEnabled",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "notification.dnd.enabled": {
    field: "dndEnabled",
    fromValue: (v) => v === "true",
    toValue: (v) => String(v),
  },
  "notification.dnd.startTime": {
    field: "dndStartTime",
    fromValue: (v) => v || "22:00",
    toValue: (v) => v,
  },
  "notification.dnd.endTime": {
    field: "dndEndTime",
    fromValue: (v) => v || "08:00",
    toValue: (v) => v,
  },
  "notification.system.enabled": {
    field: "systemEnabled",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "notification.security.enabled": {
    field: "securityEnabled",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "notification.business.enabled": {
    field: "businessEnabled",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
  "notification.interaction.enabled": {
    field: "interactionEnabled",
    fromValue: (v) => v !== "false",
    toValue: (v) => String(v),
  },
};

/* ***************************** 表单状态 ********************************* */
const form = reactive<NotificationForm>({
  globalEnabled: true,
  dndEnabled: false,
  dndStartTime: "22:00",
  dndEndTime: "08:00",
  systemEnabled: true,
  securityEnabled: true,
  businessEnabled: true,
  interactionEnabled: true,
});

const loading = ref(false);
const savingKeys = ref<Set<string>>(new Set());

/* ***************************** 数据加载 ********************************* */
/**
 * 从后端加载通知偏好设置
 */
function settingsToForm(settings: SettingDto[]) {
  for (const item of settings) {
    const mapping = CONFIG_MAP[item.configCode];
    if (mapping) {
      (form as any)[mapping.field] = mapping.fromValue(item.configValue);
    }
  }
}

async function loadSettings() {
  loading.value = true;
  try {
    const data = await UserAPI.listUserSettings({ prefix: SETTING_PREFIX });
    settingsToForm(data ?? []);
  } catch {
    // 加载失败使用默认值
  } finally {
    loading.value = false;
  }
}

/* ***************************** 保存操作 ********************************* */
/**
 * 保存单个配置项
 */
async function handleSave(field: keyof NotificationForm, value: string) {
  // 找到对应的 configCode
  const entry = Object.entries(CONFIG_MAP).find(([, mapping]) => mapping.field === field);
  if (!entry) return;

  const [configCode] = entry;
  savingKeys.value.add(field);
  try {
    const params: SettingSaveParam[] = [{ configCode, configValue: value }];
    await UserAPI.saveUserSetting(params);
    ElMessage.success("保存成功");
  } catch {
    ElMessage.error("保存失败");
    // 回滚本地状态：重新加载
    await loadSettings();
  } finally {
    savingKeys.value.delete(field);
  }
}

/* ***************************** 生命周期 ********************************* */
onMounted(() => {
  loadSettings();
});
</script>

<style lang="scss" scoped>
.form-item-tip {
  margin-top: 4px;
  margin-left: 12px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-placeholder);
}

.dnd-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 300px;

  .dnd-separator {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }
}
</style>
