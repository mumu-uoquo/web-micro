<template>
  <div class="app-container">
    <div class="search-bar">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item prop="messageTitle" label="标题">
          <el-input v-model="queryParams.messageTitle" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item prop="messageType" label="分类">
          <el-select v-model="queryParams.messageType" placeholder="请选择" clearable>
            <el-option
              v-for="item in messageTypeList"
              :key="item.dicCode"
              :label="item.dicValue"
              :value="item.dicCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="messageLevel" label="级别">
          <el-select v-model="queryParams.messageLevel" placeholder="请选择" clearable>
            <el-option
              v-for="item in messageLevelList"
              :key="item.dicCode"
              :label="item.dicValue"
              :value="item.dicCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="businessType" label="业务">
          <el-select v-model="queryParams.businessType" placeholder="请选择" clearable>
            <el-option
              v-for="item in businessTypeList"
              :key="item.dicCode"
              :label="item.dicValue"
              :value="item.dicCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="status" label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable>
            <el-option
              v-for="item in statusList"
              :key="item.dicCode"
              :label="item.dicValue"
              :value="item.dicCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <DatePicker
            v-model="senderDateRangeVal"
            type="daterange"
            width="260px"
            @on-change="handleSenderDateRangeChange"
          />
        </el-form-item>
        <el-form-item label="过期时间">
          <DatePicker
            v-model="expireDateRangeVal"
            type="daterange"
            width="260px"
            @on-change="handleExpireDateRangeChange"
          />
        </el-form-item>
        <el-form-item label="创建时间">
          <DatePicker
            v-model="createDateRangeVal"
            type="daterange"
            width="260px"
            @on-change="handleCreateDateRangeChange"
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
          <div>
            <el-button type="success" :icon="Plus" @click="handleOpenInfoAddDialog">新增</el-button>
          </div>
          <div>
            <el-button :icon="Refresh" circle title="刷新" @click="handleQuery()" />
            <el-popover placement="bottom" trigger="click">
              <template #reference>
                <el-button :icon="Operation" circle title="筛选列" />
              </template>
              <el-scrollbar max-height="350px">
                <el-checkbox v-model="cols.index" value="true" label="序号" />
                <el-checkbox v-model="cols.messageType" value="true" label="分类" />
                <el-checkbox v-model="cols.messageLevel" value="true" label="级别" />
                <el-checkbox v-model="cols.businessType" value="true" label="业务" />
                <el-checkbox v-model="cols.messageTitle" value="true" label="标题" />
                <el-checkbox v-model="cols.status" value="true" label="状态" />
                <el-checkbox v-model="cols.receiverRange" value="true" label="范围" />
                <el-checkbox v-model="cols.senderTime" value="true" label="发布时间" />
                <el-checkbox v-model="cols.expireTime" value="true" label="过期时间" />
                <el-checkbox v-model="cols.createTime" value="true" label="创建时间" />
              </el-scrollbar>
            </el-popover>
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
        <el-table-column v-if="cols.index" type="index" label="序号" width="60" align="center" />
        <el-table-column
          v-if="cols.messageType"
          prop="messageType"
          label="分类"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <DictTag :code="row.messageType" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.messageLevel"
          prop="messageLevel"
          label="级别"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <DictTag :code="row.messageLevel" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.businessType"
          prop="businessType"
          label="业务"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <DictTag :code="row.businessType" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.messageTitle"
          prop="messageTitle"
          label="标题"
          show-overflow-tooltip
        />

        <el-table-column v-if="cols.status" prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <DictTag :code="row.status" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.receiverRange"
          prop="receiverRange"
          label="范围"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <DictTag :code="row.receiverRange" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.senderTime"
          prop="senderTime"
          label="发布时间"
          width="120"
          align="center"
          :formatter="(row) => formatDate(row.senderTime, 'YYYY-MM-DD')"
        />
        <el-table-column
          v-if="cols.expireTime"
          prop="expireTime"
          label="过期时间"
          width="120"
          align="center"
          :formatter="(row) => formatDate(row.expireTime, 'YYYY-MM-DD')"
        />
        <el-table-column
          v-if="cols.createTime"
          prop="createTime"
          label="创建时间"
          width="160"
          align="center"
          :formatter="(row) => formatDate(row.createTime, 'YYYY-MM-DD HH:mm:ss')"
        />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-tooltip content="详情">
              <el-button
                link
                size="small"
                type="warning"
                :icon="Document"
                @click="handleOpenInfoViewDrawer(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="编辑">
              <el-button
                link
                size="small"
                type="primary"
                :icon="Edit"
                :disabled="scope.row.status !== DictionaryEnum.PUSH_STATUS_WAITING"
                @click="handleOpenInfoEditDialog(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="发布">
              <el-button
                link
                size="small"
                type="success"
                :icon="Promotion"
                :disabled="scope.row.status !== DictionaryEnum.PUSH_STATUS_WAITING"
                @click="handleOpenInfoPublishDialog(scope.row)"
              />
            </el-tooltip>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要撤回吗？`"
              width="160"
              @confirm="handleWithdraw(scope.row)"
            >
              <template #reference>
                <el-button
                  link
                  size="small"
                  type="info"
                  class="btn-color-purple"
                  :disabled="scope.row.status !== DictionaryEnum.PUSH_STATUS_PUBLISH"
                >
                  <el-icon><ToiletPaper /></el-icon>
                </el-button>
              </template>
              <template #actions="{ confirm, cancel }">
                <el-button size="small" @click="cancel">取消</el-button>
                <el-button size="small" type="danger" @click="confirm">确定</el-button>
              </template>
            </el-popconfirm>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要删除吗？`"
              width="160"
              @confirm="handleDelete(scope.row)"
            >
              <template #reference>
                <el-button link size="small" type="danger">
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

    <AdminMsgInfoView
      ref="viewFormRef"
      :default-institute="defaultInstitute"
      @on-edit="handleOpenInfoEditDialog"
      @on-publish="handleOpenInfoPublishDialog"
      @on-withdraw="handleWithdraw"
      @on-delete="handleDelete"
    />
    <AdminMsgInfoForm
      ref="infoFormRef"
      :default-institute="defaultInstitute"
      @on-submit="handleEdit"
    />
    <AdminMsgInfoPublishForm
      ref="publishFormRef"
      :default-institute="defaultInstitute"
      @on-submit="handlePublish"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useUserStore, useDictStore } from "@/stores";
