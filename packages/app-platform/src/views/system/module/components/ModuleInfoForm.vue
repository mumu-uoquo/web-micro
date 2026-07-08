<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    draggable
    @close="handleCloseDialog"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" status-icon label-width="100px">
      <el-form-item label="父级菜单" prop="parentId">
        <el-cascader
          v-model="formData.parentId"
          :options="parentTree"
          :props="{
            value: 'id',
            label: 'moduleName',
            children: 'children',
            expandTrigger: 'hover',
            checkStrictly: true,
            emitPath: false,
          }"
          :disabled="'' != formData.id"
          :show-all-levels="false"
          filterable
          clearable
          placeholder="请选择"
          @change="handleParentChange"
        >
          <template #default="{ node, data }">
            <span>{{ data.moduleName }}</span>
            <span v-if="!node.isLeaf">({{ data.children.length }})</span>
          </template>
        </el-cascader>
      </el-form-item>
      <el-form-item label="模块类型" prop="moduleType">
        <el-radio-group
          v-model="formData.moduleType"
          :disabled="!formData.parentId || '' == formData.parentId"
          @change="changeModuleType"
        >
          <el-radio-button :value="DictionaryEnum.MODULE_TYPE_MENU">菜单</el-radio-button>
          <el-radio-button :value="DictionaryEnum.MODULE_TYPE_BUTTON">按钮</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="模块名称" prop="moduleName">
        <el-input
          v-model="formData.moduleName"
          maxlength="20"
          show-word-limit
          clearable
          placeholder="角色授权时显示"
        >
          <template #prepend>
            <icon-select v-model="formData.icon" type="icon" placement="bottom" width="14px" />
          </template>
          <template #append>
            <div class="number-wrapper">
              <el-input-number v-model="formData.sortIdx" size="small" :min="0" :max="1000" />
            </div>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="菜单名称" prop="menuName">
        <el-input
          v-model="formData.menuName"
          maxlength="20"
          show-word-limit
          clearable
          :disabled="!isMenu"
          placeholder="页面菜单显示，默认同模块名称"
        >
          <template #append>
            <el-switch
              v-model="formData.visible"
              :disabled="!isMenu"
              :style="`--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;`"
              inline-prompt
              active-text="可见"
              inactive-text="隐藏"
            />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="默认授权" prop="roleIdList">
        <el-checkbox-group v-model="formData.roleIdList">
          <el-checkbox
            v-for="role in roleList"
            :key="role.id"
            :value="role.id"
            :label="role.roleName"
          >
            {{ role.roleName }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item v-if="formData.id" label="模块编码">
        <el-input v-model="formData.moduleCode" :disabled="true" />
      </el-form-item>
      <el-form-item v-else label="模块编码" prop="moduleCode">
        <el-input
          v-model="formData.moduleCode"
          placeholder="用于权限控制，全局唯一，不可修改"
          maxlength="10"
          show-word-limit
          clearable
        >
          <template #prepend>{{ prependCode }}</template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="isMenu" label="路由地址" prop="path">
        <el-input
          v-model="formData.path"
          placeholder="模块的路由地址"
          maxlength="100"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item v-if="isMenu" label="链接地址" prop="url">
        <el-input
          v-model="formData.url"
          placeholder="默认同路由地址，常用于外站、redirect跳转等链接地址"
          maxlength="100"
          show-word-limit
          clearable
        >
          <template #append>
            <el-switch
              v-model="formData.popup"
              :style="`--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949;`"
              inline-prompt
              :active-value="false"
              :inactive-value="true"
              active-text="内嵌"
              inactive-text="新页"
            />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="isMenu" label="请求参数" prop="params">
        <ModuleParamList v-model="formData.params" height="150" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          maxlength="50"
          show-word-limit
          :autosize="{ minRows: 2, maxRows: 4 }"
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
import { ref, reactive, watchEffect, onBeforeMount } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import ModuleAPI, { ModuleInfoDto, ModuleTreeDto, ModuleInfoParam } from "@/api/module";
import AdminRoleAPI, { RoleInfoDto } from "@/api/adminRole";
import ModuleParamList from "./ModuleParamList.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  moduleData: ModuleTreeDto[];
}>();

// 初始表单数据
const initialFormData = ref<ModuleInfoParam>({
  id: "",
  parentId: "",
  moduleCode: "",
  moduleType: DictionaryEnum.MODULE_TYPE_MENU,
  moduleName: "",
  menuName: "",
  description: "",
  sortIdx: 99,
  visible: true,
  icon: "el-icon-menu",
  path: "",
  url: "",
  params: [],
  popup: false,
  roleIdList: [],
});

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");

