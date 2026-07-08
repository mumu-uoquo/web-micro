<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    draggable
    @close="handleCloseDialog"
  >
    <el-card shadow="never" class="table-container">
      <template #header>
        <div style="display: flex; justify-content: flex-end">
          <el-button :icon="FolderOpened" circle title="导入" size="small" />
          <el-button
            :icon="Switch"
            circle
            title="切换"
            size="small"
            @click="handleChangeEditMode"
          />
        </div>
      </template>
      <div v-if="editInTable">
        <HolidayList
          :data="tableData"
          :height="200"
          @on-add="handleOnSave"
          @on-edit="handleOnUpdate"
          @on-delete="handleOnDelete"
        />
      </div>
      <div v-else>
        <el-input
          v-model="textareaValue"
          :rows="10"
          style="height: 240px"
          type="textarea"
          placeholder="每行请按“YYYY-MM-DD 类型 备注”的格式填写"
        />
      </div>
    </el-card>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleInfoSubmit">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { guid, assert } from "@/utils/common";
import { formatDate, parseDate } from "@/utils/format";
import { Switch, FolderOpened } from "@element-plus/icons-vue";
import SystemAPI, { SysHolidayInfoParam, SysHolidayDto } from "@/api/system";
import HolidayList from "./HolidayList.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");

// 待提交的数据
const listData = ref<SysHolidayInfoParam[]>([]);
// 转换为表格显示的数据
const tableData = ref<SysHolidayDto[]>([]);

/* ***************************** 表格操作 ********************************* */
/**
 * 操作：新增保存
 */
function handleOnSave(row: SysHolidayDto) {
  // console.log("handleOnSave", row, tableData);
  // 更新表格数据
  row.id = guid();
  tableData.value.push(row);
  // 刷新待提交的数据
  refreshListData();
}
/**
 * 操作：修改保存
 */
function handleOnUpdate(row: SysHolidayDto) {
  // console.log("handleOnUpdate", row, tableData.value);
  // 更新tableData中 row.id的数据
  const index = tableData.value.findIndex((item) => item.id === row.id);
  if (index !== -1) {
    tableData.value[index] = row;
  }
  // 以下语句不生效！！（filter、map 这些方法不会修改原数组）
  // tableData.value.filter((item) => item.id === row.id)[0] = row;
  // 刷新待提交的数据
  refreshListData();
}
/**
 * 操作：删除保存
 */
function handleOnDelete(row: SysHolidayDto) {
  // console.log("handleOnDelete", row, tableData);
  // 从tableData中删除row.id
  tableData.value = tableData.value.filter((item) => item.id !== row.id);
  // 刷新待提交的数据
  refreshListData();
}
/**
 * 更新待提交的数据
 */
function refreshListData() {
  listData.value = tableData.value.map((item) => {
    return {
      dateType: item.dateType,
      dateValue: item.dateValue,
      description: item.description,
    };
  });
}

/* ***************************** 表单操作 ********************************* */
const editInTable = ref(true);
const textareaValue = ref("");
/**
 * 切换编辑模式
 */
function handleChangeEditMode() {
  if (editInTable.value) {
    // 1.1 从表格模式切换为文本模式时，将表单数据转换为文本框数据
    textareaValue.value = "";
    listData.value.forEach((item) => {
      const dstr = formatDate(item.dateValue, "YYYY-MM-DD");
      const type =
        item.dateType == DictionaryEnum.DAY_TYPE_WORKDAY
          ? "工作日"
          : item.dateType == DictionaryEnum.DAY_TYPE_HOLIDAY
            ? "节假日"
            : "周六日";
      const desc = item?.description || "";
      textareaValue.value += `${dstr} ${type} ${desc}\n`;
    });
    // console.log("textareaValue", textareaValue.value);
  } else {
    // 1.2 从文本模式切换为表格模式时，将文本框数据转换为表单数据
    parseTextarea();
    tableData.value = listData.value.map((item) => {
      const temp: SysHolidayDto = {
        id: guid(),
        dateType: item.dateType,
        dateValue: item.dateValue,
        description: item.description,
      };
      return temp;
    });
  }
  // 2. 切换编辑模式
  editInTable.value = !editInTable.value;
}
/**
 * 解析：文本域中的内容
 */
function parseTextarea() {
  // console.log("parseTextarea", textareaValue.value);
  // 将每行的内容按空格转换为对象数组
  listData.value = textareaValue.value
    .split("\n")
    // 1. 去除空行
    .filter((item) => item.trim() != "")
    // 2. 解析每行内容
    .map((item) => {
      const arr = item.trim().split(" ");
      const date = formatDate(parseDate(arr[0], "YYYY-MM-DD"), "timestamp");
      assert(date, `${arr[0]} 的日期格式错误，不满足【YYYY-MM-DD】`);
      let type = "";
      switch (arr[1]) {
        case "工作日":
          type = DictionaryEnum.DAY_TYPE_WORKDAY;
          break;
        case "节假日":
          type = DictionaryEnum.DAY_TYPE_HOLIDAY;
          break;
        case "周六日":
          type = DictionaryEnum.DAY_TYPE_WEEKEND;
          break;
      }
      assert(
        type,
        `${arr[0]} 的类型【${arr[1]}】不是【工作日、节假日、周六日】中的任意一种，请检查错误`
      );
      const desc = arr[2] ? arr[2] : "";
      return {
        dateType: type,
        dateValue: date,
        description: desc,
      } as SysHolidayInfoParam;
    });
}
/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(async () => {
  // console.log("handleInfoSubmit", listData.value);
  // 若是文本框模式，则先转换为表格数据
  if (!editInTable.value) {
    parseTextarea();
  }
  // 入参有效性校验
  if (listData.value.length == 0) {
    ElMessage.error("请至少添加一条数据");
    return;
  } else {
    const repeatDate: string[] = [];
    listData.value.forEach((item: SysHolidayInfoParam) => {
      assert(
        !repeatDate.includes(item.dateValue),
        `日期【${formatDate(item.dateValue, "YYYY-MM-DD")}】重复`
      );
      repeatDate.push(item.dateValue);
    });
  }
  // 提交
  SystemAPI.addHolidayList(listData.value).then((_data) => {
    ElMessage.success("保存成功");
    // 刷新父窗口
    emits("on-submit");
    dialogVisible.value = false;
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async () => {
  // 最后显示弹窗
  dialogVisible.value = true;
  dialogTitle.value = "新增";
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  listData.value = [];
  tableData.value = [];
  editInTable.value = true;
  textareaValue.value = "";
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
// card中的表格铺满
.table-container {
  border: 0;
}

.table-container > :deep(.el-card__header) {
  padding-top: 0; // 本页面不需要头部留白
  border-bottom: 0;
}

.table-container > :deep(.el-card__body) {
  padding: 0;
}

.table-container > :deep(.el-card__footer) {
  border-top: 0;
}
</style>
