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
      <el-form-item label="父级机构" prop="parentId">
        <el-select
          v-model="infoFormData.parentId"
          placeholder="请选择父级机构"
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

      <el-form-item label="授权分组" prop="roleGroup">
        <el-radio-group v-model="infoFormData.roleGroup" @change="handleChangeRoleGroup">
          <el-radio-button
            v-for="item in roleGroupList"
            :key="item.dicCode"
            :label="item.dicValue"
            :value="item.dicCode"
          />
        </el-radio-group>
        <div class="el-form-item__info flex gap-2">
          <span style="display: inline-flex; align-items: center; height: 16px">
            可见的内置角色：
          </span>
          <el-tag v-for="item in roleList" :key="item.id" type="primary">
            {{ item.roleName }}
          </el-tag>
        </div>
      </el-form-item>

      <el-form-item label="机构类型" prop="instituteType">
        <el-select v-model="infoFormData.instituteType" placeholder="请选择机构类型">
          <el-option
            v-for="item in typeList"
            :key="item.dicCode"
            :label="item.dicValue"
            :value="item.dicCode"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="机构名称" prop="instituteName">
        <el-input
          v-model="infoFormData.instituteName"
          placeholder="请填写机构的名称"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="机构简称" prop="shortName">
        <el-input
          v-model="infoFormData.shortName"
          placeholder="请填写机构的简称"
          maxlength="10"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="机构编码" prop="instituteCode">
        <el-input
          v-model="infoFormData.instituteCode"
          placeholder="请填写机构的编码"
          maxlength="20"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="三方标识" prop="thirdId">
        <el-input
          v-model="infoFormData.thirdId"
          placeholder="与其他系统对接的唯一标识"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="所在地区" prop="districtCode">
        <el-cascader
          v-model="infoFormData.districtCode"
          :options="areaTreeData"
          :props="{
            value: 'districtCode',
            label: 'fullName',
            children: 'children',
            expandTrigger: 'hover',
            checkStrictly: true,
            emitPath: false,
          }"
          filterable
          clearable
          placeholder="请选择"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="详细地址" prop="address">
        <el-input
          v-model="infoFormData.address"
          placeholder="请填写机构的详细地址"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="描述说明" prop="description">
        <el-input
          v-model="infoFormData.description"
          type="textarea"
          maxlength="100"
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
import { ref, reactive, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useDictStore } from "@/stores";
import AdminRoleAPI, { RoleListParam, RoleInfoDto } from "@/api/adminRole";
import AdminInstituteAPI, {
  InstituteListParam,
  InstituteInfoParam,
  InstituteInfoDto,
} from "@/api/adminInstitute";
import { SysAreaDto } from "@/api/system";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
  areaData: SysAreaDto[];
}>();

const dictStore = useDictStore();
const areaTreeData = ref<SysAreaDto[]>([]);
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增子机构");

/* ***************************** 基础数据 ********************************* */
// 授权分组
const roleGroupList = dictStore.listDictionary(DictionaryEnum.ROLE_GROUP);
// 机构类型
// TODO 随授权分组联动
const typeList = dictStore.listDictionary(DictionaryEnum.INSTITUTE_TYPE);

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
  AdminInstituteAPI.listInstituteByAbbr(param).then((data) => {
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
    infoFormData.value.instituteType = info!.instituteType;
    infoFormData.value.roleGroup = info!.roleGroup;
  } else {
    infoFormData.value.instituteType = DictionaryEnum.INSTITUTE_TYPE_NORMAL;
    infoFormData.value.roleGroup = DictionaryEnum.ROLE_GROUP_NORMAL;
  }
  handleChangeRoleGroup();
}

/* ***************************** 表单信息 ********************************* */
// 初始表单数据
const initialFormData = ref<InstituteInfoParam>({
  id: "",
  parentId: "",
  instituteName: "",
  shortName: "",
  instituteCode: "",
  districtCode: "",
  address: "",
  thirdId: "",
  description: "",
  instituteType: DictionaryEnum.INSTITUTE_TYPE_NORMAL,
  roleGroup: DictionaryEnum.ROLE_GROUP_NORMAL,
  locationLat: "",
  locationLng: "",
});
const infoFormRef = ref(ElForm);
const infoFormData = ref<InstituteInfoParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<InstituteInfoParam>>({
  parentId: [{ required: true, message: "请选择父级机构", trigger: "change" }],
  instituteType: [{ required: true, message: "请选择机构类型", trigger: "change" }],
  roleGroup: [{ required: true, message: "请选择授权分组", trigger: "change" }],
  instituteName: [{ required: true, message: "请输入名称", trigger: "blur" }],
});

/**
 * 授权分组变化时，查询对应分组的内置角色
 */
const roleList = ref<RoleInfoDto[]>([]);
function handleChangeRoleGroup() {
  // console.log("handleChangeRoleGroup", infoFormData.value.roleGroup);
  const param = {
    roleGroup: infoFormData.value.roleGroup,
    roleType: DictionaryEnum.ROLE_TYPE_INNER,
  } as RoleListParam;
  AdminRoleAPI.listRoleInfoByPage(param).then((data) => {
    roleList.value = data.result || [];
  });
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    const params = { ...infoFormData.value } as InstituteInfoParam;
    if (params.id) {
      AdminInstituteAPI.updateInstituteInfo(params).then((_data) => {
        ElMessage.success("保存成功");
        dialogVisible.value = false;
        emits("on-submit");
      });
    } else {
      AdminInstituteAPI.addInstituteInfo(params).then((_data) => {
        ElMessage.success("保存成功");
        dialogVisible.value = false;
        emits("on-submit");
      });
    }
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (param: InstituteInfoDto) => {
  // 默认填充自己所属机构
  if (param.id && param.id != "") {
    dialogTitle.value = "修改子机构";
    Object.assign(infoFormData.value, param);
    if (param.parentId) {
      instituteList.value = [
        {
          id: param.parentId,
          instituteName: param.parentName || "",
          roleGroup: param.roleGroup,
          instituteType: param.instituteType,
        },
      ];
    }
  } else {
    instituteList.value = [props.defaultInstitute];
    infoFormData.value.parentId = props.defaultInstitute.id;
    infoFormData.value.roleGroup = props.defaultInstitute.roleGroup;
    infoFormData.value.instituteType = props.defaultInstitute.instituteType;
  }
  handleChangeRoleGroup();
  dialogVisible.value = true;
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  dialogTitle.value = "新增子机构";
  infoFormRef.value.clearValidate();
  roleList.value = [];
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等 ********************************* */
// 监听属性变化
watchEffect(() => {
  areaTreeData.value = props.areaData;
});
// 暴露给父级的自定义方法（需放在最后）
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

  .el-tag {
    height: 16px;
  }
}
</style>