/* ***************************** 表单信息 ********************************* */
const isMenu = ref<boolean>(true);
const prependCode = ref<string>(""); // 模块编码前置
const formRef = ref(ElForm);
const formData = ref<ModuleInfoParam>({ ...initialFormData.value }); // 表单数据
const formRules = reactive<FormRules<ModuleInfoParam>>({
  moduleName: [{ required: true, message: "请输入模块名称", trigger: "blur" }],
  moduleCode: [
    { required: true, message: "请输入模块编码", trigger: "blur" },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]{0,9}$/,
      message: "只能输入 10 位以内的字母、数字、下划线",
      trigger: "blur",
    },
  ],
  path: [
    {
      pattern: /^[a-zA-Z0-9\/]+$/, // eslint-disable-line
      message: "只能输入字母、数字、斜杠",
      trigger: "blur",
    },
  ],
});
const parentTree = ref<ModuleTreeDto[]>([]);
const parentList = ref<ModuleInfoDto[]>([]);
const roleList = ref<RoleInfoDto[]>([]);

/**
 * 加载内置角色列表
 */
function loadRoleList() {
  AdminRoleAPI.listRoleInfoByPage({ roleType: DictionaryEnum.ROLE_TYPE_INNER }).then((data) => {
    roleList.value = data.result ? data.result : [];
  });
}

/**
 * 递归过滤菜单
 */
function transferModuleData(param: ModuleTreeDto[]): ModuleTreeDto[] {
  const result: ModuleTreeDto[] = param
    .filter((item: ModuleTreeDto) => {
      // 父节点只能是菜单
      return DictionaryEnum.MODULE_TYPE_MENU == item.moduleType;
    })
    .map((item: ModuleTreeDto) => {
      let children: ModuleTreeDto[] = [];
      if (item.children && item.children.length > 0) {
        children = transferModuleData(item.children);
      }
      parentList.value.push(item);
      return {
        id: item.id,
        moduleName: item.moduleName,
        children,
      };
    });
  return result;
}

/**
 * 父节点变更时更新编码前缀
 */
function handleParentChange(parentId: any) {
  prependCode.value = "";
  if (parentId && parentId != "") {
    const parentInfo = parentList.value.filter((item) => {
      return item.id == parentId;
    })[0];
    // 忽略一级节点的编码
    if (parentInfo && parentInfo.parentId) {
      prependCode.value = parentInfo.moduleCode + "-";
    }
  } else {
    // 根节点只能是菜单
    formData.value.moduleType = DictionaryEnum.MODULE_TYPE_MENU;
  }
}

/**
 * 模块类型改变
 */
const changeModuleType = (val: string | number | boolean | undefined) => {
  isMenu.value = val == DictionaryEnum.MODULE_TYPE_MENU;
};

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  formRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    const moduleCode = prependCode.value + formData.value.moduleCode;
    const param = Object.assign({}, formData.value, { moduleCode });
    if (param.id && param.id != "") {
      ModuleAPI.updateModuleInfo(param).then(() => {
        ElMessage.success("修改成功");
        dialogVisible.value = false;
        emits("on-submit"); // 触发自定义事件
      });
    } else {
      ModuleAPI.addModuleInfo(param).then(() => {
        ElMessage.success("新增成功");
        dialogVisible.value = false;
        emits("on-submit"); // 触发自定义事件
      });
    }
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
  isMenu.value = true;
  Object.assign(formData.value, initialFormData.value);
}

/**
 * 显示弹窗
 */
const openDialog = (param: ModuleInfoDto) => {
  dialogVisible.value = true;
  if (param.id && param.id != "") {
    dialogTitle.value = "修改";
    param.icon = param.icon || ""; // 将null转换为空字符串，防止输出警告信息
    isMenu.value = param.moduleType == DictionaryEnum.MODULE_TYPE_MENU;
  }
  Object.assign(formData.value, param);
  formData.value.params = param.params || [];
  handleParentChange(param.parentId);
};

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 在组件挂载前执行（无法获取到 DOM 元素）
 */
onBeforeMount(() => {
  loadRoleList();
});
/**
 * 监听属性变化
 */
watchEffect(() => {
  parentList.value = [];
  parentTree.value = transferModuleData(props.moduleData);
});
/**
 * 暴露给父级的方法
 */
defineExpose({
  openDialog,
});
</script>

<style lang="scss" scoped>
.number-wrapper {
  display: inline-flex;

  :deep(.el-input-number) {
    width: 110px;
  }
  :deep(.el-input__suffix) {
    display: none;
  }

  /* 移除边框，让数字输入框与 append 区域融合 */
  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase) {
    background: transparent;
    border: none;
  }

  :deep(.el-input-number .el-input__inner) {
    padding: 0 5px;
    text-align: center;
    border: none;
  }
}
</style>
