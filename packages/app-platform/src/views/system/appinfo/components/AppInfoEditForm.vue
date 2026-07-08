<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    draggable
    @close="handleCloseDialog"
  >
    <el-form
      ref="infoFormRef"
      :model="infoFormData"
      :rules="infoFormRules"
      status-icon
      label-width="100px"
    >
      <el-form-item label="机构">
        <el-input v-model="infoFormData.institueName" :disabled="true" />
      </el-form-item>
      <el-form-item label="平台" prop="moduleId">
        <el-select
          v-model="infoFormData.moduleId"
          placeholder="请选择授权的平台，可以为空"
          clearable
        >
          <el-option
            v-for="item in props.moduleList"
            :key="item.id"
            :label="item.moduleName"
            :value="item.id || ''"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="名称" prop="appName">
        <el-input v-model="infoFormData.appName" clearable placeholder="授权的名称" />
      </el-form-item>
      <el-form-item label="账号">
        <el-input
          v-model="infoFormData.appkey"
          :disabled="true"
          placeholder="授权访问的APPKEY，全局唯一，保存后不可修改"
        >
          <template #append>
            <el-button type="primary" :disabled="true" @click="generateAppKey">生成</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="秘钥" prop="secret">
        <el-input v-model="infoFormData.secret" clearable placeholder="授权访问的SECRET">
          <template #append>
            <el-button type="primary" @click="generateSecret">生成</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="模板">
        <el-switch
          v-model="infoFormData.templateType"
          :disabled="true"
          active-text="是"
          inactive-text="否"
          :active-value="DictionaryEnum.TEMPLATE_TYPE_NORMAL"
          :inactive-value="DictionaryEnum.TEMPLATE_TYPE_NONE"
          :style="`--el-switch-on-color: #409eff; --el-switch-off-color: rgb(237.5 189.9 118.5);`"
          inline-prompt
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleInfoSubmit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { ModuleInfoDto } from "@/api/module";
import SystemAPI, { AppInfoParam, AppInfoDto } from "@/api/system";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  moduleList: ModuleInfoDto[];
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("编辑");

/* ***************************** 表单信息 ********************************* */
// 扩展部分属性
interface AppInfoEditParam extends AppInfoParam {
  institueName?: string;
}
// 初始表单数据
const initialFormData = ref<AppInfoEditParam>({
  id: "",
  instituteId: "",
  institueName: "",
  moduleId: "",
  appName: "",
  appkey: "",
  secret: "",
  templateType: DictionaryEnum.TEMPLATE_TYPE_NONE,
});
const infoFormRef = ref(ElForm);
const infoFormData = ref<AppInfoEditParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<AppInfoEditParam>>({
  appName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  secret: [
    { required: true, message: "请输入秘钥", trigger: "blur" },
    {
      min: 16,
      max: 32,
      pattern: /^[a-zA-Z0-9!-~]+$/,
      message: "只能输入 16 到 32 位以内的字符",
      trigger: "blur",
    },
  ],
});

/**
 * 生成：APPKEY
 */
function generateAppKey(): void {
  const appKeyCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789";
  const appkey = generateRandomString(32, appKeyCharacters);
  infoFormData.value.appkey = appkey;
}

/**
 * 生成：SECRET
 */
function generateSecret(): void {
  const secretCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789!@#$%^&*.-~";
  const secret = generateRandomString(32, secretCharacters);
  infoFormData.value.secret = secret;
}

/**
 * 生成随机字符串
 */
function generateRandomString(length: number, characters: string): string {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }
  return result;
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    SystemAPI.updateAppInfo(infoFormData.value).then((_data) => {
      ElMessage.success("修改成功");
      dialogVisible.value = false;
      emits("on-submit"); // 刷新列表
    });
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (param: AppInfoDto) => {
  dialogVisible.value = true;
  Object.assign(infoFormData.value, param);
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  infoFormRef.value.clearValidate();
  dialogTitle.value = "编辑";
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  openDialog,
});
</script>
