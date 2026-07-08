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
      <el-form-item label="所属机构">
        <el-input v-model="infoFormData.instituteName" :disabled="true" />
      </el-form-item>

      <el-form-item label="父级部门" prop="parentId">
        <el-cascader
          v-model="infoFormData.parentId"
          :options="parentTreeData"
          :props="{
            value: 'id',
            label: 'deptName',
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
      <el-form-item label="所属区域" prop="areaId">
        <el-select v-model="infoFormData.areaId" placeholder="请选择所属区域">
          <el-option
            v-for="item in incAreaData"
            :key="item.id"
            :label="item.areaName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="部门名称" prop="deptName">
        <el-input
          v-model="infoFormData.deptName"
          placeholder="请填写部门的名称"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="部门编码" prop="deptCode">
        <el-input
          v-model="infoFormData.deptCode"
          placeholder="请填写部门的编码"
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
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { InstituteInfoDto } from "@/api/institute";
import DepartmentAPI, {
  DepartmentTreeDto,
  DepartmentInfoParam,
  AreaInfoDto,
} from "@/api/department";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增部门");

/* ***************************** 基础数据 ********************************* */
/**
 * 加载部门数据
 */
const parentTreeData = ref<DepartmentTreeDto[]>([]);
function loadDepartmentTree() {
  // console.log("loadDepartmentTree", props.defaultInstitute.id);
  DepartmentAPI.listDepartmentByTree({ id: props.defaultInstitute.id }).then((data) => {
    parentTreeData.value = data || [];
  });
}

/**
 * 加载地区数据
 */
const incAreaData = ref<AreaInfoDto[]>([]);
function loadAreaData() {
  // console.log("loadAreaData", props.defaultInstitute.id);
  DepartmentAPI.listArea({ id: props.defaultInstitute.id }).then((data) => {
    incAreaData.value = data || [];
  });
}

/* ***************************** 表单信息 ********************************* */
// 初始表单数据
interface DepartmentInfoFormParam extends DepartmentInfoParam {
  instituteName?: string;
}
const initialFormData = ref<DepartmentInfoFormParam>({
  id: "",
  parentId: "",
  instituteId: "",
  instituteName: "",
  areaId: "",
  deptName: "",
  deptCode: "",
  address: "",
  thirdId: "",
  description: "",
});
const infoFormRef = ref(ElForm);
const infoFormData = ref<DepartmentInfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<DepartmentInfoFormParam>>({
  areaId: [{ required: true, message: "请选择所属区域", trigger: "change" }],
  deptName: [{ required: true, message: "请输入名称", trigger: "blur" }],
});

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    const params = { ...infoFormData.value } as DepartmentInfoParam;
    params.instituteId = props.defaultInstitute.id;
    if (params.id) {
      DepartmentAPI.updateDepartmentInfo(params).then((_data) => {
        ElMessage.success("保存成功");
        dialogVisible.value = false;
        emits("on-submit");
      });
    } else {
      DepartmentAPI.addDepartmentInfo(params).then((_data) => {
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
const openDialog = async (param: DepartmentInfoParam) => {
  // 每次都重新加载部门和区域信息
  loadAreaData();
  loadDepartmentTree();
  // 表单初始化
  if (param.id && param.id != "") {
    dialogTitle.value = "修改部门";
  }
  Object.assign(infoFormData.value, param);
  infoFormData.value.instituteId = props.defaultInstitute.id;
  infoFormData.value.instituteName = props.defaultInstitute.instituteName;
  dialogVisible.value = true;
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  dialogTitle.value = "新增部门";
  infoFormRef.value.clearValidate();
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等 ********************************* */
/**
 * 监听属性变化
 * https://cn.vuejs.org/api/reactivity-core.html#watch
 */
//  watch(
//   () => props.defaultInstitute.id,
//   () => {
//     if (props.defaultInstitute.id) {
//       // console.log("area watchEffect props.defaultInstitute.id", props.defaultInstitute.id);
//       handleQuery();
//     }
//   },
//   {
//     immediate: true,
//   }
// );
/**
 * 页面加载时
 */
onMounted(() => {
  // do nothing
});
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

  .el-tag {
    height: 16px;
  }
}
</style>
