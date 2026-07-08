<template>
  <el-table
    v-loading="tableLoading"
    :data="tableData"
    row-key="id"
    default-expand-all
    :max-height="tableMaxHeight"
    style="width: 100%"
    border
  >
    <el-table-column label="序号" type="index" width="80" align="center" />
    <el-table-column prop="deptName" width="" show-overflow-tooltip>
      <template #header>
        <el-row>
          <el-col :span="4">名称</el-col>
          <el-col :span="20">
            <el-input
              v-model="searchNameText"
              size="small"
              clearable
              placeholder="名称搜索"
              :prefix-icon="Search"
            />
          </el-col>
        </el-row>
      </template>
    </el-table-column>
    <el-table-column prop="deptCode" width="120">
      <template #header>
        <el-input v-model="searchCodeText" size="small" clearable placeholder="编码" />
      </template>
    </el-table-column>
    <el-table-column label="区域" prop="areaName" width="70" align="center" />
    <el-table-column label="备注" prop="description" width="160" show-overflow-tooltip />
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
        <el-tooltip v-if="scope.row.showUnlink" content="取消关联">
          <el-button
            link
            size="small"
            type="warning"
            :icon="Link"
            @click="handleUnlink(scope.row)"
          />
        </el-tooltip>
        <el-popconfirm
          v-else
          :icon="WarnTriangleFilled"
          icon-color="red"
          :title="`您确定删除吗？【${scope.row.deptName}】`"
          width="160"
          @confirm="handleDelete(scope.row)"
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
      </template>
    </el-table-column>
  </el-table>
  <!-- 部门表单页面 -->
  <DepartmentInfoForm
    ref="departmentFormRef"
    :default-institute="props.defaultInstitute"
    @on-submit="loadAllDepartmentData"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Edit, Delete, Search, Link, WarnTriangleFilled } from "@element-plus/icons-vue";
import DepartmentInfoForm from "./DepartmentInfoForm.vue";
import { InstituteInfoDto } from "@/api/institute";
import DepartmentAPI, {
  DepartmentTreeDto,
  DepartmentInfoParam,
  AreaInfoDto,
} from "@/api/department";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
  currentArea: AreaInfoDto | undefined;
}>();

/* ***************************** 基础数据 ********************************* */
/**
 * 加载机构下的所有部门
 */
const allDepartmentData = ref<DepartmentTreeDto[]>([]);
function loadAllDepartmentData() {
  const params = { id: props.defaultInstitute.id };
  DepartmentAPI.listDepartmentByTree(params).then((data) => {
    allDepartmentData.value = data || [];
    // 加载后执行渲染
    handleQuery();
  });
}

/* ***************************** 搜索表单 ********************************* */
/**
 * 名称搜索
 */
const searchNameText = ref<string>("");
watch(
  () => searchNameText.value,
  () => {
    // console.log("searchNameText.value", searchNameText.value);
    handleQuery();
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
    handleQuery();
  }
);

/* ***************************** 数据表格 ********************************* */
// 扩展部分属性
interface DepartmentTableItem extends DepartmentTreeDto {
  showUnlink: boolean; // 显示取消关联按钮（否则显示删除按钮）
}
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableData = ref<DepartmentTableItem[]>([]);

/**
 * 数据查询
 */
function handleQuery() {
  // console.log("handleQuery", props.currentArea, );
  tableData.value = handleFilter(allDepartmentData.value);
}
/**
 * 条件过滤
 */
function handleFilter(list: DepartmentTreeDto[]): DepartmentTableItem[] {
  return list
    .map((item: DepartmentTreeDto) => {
      const temp = { ...item } as DepartmentTableItem;
      // 过滤子节点
      if (temp.children && temp.children.length > 0) {
        temp.children = handleFilter(temp.children);
      }
      // 显示取消关联按钮
      temp.showUnlink = false;
      if (
        props.currentArea &&
        !props.currentArea.defaulted &&
        item.areaId === props.currentArea.id
      ) {
        temp.showUnlink = true;
      }
      return temp;
    })
    .filter((item: DepartmentTableItem) => {
      // 有子节点，则需要显示
      if (item.children && item.children.length > 0) {
        return true;
      }
      // 没子节点时，需要根据条件判断
      if (props.currentArea && item.areaId !== props.currentArea.id) {
        return false;
      }
      if (item.deptName && !item.deptName.includes(searchNameText.value)) {
        return false;
      }
      if (item.deptCode && !item.deptCode.includes(searchCodeText.value)) {
        return false;
      }
      return true;
    });
}

/* ***************************** 其他操作 ********************************* */
/**
 * 展示：编辑弹窗
 */
const departmentFormRef = ref(DepartmentInfoForm);
function handleOpenInfoEditDialog(row: DepartmentTableItem) {
  // console.log("handleOpenInfoEditDialog", row);
  const params = { ...row } as DepartmentInfoParam;
  departmentFormRef.value.openDialog(params);
}
/**
 * 操作：取消关联
 */
function handleUnlink(row: DepartmentTableItem) {
  // console.log("handleUnlink", row);
  DepartmentAPI.unlinkDepartmentAreaInfo({ id: row.id }).then((_data) => {
    ElMessage.success("取消关联成功");
    loadAllDepartmentData();
  });
}

/**
 * 操作：删除
 */
function handleDelete(row: DepartmentTableItem) {
  // console.log("handleDelete", row);
  DepartmentAPI.deleteDepartmentInfo({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    loadAllDepartmentData();
  });
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
      // console.log("department watchEffect props.defaultInstitute.id", props.defaultInstitute.id);
      searchNameText.value = "";
      searchCodeText.value = "";
      loadAllDepartmentData();
    }
  },
  {
    immediate: true,
  }
);
watch(
  () => props.currentArea,
  () => {
    // console.log("department watchEffect props.currentArea", props.currentArea);
    handleQuery();
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
  const tableHeight = Math.max(200, window.innerHeight - 250);
  tableMaxHeight.value = `${tableHeight}px`;

  // handleQuery();
});
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  loadAllDepartmentData,
});
</script>
