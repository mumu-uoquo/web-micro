<template>
  <div ref="tableSelectRef" :style="'width:' + width">
    <el-popover
      :visible="popoverVisible"
      :width="popoverWidth"
      placement="bottom-end"
      v-bind="selectConfig.popover"
      @show="handleShow"
    >
      <template #reference>
        <div @click="popoverVisible = !popoverVisible">
          <slot>
            <el-input class="reference" :model-value="text" :readonly="true" :placeholder="placeholder">
              <template #suffix>
                <el-icon :style="{ transform: popoverVisible ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .5s' }">
                  <ArrowDown />
                </el-icon>
              </template>
            </el-input>
          </slot>
        </div>
      </template>
      <div ref="popoverContentRef">
        <el-form ref="formRef" :model="queryParams" :inline="true">
          <template v-for="item in selectConfig.formItems" :key="item.prop">
            <el-form-item :label="item.label" :prop="item.prop">
              <template v-if="item.type === 'input'">
                <template v-if="item.attrs?.type === 'number'">
                  <el-input v-model.number="queryParams[item.prop]" v-bind="item.attrs" @keyup.enter="handleQuery" />
                </template>
                <template v-else>
                  <el-input v-model="queryParams[item.prop]" v-bind="item.attrs" @keyup.enter="handleQuery" />
                </template>
              </template>
              <template v-else-if="item.type === 'select'">
                <el-select v-model="queryParams[item.prop]" v-bind="item.attrs">
                  <template v-for="option in item.options" :key="option.value">
                    <el-option :label="option.label" :value="option.value" />
                  </template>
                </el-select>
              </template>
              <template v-else-if="item.type === 'tree-select'">
                <el-tree-select v-model="queryParams[item.prop]" v-bind="item.attrs" />
              </template>
              <template v-else-if="item.type === 'date-picker'">
                <el-date-picker v-model="queryParams[item.prop]" v-bind="item.attrs" />
              </template>
              <template v-else>
                <template v-if="item.attrs?.type === 'number'">
                  <el-input v-model.number="queryParams[item.prop]" v-bind="item.attrs" @keyup.enter="handleQuery" />
                </template>
                <template v-else>
                  <el-input v-model="queryParams[item.prop]" v-bind="item.attrs" @keyup.enter="handleQuery" />
                </template>
              </template>
            </el-form-item>
          </template>
          <el-form-item>
            <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
            <el-button icon="refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="pageData"
          :border="true"
          :max-height="250"
          :row-key="pk"
          :highlight-current-row="true"
          :class="{ radio: !isMultiple }"
          @select="handleSelect"
          @select-all="handleSelectAll"
        >
          <template v-for="col in selectConfig.tableColumns" :key="col.prop">
            <template v-if="col.templet === 'custom'">
              <el-table-column v-bind="col">
                <template #default="scope">
                  <slot :name="col.slotName ?? col.prop" :prop="col.prop" v-bind="scope" />
                </template>
              </el-table-column>
            </template>
            <template v-else>
              <el-table-column v-bind="col" />
            </template>
          </template>
        </el-table>
        <pagination
          v-if="total > 0"
          v-model:total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="handlePagination"
        />
        <div class="feedback">
          <el-button type="primary" size="small" @click="handleConfirm">{{ confirmText }}</el-button>
          <el-button size="small" @click="handleClear">清空</el-button>
          <el-button size="small" @click="handleClose">关闭</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown } from "@element-plus/icons-vue";
import { ref, reactive, computed } from "vue";
import { useResizeObserver } from "@vueuse/core";
import type { FormInstance, PopoverProps, TableInstance } from "element-plus";

export type IObject = Record<string, any>;
export interface ISelectConfig<T = any> {
  width?: string;
  placeholder?: string;
  popover?: Partial<Omit<PopoverProps, "visible" | "v-model:visible">>;
  indexAction: (_queryParams: T) => Promise<any>;
  pk?: string;
  multiple?: boolean;
  formItems: Array<{
    type?: "input" | "select" | "tree-select" | "date-picker";
    label: string;
    prop: string;
    attrs?: IObject;
    initialValue?: any;
    options?: { label: string; value: any }[];
  }>;
  tableColumns: Array<{
    type?: "default" | "selection" | "index" | "expand";
    label?: string;
    prop?: string;
    width?: string | number;
    [key: string]: any;
  }>;
}

const props = withDefaults(defineProps<{ selectConfig: ISelectConfig; text?: string }>(), { text: "" });
const emit = defineEmits<{ confirmClick: [selection: any[]] }>();

const pk = props.selectConfig.pk ?? "id";
const isMultiple = props.selectConfig.multiple === true;
const width = props.selectConfig.width ?? "100%";
const placeholder = props.selectConfig.placeholder ?? "请选择";
const popoverVisible = ref(false);
const loading = ref(false);
const total = ref(0);
const pageData = ref<IObject[]>([]);
const pageSize = 10;
const queryParams = reactive<{ pageNum: number; pageSize: number; [key: string]: any }>({ pageNum: 1, pageSize });

const tableSelectRef = ref();
const popoverWidth = ref(width);
useResizeObserver(tableSelectRef, (entries) => { popoverWidth.value = `${entries[0].contentRect.width}px`; });

const formRef = ref<FormInstance>();
for (const item of props.selectConfig.formItems) {
  queryParams[item.prop] = item.initialValue ?? "";
}
function handleReset() { formRef.value?.resetFields(); fetchPageData(true); }
function handleQuery() { fetchPageData(true); }

function fetchPageData(isRestart = false) {
  loading.value = true;
  if (isRestart) { queryParams.pageNum = 1; queryParams.pageSize = pageSize; }
  props.selectConfig.indexAction(queryParams)
    .then((data) => { total.value = data.total ?? 0; pageData.value = data.list ?? []; })
    .finally(() => { loading.value = false; });
}

const tableRef = ref<TableInstance>();
for (const item of props.selectConfig.tableColumns) {
  if (item.type === "selection") { item.reserveSelection = true; break; }
}
const selectedItems = ref<IObject[]>([]);
const confirmText = computed(() => selectedItems.value.length > 0 ? `已选${selectedItems.value.length}条` : "请选择");

function handleSelect(selection: any[]) {
  if (isMultiple || selection.length === 0) {
    selectedItems.value = selection;
  } else {
    selectedItems.value = [selection[selection.length - 1]];
    tableRef.value?.clearSelection();
    tableRef.value?.toggleRowSelection(selectedItems.value[0], true);
    tableRef.value?.setCurrentRow(selectedItems.value[0]);
  }
}
function handleSelectAll(selection: any[]) { if (isMultiple) selectedItems.value = selection; }
function handlePagination() { fetchPageData(); }

const isInit = ref(false);
function handleShow() { if (isInit.value === false) { isInit.value = true; fetchPageData(); } }
function handleConfirm() {
  if (selectedItems.value.length === 0) { ElMessage.error("请选择数据"); return; }
  popoverVisible.value = false;
  emit("confirmClick", selectedItems.value);
}
function handleClear() { tableRef.value?.clearSelection(); selectedItems.value = []; }
function handleClose() { popoverVisible.value = false; }

const popoverContentRef = ref();
</script>

<style scoped lang="scss">
.reference :deep(.el-input__wrapper), .reference :deep(.el-input__inner) { cursor: pointer; }
.feedback { display: flex; justify-content: flex-end; margin-top: 6px; }
.radio :deep(.el-table__header th.el-table__cell:nth-child(1) .el-checkbox) { visibility: hidden; }
</style>
