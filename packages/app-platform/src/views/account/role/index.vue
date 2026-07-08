<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :lg="6" :xs="24">
        <el-card shadow="never" header="角色">
          <RoleInfoPanel :default-institute="defaultInstitute" @on-role-click="handleRoleClick" />
        </el-card>
      </el-col>
      <el-col :lg="18" :xs="24">
        <el-card shadow="never" header="授权">
          <AuthPanel :role-info="roleInfo" :read-only="roleReadOnly" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { InstituteInfoDto } from "@/api/institute";
import { RoleInfoDto } from "@/api/role";
import RoleInfoPanel from "./components/RoleInfoPanel.vue";
import AuthPanel from "./components/AuthPanel.vue";
import { useUserStore } from "@/stores";

/* ***************************** 初始数据 ********************************* */
/**
 * 加载自己所属机构
 */
const defaultInstitute = ref<InstituteInfoDto>({ id: "", instituteName: "" });
async function loadDefaultInstititute() {
  const user = await useUserStore().getUserInfo();
  defaultInstitute.value = {
    id: user.instituteId,
    instituteName: user.instituteName,
    roleGroup: user.roleGroup,
  } as InstituteInfoDto;
}

/* ***************************** 角色操作 ********************************* */
/**
 * 点击角色
 */
const roleInfo = ref<RoleInfoDto>({ id: "", roleName: "" });
const roleReadOnly = ref<boolean>(true);
function handleRoleClick(info: RoleInfoDto, readOnly: boolean) {
  // console.log("handleRoleClick", info, readOnly);
  roleInfo.value = info;
  roleReadOnly.value = readOnly;
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "account-role_list",
  inheritAttrs: false,
});
/**
 * 页面加载时
 */
onMounted(() => {
  loadDefaultInstititute();
});
</script>
