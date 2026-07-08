<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    width="500px"
    draggable
    @close="handleCloseDialog"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" status-icon label-width="100px">
      <el-form-item label="父级菜单" prop="parentCode">
        <el-select
          v-model="formData.parentCode"
          placeholder="请选择"
          :disabled="!!formData.id"
          filterable
          clearable
          @change="handleParentChange"
        >
          <el-option
            v-for="item in parentList"
            :key="item.id"
            :label="item.dicValue"
            :value="item.dicCode"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="作用范围" prop="dicType">
        <el-radio-group v-model="formData.dicType" :disabled="!formData.canChangeType">
          <el-radio-button :value="DictionaryEnum.ROLE_TYPE_INNER">内置</el-radio-button>
          <el-radio-button :value="DictionaryEnum.ROLE_TYPE_NORMAL">通用</el-radio-button>
        </el-radio-group>
        <div v-show="formData.dicType == DictionaryEnum.ROLE_TYPE_INNER" class="el-form-item__info">
          保存后不可删除
        </div>
      </el-form-item>
      <el-form-item v-if="formData.id" label="自定编码">
        <el-input v-model="formData.dicCode" :disabled="true" />
      </el-form-item>
      <el-form-item v-else label="自定编码" prop="dicCode">
        <el-input
          v-model="formData.dicCode"
          placeholder="三位数字，全局唯一，不可修改"
          minlength="3"
          maxlength="3"
          clearable
        >
          <template #prepend>
            <span style="width: 30px">{{ prependCode }}</span>
          </template>
        </el-input>
        <!-- 提示信息 -->
      </el-form-item>
      <el-form-item label="字典内容" prop="dicValue">
        <el-input
          v-model="formData.dicValue"
          maxlength="100"
          show-word-limit
          clearable
          placeholder=""
        />
      </el-form-item>
      <el-form-item label="样式" prop="tagStyle">
        <el-select v-model="formData.tagStyle" placeholder="无" clearable>
          <template #label="{ label, value }">
            <el-tag :type="value" size="small">{{ label }}</el-tag>
          </template>
          <el-option
            v-for="item in tagStyleList"
            :key="item.label"
            :label="item.label"
            :value="item.value"
          >
            <el-tag :type="item.value as any" size="small">{{ item.label }}</el-tag>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="排序" prop="sortIdx">
        <el-input-number v-model="formData.sortIdx" :min="0" :max="1000" />
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
import { ref, reactive, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import SystemAPI, { SysDictionaryParam, SysDictionaryDto } from "@/api/system";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  parentData: SysDictionaryDto[];
}>();
// 样式列表
const tagStyleList = [
  { label: "primary", value: "primary" },
  { label: "success", value: "success" },
  { label: "info", value: "info" },
  { label: "warning", value: "warning" },
  { label: "danger", value: "danger" },
];

// 扩展部分属性
interface DictionaryFormParam extends SysDictionaryParam {
  parentCode: string;
  canChangeType: boolean;
}
// 初始表单数据
const initialFormData = ref<DictionaryFormParam>({
  id: "",
  parentCode: "",
  dicCode: "",
  canChangeType: true,
  dicType: DictionaryEnum.ROLE_TYPE_NORMAL,
  dicValue: "",
  tagStyle: "",
  sortIdx: 99,
});

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");

/* ***************************** 表单信息 ********************************* */
const formRef = ref(ElForm);
const formData = ref<DictionaryFormParam>({ ...initialFormData.value }); // 表单数据
const formRules = reactive<FormRules<DictionaryFormParam>>({
  dicValue: [{ required: true, message: "请输入字典内容", trigger: "blur" }],
  dicCode: [
    { required: true, message: "请输入字典编码", trigger: "blur" },
    { pattern: /^[0-9]{3}$/, message: "请输入 3 位数字", trigger: "blur" },
  ],
});

/**
 * 筛选一级字典
 */
const parentList = ref<SysDictionaryDto[]>([]);
function transferParentData(param: SysDictionaryDto[]) {
  parentList.value = param.map((item: SysDictionaryDto) => {
    const temp = { ...item };
    delete temp.children;
    return temp;
  });
}

/**
 * 父节点变更时更新编码前缀
 */
const prependCode = ref<string>(""); // 编码前置
function handleParentChange(parentCode: any) {
  prependCode.value = parentCode ? parentCode : "";
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  formRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    const param = Object.assign({}, formData.value);
    if (!param.id || param.id == "") {
      const dicCode = prependCode.value + formData.value.dicCode;
      param.dicCode = dicCode;
    }
    SystemAPI.saveDictionaryInfo(param).then(() => {
      ElMessage.success(`${dialogTitle.value}成功`);
      dialogVisible.value = false;
      emits("on-submit"); // 触发自定义事件
    });
  });
}, 500);

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  formRef.value.clearValidate();
  prependCode.value = "";
  dialogTitle.value = "新增";
  Object.assign(formData.value, initialFormData.value);
}

/**
 * 显示弹窗
 */
const openDialog = async (param: DictionaryFormParam) => {
  Object.assign(formData.value, param);
  const parentCode = param.dicCode?.length == 3 ? param.dicCode : param.dicCode?.substring(0, 3);
  if (formData.value.id && formData.value.id != "") {
    formData.value.parentCode = parentCode;
    formData.value.canChangeType = param.dicType != DictionaryEnum.ROLE_TYPE_INNER;
    dialogTitle.value = "修改";
  } else {
    Object.assign(formData.value, initialFormData.value);
    formData.value.parentCode = parentCode;
    formData.value.dicCode = param.dicCode?.substring(3);
    handleParentChange(parentCode);
  }
  dialogVisible.value = true;
};

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 在组件挂载前执行（无法获取到 DOM 元素）
 */
// onBeforeMount(() => {
//   loadRoleList();
// });
/**
 * 监听属性变化
 */
watchEffect(() => {
  transferParentData(props.parentData);
});
/**
 * 暴露给父级的方法
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
