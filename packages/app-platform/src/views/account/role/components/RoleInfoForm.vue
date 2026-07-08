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
      class="mt-5"
    >
      <el-form-item
        v-show="infoFormData.fromRoleId && infoFormData.fromRoleId != ''"
        label="复制权限"
      >
        <el-input v-model="fromRoleInfo.roleName" :disabled="true" />
      </el-form-item>

      <el-form-item label="所属机构">
        <el-input v-model="infoFormData.instituteName" :disabled="true" />
      </el-form-item>

      <el-form-item label="角色名称" prop="roleName">
        <el-input
          v-model="infoFormData.roleName"
          placeholder="请填写角色的名称"
          maxlength="10"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="角色类型" prop="roleType">
        <el-radio-group v-model="infoFormData.roleType">
          <el-radio-button :value="DictionaryEnum.ROLE_TYPE_NORMAL">通用</el-radio-button>
          <el-radio-button :value="DictionaryEnum.ROLE_TYPE_PRIVATE">私有</el-radio-button>
        </el-radio-group>
        <div
          v-show="infoFormData.roleType == DictionaryEnum.ROLE_TYPE_NORMAL"
          class="el-form-item__info"
        >
          所属机构及子机构可见
        </div>
        <div
          v-show="infoFormData.roleType == DictionaryEnum.ROLE_TYPE_PRIVATE"
          class="el-form-item__info"
        >
          仅所属机构可见
        </div>
      </el-form-item>

      <el-form-item label="描述说明" prop="description">
        <el-input
          v-model="infoFormData.description"
          type="textarea"
          maxlength="50"
          show-word-limit
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleInfoSubmit">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { InstituteInfoDto } from "@/api/institute";
import RoleAPI, { RoleInfoParam, RoleInfoDto } from "@/api/role";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  institute: InstituteInfoDto;
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");

/* ***************************** 表单信息 ********************************* */
// 扩展部分属性
interface RoleInfoFormParam extends RoleInfoParam {
  instituteName?: string;
}
// 初始表单数据
const initialFormData = ref<RoleInfoFormParam>({
  id: "",
  fromRoleId: "",
  instituteId: "",
  instituteName: "",
  roleName: "",
  description: "",
  roleType: DictionaryEnum.ROLE_TYPE_PRIVATE,
});
const infoFormRef = ref(ElForm);
const infoFormData = ref<RoleInfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<RoleInfoFormParam>>({
  instituteId: [{ required: true, message: "请选择所属机构", trigger: "change" }],
  roleName: [{ required: true, message: "请输入名称", trigger: "blur" }],
});

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    const params = { ...infoFormData.value } as RoleInfoParam;
    if (params.id) {
      RoleAPI.updateRoleInfo(params).then((_data) => {
        ElMessage.success("保存成功");
        dialogVisible.value = false;
        emits("on-submit");
      });
    } else {
      RoleAPI.addRoleInfo(params).then((_data) => {
        ElMessage.success("保存成功");
        dialogVisible.value = false;
        emits("on-submit");
      });
    }
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗：新增
 */
const openAddDialog = async (roleType: string, institute: InstituteInfoDto) => {
  dialogVisible.value = true;
  dialogTitle.value = "新增";
  if (roleType == DictionaryEnum.ROLE_TYPE_INNER) {
    infoFormData.value.roleType = DictionaryEnum.ROLE_TYPE_PRIVATE;
  } else {
    infoFormData.value.roleType = roleType;
  }
  infoFormData.value.instituteId = institute.id;
  infoFormData.value.instituteName = institute.instituteName;
};

/**
 * 显示弹窗：编辑
 */
const openEditDialog = async (data: RoleInfoDto, institute: InstituteInfoDto) => {
  dialogVisible.value = true;
  dialogTitle.value = "编辑";
  Object.assign(infoFormData.value, data);
  infoFormData.value.instituteName = institute.instituteName;
};

/**
 * 显示弹窗：复制
 */
const fromRoleInfo = ref<RoleInfoDto>({ id: "", roleName: "" }); // 复制权限的来源角色
const openCopyDialog = async (data: RoleInfoDto, roleType: string, institute: InstituteInfoDto) => {
  dialogVisible.value = true;
  dialogTitle.value = "复制";
  if (roleType == DictionaryEnum.ROLE_TYPE_INNER) {
    infoFormData.value.roleType = DictionaryEnum.ROLE_TYPE_PRIVATE;
  } else {
    infoFormData.value.roleType = roleType;
  }
  Object.assign(fromRoleInfo.value, data);
  infoFormData.value.fromRoleId = data.id;
  infoFormData.value.instituteId = institute.id;
  infoFormData.value.instituteName = institute.instituteName;
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  infoFormRef.value.clearValidate();
  fromRoleInfo.value = { id: "", roleName: "" };
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  openAddDialog,
  openEditDialog,
  openCopyDialog,
});
</script>

<style lang="scss" scoped>
// 角色类型提示效果
.el-form-item__info {
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 2px;
  font-size: 12px;
  line-height: 1;
  color: #e6a23c;
}
</style>
