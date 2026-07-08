<template>
  <div v-loading="props.loading" style="width: 100%">
    <el-table :data="tableData" border :height="height" :max-height="maxHeight">
      <el-table-column label="序号" type="index" width="80" align="center" />
      <el-table-column label="日期" prop="dateData" width="180" align="center">
        <template #default="{ row }">
          <div v-if="row.isEdit">
            <DatePicker v-model="row.dateData" type="date" width="140px" size="small" />
          </div>
          <span v-else>{{ formatDate(row.dateData, "YYYY-MM-DD") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" prop="dateType" width="180" align="center">
        <template #default="{ row }">
          <div v-if="row.isEdit">
            <el-select v-model="row.dateType" size="small" placeholder="请选择">
              <el-option
                v-for="item in dateTypeList"
                :key="item.dicCode"
                :label="item.dicValue"
                :value="item.dicCode"
              />
            </el-select>
          </div>
          <span v-else>
            <DictTag :code="row.dateType" />
          </span>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="description" min-width="120">
        <template #default="scope">
          <div v-if="scope.row.isEdit">
            <el-input
              v-model="scope.row.description"
              size="small"
              maxlength="50"
              show-word-limit
              style="padding-right: 24px"
              clearable
            />
          </div>
          <span v-else>{{ scope.row.description }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center">
        <template #default="scope">
          <div v-if="scope.row.isEdit">
            <el-button
              link
              size="small"
              type="success"
              :icon="Select"
              @click.stop="handleSave(scope.$index, scope.row)"
            />
            <el-button
              link
              size="small"
              type="warning"
              :icon="Close"
              @click.stop="handleCancel(scope.$index, scope.row)"
            />
          </div>
          <div v-else>
            <el-button
              link
              size="small"
              type="primary"
              :icon="Edit"
              @click.stop="handleEdit(scope.$index, scope.row)"
            />
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要删除吗？`"
              width="160"
              @confirm.stop="handleDelete(scope.$index, scope.row)"
            >
              <template #reference>
                <el-button
                  link
                  size="small"
                  type="danger"
                  :disabled="scope.row.defaulted"
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
          </div>
        </template>
      </el-table-column>
    </el-table>
    <el-button class="mt-2" :icon="Plus" style="width: 100%" @click="onAddItem">单个添加</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useDictStore } from "@/stores";
import DictTag from "@/components/DictTag/index.vue";
import { formatDate, parseDate } from "@/utils/format";
import { Plus, Edit, Delete, Select, Close, WarnTriangleFilled } from "@element-plus/icons-vue";
import { SysHolidayDto } from "@/api/system";
import DatePicker from "@/components/DatePicker/index.vue";

/* ***************************** 参数定义 ********************************* */
// 父级组件绑定的v-modle
// const model = defineModel<SysHolidayDto[]>();
// 暴露给父级的自定义事件
const emits = defineEmits<{
  (e: "on-add", row: SysHolidayDto): void;
  (e: "on-edit", row: SysHolidayDto): void;
  (e: "on-delete", row: SysHolidayDto): void;
}>();
// 暴露给父级的自定义属性
const props = defineProps({
  data: {
    // 接收父组件单向传递的表格数据
    type: Array as PropType<SysHolidayDto[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  height: {
    type: [Number, String],
    default: "auto",
  },
  maxHeight: {
    type: [Number, String],
    default: "auto",
  },
});

// 日期类型
const dictStore = useDictStore();
const dateTypeList = dictStore.listDictionary(DictionaryEnum.DAY_TYPE);

/* ***************************** 数据表格 ********************************* */
// 扩展部分属性
interface HolidayTableItem extends SysHolidayDto {
  isEdit: boolean;
  dateData?: Date | null;
  oldData?: SysHolidayDto;
}
const tableData = ref<HolidayTableItem[]>([]);

/**
 * 刷新表格数据
 */
function refreshTableData(data: SysHolidayDto[] | undefined) {
  // console.log("refreshData", data);
  if (!data) {
    tableData.value = [];
    return;
  }
  tableData.value = data!.map((item) => {
    const temp: HolidayTableItem = {
      ...item,
      isEdit: false,
      dateData: parseDate(item.dateValue),
      oldData: { ...item },
    };
    return temp;
  });
}

/* ***************************** 按钮操作 ********************************* */
/**
 * 新增：插入行
 */
function onAddItem() {
  const date = parseDate(formatDate(new Date(), "YYYY-MM-DD"), "YYYY-MM-DD");
  const temp: HolidayTableItem = {
    id: "",
    dateValue: formatDate(date, "timestamp"),
    dateData: date,
    dateType: DictionaryEnum.DAY_TYPE_HOLIDAY,
    description: "",
    isEdit: true,
  };
  temp.oldData = { ...temp };
  // console.log("onAddItem", temp);
  tableData.value.push(temp);
}
/**
 * 编辑：展现
 */
function handleEdit(index: number, row: HolidayTableItem) {
  // console.log("handleEdit", row);
  row.isEdit = true;
}

/**
 * 保存提交（防抖）
 */
const handleSave = useDebounceFn(async (index: number, row: HolidayTableItem) => {
  // console.log("handleSave", index, row);
  if (!row.dateData) {
    ElMessage.error("请选择日期");
    return;
  }
  row.dateValue = formatDate(row.dateData!, "timestamp");
  const params = {
    id: row.id,
    dateType: row.dateType,
    dateValue: row.dateValue,
    description: row.description,
  } as SysHolidayDto;
  if (params.id) {
    emits("on-edit", params);
  } else {
    emits("on-add", params);
  }
  row.isEdit = false;
}, 500);

/**
 * 取消
 */
function handleCancel(index: number, row: HolidayTableItem) {
  // console.log("handleCancel", row);
  if (row.id) {
    row.isEdit = false;
    row.dateType = row.oldData!.dateType;
    row.dateData = parseDate(row.oldData!.dateValue);
    row.dateValue = row.oldData!.dateValue;
    row.description = row.oldData!.description;
  } else {
    tableData.value.splice(index, 1);
  }
}

/**
 * 删除
 */
function handleDelete(index: number, row: HolidayTableItem) {
  // console.log("before on-delete", row);
  const params = {
    id: row.id,
    dateType: row.dateType,
    dateValue: row.dateValue,
    description: row.description,
  } as SysHolidayDto;
  emits("on-delete", params);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 * https://cn.vuejs.org/api/reactivity-core.html#watch
 */
// watch(
//   model,
//   (newVal, oldVal) => {
//     // console.log("model watchEffect", newVal, oldVal);
//     refreshTableData(newVal);
//   },
//   {
//     // 在onMounted中手动执行初次加载
//     immediate: false,
//     // 以下数据导致tableData执行push时触发了数据重新加载！！
//     // deep: true, // 复杂类型（如：对象、数组）需深度监听
//   }
// );
watch(
  () => props.data,
  (newVal) => {
    refreshTableData(newVal);
  },
  {
    immediate: true, // 初始化时执行
    deep: false, // 仅监听数组引用变化，不深度监听内部元素
  }
);
/**
 * 页面加载时
 */
onMounted(() => {
  // 初始化手动刷新
  // refreshTableData(model.value);
});
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  // handleResetQuery,
});
</script>
