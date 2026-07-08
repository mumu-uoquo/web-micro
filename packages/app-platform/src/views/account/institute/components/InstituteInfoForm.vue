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
        <el-tree-select
          ref="instituteSelectRef"
          v-model="infoFormData.parentId"
          placeholder="请选择父级机构"
          :data="instituteTreeData"
          node-key="id"
          :props="{
            label: 'instituteName',
            children: 'children',
            disabled: '',
          }"
          :expand-on-click-node="false"
          :check-on-click-node="true"
          :filter-node-method="filterNodeMethod"
          check-strictly
          filterable
          @change="handleInstituteSelect"
        >
          <template #prefix>
            <el-icon class="el-input__icon"><Search /></el-icon>
          </template>
        </el-tree-select>
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
import { Search } from "@element-plus/icons-vue";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useDictStore } from "@/stores";
import InstituteAPI, {
  InstituteInfoParam,
  InstituteInfoDto,
  InstituteTreeDto,
} from "@/api/institute";
import { SysAreaDto } from "@/api/system";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
  instituteTreeData: InstituteTreeDto[];
  areaData: SysAreaDto[];
}>();

const dictStore = useDictStore();
const areaTreeData = ref<SysAreaDto[]>([]);
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增子机构");

/* ***************************** 基础数据 ********************************* */
// 机构类型
// TODO 随授权分组联动
const typeList = dictStore.listDictionary(DictionaryEnum.INSTITUTE_TYPE);

/**
 * 机构筛选
 */
function filterNodeMethod(value: string, data: any) {
  // console.log("filterNodeMethod", value, data)
  return !value ? true : (data as InstituteTreeDto).instituteName!.includes(value);
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
  instituteName: [{ required: true, message: "请输入名称", trigger: "blur" }],
});

/**
 * 选中机构
 */
const instituteSelectRef = ref();
function handleInstituteSelect(instituteId: string) {
  // console.log("handleInstituteSelect", data);
  if (instituteId) {
    const node = instituteSelectRef.value.getNode(instituteId);
    const info = node!.data as InstituteInfoDto;
    // console.log("handleInstituteSelect", info);
    infoFormData.value.instituteType = info!.instituteType;
    infoFormData.value.roleGroup = info!.roleGroup;
  } else {
    infoFormData.value.instituteType = DictionaryEnum.INSTITUTE_TYPE_NORMAL;
    infoFormData.value.roleGroup = DictionaryEnum.ROLE_GROUP_NORMAL;
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
    const params = { ...infoFormData.value } as InstituteInfoParam;
    if (params.id) {
      InstituteAPI.updateInstituteInfo(params).then((_data) => {
        ElMessage.success("保存成功");
        dialogVisible.value = false;
        emits("on-submit");
      });
    } else {
      InstituteAPI.addInstituteInfo(params).then((_data) => {
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
    // TODO 加载机构类型 param.roleGroup
  } else {
    infoFormData.value.parentId = props.defaultInstitute.id;
    infoFormData.value.instituteType = props.defaultInstitute.instituteType;
    // TODO 加载机构类型 props.defaultInstitute.roleGroup
  }
  dialogVisible.value = true;
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  dialogTitle.value = "新增子机构";
  infoFormRef.value.clearValidate();
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
