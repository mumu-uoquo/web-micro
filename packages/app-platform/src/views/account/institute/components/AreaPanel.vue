<template>
  <ElTable
    ref="tableRef"
    :data="tableData"
    :show-header="false"
    :highlight-current-row="true"
    :border="true"
    :max-height="tableMaxHeight"
    style="width: 99%"
    @row-dblclick="handleDbClick"
    @row-click="handleClick"
  >
    <el-table-column prop="areaName" label="名称">
      <template #default="scope">
        <div v-if="scope.row.isEdit">
          <el-input
            v-model="scope.row.newAreaName"
            size="small"
            maxlength="10"
            show-word-limit
            style="padding-right: 24px"
          />
          <el-button
            link
            size="small"
            type="success"
            :icon="MoreFilled"
            style="margin-left: -18px"
            @click.stop="openDialog(scope.$index, scope.row)"
          />
        </div>
        <span v-else>{{ scope.row.areaName }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="80" align="right">
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
            :title="`您确定要删除吗？【${scope.row.areaName}】`"
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
  </ElTable>
  <el-button class="mt-2" :icon="Plus" style="width: 99%" @click="onAddItem">新增区域</el-button>
  <!-- 弹窗：新增/编辑 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    draggable
    @close="handleCloseDialog"
  >
    <el-form
      ref="infoFormRef"
      :model="infoFormData"
      :rules="infoFormRules"
      status-icon
      label-width="100px"
      class="mt-5"
    >
      <el-form-item label="所属机构">
        <el-input v-model="infoFormData.instituteName" :disabled="true" />
      </el-form-item>

      <el-form-item label="区域名称" prop="areaName">
        <el-input
          v-model="infoFormData.areaName"
          placeholder="请填写区域的名称"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="区域编码" prop="areaCode">
        <el-input
          v-model="infoFormData.areaCode"
          placeholder="请填写区域的编码"
          maxlength="20"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="三方标识" prop="thirdId">
        <el-input
          v-model="infoFormData.thirdId"
          placeholder="与其他系统对接的唯一标识"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="详细地址" prop="address">
        <el-input
          v-model="infoFormData.address"
          placeholder="请填写区域的详细地址"
          maxlength="50"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="描述说明" prop="description">
        <el-input
          v-model="infoFormData.description"
          type="textarea"
          maxlength="100"
          show-word-limit
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click.stop="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click.stop="handleInfoSubmit">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { ElMessage, ElTable } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import {
  Plus,
  Edit,
  Delete,
  Close,
  Select,
  MoreFilled,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import { InstituteInfoDto } from "@/api/institute";
import DepartmentAPI, { AreaInfoDto, AreaInfoParam } from "@/api/department";

/* ***************************** 参数定义 ********************************* */
// 父级组件绑定的v-modle
const model = defineModel<AreaInfoDto>();
// 暴露给父级的自定义事件
// const emits = defineEmits<{
//   (e: "on-click", areaId: string): void;
//   (e: "on-delete", areaId: string): void;
// }>();
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
}>();

/* ***************************** 数据表格 ********************************* */
// 扩展部分属性
interface AreaTableItem extends AreaInfoDto {
  isEdit: boolean;
  newAreaName?: string;
}
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableData = ref<AreaTableItem[]>([]);
const tableRef = ref(ElTable);
/**
 * 数据查询
 */
function handleQuery() {
  tableData.value = [];
  if (!props.defaultInstitute.id) {
    return;
  }
  // 有机构ID时，执行查询
  tableLoading.value = true;
  DepartmentAPI.listArea({ id: props.defaultInstitute.id })
    .then((data) => {
      // 数据格式化
      tableData.value = data!.map((item: AreaInfoDto) => {
        const temp: AreaTableItem = { ...item } as AreaTableItem;
        temp.isEdit = false;
        temp.newAreaName = item.areaName;
        return temp;
      });
      // 不自动选择，改为手动选
      // // 默认选中第一行
      // if (tableData.value.length > 0) {
      //   handleClick(tableData.value[0]);
      // }
    })
    .finally(() => {
      tableLoading.value = false;
    });
}

/**
 * 单击行
 */
const rowClickTimer = ref<NodeJS.Timeout | null>(null);
function handleClick(row: AreaTableItem) {
  if (row.isEdit) {
    return;
  }
  // 若存在未执行的单击事件，说明本次可能是双击，所以取消待执行事件
  if (rowClickTimer.value) {
    clearTimeout(rowClickTimer.value);
    rowClickTimer.value = null;
    return;
  }
  // 延迟300ms处理（防止row-dbclick触发两次row-click）
  rowClickTimer.value = setTimeout(() => {
    // console.log("handleClick", row);
    rowClickTimer.value = null;
    // 直接设置绑定的model，不用通过绑定click事件来回传父组件
    // emits("on-click", row.id);
    if (model.value && row.id == model.value.id) {
      tableRef.value.setCurrentRow();
      model.value = undefined;
    } else {
      tableRef.value.setCurrentRow(row, true);
      model.value = row;
    }
  }, 300);
}

/**
 * 双击行
 */
function handleDbClick(row: AreaTableItem, col: any, event: Event) {
  event.stopPropagation();
  if (row.isEdit) {
    return;
  }
  // console.log("handleDoubleClick", row);
  row.isEdit = true;
}

