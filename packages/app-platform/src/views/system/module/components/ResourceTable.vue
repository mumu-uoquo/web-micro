<template>
  <el-card shadow="always" class="table-container">
    <template #header>
      <div class="flex-x-between">
        <div>
          <el-button type="primary" @click="openResourceForm()">新增</el-button>
          <el-button type="primary" @click="openResourceImport()">导入</el-button>
        </div>
        <div>
          <el-button :icon="Refresh" circle title="刷新" @click="loadResourceList()" />
        </div>
      </div>
    </template>

    <el-table :data="resourceList" :border="true" stripe style="width: 100%" height="350">
      <el-table-column label="资源名称" prop="resourceName" width="320" show-overflow-tooltip />
      <el-table-column label="资源地址" prop="resourceUrl" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="80" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openResourceForm(row)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-popconfirm
            :icon="WarnTriangleFilled"
            icon-color="red"
            title="您确定从模块中删除该资源吗？"
            @confirm="handleDeleteRelationResource(row)"
          >
            <template #reference>
              <el-button size="small" type="danger" link>
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
  </el-card>

  <!-- 新增编辑资源 -->
  <el-dialog
    v-model="resourceFormVisible"
    title="资源新增"
    :close-on-click-modal="false"
    draggable
    width="600px"
    @close="handleCloseResource"
  >
    <el-form
      ref="resourceFormRef"
      :model="resourceData"
      :rules="resourceRule"
      status-icon
      label-width="100px"
    >
      <el-form-item label="资源名称" prop="resourceName">
        <el-input v-model="resourceData.resourceName" autocomplete="off" clearable />
      </el-form-item>
      <el-form-item label="资源地址" prop="resourceUrl">
        <el-input v-model="resourceData.resourceUrl" autocomplete="off" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <span>
        <el-button @click="handleCloseResource">取 消</el-button>
        <el-button type="primary" @click="handleSubmitResource">确 定</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 资源库导入资源 -->
  <el-dialog
    v-model="resourceImportVisible"
    title="资源导入"
    :close-on-click-modal="false"
    draggable
  >
    <el-table
      ref="resourceImportTableRef"
      :data="resourceImportFilterData"
      row-key="id"
      :border="true"
      style="width: 100%"
      max-height="600"
      @selection-change="handleImportSelected"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="resourceName" label="资源名称" width="320" show-overflow-tooltip />
      <el-table-column prop="resourceUrl" show-overflow-tooltip>
        <template #header>
          <el-row>
            <el-col :span="6">资源地址</el-col>
            <el-col :span="16">
              <el-input
                v-model="resourceImportSearchText"
                size="small"
                clearable
                placeholder="URL 过滤"
              />
            </el-col>
          </el-row>
        </template>
      </el-table-column>
      <el-table-column fixed="right" align="center" label="操作" width="60">
        <template #default="scope">
          <el-popconfirm
            :icon="WarnTriangleFilled"
            icon-color="red"
            title="您确定完全删除该资源吗？"
            @confirm="handleDeleteResource(scope.$index, scope.row)"
          >
            <template #reference>
              <el-button size="small" type="danger" link>
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
      <span>
        <el-button @click="handleCloseImport">取 消</el-button>
        <el-button type="primary" @click="handleSubmitImport">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import type { TableInstance } from "element-plus";
import { WarnTriangleFilled, Refresh } from "@element-plus/icons-vue";
import ModuleAPI, { ResourceInfoDto, ResourceInfoParam, ModuleResourceParam } from "@/api/module";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义属性
const props = defineProps<{
  moduleId: string | undefined;
}>();

/* ***************************** 资源列表 ********************************* */
const resourceList = ref<ResourceInfoDto[]>([]);
/**
 * 加载资源列表
 */
function loadResourceList() {
  ModuleAPI.listModuleRelationResource({ id: props.moduleId || "" }).then((data) => {
    resourceList.value = data;
  });
}

/* ***************************** 资源增改 ********************************* */
const resourceFormVisible = ref(false);
// 初始表单数据
const initialFormData = ref<ResourceInfoParam>({
  id: "",
  relateId: "",
  resourceName: "",
  resourceUrl: "",
});
const resourceFormRef = ref(ElForm);
const resourceData = ref<ResourceInfoParam>({ ...initialFormData.value });
const resourceRule = ref({
  resourceName: [
    { required: true, message: "请输入资源名称", trigger: "blur" },
    { min: 1, max: 20, message: "不能超过20个字符", trigger: "blur" },
  ],
  resourceUrl: [
    { required: true, message: "请输入资源URL", trigger: "blur" },
    { min: 1, max: 100, message: "不能超过100个字符", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9/\_-]+$/, message: "不满足URL规则", trigger: "blur" }, // eslint-disable-line
  ],
});

