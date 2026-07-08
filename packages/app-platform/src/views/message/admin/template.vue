<template>
  <div class="app-container">
    <div class="search-bar">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item prop="templateName" label="名称">
          <el-input v-model="queryParams.templateName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item prop="templateCode" label="编码">
          <el-input v-model="queryParams.templateCode" placeholder="请输入" clearable />
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
        <el-form-item label="创建时间">
          <DatePicker
            v-model="dateRangeVal"
            type="daterange"
            width="260px"
            @on-change="handleDateRangeChange"
          />
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
        <el-form-item prop="pushWay" label="推送方式">
          <el-select v-model="queryParams.pushWay" placeholder="请选择" clearable>
            <el-option
              v-for="item in pushWayList"
              :key="item.dicCode"
              :label="item.dicValue"
              :value="item.dicCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="defaulted" label="是否默认">
          <el-select v-model="queryParams.defaulted" placeholder="请选择" clearable>
            <el-option label="是" value="true"></el-option>
            <el-option label="否" value="false"></el-option>
          </el-select>
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
                <el-checkbox v-model="cols.templateName" value="true" label="名称" />
                <el-checkbox v-model="cols.templateCode" value="true" label="编码" />
                <el-checkbox v-model="cols.titleTemplate" value="true" label="标题" />
                <el-checkbox v-model="cols.messageType" value="true" label="分类" />
                <el-checkbox v-model="cols.pushWay" value="true" label="推送方式" />
                <el-checkbox v-model="cols.defaulted" value="true" label="是否默认" />
                <el-checkbox v-model="cols.status" value="true" label="状态" />
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
          v-if="cols.templateName"
          prop="templateName"
          label="名称"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="cols.templateCode"
          prop="templateCode"
          label="编码"
          width="160"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="cols.titleTemplate"
          prop="titleTemplate"
          label="标题"
          show-overflow-tooltip
        />
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
          v-if="cols.pushWay"
          prop="pushWay"
          label="推送方式"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <DictTag :code="row.pushWay" />
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.defaulted"
          prop="defaulted"
          label="默认"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-tag v-if="row.defaulted" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="cols.status" prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-text="可用"
              inactive-text="禁用"
              :active-value="DictionaryEnum.STATE_NORMAL"
              :inactive-value="DictionaryEnum.STATE_DISABLE"
              :disabled="scope.row.isSystemTemplate"
              :style="`--el-switch-on-color: #409EFF; --el-switch-off-color: ${scope.row.isSystemTemplate ? 'rgb(242.5, 208.5, 157.5)' : 'rgb(237.5, 189.9, 118.5)'} `"
              inline-prompt
              @change="handleChangeState(scope.$index, scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.createTime"
          prop="createTime"
          label="创建时间"
          width="160"
          align="center"
          :formatter="(row) => formatDate(row.createTime, 'YYYY-MM-DD HH:mm:ss')"
        />
        <el-table-column label="操作" width="100" align="center" fixed="right">
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

    <MsgTempateInfoForm ref="infoFormRef" @on-submit="handleQuery" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useDictStore } from "@/stores";
import { formatDate } from "@/utils/format";
import {
  Plus,
  Edit,
  Delete,
  Search,
  CircleClose,
  Refresh,
  Operation,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import MessageAPI, {
  MsgTemplateListParam,
  MsgTemplateDto,
  MsgTemplateStatusParam,
} from "@/api/message";
import DatePicker from "@/components/DatePicker/index.vue";
import DictTag from "@/components/DictTag/index.vue";
import MsgTempateInfoForm from "./components/MsgTempateInfoForm.vue";

/* ***************************** 参数定义 ********************************* */
const dictStore = useDictStore();
// 表格显示的列
const cols = ref({
  index: true,
  templateName: true,
  templateCode: true,
  titleTemplate: true,
  messageType: true,
  pushWay: true,
  defaulted: true,
  status: true,
  createTime: true,
});

/* ***************************** 日期选择 ********************************* */
// 选择的日期
const dateRangeVal = ref<[Date, Date]>();
/**
 * 日期选中后
 */
function handleDateRangeChange(_val: [Date, Date]) {
  // console.log("handleDateRangeChange", dateRangeVal.value, val);
  if (dateRangeVal.value && dateRangeVal.value.length > 0) {
    queryParams.createTimeStart = String(dateRangeVal.value[0].getTime());
    queryParams.createTimeEnd = String(dateRangeVal.value[1].getTime());
  } else {
    queryParams.createTimeStart = "";
    queryParams.createTimeEnd = "";
  }
}

/* ***************************** 搜索表单 ********************************* */
const queryFormRef = ref(ElForm);
const queryParams = reactive<MsgTemplateListParam>({
  pageNum: 1,
  pageSize: 10,
  createTimeStart: "",
  createTimeEnd: "",
});
const statusList = dictStore.listDictionary(DictionaryEnum.STATE);
const messageTypeList = dictStore.listDictionary(DictionaryEnum.MESSAGE_CATEGORY);
const pushWayList = dictStore.listDictionary(DictionaryEnum.PUSH_WAY);

/**
 * 重置查询
 */
function handleResetQuery() {
  queryFormRef.value.resetFields();
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
const tableData = ref<MsgTemplateDto[]>([]);

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
  MessageAPI.listTemplateByPage(queryParams)
    .then((data) => {
      tableDataTotal.value = data.total || 0;
      tableData.value = data.result || [];
    })
    .finally(() => {
      tableLoading.value = false;
    });
}

/**
 * 变更：可用状态
 * change事件：传入的是变更后的值
 */
function handleChangeState(index: number, row: MsgTemplateDto) {
  const param = { id: row.id, status: row.status } as MsgTemplateStatusParam;
  MessageAPI.updateTemplateState(param)
    .then((_data) => {
      ElMessage.success("状态变更成功");
    })
    .catch((_e) => {
      const oldStatus =
        DictionaryEnum.STATE_NORMAL == row.status
          ? DictionaryEnum.STATE_DISABLE
          : DictionaryEnum.STATE_NORMAL;
      tableData.value[index].status = oldStatus; // 还原变更前的值
    });
}

/* ***************************** 其他操作 ********************************* */
/**
 * 展示：新增弹窗
 */
const infoFormRef = ref(MsgTempateInfoForm);
function handleOpenInfoAddDialog() {
  // console.log("handleOpenInfoAddDialog");
  infoFormRef.value.openAddDialog();
}
/**
 * 展示：编辑弹窗
 */
function handleOpenInfoEditDialog(row: MsgTemplateDto) {
  // console.log("handleOpenInfoEditDialog", row);
  infoFormRef.value.openEditDialog(row);
}

/**
 * 操作：删除
 */
function handleDelete(row: MsgTemplateDto) {
  // console.log("handleDelete", row);
  MessageAPI.deleteTemplateInfo({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    handleQuery();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "message-admin_tpl",
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
</style>
