<template>
  <div class="app-container">
    <el-row :gutter="20">
      <el-col :lg="5" :xs="24">
        <!-- 机构树 -->
        <InstituteTree
          :tree-data="instituteTreeData"
          :current-node="currentInstituteInfo.id"
          @node-click="handleInstituteClick"
        />
      </el-col>
      <el-col :lg="19" :xs="24">
        <div class="card-container">
          <el-card shadow="never">
            <template #header>
              <DictTag :code="currentInstituteInfo.instituteType" size="small" />
              <span class="mx-2">{{ currentInstituteInfo.instituteName }}</span>
            </template>
            <div class="tabs-container">
              <el-tabs v-model="stepActive" type="border-card">
                <el-tab-pane name="0" label="直属子机构">
                  <AdminInstituteList
                    ref="subInstituteListRef"
                    :default-institute="currentInstituteInfo"
                    :area-data="sysAreaData"
                  />
                </el-tab-pane>
                <el-tab-pane name="1" label="区域及部门">
                  <el-row :gutter="20">
                    <el-col :lg="8" :xs="24">
                      <AreaPanel
                        v-model="currentIncArea"
                        :default-institute="currentInstituteInfo"
                      />
                    </el-col>
                    <el-col :lg="16" :xs="24">
                      <DepartmentPanel
                        ref="departmentListRef"
                        :current-area="currentIncArea"
                        :default-institute="currentInstituteInfo"
                      />
                    </el-col>
                  </el-row>
                </el-tab-pane>
              </el-tabs>
              <div class="button-wrapper">
                <el-button type="primary" :icon="Plus" @click="openAddInfoForm">新增</el-button>
              </div>
            </div>
          </el-card>
          <div class="button-wrapper">
            <el-tooltip content="编辑">
              <el-button size="small" type="primary" :icon="Edit" @click="openEditInstituteForm" />
            </el-tooltip>
            <el-tooltip content="配置">
              <el-button size="small" type="success" :icon="Tools" />
            </el-tooltip>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定删除吗？【${currentInstituteInfo.instituteName}】`"
              width="160"
              @confirm="handleDeleteInstitute"
            >
              <template #reference>
                <el-button size="small" type="danger">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
              <template #actions="{ confirm, cancel }">
                <el-button size="small" @click="cancel">取消</el-button>
                <el-button size="small" type="danger" @click="confirm">确定</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-col>
    </el-row>
    <!-- 机构表单页面 -->
    <AdminInstituteInfoForm
      ref="instituteFormRef"
      :default-institute="currentInstituteInfo"
      :area-data="sysAreaData"
      @on-submit="reloadInsituteData"
    />
    <!-- 部门表单页面 -->
    <DepartmentInfoForm
      ref="departmentFormRef"
      :default-institute="currentInstituteInfo"
      @on-submit="reloadDepartmentData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import DictTag from "@/components/DictTag/index.vue";
import { Plus, Edit, Delete, Tools, WarnTriangleFilled } from "@element-plus/icons-vue";
import AdminInstituteList from "./components/AdminInstituteList.vue";
import AdminInstituteInfoForm from "./components/AdminInstituteInfoForm.vue";
import InstituteTree from "./components/InstituteTree.vue";
import AreaPanel from "./components/AreaPanel.vue";
import DepartmentPanel from "./components/DepartmentPanel.vue";
import DepartmentInfoForm from "./components/DepartmentInfoForm.vue";
import AdminInstituteAPI, { InstituteInfoDto, InstituteTreeDto } from "@/api/adminInstitute";
import { DepartmentInfoParam, AreaInfoDto } from "@/api/department";
import SystemAPI, { SysAreaDto } from "@/api/system";

/* ***************************** 参数定义 ********************************* */
const instituteTreeData = ref<InstituteTreeDto[]>([]); // 机构树数据
const currentInstituteInfo = ref<InstituteInfoDto>({ id: "", instituteName: "" }); // 当前机构信息
const currentIncArea = ref<AreaInfoDto>(); // 当前区域ID

/* ***************************** 初始数据 ********************************* */
/**
 * 加载地区数据
 */
const sysAreaData = ref<SysAreaDto[]>([]);
function loadSysAreaTree() {
  // console.log("loadSysArea");
  SystemAPI.listAreaByCode({ id: "" }).then((data) => {
    sysAreaData.value = data || [];
  });
}
/* ***************************** 机构树 ********************************* */
/**
 * 加载机构树
 */
function loadInsituteTree() {
  AdminInstituteAPI.listInstituteByTree().then((data) => {
    instituteTreeData.value = data || [];
    // 默认选中第一个节点
    if (!currentInstituteInfo.value.id) {
      handleInstituteClick(instituteTreeData.value[0]);
    }
  });
}
/**
 * 查找节点
 */
function findInstituteTreeNode(
  id: string,
  data?: InstituteTreeDto[] | null
): InstituteTreeDto | null {
  if (!id) {
    return null;
  }
  if (!data) {
    data = instituteTreeData.value;
  }
  // 递归查找 data 中id为id的节点
  for (let i = 0; i < data.length; i++) {
    if (data[i].id == id) {
      return data[i];
    }
    if (data[i].children && data[i].children!.length > 0) {
      const result = findInstituteTreeNode(id, data[i].children!);
      if (result) {
        return result;
      }
    }
  }
  return null;
}
/**
 * 选中节点
 */
function handleInstituteClick(param: InstituteTreeDto) {
  // console.log("handleInstituteClick", param);
  // 加载机构详情
  const params = { id: param.id };
  AdminInstituteAPI.getInstituteInfo(params).then((data) => {
    currentInstituteInfo.value = data;
  });
}

/**
 * 刷新子机构数据
 */
const subInstituteListRef = ref(AdminInstituteList);
function reloadInsituteData() {
  // console.log("reloadInsituteData");
  // 刷新机构树
  loadInsituteTree();
  // 刷新子机构
  subInstituteListRef.value.handleResetQuery();
}

/**
 * 刷新部门列表
 */
const departmentListRef = ref(DepartmentPanel);
function reloadDepartmentData() {
  // console.log("reloadDepartmentData");
  departmentListRef.value.loadAllDepartmentData();
}

/* ***************************** 详情表单 ********************************* */
/**
 * 新增按钮
 */
const stepActive = ref<string>("0");
function openAddInfoForm() {
  if ("0" == stepActive.value) {
    // 打开机构表单，已当前选中机构作为父节点
    const param = {
      id: "",
      parentId: currentInstituteInfo.value.id,
      parentName: currentInstituteInfo.value.instituteName,
      instituteType: currentInstituteInfo.value.instituteType,
      roleGroup: currentInstituteInfo.value.roleGroup,
    } as InstituteInfoDto;
    openInstituteForm(param);
  } else {
    // 打开部门表单，已当前选中机构作为所属机构
    const param = { id: "", instituteId: currentInstituteInfo.value.id } as DepartmentInfoParam;
    param.areaId = currentIncArea.value ? currentIncArea.value!.id : "";
    openDepartmentForm(param);
  }
}

/**
 * 机构编辑按钮
 */
function openEditInstituteForm() {
  openInstituteForm(currentInstituteInfo.value);
}

/**
 * 机构删除按钮
 */
function handleDeleteInstitute() {
  const params = { id: currentInstituteInfo.value.id };
  AdminInstituteAPI.deleteInstituteInfo(params).then((_data) => {
    ElMessage.success("删除成功");
    // 删除后默认选中父节点
    const parentData = findInstituteTreeNode(currentInstituteInfo.value.parentId!);
    if (parentData) {
      handleInstituteClick(parentData);
    }
    // 刷新机构列表
    reloadInsituteData();
  });
}

/**
 * 打开机构表单
 */
const instituteFormRef = ref(AdminInstituteInfoForm);
function openInstituteForm(param: InstituteInfoDto) {
  instituteFormRef.value.openDialog(param);
}

/**
 * 打开部门表单
 */
const departmentFormRef = ref(DepartmentInfoForm);
function openDepartmentForm(param: DepartmentInfoParam) {
  departmentFormRef.value.openDialog(param);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "account-institute_admin",
  inheritAttrs: false,
});
/**
 * 页面加载时
 */
onMounted(() => {
  loadInsituteTree();
  loadSysAreaTree();
});
</script>

<style lang="scss" scoped>
// 去除card的边距，让内部元素填满
.card-container > :deep(.el-card > .el-card__body) {
  padding: 0;
}

// card右侧按钮
.card-container {
  position: relative; /* 为内部元素提供定位上下文 */
  > .button-wrapper {
    position: absolute; /* 绝对定位 */
    top: 18px;
    right: 10px;
  }
}
// tabs右侧按钮
.tabs-container {
  position: relative; /* 为内部元素提供定位上下文 */
  > .button-wrapper {
    position: absolute; /* 绝对定位 */
    top: 4px;
    right: 10px;
  }

  > .el-tabs {
    border: 0;
  }
}
</style>
