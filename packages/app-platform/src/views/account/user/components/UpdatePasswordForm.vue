<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    draggable
    width="400px"
    @close="handleCloseDialog"
  >
    <el-form
      ref="infoFormRef"
      :model="infoFormData"
      :rules="infoFormRules"
      status-icon
      label-width="100px"
      class="form-inline mt-5"
    >
      <el-form-item label="登录密码" prop="newPassword">
        <el-input
          v-model="infoFormData.newPassword"
          placeholder="请填写登录密码"
          type="password"
          autocomplete="new-password"
          show-password
          clearable
          @input="checkPasswordComplex"
        />
        <div class="password-strength">
          <span :style="{ 'background-color': infoFormData.pwdColor1 }"></span>
          <span :style="{ 'background-color': infoFormData.pwdColor2 }"></span>
          <span :style="{ 'background-color': infoFormData.pwdColor3 }"></span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleInfoSubmit">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useSettingsStore } from "@/stores";
import UserAPI, { UserInfoDto, ChangePasswordParam } from "@/api/user";
import { passwordComplex } from "@/utils/common";
import { encrypt } from "@web-micro/shared";

const settingsStore = useSettingsStore();

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("改密");

/* ***************************** 表单操作 ********************************* */
// 扩展部分属性
interface InfoFormParam extends ChangePasswordParam {
  userName?: string; // 用户账号
  pwdColor1?: string; // 密码强度颜色
  pwdColor2?: string; // 密码强度颜色
  pwdColor3?: string; // 密码强度颜色
}
// 初始表单数据
const initialFormData = ref<InfoFormParam>({
  id: "",
  userName: "",
  oldPassword: "",
  newPassword: "",
  newPwdLevel: DictionaryEnum.PASSWORD_WEAK,
  pwdColor1: "#BBBBBB",
  pwdColor2: "#BBBBBB",
  pwdColor3: "#BBBBBB",
});

const infoFormRef = ref(ElForm);
const infoFormData = ref<InfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<InfoFormParam>>({
  newPassword: [
    { required: true, message: "请输入密码", trigger: "blur" },
    {
      min: 6,
      max: 20,
      pattern: /^[a-zA-Z0-9%&'*.,;=+\-?@#!$]+$/,
      message: "只能输入 6 到 20 位以内的字符",
      trigger: "blur",
    },
  ],
});

/**
 * 密码强度
 */
function checkPasswordComplex(password: string) {
  const score = passwordComplex(password);
  infoFormData.value.newPwdLevel = DictionaryEnum.PASSWORD_WEAK;
  infoFormData.value.pwdColor1 = "#BBBBBB";
  infoFormData.value.pwdColor2 = "#BBBBBB";
  infoFormData.value.pwdColor3 = "#BBBBBB";
  if (score >= 20) {
    infoFormData.value.newPwdLevel = DictionaryEnum.PASSWORD_STRONG;
    infoFormData.value.pwdColor1 = "#33CC00";
    infoFormData.value.pwdColor2 = "#33CC00";
    infoFormData.value.pwdColor3 = "#33CC00";
  } else if (score >= 15) {
    infoFormData.value.newPwdLevel = DictionaryEnum.PASSWORD_MIDDLE;
    infoFormData.value.pwdColor1 = "#FF9900";
    infoFormData.value.pwdColor2 = "#FF9900";
  } else if (score >= 10) {
    infoFormData.value.pwdColor1 = "#FC5F76";
  }
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(async () => {
  const params = {
    id: infoFormData.value.id,
    newPassword: infoFormData.value.newPassword,
    newPwdLevel: infoFormData.value.newPwdLevel,
  } as ChangePasswordParam;
  params.newPassword = encrypt.password(params.newPassword || "", settingsStore.rsaPublicKey);
  // console.log("handleInfoSubmit", params);
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    UserAPI.updateUserPassword(params).then((_data) => {
      ElMessage.success("修改成功");
      // 关闭窗体
      dialogVisible.value = false;
      // 刷新列表
      emits("on-submit");
    });
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (param: UserInfoDto) => {
  // 拼接表单数据
  infoFormData.value.id = param.id;
  // 最后显示弹窗
  dialogVisible.value = true;
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  infoFormRef.value.clearValidate();
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等 ********************************* */
// 监听属性变化
const unwatch = watchEffect(() => {
  // areaTreeData.value = props.areaData;
});
// 暴露给父级的自定义方法（需放在最后）
defineExpose({
  openDialog,
});
/**
 * 页面卸载时（此处仅做为示例，无实际用处）
 * <script setup>中同步创建的监听器，组件销毁时，默认会释放，如果是在setTimeout中创建的，则需要手动销毁
 */
onBeforeUnmount(() => {
  // console.log("onBeforeUnmount");
  unwatch();
});
</script>

<style lang="scss" scoped>
// 密码强度
.password-strength {
  position: absolute;
  top: 100%;
  right: 0;
  float: right;
  display: flex;
  width: 35%;
  height: 8px;

  span {
    display: inline-block;
    width: 30%;
    margin-top: 3px;
    margin-right: 3px;
    text-align: center;
    border-radius: 8px;
  }
}
</style>
