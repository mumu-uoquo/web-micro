<template>
  <el-drawer v-model="dialogVisible" size="50%" :with-header="false" @close="handleCloseDialog">
    <el-tabs tab-position="top">
      <el-tab-pane label="详情明细">
        <el-container>
          <el-main>
            <el-descriptions label-width="100px" :column="2" border>
              <el-descriptions-item label="业务数据" label-align="right" :span="2">
                <el-tag>
                  {{ parseDictCode(infoFormData.businessType) }}
                  <span v-if="infoFormData.businessSubType">
                    ({{ infoFormData.businessSubType }})
                  </span>
                </el-tag>
                {{ infoFormData.businessId }}
              </el-descriptions-item>

              <el-descriptions-item label="所属机构" label-align="right">
                {{ infoFormData.businessInstituteId }}
              </el-descriptions-item>
              <el-descriptions-item label="会话标识" label-align="right">
                {{ infoFormData.token }}
              </el-descriptions-item>

              <el-descriptions-item label="操作类型" label-align="right">
                <DictTag :code="infoFormData.operationType" />
              </el-descriptions-item>
              <el-descriptions-item label="请求标识" label-align="right">
                {{ infoFormData.traceId }}
              </el-descriptions-item>

              <el-descriptions-item label="初始操作" label-align="right" :span="2">
                {{ formatDate(infoFormData.operationTime, "YYYY-MM-DD HH:mm:ss") }}
                <el-tag>{{ infoFormData.operatorName }}</el-tag>
                {{ parseReturnCode(infoFormData.operationStatus) }}
              </el-descriptions-item>

              <el-descriptions-item label="最后重推" label-align="right" :span="2">
                {{ formatDate(infoFormData.retryTime, "YYYY-MM-DD HH:mm:ss") }}
                <el-tag v-if="infoFormData.retryOperatorName">
                  {{ infoFormData.retryOperatorName }}
                </el-tag>
              </el-descriptions-item>

              <el-descriptions-item label="备注说明" label-align="right" :span="2">
                {{ infoFormData.description }}
              </el-descriptions-item>

              <el-descriptions-item label="操作描述" label-align="right" :span="2">
                {{ infoFormData.operationDesc }}
              </el-descriptions-item>

              <el-descriptions-item label="操作内容" label-align="right" :span="2">
                <el-descriptions label-width="100px" :column="1" size="small" border>
                  <el-descriptions-item
                    v-for="(value, key) in infoFormData.operationContent"
                    :key="key"
                    :label="key"
                    label-align="right"
                    label-class-name="label-no-background"
                  >
                    {{ value }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="changeData && changeData.length > 0">
              <el-divider>变更数据</el-divider>
              <el-table :data="changeData" style="width: 100%" size="small" border>
                <el-table-column prop="field" label="字段属性" width="180" />
                <el-table-column prop="value1" label="旧数据" />
                <el-table-column prop="value2" label="新数据" />
              </el-table>
            </div>
          </el-main>
          <el-footer>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要重推吗？`"
              width="160"
              @confirm="handleRetryEvent(infoFormData)"
            >
              <template #reference>
                <el-button type="danger" :icon="Promotion">重推</el-button>
              </template>
              <template #actions="{ confirm, cancel }">
                <el-button size="small" @click="cancel">取消</el-button>
                <el-button size="small" type="danger" @click="confirm">确定</el-button>
              </template>
            </el-popconfirm>
          </el-footer>
        </el-container>
      </el-tab-pane>

      <el-tab-pane>
        <template #label>
          <span v-if="!tableData.length">重推记录</span>
          <el-badge v-else :value="tableData.length" type="primary">重推记录</el-badge>
        </template>
        <el-table :data="tableData" style="width: 100%" border>
          <el-table-column prop="operationTime" label="重推时间" width="160" align="center">
            <template #default="{ row }">
              <span>{{ formatDate(row.operationTime, "YYYY-MM-DD HH:mm:ss") }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="140" />
          <el-table-column prop="token" label="会话标识" width="180" />
          <el-table-column prop="traceId" label="请求标识" width="180" />
          <el-table-column prop="operationStatus" label="操作结果" show-overflow-tooltip>
            <template #default="{ row }">
              {{ parseReturnCode(row.operationStatus) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { Promotion, WarnTriangleFilled } from "@element-plus/icons-vue";
import { parseReturnCode, parseDictCode } from "@/utils/common";
import { formatDate } from "@/utils/format";
import DictTag from "@/components/DictTag/index.vue";
import AdminLogsAPI, { type BizEventRetryDto, type BizEventRecordDto } from "@/api/adminLogs";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-retry-event"]);
const dialogVisible = ref<boolean>(false);
// 初始表单数据
const initialFormData = ref<BizEventRecordDto>({
  id: "",
  traceId: "",
});
const infoFormData = ref<BizEventRecordDto>({ ...initialFormData.value });
//
interface ChangeDataItem {
  field: string;
  value1?: string;
  value2?: string;
}
const changeData = ref<ChangeDataItem[]>([]);

/* ***************************** 重推记录 ********************************* */
const tableData = ref<BizEventRetryDto[]>([]);
/**
 * 数据查询
 */
function handleQuery() {
  // console.log("initialFormData.value.id", infoFormData.value.id, infoFormData.value);
  if (!infoFormData.value.id) {
    return;
  }
  AdminLogsAPI.listEventByRetry({ id: infoFormData.value.id }).then((data) => {
    tableData.value = data || [];
  });
}

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (data: BizEventRecordDto) => {
  // 最后显示弹窗
  AdminLogsAPI.getEventRecordById({ id: data.id }).then((res) => {
    if (res) {
      dialogVisible.value = true;
      Object.assign(infoFormData.value, res);
      // 处理变更数据（提取 res.changeData中的change字段）
      const tempData = (res.changeData as any)?.change;
      if (tempData) {
        if (typeof tempData === "string") {
          changeData.value = JSON.parse(tempData);
        } else {
          changeData.value = tempData;
        }
      } else {
        changeData.value = [];
      }
      // 加载日志列表
      handleQuery();
    }
  });
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  Object.assign(infoFormData.value, initialFormData.value);
}
/**
 * 操作：重发事件
 */
function handleRetryEvent(row: BizEventRecordDto) {
  emits("on-retry-event", row);
  // 加载日志列表
  handleQuery();
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
// 提示信息
.el-form-item__info {
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 2px;
  font-size: 12px;
  line-height: 1;
  color: #e6a23c;
}
// transfer面板样式
.el-transfer {
  width: 100%;

  :deep(.el-transfer-panel) {
    width: 276px;
  }
}
// 去除内嵌表格的背景色
:deep(.label-no-background) {
  background: none !important;
}
// 布局容器的footer固定到底部
.el-container {
  .el-main {
    margin-bottom: 60px;
  }

  .el-footer {
    position: fixed;
    right: 20px;
    bottom: 0;
    height: 60px;
    line-height: 60px;
  }
}
</style>