import { formatDate } from "@/utils/format";
import {
  Plus,
  Edit,
  Delete,
  Document,
  Promotion,
  ToiletPaper,
  Search,
  CircleClose,
  Refresh,
  Operation,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import AdminMessageAPI, { MsgInfoListParam, MsgInfoDto } from "@/api/adminMessage";
import { InstituteInfoDto } from "@/api/adminInstitute";
import DatePicker from "@/components/DatePicker/index.vue";
import DictTag from "@/components/DictTag/index.vue";
import AdminMsgInfoView from "./components/AdminMsgInfoView.vue";
import AdminMsgInfoForm from "./components/AdminMsgInfoForm.vue";
import AdminMsgInfoPublishForm from "./components/AdminMsgInfoPublishForm.vue";

/* ***************************** 参数定义 ********************************* */
const dictStore = useDictStore();
// 表格显示的列
const cols = ref({
  index: true,
  messageType: true,
  messageLevel: true,
  businessType: true,
  messageTitle: true,
  status: true,
  receiverRange: true,
  senderTime: true,
  expireTime: true,
  createTime: true,
});

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
/* ***************************** 日期选择 ********************************* */
/**
 * 日期选中后：创建日期
 */
const createDateRangeVal = ref<[Date, Date]>();
function handleCreateDateRangeChange(_val: [Date, Date]) {
  // console.log("handleDateRangeChange", dateRangeVal.value, val);
  if (createDateRangeVal.value && createDateRangeVal.value.length > 0) {
    queryParams.createTimeStart = String(createDateRangeVal.value[0].getTime());
    queryParams.createTimeEnd = String(createDateRangeVal.value[1].getTime());
  } else {
    queryParams.createTimeStart = "";
    queryParams.createTimeEnd = "";
  }
}
/**
 * 日期选中后：发布日期
 */
const senderDateRangeVal = ref<[Date, Date]>();
function handleSenderDateRangeChange(_val: [Date, Date]) {
  // console.log("handleDateRangeChange", dateRangeVal.value, val);
  if (senderDateRangeVal.value && senderDateRangeVal.value.length > 0) {
    queryParams.senderTimeStart = String(senderDateRangeVal.value[0].getTime());
    queryParams.senderTimeEnd = String(senderDateRangeVal.value[1].getTime());
  } else {
    queryParams.senderTimeStart = "";
    queryParams.senderTimeEnd = "";
  }
}
/**
 * 日期选中后：过期日期
 */
const expireDateRangeVal = ref<[Date, Date]>();
function handleExpireDateRangeChange(_val: [Date, Date]) {
  // console.log("handleDateRangeChange", dateRangeVal.value, val);
  if (expireDateRangeVal.value && expireDateRangeVal.value.length > 0) {
    queryParams.expireTimeStart = String(expireDateRangeVal.value[0].getTime());
    queryParams.expireTimeEnd = String(expireDateRangeVal.value[1].getTime());
  } else {
    queryParams.expireTimeStart = "";
    queryParams.expireTimeEnd = "";
  }
}

/* ***************************** 搜索表单 ********************************* */
const queryFormRef = ref(ElForm);
const queryParams = reactive<MsgInfoListParam>({
  pageNum: 1,
  pageSize: 10,
  senderTimeStart: "",
  senderTimeEnd: "",
  expireTimeStart: "",
  expireTimeEnd: "",
  createTimeStart: "",
  createTimeEnd: "",
});
const statusList = dictStore.listDictionary(DictionaryEnum.PUSH_STATUS);
const messageTypeList = dictStore.listDictionary(DictionaryEnum.MESSAGE_CATEGORY);
const messageLevelList = dictStore.listDictionary(DictionaryEnum.PRIOR_LEVEL);
const businessTypeList = dictStore.listDictionary(DictionaryEnum.BUSINESS_TYPE);

/**
 * 重置查询
 */
function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.senderTimeStart = "";
  queryParams.senderTimeEnd = "";
  queryParams.expireTimeStart = "";
  queryParams.expireTimeEnd = "";
  queryParams.createTimeStart = "";
  queryParams.createTimeEnd = "";
  queryParams.pageNum = 1;
  handleQuery();
}

