<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密码"
    destroy-on-close
    draggable
    width="480px"
    @close="handleCloseDialog"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      status-icon
      label-width="100px"
      class="mt-2"
    >
      <el-form-item label="原密码" prop="oldPassword">
        <el-input
          v-model="formData.oldPassword"
          placeholder="请输入当前密码"
          type="password"
          show-password
          clearable
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="formData.newPassword"
          placeholder="请输入新密码"
          type="password"
          show-password
          clearable
          @input="checkPasswordComplex"
        />
        <div class="password-strength">
          <span :style="{ backgroundColor: formData.pwdColor1 }"></span>
          <span :style="{ backgroundColor: formData.pwdColor2 }"></span>
          <span :style="{ backgroundColor: formData.pwdColor3 }"></span>
        </div>
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          placeholder="请再次输入新密码"
          type="password"
          show-password
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCloseDialog">取 消</el-button>
      <el-button type="primary" :loading="loading" :disabled="loading" @click="handleSubmit">
        确 认
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { useRouter, useRoute } from "vue-router";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useUserStore, useSettingsStore } from "@/stores";
import UserAPI, { ChangePasswordParam } from "@/api/user";
import { passwordComplex } from "@/utils/common";
import { encrypt } from "@web-micro/shared";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

const dialogVisible = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();

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

const formData = ref<ChangePasswordFormData>(initialFormData());

const validateConfirmPassword = (
  _rule: unknown,
  value: string,
  callback: (err?: Error) => void
) => {
  if (!value) {
    callback(new Error("请确认新密码"));
  } else if (value !== formData.value.newPassword) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const formRules = reactive<FormRules<ChangePasswordFormData>>({
  oldPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    {
      min: 6,
      max: 20,
      pattern: /^[a-zA-Z0-9%&'*.,;=+\-?@#!]+$/,
      message: "只能输入 6 到 20 位以内的字符（字母、数字及特殊字符）",
      trigger: "blur",
    },
  ],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: "blur" }],
});

function checkPasswordComplex(password: string) {
  formData.value.newPwdLevel = DictionaryEnum.PASSWORD_WEAK;
  formData.value.pwdColor1 = "#BBBBBB";
  formData.value.pwdColor2 = "#BBBBBB";
  formData.value.pwdColor3 = "#BBBBBB";
  if (!password) return;
  const score = passwordComplex(password);
  if (score >= 20) {
    formData.value.newPwdLevel = DictionaryEnum.PASSWORD_STRONG;
    formData.value.pwdColor1 = "#33CC00";
    formData.value.pwdColor2 = "#33CC00";
    formData.value.pwdColor3 = "#33CC00";
  } else if (score >= 15) {
    formData.value.newPwdLevel = DictionaryEnum.PASSWORD_MIDDLE;
    formData.value.pwdColor1 = "#FF9900";
    formData.value.pwdColor2 = "#FF9900";
  } else if (score >= 10) {
    formData.value.pwdColor1 = "#FC5F76";
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const params: ChangePasswordParam = {
      oldPassword: encrypt.password(formData.value.oldPassword, settingsStore.rsaPublicKey),
      newPassword: encrypt.password(formData.value.newPassword, settingsStore.rsaPublicKey),
      newPwdLevel: formData.value.newPwdLevel,
    };
    await UserAPI.updateSelfPassword(params);
    dialogVisible.value = false;

    ElMessage.success("密码修改成功");
    // await ElMessageBox.alert("密码修改成功，请重新登录", "提示", {
    //   confirmButtonText: "确定",
    //   type: "success",
    //   showClose: false,
    // });
    // await userStore.logout();
    // router.push({
    //   path: "/login",
    //   query: { redirect: route.fullPath !== "/login" ? route.fullPath : undefined },
    //   replace: true,
    // });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(formData.value, initialFormData());
  formRef.value?.clearValidate();
}

function openDialog() {
  resetForm();
  dialogVisible.value = true;
}

function handleCloseDialog() {
  resetForm();
  dialogVisible.value = false;
}

defineExpose({ openDialog });
</script>

<style lang="scss" scoped>
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
