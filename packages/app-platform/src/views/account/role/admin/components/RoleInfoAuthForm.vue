<template>
  <el-drawer v-model="dialogVisible" :title="dialogTitle" @close="handleCloseDialog">
    <el-input v-model="filterText" placeholder="请输入名称过滤" clearable>
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <ElTree
      ref="treeRef"
      :data="props.moduleData"
      :props="{
        label: 'moduleName',
        children: 'children',
        disabled: '',
      }"
      :default-checked-keys="checkedModuleKeys"
      node-key="id"
      show-checkbox
      default-expand-all
      highlight-current
      :check-strictly="true"
      :check-on-click-node="true"
      :expand-on-click-node="false"
      :filter-node-method="handleFilter"
      @check="handleNodeCheck"
    />

    <template #footer>
      <el-button @click="handleInfoReset">还 原</el-button>
      <el-button type="primary" @click="handleInfoSubmit">保 存</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElTree } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useDebounceFn } from "@vueuse/core";
import type { FilterNodeMethodFunction } from "element-plus";
import AdminRoleAPI, { RoleModuleParam, RoleInfoDto, ModuleTreeDto } from "@/api/adminRole";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
// const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  moduleData: ModuleTreeDto[];
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("授权");

/* ***************************** 表单操作 ********************************* */
/**
 * 表单还原
 */
function handleInfoReset() {
  treeRef.value!.setCheckedKeys(defaultModuleKeys.value, false);
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  const params = {
    roleId: currentRoleInfo.value!.id,
    moduleIds: treeRef.value!.getCheckedKeys(),
  } as RoleModuleParam;
  // 基础校验
  if (!params.roleId) {
    ElMessage.error("请选择角色");
    return;
  }
  if (!params.moduleIds || params.moduleIds.length == 0) {
    ElMessage.error("请选择模块");
    return;
  }
  // 提交保存
  AdminRoleAPI.updateModuleRoleRelation(params).then((_data) => {
    ElMessage.success("授权成功");
    dialogVisible.value = false;
  });
}, 500);

/* ***************************** 树形操作 ********************************* */
const treeRef = ref(ElTree);
const filterText = ref<string>("");
watch(
  () => filterText.value,
  () => {
    treeRef.value!.filter(filterText.value);
  }
);
/**
 * 节点筛选
 */
const handleFilter: FilterNodeMethodFunction = (value: string, data: any) => {
  if (!value) {
    return true;
  }
  return (data as ModuleTreeDto).moduleName!.indexOf(value) !== -1;
};
/**
 * 节点单击（级联处理子节点和父节点）
 */
function handleNodeCheck(node: ModuleTreeDto, params: any) {
  // 1. 当前节点选中状态
  const checked = params.checkedKeys!.includes(node.id);
  checkedModuleKeys.value = treeRef.value!.getCheckedKeys();
  // 2. 级联处理
  const childrenKeys = getChildrenKeys(node.children!);
  if (checked) {
    // 子节点级联选中
    checkedModuleKeys.value!.push(...childrenKeys);
    // 父节点未选中时，需要级联勾选
    const unCheckedParentKeys = getUnCheckedParentKeys(node.parentId!);
    checkedModuleKeys.value!.push(...unCheckedParentKeys);
  } else {
    // 子节点级联取消
    checkedModuleKeys.value = checkedModuleKeys.value!.filter(
      (item) => !childrenKeys.includes(item)
    );
    // 取消选中时，父节点不做操作
  }
  // 3. 变更选中效果
  treeRef.value!.setCheckedKeys(checkedModuleKeys.value, true);
}
/**
 * 获取子节点的key集合
 */
function getChildrenKeys(data: ModuleTreeDto[]) {
  let result: string[] = [];
  data.forEach((item) => {
    result.push(item.id);
    if (item.children && item.children.length > 0) {
      result = result.concat(getChildrenKeys(item.children));
    }
  });
  return result;
}
/**
 * 获取未选中的父节点的key集合
 */
function getUnCheckedParentKeys(parentId: string) {
  let result: string[] = [];
  if (!parentId || "" == parentId) {
    return result;
  }
  const node = treeRef.value!.getNode(parentId);
  if (node && !node.checked) {
    result.push(parentId);
    if (node.data!.parentId && "" != node.data!.parentId) {
      result = result.concat(getUnCheckedParentKeys(node.data!.parentId));
    }
  }
  return result;
}

/**
 * 加载初始数据
 */
const checkedModuleKeys = ref<string[]>([]); // 当前选中的
const defaultModuleKeys = ref<string[]>([]); // 默认选中的
function loadSelectModule() {
  AdminRoleAPI.listRoleSelectedModule({ id: currentRoleInfo.value?.id }).then((data) => {
    defaultModuleKeys.value = data!.map((item) => item.id);
    checkedModuleKeys.value = defaultModuleKeys.value;
    handleInfoReset();
  });
}

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const currentRoleInfo = ref<RoleInfoDto>({ id: "", roleName: "" });
const openDialog = async (data: RoleInfoDto) => {
  dialogVisible.value = true;
  dialogTitle.value = "授权";
  Object.assign(currentRoleInfo.value, data);
  loadSelectModule();
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  currentRoleInfo.value = { id: "", roleName: "" };
  defaultModuleKeys.value = [];
  checkedModuleKeys.value = [];
  handleInfoReset();
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
