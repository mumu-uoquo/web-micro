<template>
  <div class="app-container">
    <el-row :gutter="16">
      <!-- 左侧：一级字典 -->
      <el-col :span="4">
        <el-card shadow="never" class="panel-card table-container">
          <template #header>
            <div>
              <div class="flex-x-between">
                <el-button type="success" :icon="Plus" @click="handleLeftAdd">新增</el-button>
                <el-button
                  type="primary"
                  :icon="Edit"
                  :disabled="!selectedRow"
                  @click="handleLeftEdit"
                >
                  修改
                </el-button>
              </div>
              <el-input
                v-model="leftSearchKeyword"
                placeholder="编码 / 名称"
                clearable
                style="margin-top: 8px"
              />
            </div>
          </template>
          <el-table
            v-loading="leftTableLoading"
            :data="filteredLeftTableData"
            :show-header="false"
            highlight-current-row
            @row-click="handleLeftRowClick"
          >
            <el-table-column label="编码" prop="dicCode" width="60" align="center" />
            <el-table-column label="名称" prop="dicValue" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：二级字典 -->
      <el-col :span="20">
        <el-card shadow="never" class="panel-card table-container">
          <template #header>
            <div class="flex-x-between">
              <div>
                <el-button
                  type="success"
                  :icon="Plus"
                  :disabled="!selectedRow"
                  @click="handleRightAdd"
                >
                  新增
                </el-button>
              </div>
              <div>
                <el-button
                  :icon="Refresh"
                  circle
                  title="刷新"
                  @click="selectedRow && loadRightData(selectedRow.dicCode)"
                />
              </div>
            </div>
          </template>
          <el-table v-loading="rightTableLoading" :data="rightTableData" border stripe>
            <el-table-column label="序号" type="index" width="80" align="center" />
            <el-table-column label="编码" prop="dicCode" width="120" align="center" />
            <el-table-column label="名称" prop="dicValue" show-overflow-tooltip />
            <el-table-column label="级别" prop="dicType" width="80" align="center">
              <template #default="{ row }">
                <DictTag :code="row.dicType" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="样式" prop="tagStyle" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.tagStyle" :type="row.tagStyle" size="small">
                  {{ row.tagStyle }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="顺序" prop="sortIdx" width="80" align="center" />
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="scope">
                <el-button
                  link
                  size="small"
                  type="primary"
                  :icon="Edit"
                  @click="handleRightEdit(scope.row)"
                />
                <el-popconfirm
                  :icon="WarnTriangleFilled"
                  icon-color="red"
                  :title="`您确定删除吗？【${scope.row.dicValue}】`"
                  width="160"
                  @confirm="handleDelete(scope.row)"
                >
                  <template #reference>
                    <el-button
                      link
                      size="small"
                      type="danger"
                      :disabled="scope.row.dicType == DictionaryEnum.ROLE_TYPE_INNER"
                      @click.stop
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <DictionaryInfoForm
      ref="infoFormRef"
      :parent-data="leftTableData"
      @on-submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Refresh, Edit, Delete, WarnTriangleFilled } from "@element-plus/icons-vue";
import SystemAPI, { SysDictionaryDto, SysDictionarySearchParam } from "@/api/system";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import DictTag from "@/components/DictTag/index.vue";
import DictionaryInfoForm from "./components/DictionaryInfoForm.vue";

/* ===== 左侧状态 ===== */
const leftTableData = ref<SysDictionaryDto[]>([]);
const leftTableLoading = ref<boolean>(false);
const selectedRow = ref<SysDictionaryDto | null>(null);
const leftSearchKeyword = ref("");

const filteredLeftTableData = computed(() => {
  const kw = leftSearchKeyword.value.trim().toLowerCase();
  if (!kw) return leftTableData.value;
  return leftTableData.value.filter(
    (row) => row.dicCode?.toLowerCase().includes(kw) || row.dicValue?.toLowerCase().includes(kw)
  );
});

/* ===== 右侧状态 ===== */
const rightTableData = ref<SysDictionaryDto[]>([]);
const rightTableLoading = ref<boolean>(false);

/* ===== 弹窗引用 ===== */
const infoFormRef = ref<InstanceType<typeof DictionaryInfoForm>>();
const activePanel = ref<"left" | "right">("left");

/* ===== 左侧数据加载 ===== */
async function loadLeftData() {
  leftTableLoading.value = true;
  try {
    const data = await SystemAPI.listDictionaryByCode({} as SysDictionarySearchParam);
    leftTableData.value = data;
  } finally {
    leftTableLoading.value = false;
  }
}

/* ===== 右侧数据加载 ===== */
async function loadRightData(parentCode: string) {
  rightTableLoading.value = true;
  try {
    const data = await SystemAPI.listDictionaryByCode({
      itemCode: parentCode,
    } as SysDictionarySearchParam);
    rightTableData.value = data;
  } finally {
    rightTableLoading.value = false;
  }
}

/* ===== 左侧事件处理 ===== */
function handleLeftRowClick(row: SysDictionaryDto) {
  selectedRow.value = row;
  loadRightData(row.dicCode);
}

function handleLeftAdd() {
  activePanel.value = "left";
  infoFormRef.value?.openDialog({ dicCode: "" } as any);
}

function handleLeftEdit() {
  if (!selectedRow.value) return;
  activePanel.value = "left";
  const { id, dicCode, dicValue, dicType, sortIdx, tagStyle } = selectedRow.value;
  infoFormRef.value?.openDialog({ id, dicCode, dicValue, dicType, sortIdx, tagStyle } as any);
}

/* ===== 右侧事件处理 ===== */
function handleRightAdd() {
  activePanel.value = "right";
  infoFormRef.value?.openDialog({ dicCode: selectedRow.value!.dicCode } as any);
}

function handleRightEdit(row: SysDictionaryDto) {
  activePanel.value = "right";
  const { id, dicCode, dicValue, dicType, sortIdx, tagStyle } = row;
  infoFormRef.value?.openDialog({ id, dicCode, dicValue, dicType, sortIdx, tagStyle } as any);
}

async function handleDelete(row: SysDictionaryDto) {
  await SystemAPI.deleteDictionaryInfo({ id: row.id });
  loadRightData(selectedRow.value!.dicCode);
  ElMessage.success("删除成功");
}

function handleFormSubmit() {
  if (activePanel.value === "left") {
    loadLeftData();
  } else {
    loadRightData(selectedRow.value!.dicCode);
  }
}

/* ===== 生命周期 ===== */
onMounted(() => {
  loadLeftData();
});

/* ===== 页面配置 ===== */
defineOptions({
  name: "SystemDicTree",
  inheritAttrs: false,
});
</script>

<style lang="scss" scoped>
.panel-card {
  height: 100%;
}
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
</style>
