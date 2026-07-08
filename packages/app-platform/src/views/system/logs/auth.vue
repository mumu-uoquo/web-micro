<template>
  <div class="app-container">
    <div class="search-bar">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item prop="userId" label="用户名称">
          <el-select
            v-model="queryParams.userId"
            placeholder="请输入用户名"
            value-key="id"
            filterable
            clearable
            remote
            remote-show-suffix
            :remote-method="autoCompleteUsers"
          >
            <el-option
              v-for="item in userList"
              :key="item.id"
              :label="item.userName"
              :value="item.id"
            >
              {{ item.userName }}（{{ item.phone }}）
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="loginIp" label="IP地址">
          <el-input v-model="queryParams.loginIp" placeholder="模糊匹配" clearable />
        </el-form-item>
        <el-form-item prop="loginStatus" label="登录状态">
          <el-select v-model="queryParams.loginStatus" placeholder="请选择" clearable>
            <el-option
              v-for="item in loginStatusList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="登录时间">
          <DatePicker
            v-model="dateRangeVal"
            type="daterange"
            width="260px"
            @on-change="handleDateRangeChange"
          />
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
        <el-table-column prop="userName" label="用户名" width="140" />
        <el-table-column prop="token" label="会话标识" width="180" />
        <el-table-column prop="loginIp" label="登录IP" width="140" align="center" />
        <el-table-column prop="loginAddress" label="登录地点" show-overflow-tooltip />
        <el-table-column prop="loginStatus" label="登录状态" width="120" align="center">
          <template #default="{ row }">
            {{ parseReturnCode(row.loginStatus) }}
          </template>
        </el-table-column>
        <el-table-column prop="appName" label="应用名称" width="140" align="center" />
        <el-table-column prop="appVersion" label="应用版本" width="100" align="center" />
        <el-table-column prop="loginTime" label="登录时间" width="170" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.loginTime, "YYYY-MM-DD HH:mm:ss") }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="logoutTime" label="退出时间" width="170" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.logoutTime, "YYYY-MM-DD HH:mm:ss") }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" align="center" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="详情">
              <el-button
                link
                size="small"
                type="warning"
                :icon="Document"
                @click="handleOpenDetail(row)"
              />
            </el-tooltip>
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

    <!-- 详情弹窗 -->
    <AuthInfo ref="viewFormRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Search, CircleClose, Document, Refresh } from "@element-plus/icons-vue";
import { parseReturnCode } from "@/utils/common";
import { formatDate } from "@/utils/format";
import { useReturnCodeStore } from "@/stores";
import AdminLogsAPI, { type LogsAuthSearchParam, type LogUserLoginDto } from "@/api/adminLogs";
import AdminUserAPI, { type UserListParam, type UserInfoDto } from "@/api/adminUser";
import DatePicker from "@/components/DatePicker/index.vue";
import AuthInfo from "./components/AuthInfo.vue";

/* ***************************** 日期选择 ********************************* */
const dateRangeVal = ref<[Date, Date] | []>();

/**
 * 日期选中后
 */
function handleDateRangeChange(_val: [Date, Date]) {
  if (dateRangeVal.value && dateRangeVal.value.length > 0) {
    queryParams.loginTimeStart = String(dateRangeVal.value[0]?.getTime());
    queryParams.loginTimeEnd = String(dateRangeVal.value[1]?.getTime());
  } else {
    queryParams.loginTimeStart = "";
    queryParams.loginTimeEnd = "";
  }
}

/* ***************************** 搜索表单 ********************************* */
const queryFormRef = ref(ElForm);
const loginStatusList = ref([
  {
    value: "00000",
    label: "登录成功",
  },
  {
    value: "21004",
    label: "用户不存在",
  },
  {
    value: "21011",
    label: "账号密码错误",
  },
  {
    value: "21013",
    label: "密码错误",
  },
  {
    value: "21014",
    label: "验证码错误",
  },
  {
    value: "21020",
    label: "账户被禁用",
  },
  {
    value: "21021",
    label: "账户已删除",
  },
  {
    value: "21022",
    label: "账户被锁定",
  },
]);

const queryParams = reactive<LogsAuthSearchParam>({
  pageNum: 1,
  pageSize: 10,
  userId: "",
  loginIp: "",
  loginStatus: "",
  loginTimeStart: "",
  loginTimeEnd: "",
});

/**
 * 自动加载：用户列表
 */
const userList = ref<UserInfoDto[]>([]);
function autoCompleteUsers(keyword: string) {
  if (!keyword || keyword == "") {
    return;
  }
  const param = { pageNum: 1, pageSize: 10, userName: keyword } as UserListParam;
  AdminUserAPI.listUserByAbbr(param).then((data) => {
    if (data.length > 0) {
      userList.value = data;
    }
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
  dateRangeVal.value = [];
  queryParams.loginTimeStart = "";
  queryParams.loginTimeEnd = "";
  queryParams.pageNum = 1;
  handleQuery();
}

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref<string>("auto");
const tableDataTotal = ref<number>(0);
const tableData = ref<LogUserLoginDto[]>([]);

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
  AdminLogsAPI.logsByAuthList(queryParams)
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
const viewFormRef = ref(AuthInfo);
function handleOpenDetail(row: LogUserLoginDto) {
  // console.log("handleOpenInfoViewDrawer", row);
  viewFormRef.value.openDialog(row);
}

/* ***************************** 监听器等（需放在最后） ********************************* */

defineOptions({ name: "system-logs_auth", inheritAttrs: false });

onMounted(() => {
  const tableHeight = Math.max(200, window.innerHeight - 320);
  tableMaxHeight.value = `${tableHeight}px`;
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
