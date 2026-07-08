<template>
  <div class="app-container">
    <div class="search-bar">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="60px">
        <el-form-item prop="instituteId" label="机构">
          <el-select
            v-model="queryParams.instituteId"
            placeholder="请选择"
            value-key="id"
            filterable
            clearable
            remote
            remote-show-suffix
            :remote-method="autoCompleteInstitute"
          >
            <el-option
              v-for="item in instituteList"
              :key="item.id"
              :label="item.instituteName"
              :value="item.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="roleName" label="名称">
          <el-input v-model="queryParams.roleName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSubmitQuery">搜索</el-button>
          <el-button :icon="CircleClose" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card shadow="never" class="table-container">
      <template #header>
        <div class="flex-x-between">
          <div>
            <el-button type="success" :icon="Plus" @click="handleOpenInfoAddDialog">新增</el-button>
          </div>
          <div>
            <el-button :icon="Refresh" circle title="刷新" @click="handleQuery()" />
          </div>
        </div>
      </template>
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        :max-height="tableMaxHeight"
        style="width: 100%"
        border
      >
        <el-table-column label="序号" type="index" width="80" align="center" />
        <el-table-column label="名称" prop="roleName" width="200" />
        <el-table-column label="机构" prop="instituteName" width="260" show-overflow-tooltip />
        <el-table-column label="类型" prop="roleType" width="100" align="center">
          <template #default="{ row }">
            <DictTag :code="row.roleType" />
          </template>
        </el-table-column>
        <el-table-column label="等级" prop="roleGrade" width="100" align="center" />
        <el-table-column label="分组" prop="roleGroup" width="100" align="center">
          <template #default="{ row }">
            <DictTag :code="row.roleGroup" />
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="description" width="" show-overflow-tooltip />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-tooltip content="编辑">
              <el-button
                link
                size="small"
                type="primary"
                :icon="Edit"
                @click="handleOpenInfoEditDialog(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="复制">
              <el-button
                link
                size="small"
                type="success"
                :icon="CopyDocument"
                @click="handleOpenInfoCopyDialog(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="授权">
              <el-button
                link
                size="small"
                type="warning"
                :icon="Finished"
                class="btn-color-purple"
                @click="handleOpenAuthDialog(scope.row)"
              />
            </el-tooltip>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要删除吗？【${scope.row.roleName}】`"
              width="160"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button
                  link
                  size="small"
                  type="danger"
                  :disabled="scope.row.roleType == DictionaryEnum.ROLE_TYPE_INNER"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
              <template #actions="{ confirm, cancel }">
                <el-button size="small" @click="cancel">取消</el-button>
                <el-button size="small" type="danger" @click="confirm">确定</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-pagination
          background
          layout="sizes, prev, pager, next"
          :total="tableDataTotal"
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          @current-change="handlePagNumChange"
          @size-change="handlePagSizeChange"
          @change="handleQuery"
        />
      </template>
    </el-card>
    <RoleInfoAddForm
      ref="infoAddFormRef"
      :default-institute="defaultInstitute"
      @on-submit="handleQuery"
    />
    <RoleInfoEditForm ref="infoEditFormRef" @on-submit="handleQuery" />
    <RoleInfoAuthForm ref="infoAuthFormRef" :module-data="moduleTreeData" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import DictTag from "@/components/DictTag/index.vue";
import {
  Plus,
  Edit,
  Delete,
  Search,
  Refresh,
  CircleClose,
  CopyDocument,
  Finished,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import InstituteAPI, { InstituteListParam, InstituteInfoDto } from "@/api/institute";
import AdminRoleAPI, { RoleListParam, RoleInfoDto, ModuleTreeDto } from "@/api/adminRole";
import RoleInfoAddForm from "./components/RoleInfoAddForm.vue";
import RoleInfoEditForm from "./components/RoleInfoEditForm.vue";
import RoleInfoAuthForm from "./components/RoleInfoAuthForm.vue";
import { useUserStore } from "@/stores";

/* ***************************** 初始数据 ********************************* */
/**
 * 加载模块树列表
 */
const moduleTreeData = ref<ModuleTreeDto[]>([]); // 模块树数据
function loadModuleData() {
  AdminRoleAPI.listModuleByTree().then((data) => {
    moduleTreeData.value = data;
  });
}
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

/* ***************************** 搜索表单 ********************************* */
const queryFormRef = ref(ElForm);
const queryParams = reactive<RoleListParam>({
  pageNum: 1,
  pageSize: 20,
});

/**
 * 自动加载：机构列表
 */
const instituteList = ref<InstituteInfoDto[]>([]);
function autoCompleteInstitute(keyword: string) {
  if (!keyword || keyword == "") {
    instituteList.value = [defaultInstitute.value];
    return;
  }
  const param = { pageNum: 1, pageSize: 10, instituteName: keyword } as InstituteListParam;
  InstituteAPI.listInstituteByAbbr(param).then((data) => {
    instituteList.value = data;
  });
}

/**
 * 重置查询
 */
function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.pageNum = 1;
  handleQuery();
}

/**
 * 提交查询
 */
function handleSubmitQuery() {
  queryParams.pageNum = 1;
  handleQuery();
}

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableDataTotal = ref<number>(0);
const tableData = ref<RoleInfoDto[]>([]);

/**
 * 分页变更：页码变更
 * 会自动触发分页的 change 事件
 */
function handlePagNumChange(val: number) {
  queryParams.pageNum = val;
}
/**
 * 分页变更：每页条数变更
 * 会自动触发分页的 change 事件
 */
function handlePagSizeChange(val: number) {
  // 保持当前页面的数据
  //queryParams.pageNum = Math.ceil((queryParams.pageSize! * queryParams.pageNum! ) / val);
  queryParams.pageNum = 1;
  queryParams.pageSize = val;
}

/**
 * 数据查询
 */
function handleQuery() {
  tableLoading.value = true;
  AdminRoleAPI.listRoleInfoByPage(queryParams)
    .then((data) => {
      tableDataTotal.value = data.total || 0;
      tableData.value = data.result || [];
    })
    .finally(() => {
      tableLoading.value = false;
    });
}

/* ***************************** 其他操作 ********************************* */
/**
 * 展示：新增弹窗
 */
const infoAddFormRef = ref(RoleInfoAddForm);
function handleOpenInfoAddDialog() {
  infoAddFormRef.value.openDialog(null);
}
/**
 * 展示：新增弹窗（复制）
 */
function handleOpenInfoCopyDialog(row: RoleInfoDto) {
  infoAddFormRef.value.openDialog(row);
}

/**
 * 展示：编辑弹窗
 */
const infoEditFormRef = ref(RoleInfoEditForm);
function handleOpenInfoEditDialog(row: RoleInfoDto) {
  infoEditFormRef.value.openDialog(row);
}

/**
 * 展示：授权弹窗
 */
const infoAuthFormRef = ref(RoleInfoAuthForm);
function handleOpenAuthDialog(row: RoleInfoDto) {
  infoAuthFormRef.value.openDialog(row);
}

/**
 * 操作：删除
 */
function handleDelete(row: RoleInfoDto) {
  AdminRoleAPI.deleteRoleInfo({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    handleQuery();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "account-role_admin",
  inheritAttrs: false,
});
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const tableHeight = Math.max(200, window.innerHeight - 320);
  tableMaxHeight.value = `${tableHeight}px`;

  handleQuery();
  loadModuleData();
  loadDefaultInstititute();
});
</script>

<style lang="scss" scoped>
// card中的表格铺满
.table-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 确保父容器有高度 */
  border: 0;
}

.table-container > :deep(.el-card__header) {
  border-bottom: 0;
}

.table-container > :deep(.el-card__body) {
  padding: 0;
}

.table-container > :deep(.el-card__footer) {
  border-top: 0;
}
// 搜索框的表单宽度
.search-bar {
  .el-input {
    --el-input-width: 220px;
  }

  .el-select {
    --el-select-width: 220px;
  }
}
// 自定义按钮颜色
.btn-color-purple {
  color: purple;
  opacity: 1;
  transition: opacity 0.3s;
}

.btn-color-purple:hover {
  color: purple;
  opacity: 0.5;
}
</style>
