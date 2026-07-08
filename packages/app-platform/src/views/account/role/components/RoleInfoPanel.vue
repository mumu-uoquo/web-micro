<template>
  <!-- 机构选择 -->
  <el-tree-select
    ref="instituteSelectRef"
    v-model="instituteId"
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

  <!-- 角色列表 -->
  <div class="tabs-container">
    <el-tabs v-model="roleType">
      <el-tab-pane label="内置" :name="DictionaryEnum.ROLE_TYPE_INNER">
        <RoleInfoList
          :role-type="DictionaryEnum.ROLE_TYPE_INNER"
          :data-list="roleList"
          :institute="instituteSelect"
          :max-height="tableMaxHeight"
          @on-click="handleRoleClick"
          @on-submit="loadRoleList(instituteId)"
        />
      </el-tab-pane>
      <el-tab-pane label="通用" :name="DictionaryEnum.ROLE_TYPE_NORMAL">
        <RoleInfoList
          :role-type="DictionaryEnum.ROLE_TYPE_NORMAL"
          :data-list="roleList"
          :institute="instituteSelect"
          :max-height="tableMaxHeight"
          @on-click="handleRoleClick"
          @on-submit="loadRoleList(instituteId)"
        />
      </el-tab-pane>
      <el-tab-pane label="私有" :name="DictionaryEnum.ROLE_TYPE_PRIVATE">
        <RoleInfoList
          :role-type="DictionaryEnum.ROLE_TYPE_PRIVATE"
          :data-list="roleList"
          :institute="instituteSelect"
          :max-height="tableMaxHeight"
          @on-click="handleRoleClick"
          @on-submit="loadRoleList(instituteId)"
        />
      </el-tab-pane>
    </el-tabs>
    <div class="button-wrapper">
      <el-button type="primary" :icon="Plus" size="small" round @click="handleOpenInfoAddDialog" />
    </div>
  </div>

  <!-- 角色表单 -->
  <RoleInfoForm
    ref="roleInfoFormRef"
    :institute="defaultInstitute"
    @on-submit="loadRoleList(instituteId)"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { Plus, Search } from "@element-plus/icons-vue";
import InstituteAPI, { InstituteTreeDto, InstituteInfoDto } from "@/api/institute";
import RoleAPI, { RoleInfoDto } from "@/api/role";
import RoleInfoList from "./RoleInfoList.vue";
import RoleInfoForm from "./RoleInfoForm.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits<{
  (e: "on-role-click", info: RoleInfoDto, readOnly: boolean): void;
}>();
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
}>();
const tableMaxHeight = ref("auto");

/* ***************************** 机构操作 ********************************* */
/**
 * 加载机构列表
 */
const instituteId = ref<string>("");
const instituteSelect = ref<InstituteInfoDto>({ id: "", instituteName: "" });
const instituteTreeData = ref<InstituteTreeDto[]>([]);
const loadInstitituteList = async () => {
  // 加载机构列表
  const data = await InstituteAPI.listInstituteByTree();
  instituteTreeData.value = data || [];
  // 默认选中当前机构，并加载对应的角色列表
  instituteId.value = props.defaultInstitute!.id;
  instituteSelect.value = props.defaultInstitute!;
  loadRoleList(instituteId.value);
};
/**
 * 机构筛选
 */
function filterNodeMethod(value: string, data: any) {
  // console.log("filterNodeMethod", value, data);
  return !value ? true : (data as InstituteTreeDto).instituteName!.includes(value);
}

/**
 * 选中机构
 */
const instituteSelectRef = ref();
function handleInstituteSelect(instituteId: string) {
  const node = instituteSelectRef.value.getNode(instituteId);
  instituteSelect.value = { ...node.data } as InstituteInfoDto;
  loadRoleList(instituteId);
}

/* ***************************** 角色操作 ********************************* */
/**
 * 加载机构的角色列表
 */
const roleList = ref<RoleInfoDto[]>([]);
function loadRoleList(instituteId: string) {
  // console.log("loadRoleList", instituteId);
  RoleAPI.listRoleInfo({ instituteId }).then((data) => {
    roleList.value = data;
  });
}

/**
 * 打开新增弹窗
 */
const roleType = ref<string>(DictionaryEnum.ROLE_TYPE_INNER);
const roleInfoFormRef = ref(RoleInfoForm);
function handleOpenInfoAddDialog() {
  roleInfoFormRef.value.openAddDialog(roleType.value, instituteSelect.value);
}

/**
 * 点击角色
 */
function handleRoleClick(info: RoleInfoDto, readOnly: boolean) {
  emits("on-role-click", info, readOnly);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const tableHeight = Math.max(200, window.innerHeight - 304);
  tableMaxHeight.value = `${tableHeight}px`;

  loadInstitituteList();
});
</script>

<style lang="scss" scoped>
// 按钮放在tabs的header右边
.tabs-container {
  position: relative; /* 为内部元素提供定位上下文 */
  .button-wrapper {
    position: absolute; /* 绝对定位 */
    top: 4px;
    right: 4px;
  }
}
</style>
