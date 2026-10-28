<template>
  <div v-loading="loading" class="app-push-config">
    <el-form ref="formRef" :model="formData" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="数据类型">
            <DictSelect v-model="dataBizTypes" code="009" multiple />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="数据来源">
            <DictSelect v-model="formData.dataSource" code="030" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="数据范围">
            <DictSelect v-model="formData.dataScope" code="031" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="推送方式">
            <DictSelect v-model="formData.pushMode" code="032" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="推送实现">
            <el-radio-group v-model="formData.pushImpl">
              <el-radio value="standard">标准</el-radio>
              <el-radio value="custom">定制</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="压缩方式">
            <el-radio-group v-model="formData.compressType">
              <el-radio value="none">none</el-radio>
              <el-radio value="gzip">gzip</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="失败处理">
            <el-input v-model="formData.failHandling" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="推送速率">
            <el-input-number
              v-model="formData.pushRateLimit"
              :min="0"
              :precision="0"
              controls-position="right"
            >
              <template #suffix>
                <span>条/秒</span>
              </template>
            </el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="推送目标">
            <el-input v-model="formData.targetHost" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="目标地址">
            <el-input v-model="formData.targetAddress" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="三方授权">
            <el-input v-model="formData.targetAppkey" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="三方秘钥">
            <el-input
              v-model="formData.targetSecret"
              type="password"
              clearable
              show-password
              autocomplete="new-password"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div v-if="!props.externalSave" class="actions">
      <el-button @click="emits('on-cancel')">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import SystemAPI, { AppPushParam } from "@/api/system";
import DictSelect from "@/components/DictSelect/index.vue";

const props = withDefaults(
  defineProps<{
    appId: string;
    externalSave?: boolean;
  }>(),
  {
    externalSave: false,
  }
);
const emits = defineEmits<{
  (e: "on-cancel"): void;
  (e: "on-saved"): void;
}>();

function createInitialForm(): AppPushParam {
  return {
    appId: props.appId,
    compressType: "none",
    dataBizType: "",
    dataScope: "",
    dataSource: "",
    failHandling: "",
    pushImpl: "standard",
    pushMode: "",
    pushRateLimit: undefined,
    targetAddress: "",
    targetAppkey: "",
    targetHost: "",
    targetSecret: "",
  };
}

const loading = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<AppPushParam>(createInitialForm());
const dataBizTypes = computed<string[]>({
  get: () =>
    formData.dataBizType
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [],
  set: (values) => {
    formData.dataBizType = values.join(",");
  },
});

function resetForm(): void {
  Object.keys(formData).forEach((key) => Reflect.deleteProperty(formData, key));
  Object.assign(formData, createInitialForm());
  formRef.value?.clearValidate();
}

async function loadConfig(): Promise<void> {
  resetForm();
  if (!props.appId) {
    return;
  }
  loading.value = true;
  try {
    const configs = await SystemAPI.listAppPushByAppId({ id: props.appId });
    const config = configs?.[0];
    if (config?.id) {
      const detail = await SystemAPI.getAppPush({ id: config.id });
      Object.assign(formData, detail, { appId: props.appId });
    }
  } finally {
    loading.value = false;
  }
}

async function save(): Promise<boolean> {
  if (!props.appId) {
    ElMessage.warning("缺少应用信息，无法保存推送配置");
    return false;
  }
  saving.value = true;
  try {
    if (formData.id) {
      await SystemAPI.updateAppPush(formData);
      ElMessage.success("推送配置修改成功");
    } else {
      const data = await SystemAPI.addAppPush(formData);
      Object.assign(formData, data, { appId: props.appId });
      ElMessage.success("推送配置添加成功");
    }
    emits("on-saved");
    return true;
  } finally {
    saving.value = false;
  }
}

watch(() => props.appId, loadConfig, { immediate: true });

defineExpose({
  refresh: loadConfig,
  save,
});
</script>

<style scoped>
.app-push-config {
  min-height: 180px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
