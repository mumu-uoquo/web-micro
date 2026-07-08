<template>
  <div class="app-container">
    <div class="search-bar">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="60px">
        <el-form-item prop="instituteId" label="机构">
          <el-select
            v-model="queryParams.instituteId"
            placeholder="请选择"
            value-key="id"
            filterable
            clearable
            remote
            remote-show-suffix
            :remote-method="autoCompleteInstitute"
          >
            <el-option
              v-for="item in instituteList"
              :key="item.id"
              :label="item.instituteName"
              :value="item.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="appName" label="名称">
          <el-input v-model="queryParams.appName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item prop="appkey" label="账号">
          <el-input v-model="queryParams.appkey" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item prop="moduleId" label="平台">
          <el-select v-model="queryParams.moduleId" placeholder="请选择" clearable>
            <el-option
              v-for="item in moduleList"
              :key="item.id"
              :label="item.moduleName"
              :value="item.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSubmitQuery">搜索</el-button>
          <el-button :icon="CircleClose" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-card shadow="never" class="table-container">
      <template #header>
        <div class="flex-x-between">
          <div>
            <el-button type="success" :icon="Plus" @click="handleOpenInfoAddDialog">新增</el-button>
          </div>
          <div>
            <el-button :icon="Refresh" circle title="刷新" @click="handleQuery()" />
            <el-popover placement="bottom" trigger="click">
              <template #reference>
                <el-button :icon="Operation" circle title="筛选列" />
              </template>
              <el-scrollbar max-height="350px">
                <el-checkbox v-model="cols.index" value="true" label="序号" />
                <el-checkbox v-model="cols.appName" value="true" label="名称" />
                <el-checkbox v-model="cols.instituteName" value="true" label="机构" />
                <el-checkbox v-model="cols.appkey" value="true" label="账号" />
                <el-checkbox v-model="cols.secret" value="true" label="私钥" />
                <el-checkbox v-model="cols.moduleId" value="true" label="平台" />
                <el-checkbox v-model="cols.templateType" value="true" label="模板" />
                <el-checkbox v-model="cols.status" value="true" label="状态" />
              </el-scrollbar>
            </el-popover>
          </div>
        </div>
      </template>
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        style="width: 100%"
        border
        :max-height="tableMaxHeight"
      >
        <el-table-column v-if="cols.index" type="index" label="序号" width="80" align="center" />
        <el-table-column
          v-if="cols.appName"
          prop="appName"
          label="名称"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="cols.instituteName"
          prop="instituteName"
          label="机构"
          width="260"
          show-overflow-tooltip
        />
        <el-table-column
          v-if="cols.appkey"
          prop="appkey"
          label="账号"
          width=""
          align="center"
          :formatter="columnFormatterSensitive"
        />
        <el-table-column
          v-if="cols.secret"
          prop="secret"
          label="私钥"
          width=""
          align="center"
          :formatter="columnFormatterSensitive"
        />
        <el-table-column
          v-if="cols.moduleId"
          prop="moduleId"
          label="平台"
          width="140"
          align="center"
        >
          <template #default="{ row }">
            <el-tag v-show="!row.moduleName || row.moduleName == ''" type="success">不限</el-tag>
            <el-tag v-show="row.moduleName && row.moduleName != ''" type="primary">
              {{ row.moduleName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="cols.templateType"
          prop="templateType"
          label="模板"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-switch
              v-model="row.templateType"
              :disabled="row.isSystemTemplate"
              active-text="是"
              inactive-text="否"
              :active-value="DictionaryEnum.TEMPLATE_TYPE_NORMAL"
              :inactive-value="DictionaryEnum.TEMPLATE_TYPE_NONE"
              :style="`--el-switch-on-color: #409EFF; --el-switch-off-color: ${row.isSystemTemplate ? 'rgb(242.5, 208.5, 157.5)' : 'rgb(237.5, 189.9, 118.5)'} `"
              inline-prompt
              :before-change="() => handleBeforeChangeTemplate(row)"
            />
          </template>
        </el-table-column>
        <el-table-column v-if="cols.status" prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-text="可用"
              inactive-text="禁用"
              :active-value="DictionaryEnum.STATE_NORMAL"
              :inactive-value="DictionaryEnum.STATE_DISABLE"
              :disabled="scope.row.isSystemTemplate"
              :style="`--el-switch-on-color: #409EFF; --el-switch-off-color: ${scope.row.isSystemTemplate ? 'rgb(242.5, 208.5, 157.5)' : 'rgb(237.5, 189.9, 118.5)'} `"
              inline-prompt
              @change="handleChangeState(scope.$index, scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-tooltip content="编辑">
              <el-button
                link
                size="small"
                type="primary"
                :icon="Edit"
                :disabled="scope.row.isSystemTemplate"
                @click="handleOpenInfoEditDialog(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="复制">
              <el-button
                link
                size="small"
                type="success"
                :icon="CopyDocument"
                :disabled="scope.row.isSystemTemplate"
                @click="handleCopy(scope.row)"
              />
            </el-tooltip>
            <el-tooltip content="授权">
              <el-button
                link
                size="small"
                type="warning"
                :icon="Finished"
                class="btn-color-purple"
                @click="handleOpenAuthDialog(scope.row)"
              />
            </el-tooltip>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要删除吗？【${scope.row.appName}】`"
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
    <AppInfoAddForm
      ref="infoAddFormRef"
      :module-list="moduleList"
      :default-institute="defaultInstitute"
      @on-submit="handleQuery"
    />
    <AppInfoEditForm ref="infoEditFormRef" :module-list="moduleList" @on-submit="handleQuery" />
    <el-dialog
      v-model="authDialogVisible"
      title="授权"
      :close-on-click-modal="false"
      draggable
      @close="handleCloseAuthDialog"
    >
      <AppPermission :info-data="authInfoData" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useClipboard } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import {
  Plus,
  Edit,
  Delete,
  Search,
  CircleClose,
  Refresh,
  Operation,
  CopyDocument,
  Finished,
  WarnTriangleFilled,
} from "@element-plus/icons-vue";
import InstituteAPI, { InstituteListParam, InstituteInfoDto } from "@/api/institute";
import SystemAPI, {
  AppInfoListParam,
  AppInfoParam,
  AppInfoDto,
  AppInfoStateParam,
} from "@/api/system";
import ModuleAPI, { ModuleInfoDto } from "@/api/module";
import AppInfoAddForm from "./components/AppInfoAddForm.vue";
import AppInfoEditForm from "./components/AppInfoEditForm.vue";
import AppPermission from "./components/AppPermission.vue";
import { useUserStore } from "@/stores";

/* ***************************** 参数定义 ********************************* */
// 表格显示的列
const cols = ref({
  index: true,
  appName: true,
  instituteName: true,
  appkey: true,
  secret: true,
  moduleId: true,
  templateType: true,
  status: true,
});

/* ***************************** 初始数据 ********************************* */
/**
 * 加载自己所属机构
 */
const defaultInstitute = ref<InstituteInfoDto>({ id: "", instituteName: "" });
async function loadDefaultInstititute() {
  const user = await useUserStore().getUserInfo();
  defaultInstitute.value = {
    id: user.instituteId,
    instituteName: user.instituteName,
    roleGroup: user.roleGroup,
  } as InstituteInfoDto;
}

/* ***************************** 搜索表单 ********************************* */
const queryFormRef = ref(ElForm);
const queryParams = reactive<AppInfoListParam>({
  pageNum: 1,
  pageSize: 20,
});
const moduleList = ref<ModuleInfoDto[]>([]);

/**
 * 获取根模块列表
 */
function getRootModuleList() {
  ModuleAPI.listModuleByRoot().then((data) => {
    moduleList.value = data;
  });
}

/**
 * 自动加载：机构列表
 */
const instituteList = ref<InstituteInfoDto[]>([]);
function autoCompleteInstitute(keyword: string) {
  if (!keyword || keyword == "") {
    instituteList.value = [defaultInstitute.value];
    return;
  }
  const param = { pageNum: 1, pageSize: 10, instituteName: keyword } as InstituteListParam;
  InstituteAPI.listInstituteByAbbr(param).then((data) => {
    instituteList.value = data;
  });
}

/**
 * 重置查询
 */
function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.pageNum = 1;
  handleQuery();
}

/**
 * 提交查询
 */
function handleSubmitQuery() {
  queryParams.pageNum = 1;
  handleQuery();
}

/* ***************************** 数据表格 ********************************* */
// 扩展部分属性
interface AppTableItem extends AppInfoDto {
  isSystemTemplate: boolean;
}
const tableLoading = ref<boolean>(false);
const tableMaxHeight = ref("auto");
const tableDataTotal = ref<number>(0);
const tableData = ref<AppTableItem[]>([]);

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
  SystemAPI.listAppInfoByPage(queryParams)
    .then((data) => {
      tableDataTotal.value = data.total || 0;
      // 数据格式化
      tableData.value = data.result!.map((item: AppInfoDto) => {
        const temp: AppTableItem = { ...item } as AppTableItem;
        if (
          item.templateType != DictionaryEnum.TEMPLATE_TYPE_NORMAL &&
          item.templateType != DictionaryEnum.TEMPLATE_TYPE_NONE
        ) {
          temp.templateType = DictionaryEnum.TEMPLATE_TYPE_NONE; // 因为switch开关只接收两个值，所以此处将系统模板设置为“无模板”
          temp.isSystemTemplate = true;
        } else {
          temp.isSystemTemplate = false;
        }
        return temp;
      });
    })
    .finally(() => {
      tableLoading.value = false;
    });
}

/**
 * 列格式化：脱敏展示
 */
function columnFormatterSensitive(row: AppTableItem, column: any, cellValue: any, _index: number) {
  return cellValue.replace(/(\S{4})\S*(\S{4})/, "$1****$2"); // 只显示前四位和后四位
}

/**
 * 变更：模板类型
 * before-change事件，传入的是变更前值
 */
function handleBeforeChangeTemplate(row: AppTableItem): Promise<boolean> {
  const newType =
    DictionaryEnum.TEMPLATE_TYPE_NORMAL == row.templateType
      ? DictionaryEnum.TEMPLATE_TYPE_NONE
      : DictionaryEnum.TEMPLATE_TYPE_NORMAL;
  const param = { id: row.id, appName: row.appName, templateType: newType } as AppInfoParam;
  return new Promise((resolve) => {
    // 系统模板：不允许变更
    if (row.isSystemTemplate) {
      ElMessage.warning("系统模板无法变更");
      return resolve(false); // 阻止变更
    }
    // 变更为模板：直接操作
    if (row.templateType == DictionaryEnum.TEMPLATE_TYPE_NONE) {
      SystemAPI.updateAppInfoTemplateType(param)
        .then((_data) => {
          ElMessage.success("模板变更成功");
          return resolve(true);
        })
        .catch((_e) => {
          return resolve(false); // 阻止变更
        });
      return;
    }
    // 取消模板：需要确认
    ElMessageBox.confirm(
      `取消模板后，将同步收回该模板给其他应用的授权，您确定要取消模板[${row.appName}]吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        SystemAPI.updateAppInfoTemplateType(param)
          .then((_data) => {
            ElMessage.success("模板变更成功");
            return resolve(true);
          })
          .catch((_e) => {
            return resolve(false); // 阻止变更
          });
      })
      .catch((_e) => {
        return resolve(false); // 阻止变更
      });
  });
}

