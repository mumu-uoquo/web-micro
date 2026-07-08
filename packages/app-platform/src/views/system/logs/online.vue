<template>
  <div class="app-container">
    <div class="search-bar">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item prop="instituteId" label="所属机构">
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
        <el-form-item prop="appModuleId" label="应用平台">
          <el-select v-model="queryParams.appModuleId" placeholder="请选择" clearable>
            <el-option
              v-for="item in moduleList"
              :key="item.id"
              :label="item.moduleName"
              :value="item.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="userName" label="用户名">
          <el-input v-model="queryParams.userName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item prop="loginIp" label="登录IP">
          <el-input v-model="queryParams.loginIp" placeholder="请输入" clearable />
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
          <div></div>
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
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="instituteId" label="所属机构" width="200" show-overflow-tooltip />
        <el-table-column prop="userName" label="用户名" min-width="160" />
        <el-table-column prop="token" label="会话标识" width="180">
          <template #default="scope">
            {{ scope.row.token ? scope.row.token.substring(0, 16) : "" }}
          </template>
        </el-table-column>
        <el-table-column prop="loginIp" label="登录IP" width="140" align="center" />
        <el-table-column prop="loginAddress" label="登录地点" width="200" show-overflow-tooltip />
        <el-table-column prop="appName" label="应用名称" width="140" />
        <el-table-column prop="appVersion" label="应用版本" width="100" align="center" />
        <el-table-column prop="createTime" label="本次登录时间" width="160" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.createTime, "YYYY-MM-DD HH:mm:ss") }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="loginTime" label="最近刷新时间" width="160" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.loginTime, "YYYY-MM-DD HH:mm:ss") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="详情">
              <el-button
                link
                size="small"
                type="warning"
                :icon="Document"
                @click="handleOpenInfoViewDrawer(row)"
              />
            </el-tooltip>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`确定踢出【${row.userName}】吗？`"
              width="160"
              @confirm="handleKickOut(row)"
            >
              <template #reference>
                <el-button link size="small" type="danger">
                  <el-icon><Aim /></el-icon>
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

    <OnlineInfo ref="viewFormRef" @on-kick-out="handleKickOut" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Aim,
  Search,
  CircleClose,
  Document,
  Refresh,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import { useUserStore, useReturnCodeStore } from "@/stores";
import { formatDate } from "@/utils/format";
import AdminLogsAPI, { type OnlineUserSearchParam, type LogUserOnlineDto } from "@/api/adminLogs";
import AdminInstituteAPI, {
  type InstituteInfoDto,
  type InstituteListParam,
} from "@/api/adminInstitute";
import ModuleAPI, { type ModuleInfoDto } from "@/api/module";
import OnlineInfo from "./components/OnlineInfo.vue";

/* ***************************** 搜索表单 ********************************* */
const queryFormRef = ref(ElForm);
const queryParams = reactive<OnlineUserSearchParam>({
  pageNum: 1,
  pageSize: 10,
  userName: "",
  loginIp: "",
  appModuleId: "",
  instituteId: "",
});

/**
 * 自动加载：机构列表
 */
const defaultInstitute = ref<InstituteInfoDto>({ id: "", instituteName: "" });
const instituteList = ref<InstituteInfoDto[]>([]);
const moduleList = ref<ModuleInfoDto[]>([]);
function autoCompleteInstitute(keyword: string) {
  if (!keyword || keyword === "") {
    instituteList.value = [defaultInstitute.value];
    return;
  }
  const param = { pageNum: 1, pageSize: 10, instituteName: keyword } as InstituteListParam;
  AdminInstituteAPI.listInstituteByAbbr(param).then((data) => {
    instituteList.value = data;
  });
}

/**
 * 提交查询
 */
function handleSubmitQuery() {
  queryParams.pageNum = 1;
  handleQuery();
}

/**
 * 重置查询
 */
function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.pageNum = 1;
  handleQuery();
}

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref<string>("auto");
const tableDataTotal = ref<number>(0);
const tableData = ref<LogUserOnlineDto[]>([]);

/**
 * 分页变更：页码变更
 */
function handlePagNumChange(val: number) {
  queryParams.pageNum = val;
}

/**
 * 分页变更：每页条数变更
 */
function handlePagSizeChange(val: number) {
  queryParams.pageNum = 1;
  queryParams.pageSize = val;
}

/**
 * 数据查询
 */
function handleQuery() {
  tableLoading.value = true;
  AdminLogsAPI.onlineList(queryParams)
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
 * 展示：详情窗口
 */
const viewFormRef = ref(OnlineInfo);
function handleOpenInfoViewDrawer(row: LogUserOnlineDto) {
  // console.log("handleOpenInfoViewDrawer", row);
  viewFormRef.value.openDialog(row);
}

/**
 * 操作：踢出在线用户
 */
function handleKickOut(row: LogUserOnlineDto) {
  AdminLogsAPI.onlineKickOut({ id: row.id }).then(() => {
    ElMessage.success("踢出成功");
    handleQuery();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */

defineOptions({ name: "system-logs_line", inheritAttrs: false });

onMounted(() => {
  const tableHeight = Math.max(200, window.innerHeight - 320);
  tableMaxHeight.value = `${tableHeight}px`;
  useUserStore()
    .getUserInfo()
    .then((user) => {
      defaultInstitute.value = {
        id: user.instituteId,
        instituteName: user.instituteName,
      } as InstituteInfoDto;
      instituteList.value = [defaultInstitute.value];
    });
  ModuleAPI.listModuleByRoot().then((data) => {
    moduleList.value = data || [];
  });
  useReturnCodeStore().loadReturnCode();
  handleQuery();
});
</script>

<style lang="scss" scoped>
.table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.search-bar {
  .el-input {
    --el-input-width: 160px;
  }

  .el-select {
    --el-select-width: 160px;
  }
}
</style>
