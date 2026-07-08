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
      :inline="true"
      class="form-inline mt-5"
    >
      <el-form-item label="所属机构">
        <el-input v-model="infoFormData.instituteName" :disabled="true" />
      </el-form-item>
      <el-form-item label="所属部门" prop="deptId">
        <el-tree-select
          v-model="infoFormData.deptId"
          placeholder="请选择所属的部门"
          :data="deptlist"
          node-key="id"
          :props="{
            label: 'deptName',
            children: 'children',
            disabled: '',
          }"
          check-strictly
          filterable
          clearable
          :default-expand-all="true"
          :render-after-expand="false"
          :expand-on-click-node="false"
          :check-on-click-node="true"
        />
      </el-form-item>

      <el-form-item label="账号名称" prop="userName">
        <el-input
          v-model="infoFormData.userName"
          placeholder="系统唯一，可用于登录"
          maxlength="20"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="真实姓名" prop="realName">
        <el-input
          v-model="infoFormData.realName"
          placeholder="可以为空，用于消息发送"
          maxlength="20"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="手机号码" prop="phone">
        <el-input
          v-model="infoFormData.phone"
          placeholder="系统唯一，可用于登录"
          maxlength="20"
          autocomplete="off"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="登录密码" prop="password">
        <el-input
          v-model="infoFormData.password"
          placeholder="请填写登录密码"
          type="password"
          autocomplete="new-password"
          show-password
          clearable
          @input="checkPasswordComplex"
        />
        <div class="password-strength">
          <span :style="{ 'background-color': infoFormData.pwdColor1 }"></span>
          <span :style="{ 'background-color': infoFormData.pwdColor2 }"></span>
          <span :style="{ 'background-color': infoFormData.pwdColor3 }"></span>
        </div>
      </el-form-item>

      <el-form-item label="用户编码" prop="userCode">
        <el-input
          v-model="infoFormData.userCode"
          placeholder="机构唯一，与其他系统对接的唯一标识"
          maxlength="20"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="三方标识" prop="thirdId">
        <el-input
          v-model="infoFormData.thirdId"
          placeholder="机构唯一，与其他系统对接的唯一标识"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="授权角色" prop="userRoleIdList" class="full-row">
        <el-row style="width: 100%">
          <el-text tag="b" class="mr-5" style="margin-right: 1.25rem">内置</el-text>
          <el-checkbox-group v-model="infoFormData.innerRoleIdList">
            <el-checkbox
              v-for="item in innerRoleList"
              :key="item.id"
              :label="item.roleName"
              :value="item.id"
            />
          </el-checkbox-group>
        </el-row>
        <el-row style="width: 100%">
          <el-text tag="b" class="mr-5" style="margin-right: 1.25rem">通用</el-text>
          <el-checkbox-group v-model="infoFormData.normalRoleIdList">
            <el-checkbox
              v-for="item in normalRoleList"
              :key="item.id"
              :label="item.roleName"
              :value="item.id"
            />
          </el-checkbox-group>
        </el-row>
        <el-row style="width: 100%">
          <el-text tag="b" class="mr-5" style="margin-right: 1.25rem">私有</el-text>
          <el-checkbox-group v-model="infoFormData.privateRoleIdList">
            <el-checkbox
              v-for="item in privateRoleList"
              :key="item.id"
              :label="item.roleName"
              :value="item.id"
            />
          </el-checkbox-group>
        </el-row>
      </el-form-item>

      <el-form-item label="用户分组" prop="userGroupIdList" class="full-row">
        <el-checkbox-group v-model="infoFormData.userGroupIdList">
          <el-checkbox
            v-for="item in groupList"
            :key="item.id"
            :label="item.groupName"
            :value="item.id"
          />
        </el-checkbox-group>
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
import { InstituteInfoDto } from "@/api/institute";
import { useSettingsStore } from "@/stores";
import DepartmentAPI, { DepartmentTreeDto } from "@/api/department";
import UserAPI, { GroupDto } from "@/api/user";
import RoleAPI, { RoleInfoDto } from "@/api/role";
import AdminUserAPI, { UserInfoDto, UserUpdateParam } from "@/api/adminUser";
import { passwordComplex } from "@/utils/common";
import { encrypt } from "@web-micro/shared";

