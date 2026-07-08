<template>
  <el-tabs type="border-card">
    <el-tab-pane label="功能">
      <AuthModule
        :module-data="moduleData"
        :role-info="props.roleInfo"
        :read-only="props.readOnly"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import AuthModule from "./AuthModule.vue";
import { RoleInfoDto } from "@/api/role";
import ModuleAPI, { ModuleTreeDto } from "@/api/module";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义属性
const props = defineProps<{
  roleInfo: RoleInfoDto;
  readOnly: boolean;
}>();

/* ***************************** 初始数据 ********************************* */
/**
 * 加载自己所属机构
 */
const moduleData = ref<ModuleTreeDto[]>([]);
async function loadModuleData() {
  const data = await ModuleAPI.listModuleInfoByTree();
  moduleData.value = data || [];
  // console.log("loadModuleData", moduleData.value);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面加载时
 */
onMounted(() => {
  loadModuleData();
});
</script>
