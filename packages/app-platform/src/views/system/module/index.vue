<template>
  <div class="app-container">
    <el-row :gutter="10">
      <!-- 菜单树 -->
      <el-col :lg="4" :xs="24" class="mb-[10px]">
        <el-card :height="treeMaxHeight">
          <el-button
            v-hasPerm="['system-module-add']"
            type="primary"
            class="m-b-10px"
            @click="openModuleForm(null)"
          >
            新增
          </el-button>
          <ModuleTree
            :module-data="moduleTreeData"
            :current-node="currentModuleInfo.id"
            @node-click="getModuleInfo"
          />
        </el-card>
      </el-col>
      <el-col :lg="20" :xs="24">
        <!-- 详情 -->
        <el-card class="search-bar mb-[10px]">
          <el-form :model="currentModuleInfo" :inline="true" :disabled="true" label-width="100px">
            <el-form-item label="模块名称" prop="moduleName">
              <el-input v-model="currentModuleInfo.moduleName">
                <template #prepend>
                  <MenuIcon :icon="currentModuleInfo.icon || ''" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="currentModuleInfo.menuName" />
            </el-form-item>
            <el-form-item label="类型" prop="moduleType">
              <el-radio-group v-model="currentModuleInfo.moduleType">
                <el-radio-button value="005001">菜单</el-radio-button>
                <el-radio-button value="005002">按钮</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="模块编码" prop="moduleCode" :style="{ width: '50%' }">
              <el-input v-model="currentModuleInfo.moduleCode" />
            </el-form-item>
            <el-form-item label="排序" prop="sortIdx">
              <el-input v-model="currentModuleInfo.sortIdx" />
            </el-form-item>
            <el-form-item label="路由地址" prop="path" :style="{ width: '50%' }">
              <el-input v-model="currentModuleInfo.path" />
            </el-form-item>
            <el-form-item label="链接地址" prop="url" :style="{ width: '50%' }">
              <el-input v-model="currentModuleInfo.url" />
            </el-form-item>
            <el-form-item label="备注描述" prop="description" :style="{ width: '50%' }">
              <el-input v-model="currentModuleInfo.description" type="textarea" autosize />
            </el-form-item>
          </el-form>
          <div class="dialog-footer">
            <el-button
              v-hasPerm="'system-module:update'"
              type="primary"
              @click="openModuleForm(currentModuleInfo)"
            >
              编 辑
            </el-button>
            <el-button
              v-hasPerm="'system-module:delete'"
              type="danger"
              @click="handleDelete(currentModuleInfo.id)"
            >
              删 除
            </el-button>
          </div>
        </el-card>
        <!-- 资源 -->
        <ResourceTable :module-id="currentModuleInfo.id" />
      </el-col>
    </el-row>
    <!-- 新增菜单页面 -->
    <ModuleInfoForm ref="moduleFormRef" :module-data="moduleTreeData" @on-submit="loadModuleTree" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ModuleAPI, { ModuleInfoDto, ModuleTreeDto } from "@/api/module";
import AdminRoleAPI from "@/api/adminRole";
import MenuIcon from "@/components/MenuIcon/index.vue";
import ModuleTree from "./components/ModuleTree.vue";
import ModuleInfoForm from "./components/ModuleInfoForm.vue";
import ResourceTable from "./components/ResourceTable.vue";

const moduleTreeData = ref<ModuleTreeDto[]>([]); // 模块树数据
const moduleFormRef = ref(ModuleInfoForm); // 模块表单
const currentModuleInfo = ref<ModuleInfoDto>({ id: "" }); // 当前模块信息

const treeMaxHeight = ref<string>("auto");
/**
 * 加载当前的模块列表
 */
function loadModuleTree() {
  AdminRoleAPI.listModuleByTree().then((data) => {
    moduleTreeData.value = data;
    // 默认选中第一个节点
    if (!currentModuleInfo.value.id || currentModuleInfo.value.id == "") {
      getModuleInfo({ id: moduleTreeData.value[0].id });
    }
  });
}

/**
 * 获取模块信息
 */
function getModuleInfo(param: any) {
  ModuleAPI.getModuleInfo({ id: param.id }).then((data) => {
    currentModuleInfo.value = Object.assign({}, data);
  });
}

/**
 * 打开模块表单
 */
function openModuleForm(param: ModuleInfoDto | null) {
  // 新增时，以当前选中节点作为父节点
  if (param == null) {
    param = { id: "", parentId: currentModuleInfo.value.id } as ModuleInfoDto;
  }
  moduleFormRef.value.openDialog(param);
}

/**
 * 删除模块
 */
function handleDelete(id: string | undefined) {
  if (!id) {
    return;
  }
  ElMessageBox.confirm("确认删除此数据吗?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      ModuleAPI.deleteModuleInfo({ id }).then(() => {
        ElMessage.success("删除成功");
        currentModuleInfo.value = { id: "" };
        loadModuleTree();
      });
    },
    () => {
      ElMessage.info("已取消删除");
    }
  );
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "system-module",
  inheritAttrs: false,
});
/**
 * 页面加载时
 */
onMounted(() => {
  // 加载模块树
  loadModuleTree();
  // TODO 计算高
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const viewportHeight = window.innerHeight;
  const otherElementsHeight = 0; // 页面上其他元素的高度（如标题、分页等）
  treeMaxHeight.value = `${viewportHeight - otherElementsHeight}px`;
});
</script>

<style lang="scss" scoped>
.dialog-footer {
  padding: 0 20px 20px 0;
  margin-top: -50px;
  text-align: right;
}
</style>