const settingsStore = useSettingsStore();

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
defineProps<{
  defaultInstitute: InstituteInfoDto;
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");

/* ***************************** 基础数据 ********************************* */
/**
 * 加载用户分组列表
 */
const groupList = ref<GroupDto[]>([]);
function loadGroupList(instituteId: string) {
  groupList.value = [];
  if (!instituteId) {
    return;
  }
  const params = { id: instituteId };
  UserAPI.listUserGroup(params).then((data) => {
    groupList.value = data;
  });
}
/**
 * 加载部门列表
 */
const deptlist = ref<DepartmentTreeDto[]>([]);
function loadDepartmentList(instituteId: string) {
  deptlist.value = [];
  if (!instituteId) {
    return;
  }
  const params = { id: instituteId };
  DepartmentAPI.listDepartmentByTree(params).then((data) => {
    deptlist.value = data || [];
  });
}
/**
 * 加载角色列表
 */
const innerRoleList = ref<RoleInfoDto[]>([]);
const normalRoleList = ref<RoleInfoDto[]>([]);
const privateRoleList = ref<RoleInfoDto[]>([]);
async function loadRoleList(instituteId: string) {
  innerRoleList.value = [];
  normalRoleList.value = [];
  privateRoleList.value = [];
  if (!instituteId) {
    return;
  }
  const params = { instituteId };
  await RoleAPI.listRoleInfo(params).then((data) => {
    data?.forEach((item) => {
      if (item.roleType === DictionaryEnum.ROLE_TYPE_INNER) {
        innerRoleList.value.push(item);
      } else if (item.roleType === DictionaryEnum.ROLE_TYPE_NORMAL) {
        normalRoleList.value.push(item);
      } else if (item.roleType === DictionaryEnum.ROLE_TYPE_PRIVATE) {
        privateRoleList.value.push(item);
      }
    });
  });
}

/* ***************************** 表单操作 ********************************* */
// 扩展部分属性
interface InfoFormParam extends UserUpdateParam {
  instituteId: string; // 所属机构
  instituteName: string; // 所属机构
  pwdColor1?: string; // 密码强度颜色
  pwdColor2?: string; // 密码强度颜色
  pwdColor3?: string; // 密码强度颜色
  innerRoleIdList: string[];
  normalRoleIdList: string[];
  privateRoleIdList: string[];
}
// 初始表单数据
const initialFormData = ref<InfoFormParam>({
  id: "",
  userName: "",
  userCode: "",
  realName: "",
  thirdId: "",
  instituteId: "",
  instituteName: "",
  deptId: "",
  phone: "",
  email: "",
  password: "",
  pwdLevel: DictionaryEnum.PASSWORD_WEAK,
  pwdColor1: "#BBBBBB",
  pwdColor2: "#BBBBBB",
  pwdColor3: "#BBBBBB",
  userRoleIdList: [],
  userGroupIdList: [],
  innerRoleIdList: [],
  normalRoleIdList: [],
  privateRoleIdList: [],
});
// 自定义校验规则（角色必选）
const validateRoleList = (rule: any, value: any, callback: any) => {
  const roles = [
    ...infoFormData.value.innerRoleIdList,
    ...infoFormData.value.normalRoleIdList,
    ...infoFormData.value.privateRoleIdList,
  ];
  if (roles.length === 0) {
    callback(new Error("请至少选择一个角色"));
  } else {
    callback();
  }
};

const infoFormRef = ref(ElForm);
const infoFormData = ref<InfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<InfoFormParam>>({
  deptId: [{ required: true, message: "请选择所属部门", trigger: "change" }],
  userName: [
    {
      min: 2,
      max: 20,
      pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
      message: "2~20位，字母开头，只能包含字母、数字、下划线、中横线",
      trigger: "blur",
    },
  ],
  phone: [
    {
      min: 11,
      max: 20,
      pattern: /^[1]+[0-9*]+$/,
      message: "只能输入手机号码",
      trigger: "blur",
    },
  ],
  password: [
    {
      min: 6,
      max: 20,
      pattern: /^[a-zA-Z0-9%&'*.,;=+\-?@#!$]+$/,
      message: "只能输入 6 到 20 位以内的字符",
      trigger: "blur",
    },
  ],
  userRoleIdList: [{ required: true, validator: validateRoleList, trigger: "blur" }],
  userGroupIdList: [{ required: true, message: "请至少选择一个用户组", trigger: "blur" }],
});
/**
 * 自动加载：部门、角色、分组的联动
 */
async function autoCompleteInstituteChange(instituteId: string) {
  loadDepartmentList(instituteId);
  loadGroupList(instituteId);
  await loadRoleList(instituteId);
}

/**
 * 密码强度
 */
function checkPasswordComplex(password: string) {
  const score = passwordComplex(password);
  infoFormData.value.pwdLevel = DictionaryEnum.PASSWORD_WEAK;
  infoFormData.value.pwdColor1 = "#BBBBBB";
  infoFormData.value.pwdColor2 = "#BBBBBB";
  infoFormData.value.pwdColor3 = "#BBBBBB";
  if (score >= 20) {
    infoFormData.value.pwdLevel = DictionaryEnum.PASSWORD_STRONG;
    infoFormData.value.pwdColor1 = "#33CC00";
    infoFormData.value.pwdColor2 = "#33CC00";
    infoFormData.value.pwdColor3 = "#33CC00";
  } else if (score >= 15) {
    infoFormData.value.pwdLevel = DictionaryEnum.PASSWORD_MIDDLE;
    infoFormData.value.pwdColor1 = "#FF9900";
    infoFormData.value.pwdColor2 = "#FF9900";
  } else if (score >= 10) {
    infoFormData.value.pwdColor1 = "#FC5F76";
  }
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(async () => {
  const params = {
    id: infoFormData.value.id,
    userName: infoFormData.value.userName,
    userCode: infoFormData.value.userCode,
    realName: infoFormData.value.realName,
    thirdId: infoFormData.value.thirdId,
    instituteId: infoFormData.value.instituteId,
    deptId: infoFormData.value.deptId,
    phone: infoFormData.value.phone,
    email: infoFormData.value.email,
    password: infoFormData.value.password,
    pwdLevel: infoFormData.value.pwdLevel,
    userRoleIdList: [
      ...infoFormData.value.innerRoleIdList,
      ...infoFormData.value.normalRoleIdList,
      ...infoFormData.value.privateRoleIdList,
    ],
    userGroupIdList: infoFormData.value.userGroupIdList,
  } as UserUpdateParam;
  params.password = encrypt.password(params.password || "", settingsStore.rsaPublicKey);
  // console.log("handleInfoSubmit", params);
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    AdminUserAPI.updateUserInfo(params).then((_data) => {
      ElMessage.success("修改成功");
      // 关闭窗体
      dialogVisible.value = false;
      // 刷新列表
      emits("on-submit");
    });
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (param: UserInfoDto) => {
  // 1. 加载机构的部门、角色、分组信息
  await autoCompleteInstituteChange(param.instituteId);
  // 2. 拼接表单数据
  Object.assign(infoFormData.value, param);
  // 3. 解析授权的分组信息
  infoFormData.value.userGroupIdList = [];
  if (param.userGroupList && param.userGroupList.length > 0) {
    param.userGroupList.forEach((item) => {
      infoFormData.value.userGroupIdList!.push(item.id);
    });
  }
  // 4. 解析授权的角色信息
  infoFormData.value.userRoleIdList = [];
  infoFormData.value.innerRoleIdList = [];
  infoFormData.value.normalRoleIdList = [];
  infoFormData.value.privateRoleIdList = [];
  param.userRoleList!.forEach((item) => {
    infoFormData.value.userRoleIdList?.push(item.id);
  });
  if (param.userRoleList && param.userRoleList.length > 0) {
    innerRoleList.value
      .filter((role) => infoFormData.value.userRoleIdList?.includes(role.id))
      .forEach((role) => {
        infoFormData.value.innerRoleIdList.push(role.id);
      });
    normalRoleList.value
      .filter((role) => infoFormData.value.userRoleIdList?.includes(role.id))
      .forEach((role) => {
        infoFormData.value.normalRoleIdList.push(role.id);
      });
    privateRoleList.value
      .filter((role) => infoFormData.value.userRoleIdList?.includes(role.id))
      .forEach((role) => {
        infoFormData.value.privateRoleIdList.push(role.id);
      });
  }
  // 5. 手机号脱敏（只显示前四位和后四位）
  if (infoFormData.value.phone) {
    infoFormData.value.phone = infoFormData.value.phone.replace(/(\S{4})\S*(\S{4})/, "$1****$2");
  }
  // 最后显示弹窗
  dialogVisible.value = true;
  dialogTitle.value = "新增";
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  infoFormRef.value.clearValidate();
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等 ********************************* */
// 监听属性变化
watchEffect(() => {
  // areaTreeData.value = props.areaData;
});
// 暴露给父级的自定义方法（需放在最后）
defineExpose({
  openDialog,
});
</script>

<style lang="scss" scoped>
// 横排表单
.form-inline {
  .el-form-item {
    width: 45%;
  }

  .full-row {
    width: 90%;
  }
  // .el-input {
  //   --el-input-width: 220px;
  // }
  // .el-select {
  //   --el-select-width: 220px;
  // }
  .el-checkbox {
    min-width: 100px;
  }
}

// 密码强度
.password-strength {
  position: absolute;
  top: 100%;
  right: 0;
  float: right;
  display: flex;
  width: 35%;
  height: 8px;

  span {
    display: inline-block;
    width: 30%;
    margin-top: 3px;
    margin-right: 3px;
    text-align: center;
    border-radius: 8px;
  }
}
</style>
