<template>
  <el-card shadow="never" class="table-container">
    <el-table
      v-loading="tableLoading"
      :data="tableData"
      :max-height="tableMaxHeight"
      style="width: 100%"
      border
    >
      <el-table-column label="序号" type="index" width="60" align="center" />
      <el-table-column prop="instituteName" width="" show-overflow-tooltip>
        <template #header>
          <el-row>
            <el-col :span="4">名称</el-col>
            <el-col :span="20">
              <el-input
                v-model="searchText"
                size="small"
                clearable
                placeholder="名称搜索"
                :prefix-icon="Search"
              />
            </el-col>
          </el-row>
        </template>
      </el-table-column>
      <el-table-column
        label="地区"
        prop="districtCode"
        width="200"
        :formatter="(row) => formatArea(row.districtCode)"
        show-overflow-tooltip
      />
      <el-table-column label="类型" prop="instituteType" width="70" align="center">
        <template #default="{ row }">
          <DictTag :code="row.instituteType" />
        </template>
      </el-table-column>
      <el-table-column label="分组" prop="roleGroup" width="100" align="center">
        <template #default="{ row }">
          <DictTag :code="row.roleGroup" />
        </template>
      </el-table-column>
      <el-table-column label="状态" prop="status" width="80" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            active-text="正常"
            inactive-text="停用"
            :active-value="DictionaryEnum.INSTITUTE_STATUS_NORMAL"
            :inactive-value="DictionaryEnum.INSTITUTE_STATUS_DISABLE"
            :disabled="scope.row.isSystemTemplate"
            :style="`--el-switch-on-color: #409EFF; --el-switch-off-color: ${scope.row.isSystemTemplate ? 'rgb(242.5, 208.5, 157.5)' : 'rgb(237.5, 189.9, 118.5)'} `"
            inline-prompt
            @change="handleChangeState(scope.$index, scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="录入时间"
        prop="createTime"
        width="160"
        align="center"
        :formatter="(row) => formatDate(row.createTime, 'YYYY-MM-DD HH:mm:ss')"
      />
      <el-table-column label="操作" width="110" align="center" fixed="right">
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
          <el-tooltip content="配置">
            <el-button
              link
              size="small"
              type="success"
              :icon="Tools"
              @click="handleOpenConfigDialog(scope.row)"
            />
          </el-tooltip>
          <el-popconfirm
            :icon="WarnTriangleFilled"
            icon-color="red"
            :title="`您确定要删除吗？【${scope.row.instituteName}】`"
            width="160"
            @confirm="handleDelete(scope.row)"
          >
            <template #reference>
              <el-button link size="small" type="danger" :disabled="scope.row.isSystemTemplate">
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
  <!-- 机构表单页面 -->
  <AdminInstituteInfoForm
    ref="instituteFormRef"
    :default-institute="props.defaultInstitute"
    :area-data="props.areaData"
    @on-submit="handleQuery"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import DictTag from "@/components/DictTag/index.vue";
import { formatDate } from "@/utils/format";
import AdminInstituteInfoForm from "./AdminInstituteInfoForm.vue";
import { Edit, Delete, Search, Tools, WarnTriangleFilled } from "@element-plus/icons-vue";
import AdminInstituteAPI, {
  InstituteInfoDto,
  InstituteListParam,
  InstituteStateParam,
} from "@/api/adminInstitute";
import { SysAreaDto } from "@/api/system";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
// const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
  areaData: SysAreaDto[];
}>();

/* ***************************** 搜索表单 ********************************* */
// const queryFormRef = ref(ElForm);
const queryParams = reactive<InstituteListParam>({
  pageNum: 1,
  pageSize: 20,
});

/**
 * 关键字搜索
 */
const searchText = ref<string>("");
watch(
  () => searchText.value,
  () => {
    // console.log("searchText.value", searchText.value);
    queryParams.pageNum = 1;
    handleQuery();
  }
);
/**
 * 重置查询
 */
function handleResetQuery() {
  // console.log("handleResetQuery");
  queryParams.pageNum = 1;
  searchText.value = "";
  handleQuery();
}
// /**
//  * 提交查询
//  */
// function handleSubmitQuery() {
//   queryParams.pageNum = 1;
//   handleQuery();
// }

/* ***************************** 数据表格 ********************************* */
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableDataTotal = ref<number>(0);
const tableData = ref<InstituteInfoDto[]>([]);

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
  tableLoading.value = true;
  // console.log("handleQuery", queryParams);
  queryParams.parentId = props.defaultInstitute.id;
  queryParams.instituteName = searchText.value;
  AdminInstituteAPI.listInstituteByPage(queryParams)
    .then((data) => {
      tableDataTotal.value = data.total || 0;
      tableData.value = data.result || [];
    })
    .finally(() => {
      tableLoading.value = false;
    });
}

/**
 * 列格式化：所属地区
 */
function formatArea(code: string, areas: SysAreaDto[] = props.areaData): string {
  if (!code) {
    return "";
  }
  let result = "";
  const pre = code.substring(0, 2);
  areas
    .filter((item) => {
      return item.districtCode?.startsWith(pre);
    })
    .forEach((item) => {
      if (result !== "") {
        return;
      }
      if (item.districtCode === code) {
        result = item.fullName!;
        return;
      }
      if (item.children && item.children.length > 0) {
        const substr = formatArea(code, item.children);
        if (substr) {
          result = item.fullName! + " / " + substr;
        }
      }
    });
  return result;
}

/**
 * 变更：可用状态
 * change事件：传入的是变更后的值
 */
function handleChangeState(index: number, row: InstituteInfoDto) {
  const param = { id: row.id, status: row.status } as InstituteStateParam;
  AdminInstituteAPI.updateInstituteState(param)
    .then((_data) => {
      ElMessage.success("状态变更成功");
    })
    .catch((_e) => {
      const oldStatus =
        DictionaryEnum.INSTITUTE_STATUS_NORMAL == row.status
          ? DictionaryEnum.INSTITUTE_STATUS_DISABLE
          : DictionaryEnum.INSTITUTE_STATUS_NORMAL;
      tableData.value[index].status = oldStatus; // 还原变更前的值
    });
}

/* ***************************** 其他操作 ********************************* */
/**
 * 展示：编辑弹窗
 */
const instituteFormRef = ref(AdminInstituteInfoForm);
function handleOpenInfoEditDialog(row: InstituteInfoDto) {
  // console.log("handleOpenInfoEditDialog", row);
  const params = { id: row.id };
  AdminInstituteAPI.getInstituteInfo(params).then((data) => {
    instituteFormRef.value.openDialog(data);
  });
}

/**
 * 展示：配置弹窗
 */
// const infoAuthFormRef = ref(RoleInfoAuthForm);
function handleOpenConfigDialog(row: InstituteInfoDto) {
  console.log("handleOpenConfigDialog", row);
  // infoAuthFormRef.value.openDialog(row);
}

/**
 * 操作：删除
 */
function handleDelete(row: InstituteInfoDto) {
  // console.log("handleDelete", row);
  AdminInstituteAPI.deleteInstituteInfo({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    handleQuery();
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
      // console.log("watchEffect props.defaultInstitute.id", props.defaultInstitute.id);
      handleResetQuery();
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
  const tableHeight = Math.max(200, window.innerHeight - 316);
  tableMaxHeight.value = `${tableHeight}px`;

  // handleQuery();
});
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  handleResetQuery,
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