/**
 * 变更：可用状态
 * change事件：传入的是变更后的值
 */
function handleChangeState(index: number, row: AppTableItem) {
  const param = { id: row.id, status: row.status } as AppInfoStateParam;
  SystemAPI.updateAppInfoState(param)
    .then((_data) => {
      ElMessage.success("状态变更成功");
    })
    .catch((_e) => {
      const oldStatus =
        DictionaryEnum.STATE_NORMAL == row.status
          ? DictionaryEnum.STATE_DISABLE
          : DictionaryEnum.STATE_NORMAL;
      tableData.value[index].status = oldStatus; // 还原变更前的值
    });
}

/* ***************************** 授权操作 ********************************* */
const authDialogVisible = ref<boolean>(false);
const authInfoData = ref<AppInfoDto>({ id: "" });

/**
 * 授权弹窗：关闭
 */
function handleCloseAuthDialog() {
  authDialogVisible.value = false;
}

/**
 * 授权弹窗：展示
 */
function handleOpenAuthDialog(row: AppTableItem) {
  const data = { ...row } as AppInfoDto;
  // 如果是系统模板，需要将模板标识改为“系统模板”
  if (row.isSystemTemplate) {
    data.templateType = DictionaryEnum.TEMPLATE_TYPE_SYSTEM;
  }
  authInfoData.value = data;
  authDialogVisible.value = true;
}

