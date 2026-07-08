<template>
  <div class="app-container">
    <el-card shadow="never" class="table-container">
      <template #header>
        <div class="flex-x-between">
          <div>
            <el-button type="success" :icon="Plus" @click="handleOpenInfoAddDialog">新增</el-button>
          </div>
          <div>
            <el-button :icon="Refresh" circle title="刷新" @click="loadAllDictionaryData()" />
          </div>
        </div>
      </template>
      <ElTable
        ref="tableRef"
        v-loading="tableLoading"
        :data="tableData"
        :max-height="tableMaxHeight"
        row-key="id"
        style="width: 100%"
        border
        stripe
        highlight-current-row
        @row-click="handleRowClick"
      >
        <el-table-column label="序号" type="index" width="80" align="center">
          <template #default="scope">
            <span>{{ formatTableIndex(scope.row, scope.$index) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dicCode" width="120">
          <template #header>
            <el-input v-model="searchCodeText" size="small" clearable placeholder="编码" />
          </template>
        </el-table-column>
        <el-table-column prop="dicValue" width="" show-overflow-tooltip>
          <template #header>
            <el-row>
              <el-col :span="2">内容</el-col>
              <el-col :span="16">
                <el-input
                  v-model="searchNameText"
                  size="small"
                  clearable
                  placeholder="内容搜索"
                  :prefix-icon="Search"
                />
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column label="作用范围" prop="dicType" width="120" align="center">
          <template #default="{ row }">
            <DictTag :code="row.dicType" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="样式" prop="tagStyle" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.tagStyle" :type="row.tagStyle" size="small">
              {{ row.tagStyle }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="顺序" prop="sortIdx" width="120" align="center" />
        <el-table-column label="操作" width="80" align="center" fixed="right">
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
                  @click.stop=""
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
      </ElTable>
    </el-card>

    <DictionaryInfoForm
      ref="infoForm"
      :parent-data="allDictionaryData"
      @on-submit="loadAllDictionaryData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ElMessage, ElTable } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import DictTag from "@/components/DictTag/index.vue";
import { Plus, Refresh, Edit, Delete, Search, WarnTriangleFilled } from "@element-plus/icons-vue";
import SystemAPI, { SysDictionaryParam, SysDictionaryDto } from "@/api/system";
import DictionaryInfoForm from "./components/DictionaryInfoForm.vue";

/* ***************************** 搜索表单 ********************************* */
/**
 * 名称搜索
 */
const searchNameText = ref<string>("");
watch(
  () => searchNameText.value,
  () => {
    // console.log("searchNameText.value", searchNameText.value);
    tableData.value = handleFilter(allDictionaryData.value);
  }
);
/**
 * 编码搜索
 */
const searchCodeText = ref<string>("");
watch(
  () => searchCodeText.value,
  () => {
    // console.log("searchCodeText.value", searchCodeText.value);
    tableData.value = handleFilter(allDictionaryData.value);
  }
);

/* ***************************** 数据表格 ********************************* */
// 扩展部分属性
interface DictionaryTableItem extends SysDictionaryDto {
  index: string;
  children?: DictionaryTableItem[];
}
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableRef = ref(ElTable);
const tableData = ref<DictionaryTableItem[]>([]);

/**
 * 数据查询
 */
const allDictionaryData = ref<DictionaryTableItem[]>([]);
function loadAllDictionaryData() {
  SystemAPI.listDictionaryByAll().then((data) => {
    allDictionaryData.value = parseDictionaryData(data || []);
    tableData.value = handleFilter(allDictionaryData.value);
  });
}
function parseDictionaryData(data: SysDictionaryDto[]): DictionaryTableItem[] {
  // console.log("parseDictionaryData", data );
  let index = 0;
  return data.map((item: SysDictionaryDto) => {
    const temp = { ...item } as DictionaryTableItem;
    // 自定义行序号，仅一级字典显示行序号
    temp.index = temp.dicCode.length === 3 ? String(++index) : "";
    if (temp.children && temp.children.length > 0) {
      temp.children = parseDictionaryData(temp.children);
    }
    return temp;
  });
}
/**
 * 条件过滤
 */
function handleFilter(list: DictionaryTableItem[]): DictionaryTableItem[] {
  return list
    .map((item: DictionaryTableItem) => {
      const temp = { ...item } as DictionaryTableItem;
      // 过滤子节点
      if (temp.children && temp.children.length > 0) {
        temp.children = handleFilter(temp.children);
      }
      return temp;
    })
    .filter((item: DictionaryTableItem) => {
      // 有子节点，则需要显示
      if (item.children && item.children.length > 0) {
        return true;
      }
      // 没子节点时，需要根据条件判断
      if (!item.dicValue?.includes(searchNameText.value)) {
        return false;
      }
      if (!item.dicCode?.includes(searchCodeText.value)) {
        return false;
      }
      return true;
    });
}

/**
 * 格式化：行序号
 */
function formatTableIndex(row: DictionaryTableItem, _index: number) {
  return row.index; // 返回自定义序号
}

/**
 * 行操作：单击
 */
const parentCode = ref<string>("");
function handleRowClick(row: DictionaryTableItem) {
  parentCode.value = row.dicCode.substring(0, 3);
}

/* ***************************** 其他操作 ********************************* */
const infoForm = ref(DictionaryInfoForm);
/**
 * 展示：新增
 */
function handleOpenInfoAddDialog() {
  infoForm.value.openDialog({ dicCode: parentCode.value });
}
/**
 * 展示：编辑
 */
function handleOpenInfoEditDialog(row: DictionaryTableItem) {
  // console.log("handleOpenInfoEdit", row);
  const params = {} as SysDictionaryParam;
  params.id = row.id;
  params.sortIdx = row.sortIdx;
  params.dicType = row.dicType;
  params.dicCode = row.dicCode;
  params.dicValue = row.dicValue;
  params.tagStyle = row.tagStyle;
  // 显示
  infoForm.value.openDialog(params);
}

/**
 * 操作：删除
 */
function handleDelete(row: DictionaryTableItem) {
  // console.log("handleDelete", row);
  SystemAPI.deleteDictionaryInfo({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    loadAllDictionaryData();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "SystemDicList",
  inheritAttrs: false,
});
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const tableHeight = Math.max(200, window.innerHeight - 170);
  tableMaxHeight.value = `${tableHeight}px`;
  // 查询
  loadAllDictionaryData();
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