/**
 * 打开资源表单
 */
function openResourceForm(row?: ResourceInfoDto) {
  resourceFormVisible.value = true;
  if (row) {
    Object.assign(resourceData.value, row);
  }
}

/**
 * 关闭资源表单
 */
function handleCloseResource() {
  resourceFormVisible.value = false;
  resourceFormRef.value.clearValidate();
  Object.assign(resourceData.value, initialFormData.value);
}

/**
 * 提交资源表单
 */
function handleSubmitResource() {
  resourceFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    resourceData.value.relateId = props.moduleId;
    if (resourceData.value.id && resourceData.value.id !== "") {
      ModuleAPI.updateResourceInfo(resourceData.value).then((_data) => {
        loadResourceList();
        resourceFormVisible.value = false;
      });
    } else {
      ModuleAPI.addResourceInfo(resourceData.value).then((_data) => {
        loadResourceList();
        // 不直接调用 handleCloseResource，采用改变显示状态来触发关闭，不然关闭方法会执行两次
        // handleCloseResource();
        resourceFormVisible.value = false;
      });
    }
  });
}

/**
 * 删除关联的资源
 */
function handleDeleteRelationResource(row: ResourceInfoDto) {
  ModuleAPI.deleteModuleRelationResource({ id: row.relateId || "" }).then((_data) => {
    loadResourceList();
  });
}

/* ***************************** 资源导入 ********************************* */
const resourceImportVisible = ref(false);
const resourceImportTableRef = ref<TableInstance>();
const resourceImportList = ref<ResourceInfoDto[]>([]);
const resourceImportSelected = ref<ResourceInfoDto[]>([]);
const resourceImportSearchText = ref<string>("");

/**
 * 表格数据
 * computed 模式会丢失选中状态
 */
//  const resourceImportFilterData = computed(() => {
//   return resourceImportList.value.filter(
//     (data) =>
//       !resourceImportSearchText.value ||
//       data.resourceUrl!.toLowerCase().includes(resourceImportSearchText.value.toLowerCase())
//   );
// });
const resourceImportFilterData = ref<ResourceInfoDto[]>([]);
watch(resourceImportSearchText, (_val: string) => {
  resourceImportFilterData.value = resourceImportList.value.filter(
    (data: ResourceInfoDto) =>
      !resourceImportSearchText.value ||
      data.resourceUrl!.toLowerCase().includes(resourceImportSearchText.value.toLowerCase())
  );
});

/**
 * 打开资源导入
 */
function openResourceImport() {
  ModuleAPI.listModuleNotRelationResource({ id: props.moduleId || "" }).then((data) => {
    resourceImportList.value = data;
    resourceImportFilterData.value = resourceImportList.value;
    resourceImportVisible.value = true;
  });
}

/**
 * 关闭资源导入
 */
function handleCloseImport() {
  resourceImportVisible.value = false;
  resourceImportList.value = [];
  resourceImportSelected.value = [];
  resourceImportFilterData.value = [];
  resourceImportSearchText.value = "";
}

/**
 * 选中资源
 */
function handleImportSelected(rows: ResourceInfoDto[]) {
  resourceImportSelected.value = rows;
}

/**
 * 删除资源
 */
function handleDeleteResource(index: number, row: ResourceInfoDto) {
  ModuleAPI.deleteResourceInfo({ id: row.id }).then((_data) => {
    // 删除页面行
    resourceImportList.value.splice(index, 1);
    // 删除选中值，保留其他选中项
    const selected = resourceImportSelected.value.filter(
      (val: ResourceInfoDto) => val.id !== row.id
    );
    resourceImportTableRef.value!.clearSelection();
    selected!.forEach((val: ResourceInfoDto) => {
      resourceImportTableRef.value!.toggleRowSelection(val, true);
    });
  });
}

/**
 * 提交资源导入
 */
function handleSubmitImport() {
  if (resourceImportSelected.value.length == 0) {
    ElMessage.warning("请选择需要关联的资源");
    return;
  }
  const resourceIdList = resourceImportSelected.value!.map((val: ResourceInfoDto) => val.id || "");
  const param: ModuleResourceParam = { moduleId: "", resourceIdList: [] };
  param.moduleId = props.moduleId || "";
  param.resourceIdList = resourceIdList;
  ModuleAPI.addModuleRelationResource(param).then((_data) => {
    loadResourceList();
    handleCloseImport();
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 */
watchEffect(() => {
  loadResourceList();
});
</script>

<style lang="scss" scoped>
// card中的表格铺满（因外层无元素，所以border不置为0）
// .table-container {
//   border: 0px;
// }
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
