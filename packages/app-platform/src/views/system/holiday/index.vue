<template>
  <div class="app-container">
    <el-card shadow="never" class="table-container">
      <template #header>
        <div class="flex-x-between">
          <div>
            <el-button type="success" :icon="Plus" @click="handleOpenInfoAddDialog">
              批量添加
            </el-button>
          </div>
          <div>
            <el-date-picker
              v-model="startDate"
              type="year"
              placeholder="请选择年份"
              style="width: 120px"
              @change="handleQuery"
            >
              <template #default="cell">
                <div class="el-date-table-cell" :class="{ current: cell.isCurrent }">
                  <span class="el-date-table-cell__text">{{ cell.text }}年</span>
                </div>
              </template>
            </el-date-picker>
            <el-button
              :icon="Refresh"
              circle
              title="刷新"
              style="margin-left: 12px"
              @click="handleQuery()"
            />
          </div>
        </div>
      </template>

      <HolidayList
        :data="tableData"
        :loading="tableLoading"
        :height="tableMaxHeight"
        :max-height="tableMaxHeight"
        @on-add="handleOnSave"
        @on-edit="handleOnUpdate"
        @on-delete="handleOnDelete"
      />
    </el-card>

    <HolidayForm ref="infoFormRef" @on-submit="handleQuery" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Refresh } from "@element-plus/icons-vue";
import SystemAPI, { SysHolidaySearchParam, SysHolidayInfoParam, SysHolidayDto } from "@/api/system";
import HolidayList from "./components/HolidayList.vue";
import HolidayForm from "./components/HolidayForm.vue";

/* ***************************** 搜索表单 ********************************* */
const startDate = ref<Date>();
const queryParams = reactive<SysHolidaySearchParam>({
  startDate: "",
  endDate: "",
});

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableData = ref<SysHolidayDto[]>([]);

/**
 * 数据查询
 */
function handleQuery() {
  // console.log("handleQuery", queryParams);
  tableLoading.value = true;
  if (startDate.value) {
    queryParams.startDate = String(startDate.value.getTime());
  } else {
    queryParams.startDate = "";
  }
  SystemAPI.listHoliday(queryParams)
    .then((data) => {
      tableData.value = data || [];
    })
    .finally(() => {
      tableLoading.value = false;
    });
}

/* ***************************** 其他操作 ********************************* */
/**
 * 展示：新增弹窗
 */
const infoFormRef = ref(HolidayForm);
function handleOpenInfoAddDialog() {
  infoFormRef.value.openDialog();
}

/**
 * 操作：新增保存
 */
function handleOnSave(row: SysHolidayDto) {
  // console.log("handleOnSave", row);
  const params: SysHolidayInfoParam = {
    dateType: row.dateType,
    dateValue: row.dateValue,
    description: row.description,
  };
  SystemAPI.addHolidayInfo(params).then((_data) => {
    ElMessage.success("新增成功");
    handleQuery();
  });
}
/**
 * 操作：修改保存
 */
function handleOnUpdate(row: SysHolidayDto) {
  // console.log("handleOnUpdate", row);
  const params: SysHolidayInfoParam = {
    id: row.id,
    dateType: row.dateType,
    dateValue: row.dateValue,
    description: row.description,
  };
  SystemAPI.updateHolidayInfo(params).then((_data) => {
    ElMessage.success("修改成功");
    handleQuery();
  });
}
/**
 * 操作：删除保存
 */
function handleOnDelete(row: SysHolidayDto) {
  // console.log("handleOnDelete", row);
  SystemAPI.deleteHolidayInfo({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    handleQuery();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "system-holiday",
  inheritAttrs: false,
});
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const tableHeight = Math.max(200, window.innerHeight - 212);
  tableMaxHeight.value = `${tableHeight}px`;

  // 当年第一天
  startDate.value = new Date(new Date().getFullYear(), 0, 1);
  // 查询
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
</style>
