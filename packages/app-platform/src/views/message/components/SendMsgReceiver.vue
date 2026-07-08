<template>
  <div class="app-container">
    <el-card shadow="never" class="table-container">
      <el-table
        v-loading="tableLoading"
        :data="tableDataList"
        :max-height="tableMaxHeight"
        style="width: 100%"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="receiverName" label="收件人" width="120" align="center" />
        <el-table-column
          prop="createTime"
          label="送达时间"
          width="160"
          align="center"
          :formatter="(row) => formatDate(row.createTime, 'YYYY-MM-DD HH:mm:ss')"
        />
        <el-table-column
          prop="readTime"
          label="阅览时间"
          width="160"
          align="center"
          :formatter="(row) => formatDate(row.readTime, 'YYYY-MM-DD HH:mm:ss')"
        />
        <el-table-column
          prop="processedTime"
          label="处理时间"
          width="160"
          align="center"
          :formatter="(row) => formatDate(row.processedTime, 'YYYY-MM-DD HH:mm:ss')"
        />
        <el-table-column
          prop="processedResult"
          label="处理结果"
          min-width="100"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="60" align="center" fixed="right">
          <template #default="scope">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { formatDate } from "@/utils/format";
import { Delete, WarnTriangleFilled } from "@element-plus/icons-vue";
import { MsgInfoListParam, PageResultMsgReceiverDto, MsgReceiverDto } from "@/api/message";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-delete", "on-query"]);
// 暴露给父级的自定义属性
const props = defineProps({
  messageId: {
    type: String,
    required: true,
  },
  tableData: {
    type: Object as PropType<PageResultMsgReceiverDto>,
    default: () => ({
      total: 0,
      result: [],
    }),
  },
});

/* ***************************** 搜索表单 ********************************* */
const queryParams = reactive<MsgInfoListParam>({
  pageNum: 1,
  pageSize: 10,
  messageId: "",
});

/**
 * 重置查询
 */
function handleResetQuery() {
  queryParams.pageNum = 1;
  queryParams.messageId = props.messageId;
  handleQuery();
}

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableDataTotal = ref<number>(0);
const tableDataList = ref<MsgReceiverDto[]>([]);

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
  if (!queryParams.messageId) {
    return;
  }
  // console.log("handleQuery", queryParams);
  tableLoading.value = true;
  try {
    emits("on-query", queryParams);
  } finally {
    tableLoading.value = false;
  }
}

/* ***************************** 其他操作 ********************************* */

/**
 * 操作：删除
 */
function handleDelete(row: MsgReceiverDto) {
  // console.log("handleDelete", row);
  emits("on-delete", row);
  handleQuery();
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 * https://cn.vuejs.org/api/reactivity-core.html#watch
 */
watch(
  () => props.messageId,
  () => {
    if (props.messageId) {
      // console.log("watchEffect props.messageId", props.messageId);
      handleResetQuery();
    }
  },
  {
    immediate: true,
  }
);
watch(
  () => props.tableData,
  () => {
    // console.log("watchEffect props.tableData", props.tableData);
    tableDataTotal.value = props.tableData?.total || 0;
    tableDataList.value = props.tableData?.result || [];
  },
  {
    immediate: true,
  }
);
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const tableHeight = Math.max(200, window.innerHeight - 320);
  tableMaxHeight.value = `${tableHeight}px`;

  // 由 props.messageId 的监听器触发查询
  // handleQuery();
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
