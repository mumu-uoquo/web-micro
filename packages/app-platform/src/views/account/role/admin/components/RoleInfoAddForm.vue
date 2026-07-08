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

      <el-form-item label="所属机构" prop="instituteId">
        <el-select
          v-model="infoFormData.instituteId"
          placeholder="请选择所属机构，保存后不可修改"
          value-key="id"
          filterable
          clearable
          remote
          remote-show-suffix
          :remote-method="autoCompleteInstitute"
          @change="handleInstituteSelect"
        >
          <el-option
            v-for="item in instituteList"
            :key="item.id"
            :label="item.instituteName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="角色分组">
        <DictTag :code="infoFormData.roleGroup" />
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
          <el-radio-button :value="DictionaryEnum.ROLE_TYPE_INNER">内置</el-radio-button>
          <el-radio-button :value="DictionaryEnum.ROLE_TYPE_NORMAL">通用</el-radio-button>
          <el-radio-button :value="DictionaryEnum.ROLE_TYPE_PRIVATE">私有</el-radio-button>
        </el-radio-group>
        <div
          v-show="infoFormData.roleType == DictionaryEnum.ROLE_TYPE_INNER"
          class="el-form-item__info"
        >
          全局可见，仅超管可编辑
        </div>
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

      <el-form-item label="角色等级" prop="roleGrade">
        <el-input-number v-model="infoFormData.roleGrade" :min="1" :max="100" />
        <el-tooltip class="item">
          <el-icon class="no-inherit" style="vertical-align: middle"><QuestionFilled /></el-icon>
          <template #content>
            <div>
              数值越小等级越高（即：小的能看到比自己大的），建议如下
              <ul>
                <li>内部的预留：1~9</li>
                <li>运营级管理：10~19</li>
                <li>机构级管理：20~29</li>
                <li>普通的业务：30~99</li>
              </ul>
            </div>
          </template>
        </el-tooltip>
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
import { QuestionFilled } from "@element-plus/icons-vue";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import DictTag from "@/components/DictTag/index.vue";
import InstituteAPI, { InstituteListParam, InstituteInfoDto } from "@/api/institute";
import AdminRoleAPI, { RoleInfoParam, RoleInfoDto } from "@/api/adminRole";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");

/* ***************************** 基础信息 ********************************* */
// 扩展部分属性
interface RoleInfoFormParam extends RoleInfoParam {
  roleGroup?: string;
}
// 初始表单数据
const initialFormData = ref<RoleInfoFormParam>({
  id: "",
  fromRoleId: "",
  instituteId: "",
  roleName: "",
  description: "",
  roleType: DictionaryEnum.ROLE_TYPE_PRIVATE,
  roleGrade: 30,
  roleGroup: "",
});
const infoFormRef = ref(ElForm);
const infoFormData = ref<RoleInfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<RoleInfoFormParam>>({
  instituteId: [{ required: true, message: "请选择所属机构", trigger: "change" }],
  roleName: [{ required: true, message: "请输入名称", trigger: "blur" }],
});

/**
 * 自动加载：机构列表（默认显示自己机构）
 */
const instituteList = ref<InstituteInfoDto[]>([]);
function autoCompleteInstitute(keyword: string) {
  if (!keyword || keyword == "") {
    instituteList.value = [props.defaultInstitute];
    return;
  }
  const param = { pageNum: 1, pageSize: 10, instituteName: keyword } as InstituteListParam;
  InstituteAPI.listInstituteByAbbr(param).then((data) => {
    if (data.length > 0) {
      instituteList.value = data;
    }
  });
}
/**
 * 自动加载：选中机构
 */
function handleInstituteSelect(data: string) {
  // console.log("handleInstituteSelect", data);
  if (data) {
    const info = instituteList.value.find((item) => item.id == data);
    infoFormData.value.roleGroup = info!.roleGroup;
  } else {
    infoFormData.value.roleGroup = "";
  }
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    const params = { ...infoFormData.value } as RoleInfoParam;
    AdminRoleAPI.addRoleInfo(params).then((_data) => {
      ElMessage.success("保存成功");
      dialogVisible.value = false;
      emits("on-submit");
    });
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const fromRoleInfo = ref<RoleInfoDto>({ id: "", roleName: "" }); // 复制权限的来源角色
const openDialog = async (data?: RoleInfoDto) => {
  dialogVisible.value = true;
  dialogTitle.value = "新增";
  if (data) {
    fromRoleInfo.value = data;
    infoFormData.value.fromRoleId = data.id;
    infoFormData.value.roleGrade = data.roleGrade;
  } else {
    infoFormData.value.fromRoleId = "";
    infoFormData.value.roleGrade = 30;
  }
  // 默认填充自己所属机构
  instituteList.value = [props.defaultInstitute];
  infoFormData.value.instituteId = props.defaultInstitute.id;
  infoFormData.value.roleGroup = props.defaultInstitute.roleGroup;
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
  openDialog,
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