/* ***************************** 其他操作 ********************************* */
/**
 * 展示：新增弹窗
 */
const infoAddFormRef = ref(AppInfoAddForm);
function handleOpenInfoAddDialog() {
  infoAddFormRef.value.openDialog();
}
/**
 * 展示：编辑弹窗
 */
const infoEditFormRef = ref(AppInfoEditForm);
function handleOpenInfoEditDialog(row: AppTableItem) {
  const data = { ...row } as AppInfoDto;
  // 如果是系统模板，则不能编辑
  if (row.isSystemTemplate) {
    ElMessage.error("系统模板，不能编辑");
    return;
  }
  infoEditFormRef.value.openDialog(data);
}
/**
 * 操作：复制
 */
const { copy, copied } = useClipboard();
function handleCopy(row: AppTableItem) {
  const str = "APPKEY: " + row.appkey + "\nSECRET: " + row.secret;
  copy(str);
  if (copied) {
    ElMessage.success("复制成功");
  } else {
    ElMessage.error("复制失败");
  }
}

/**
 * 操作：删除
 */
function handleDelete(row: AppTableItem) {
  // 如果是系统模板，则不能删除
  if (row.isSystemTemplate) {
    ElMessage.error("系统模板，不能删除");
    return;
  }
  SystemAPI.deleteAppInfo({ id: row.id }).then((_data) => {
    ElMessage.success("删除成功");
    handleQuery();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "system-appkey",
  inheritAttrs: false,
});
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const tableHeight = Math.max(200, window.innerHeight - 320);
  tableMaxHeight.value = `${tableHeight}px`;

  handleQuery();
  getRootModuleList();
  loadDefaultInstititute();
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
// 搜索框的表单宽度
.search-bar {
  .el-input {
    --el-input-width: 220px;
  }

  .el-select {
    --el-select-width: 220px;
  }
}
// 自定义按钮颜色
.btn-color-purple {
  color: purple;
  opacity: 1;
  transition: opacity 0.3s;
}

.btn-color-purple:hover {
  color: purple;
  opacity: 0.5;
}
</style>
