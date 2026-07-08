<template>
  <el-dialog
    :model-value="visible"
    title="修改密码"
    width="480px"
    destroy-on-close
    draggable
    @update:model-value="handleVisibleChange"
  >
    <el-form ref="formRef" :model="formModel" status-icon label-width="100px" class="mt-2">
      <el-form-item
        label="原密码"
        prop="oldPassword"
        :rules="[{ required: true, message: '请输入原密码', trigger: 'blur' }]"
      >
        <el-input
          v-model="formModel.oldPassword"
          type="password"
          show-password
          clearable
          placeholder="请输入原密码"
        />
      </el-form-item>
      <el-form-item
        label="新密码"
        prop="newPassword"
        :rules="[{ required: true, message: '请输入新密码', trigger: 'blur' }]"
      >
        <el-input
          v-model="formModel.newPassword"
          type="password"
          show-password
          clearable
          placeholder="请输入新密码"
          @input="checkPasswordComplex"
        />
        <div class="password-strength">
          <span :style="{ backgroundColor: formModel.pwdColor1 }"></span>
          <span :style="{ backgroundColor: formModel.pwdColor2 }"></span>
          <span :style="{ backgroundColor: formModel.pwdColor3 }"></span>
        </div>
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword" :rules="confirmRules">
        <el-input
          v-model="formModel.confirmPassword"
          type="password"
          show-password
          clearable
          placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormItemRule } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useSettingsStore } from "@/stores";
import UserAPI, { ChangePasswordParam } from "@/api/user";
import { passwordComplex } from "@/utils/common";
import { encrypt } from "@web-micro/shared";

const settingsStore = useSettingsStore();

/* ***************************** 参数定义 ********************************* */
interface Props {
  visible: boolean;
}
defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [val: boolean];
  success: [];
}>();

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  newPwdLevel: string;
  pwdColor1: string;
  pwdColor2: string;
  pwdColor3: string;
}
const initialFormData = (): ChangePasswordFormData => ({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
  newPwdLevel: DictionaryEnum.PASSWORD_WEAK,
  pwdColor1: "#BBBBBB",
  pwdColor2: "#BBBBBB",
  pwdColor3: "#BBBBBB",
});

const formRef = ref<FormInstance | null>(null);
const formModel = reactive<ChangePasswordFormData>(initialFormData());

const confirmRules: FormItemRule[] = [
  { required: true, message: "请输入确认密码", trigger: "blur" },
  {
    validator: (_rule, value, callback) => {
      const result = validatePasswordMatch(formModel.newPassword, value);
      if (!result.valid) {
        callback(new Error(result.message));
      } else {
        callback();
      }
    },
    trigger: "blur",
  },
];

function validatePasswordMatch(
  newPassword: string,
  confirmPassword: string
): { valid: boolean; message?: string } {
  if (newPassword !== confirmPassword) {
    return { valid: false, message: "两次输入的密码不一致" };
  }
  return { valid: true };
}

/**
 * 计算密码强度
 * @param password
 */
function checkPasswordComplex(password: string) {
  formModel.newPwdLevel = DictionaryEnum.PASSWORD_WEAK;
  formModel.pwdColor1 = "#BBBBBB";
  formModel.pwdColor2 = "#BBBBBB";
  formModel.pwdColor3 = "#BBBBBB";
  if (!password) return;
  const score = passwordComplex(password);
  if (score >= 20) {
    formModel.newPwdLevel = DictionaryEnum.PASSWORD_STRONG;
    formModel.pwdColor1 = "#33CC00";
    formModel.pwdColor2 = "#33CC00";
    formModel.pwdColor3 = "#33CC00";
  } else if (score >= 15) {
    formModel.newPwdLevel = DictionaryEnum.PASSWORD_MIDDLE;
    formModel.pwdColor1 = "#FF9900";
    formModel.pwdColor2 = "#FF9900";
  } else if (score >= 10) {
    formModel.pwdColor1 = "#FC5F76";
  }
}

/* ***************************** 表单操作 ********************************* */
/**
 * 界面隐现
 */
function handleVisibleChange(val: boolean) {
  emit("update:visible", val);
  if (!val) {
    resetForm();
  }
}

/**
 * 重置表单
 */
function resetForm() {
  formRef.value?.resetFields();
}

/**
 * 按钮：取消
 */
function handleCancel() {
  emit("update:visible", false);
}

/**
 * 按钮：表单提交
 * Validates: Requirements 4.5, 4.6
 */
const submitting = ref(false);
async function handleSubmit() {
  // 表单校验
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  // 提交保存
  submitting.value = true;
  try {
    const params: ChangePasswordParam = {
      oldPassword: encrypt.password(formModel.oldPassword, settingsStore.rsaPublicKey),
      newPassword: encrypt.password(formModel.newPassword, settingsStore.rsaPublicKey),
      newPwdLevel: formModel.newPwdLevel,
    };
    await UserAPI.updateSelfPassword(params);
    ElMessage.success("密码修改成功");
    emit("update:visible", false);
    emit("success");
  } catch (err: any) {
    ElMessage.error(err?.message ?? "密码修改失败");
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.password-strength {
  position: absolute;
  top: 100%;
  right: 0;
  display: flex;
  width: 35%;
  height: 8px;

  span {
    display: inline-block;
    width: 30%;
    margin-top: 3px;
    margin-right: 3px;
    border-radius: 8px;
  }
}
</style>