/**
 * 提交查询
 */
function handleSubmitQuery() {
  // console.log("提交查询", queryParams);
  queryParams.pageNum = 1;
  handleQuery();
}

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableDataTotal = ref<number>(0);
const tableData = ref<MsgInfoDto[]>([]);

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
  // console.log("handleQuery", queryParams, cols);
  tableLoading.value = true;
  AdminMessageAPI.listMessageInfoByPage(queryParams)
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
const viewFormRef = ref(AdminMsgInfoView);
function handleOpenInfoViewDrawer(row: MsgInfoDto) {
  // console.log("handleOpenInfoViewDrawer", row);
  AdminMessageAPI.getMessage({ id: row.id }).then((data) => {
    viewFormRef.value.openDialog(data);
  });
}
/**
 * 展示：新增弹窗
 */
const infoFormRef = ref(AdminMsgInfoForm);
function handleOpenInfoAddDialog() {
  // console.log("handleOpenInfoAddDialog");
  infoFormRef.value.openAddDialog();
}
/**
 * 展示：编辑弹窗（未发布的）
 */
function handleOpenInfoEditDialog(row: MsgInfoDto) {
  // console.log("handleOpenInfoEditDialog", row);
  AdminMessageAPI.getMessage({ id: row.id }).then((data) => {
    infoFormRef.value.openEditDialog(data);
  });
}
/**
 * 展示：发布弹窗（未发布的）
 */
const publishFormRef = ref(AdminMsgInfoPublishForm);
function handleOpenInfoPublishDialog(row: MsgInfoDto) {
  // console.log("handleOpenInfoPublishDialog", row);
  AdminMessageAPI.getMessage({ id: row.id }).then((data) => {
    publishFormRef.value.openDialog(data);
  });
}
/**
 * 操作：编辑（未发布的）
 */
function handleEdit(row: MsgInfoDto) {
  handleQuery();
  viewFormRef.value.refreshData(row.id);
}
/**
 * 操作：发布（未发布的）
 */
function handlePublish(row: MsgInfoDto) {
  handleQuery();
  viewFormRef.value.refreshData(row.id);
}
/**
 * 操作：撤回（已发布的）
 */
function handleWithdraw(row: MsgInfoDto) {
  // console.log("handleDelete", row);
  AdminMessageAPI.withdrawMessage({ id: row.id }).then((_data) => {
    ElMessage.success("撤回成功");
    handleQuery();
    viewFormRef.value.refreshData(row.id);
  });
}

/**
 * 操作：删除
 */
function handleDelete(row: MsgInfoDto) {
  // console.log("handleDelete", row);
  AdminMessageAPI.deleteMessage({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    handleQuery();
    viewFormRef.value.closeDialog();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "message-admin_list",
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
    --el-input-width: 160px;
  }

  .el-select {
    --el-select-width: 160px;
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