/* ***************************** 按钮操作 ********************************* */
/**
 * 新增：插入行
 */
function onAddItem() {
  const temp: AreaTableItem = {
    id: "",
    areaName: "",
    instituteId: props.defaultInstitute.id,
    isEdit: true,
  };
  // console.log("onAddItem", temp);
  tableData.value.push(temp);
}
/**
 * 编辑
 */
function handleEdit(index: number, row: AreaTableItem) {
  // console.log("handleEdit", row);
  row.isEdit = true;
}
/**
 * 保存提交（防抖）
 */
const handleSave = useDebounceFn((index: number, row: AreaTableItem) => {
  row.newAreaName = row.newAreaName!.trim();
  if (!row.newAreaName) {
    ElMessage.error("请填写区域名称");
    return;
  }
  const params = {
    id: row.id,
    areaName: row.newAreaName,
    instituteId: row.instituteId || props.defaultInstitute.id,
  } as AreaInfoParam;
  submitAreaSave(row, params);
}, 500);
function submitAreaSave(row: AreaTableItem, params: AreaInfoParam) {
  return new Promise((resolve, reject) => {
    if (params.id) {
      // console.log("handleSave update", params);
      DepartmentAPI.updateAreaInfo(params)
        .then((data) => {
          ElMessage.success("修改成功");
          row.isEdit = false;
          row.areaName = row.newAreaName ?? row.areaName;
          console.log("submitAreaSave ok", data);
          resolve(data);
        })
        .catch((err) => {
          console.log("submitAreaSave err", err);
          reject(err);
        });
    } else {
      // console.log("handleSave add", params);
      DepartmentAPI.addAreaInfo(params)
        .then((data) => {
          ElMessage.success("新增成功");
          row.id = data;
          row.isEdit = false;
          row.areaName = row.newAreaName ?? row.areaName;
          console.log("submitAreaSave ok", data);
          resolve(data);
        })
        .catch((err) => {
          console.log("submitAreaSave err", err);
          reject(err);
        });
    }
  });
}
/**
 * 取消
 */
function handleCancel(index: number, row: AreaTableItem) {
  // console.log("handleCancel", row);
  if (row.id) {
    row.isEdit = false;
    row.newAreaName = row.areaName;
  } else {
    tableData.value.splice(index, 1);
  }
}

/**
 * 删除
 */
function handleDelete(index: number, row: AreaTableItem) {
  // console.log("before on-delete", row);
  // emits("on-delete", row.id);
  // console.log("after on-delete", row);
  DepartmentAPI.deleteAreaInfo({ id: row.id }).then(() => {
    ElMessage.success("删除成功");
    tableData.value.splice(index, 1);
    // 如果删除的是选中行，则默认选中删除行的上一行
    if (model.value && row.id == model.value.id) {
      const temp = tableData.value[index - 1];
      handleClick(temp);
    }
  });
}

/* ***************************** 表单信息 ********************************* */
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增区域");
// 初始表单数据
interface AreaInfoFormParam extends AreaInfoParam {
  index?: number;
  instituteName?: string;
}
const initialFormData = ref<AreaInfoFormParam>({
  id: "",
  instituteId: props.defaultInstitute.id,
  instituteName: props.defaultInstitute.instituteName,
  areaName: "",
  areaCode: "",
  thirdId: "",
  address: "",
  description: "",
});
const infoFormRef = ref(ElForm);
const infoFormData = ref<AreaInfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<AreaInfoFormParam>>({
  areaName: [{ required: true, message: "请输入名称", trigger: "blur" }],
});

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    const idx = infoFormData.value.index;
    const row = tableData.value[idx!];
    row.newAreaName = infoFormData.value.areaName;
    const params = { ...infoFormData.value } as AreaInfoParam;
    submitAreaSave(row, params).then((_data) => {
      dialogVisible.value = false;
    });
  });
}, 500);

/**
 * 显示弹窗
 */
function openDialog(index: number, param: AreaTableItem) {
  // 表单初始化
  if (param.id && param.id != "") {
    dialogTitle.value = "修改部门";
  }
  Object.assign(infoFormData.value, param);
  infoFormData.value.index = index; // 临时存储表格行的索引
  infoFormData.value.areaName = param.newAreaName ?? "";
  dialogVisible.value = true;
}

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  // 更新表格
  const idx = infoFormData.value.index;
  const row = tableData.value[idx!];
  console.log("row", dialogVisible.value, idx, row);
  if (row.id) {
    row.isEdit = false;
    row.newAreaName = row.areaName;
  } else {
    tableData.value.splice(idx!, 1);
  }
  // 关闭弹窗
  dialogVisible.value = false;
  dialogTitle.value = "新增部门";
  infoFormRef.value.clearValidate();
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 * https://cn.vuejs.org/api/reactivity-core.html#watch
 */
watch(
  () => props.defaultInstitute.id,
  () => {
    if (props.defaultInstitute.id) {
      // console.log("area watchEffect props.defaultInstitute.id", props.defaultInstitute.id);
      handleQuery();
    }
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
  const tableHeight = Math.max(200, window.innerHeight - 288);
  tableMaxHeight.value = `${tableHeight}px`;

  // handleQuery();
});
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  // handleResetQuery,
});
</script>
