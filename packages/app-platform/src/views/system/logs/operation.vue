<template>
  <div class="app-container">
    <div class="search-bar">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item prop="businessType" label="业务类型">
          <el-select
            v-model="queryParams.businessType"
            placeholder="请选择"
            clearable
            @change="handleBusinessTypeSelect"
          >
            <el-option
              v-for="item in businessTypeList"
              :key="item.dicCode"
              :label="item.dicValue"
              :value="item.dicCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="businessSubType" label="业务子类">
          <el-input
            v-model="queryParams.businessSubType"
            :disabled="!queryParams.businessType"
            placeholder="精确匹配"
            clearable
          />
        </el-form-item>
        <el-form-item prop="businessInstituteId" label="数据机构">
          <el-select
            v-model="queryParams.businessInstituteId"
            placeholder="请选择数据的机构"
            value-key="id"
            filterable
            clearable
            remote
            remote-show-suffix
            :remote-method="autoCompleteInstitute"
            @change="handleInstituteSelect"
          >
            <el-option
              v-for="item in instituteList"
              :key="item.id"
              :label="item.instituteName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="businessId" label="数据ID">
          <el-input v-model="queryParams.businessId" placeholder="精确匹配" clearable />
        </el-form-item>
        <el-form-item prop="operationType" label="操作类型">
          <el-select v-model="queryParams.operationType" placeholder="请选择" filterable clearable>
            <el-option
              v-for="item in operationTypeList"
              :key="item.dicCode"
              :label="item.dicValue"
              :value="item.dicCode"
            />
          </el-select>
        </el-form-item>

        <el-form-item prop="userId" label="操作人">
          <el-select
            v-model="queryParams.operatorId"
            placeholder="请输入用户名"
            value-key="id"
            filterable
            clearable
            remote
            remote-show-suffix
            :remote-method="autoCompleteUsers"
            @change="handleUserSelect"
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
        <el-form-item prop="token" label="会话标识">
          <el-input
            v-model="queryParams.token"
            :disabled="!queryParams.operatorId"
            placeholder="精确匹配"
            clearable
          />
        </el-form-item>
        <el-form-item label="操作时间">
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
        <el-table-column prop="businessType" label="业务类型" width="100" align="center">
          <template #default="{ row }">
            <DictTag :code="row.businessType" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="businessSubType" label="业务子类" width="100" align="center" />
        <el-table-column prop="operationType" label="操作类型" width="100" align="center">
          <template #default="{ row }">
            <DictTag :code="row.operationType" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="businessId" label="业务数据" width="180" />
        <el-table-column prop="operationDesc" label="操作描述" show-overflow-tooltip />
        <el-table-column prop="operationStatus" label="操作结果" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ parseReturnCode(row.operationStatus) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="140" />
        <el-table-column prop="operationTime" label="操作时间" width="170" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.operationTime, "YYYY-MM-DD HH:mm:ss") }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="retryCount" label="重推次数" width="90" align="center" />
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
              :title="`确定重推吗？`"
              @confirm="handleRetryEvent(row)"
            >
              <template #reference>
                <el-button link size="small" type="danger">
                  <el-icon><Promotion /></el-icon>
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

    <OperationInfo ref="viewFormRef" @on-retry-event="handleRetryEvent" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  Search,
  CircleClose,
  Document,
  Refresh,
  Promotion,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import { parseReturnCode } from "@/utils/common";
import { formatDate } from "@/utils/format";
import { useDictStore, useReturnCodeStore } from "@/stores";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import AdminLogsAPI, {
  type BizEventRecordSearchParam,
  type BizEventRecordDto,
} from "@/api/adminLogs";
import AdminUserAPI, { type UserListParam, type UserInfoDto } from "@/api/adminUser";
import AdminInstituteAPI, { InstituteListParam, InstituteInfoDto } from "@/api/adminInstitute";
import DatePicker from "@/components/DatePicker/index.vue";
import DictTag from "@/components/DictTag/index.vue";
import OperationInfo from "./components/OperationInfo.vue";

/* ***************************** 日期选择 ********************************* */
const dateRangeVal = ref<[Date, Date] | []>();

/**
 * 日期选中后
 */
function handleDateRangeChange(_val: [Date, Date]) {
  if (dateRangeVal.value && dateRangeVal.value.length > 0) {
    queryParams.operationTimeStart = String(dateRangeVal.value[0]?.getTime());
    queryParams.operationTimeEnd = String(dateRangeVal.value[1]?.getTime());
  } else {
    queryParams.operationTimeStart = "";
    queryParams.operationTimeEnd = "";
  }
}

/* ***************************** 搜索表单 ********************************* */
const queryFormRef = ref(ElForm);
const dictStore = useDictStore();
const operationTypeList = dictStore.listDictionary(DictionaryEnum.OPERATION_TYPE);
const businessTypeList = dictStore.listDictionary(DictionaryEnum.BUSINESS_TYPE);

const queryParams = reactive<BizEventRecordSearchParam>({
  pageNum: 1,
  pageSize: 10,
  businessId: "",
  businessInstituteId: "",
  businessType: "",
  businessSubType: "",
  operatorId: "",
  operationType: "",
  operationTimeStart: "",
  operationTimeEnd: "",
  token: "",
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
function handleUserSelect(_data: string) {
  // 切换操作人时，清空会话标识
  queryParams.token = "";
}

/**
 * 自动加载：机构列表（默认显示自己机构）
 */
const instituteList = ref<InstituteInfoDto[]>([]);
function autoCompleteInstitute(keyword: string) {
  if (!keyword || keyword == "") {
    return;
  }
  const param = { pageNum: 1, pageSize: 10, instituteName: keyword } as InstituteListParam;
  AdminInstituteAPI.listInstituteByAbbr(param).then((data) => {
    if (data.length > 0) {
      instituteList.value = data;
    }
  });
}
function handleInstituteSelect(data: string) {
  console.log("handleInstituteSelect", data);
}

/**
 * 切换业务类型时，清空子类
 */
function handleBusinessTypeSelect() {
  queryParams.businessSubType = "";
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
  queryParams.operationTimeStart = "";
  queryParams.operationTimeEnd = "";
  queryParams.pageNum = 1;
  handleQuery();
}

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref<string>("auto");
const tableDataTotal = ref<number>(0);
const tableData = ref<BizEventRecordDto[]>([]);

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
  AdminLogsAPI.listEventRecords(queryParams)
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
const viewFormRef = ref(OperationInfo);
function handleOpenInfoViewDrawer(row: BizEventRecordDto) {
  // console.log("handleOpenInfoViewDrawer", row);
  viewFormRef.value.openDialog(row);
}

/**
 * 操作：重发事件
 */
function handleRetryEvent(row: BizEventRecordDto) {
  AdminLogsAPI.retryEvent({ id: row.id }).then(() => {
    ElMessage.success("重推成功");
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */

defineOptions({ name: "system-logs_opera", inheritAttrs: false });

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
