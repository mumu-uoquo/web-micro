<template>
  <el-form :disabled="readOnly">
    <el-row :gutter="20">
      <el-col :lg="8" :xs="24" class="mb-[12px]">
        <el-input v-model="filterText" placeholder="请输入名称过滤" clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-scrollbar :max-height="treeMaxHeight">
          <el-tree
            ref="menuTreeRef"
            :data="menuData"
            :props="{
              label: 'moduleName',
              children: 'children',
              disabled: 'disabled',
            }"
            node-key="id"
            show-checkbox
            default-expand-all
            highlight-current
            :check-strictly="true"
            :expand-on-click-node="false"
            :filter-node-method="handleFilter"
            @node-click="handleNodeClick"
            @check="handleNodeCheck"
          />
        </el-scrollbar>
      </el-col>
      <el-col :lg="16" :xs="24">
        <ElTable
          ref="actionTableRef"
          :data="actionTableData"
          row-key="id"
          empty-text=""
          :stripe="true"
          :border="true"
          @select="handleTableSelect"
          @select-all="handleTableSelect"
        >
          <el-table-column type="selection" :selectable="() => !readOnly" width="55" />
          <el-table-column label="按钮" prop="moduleName" width="200" />
          <el-table-column label="描述" prop="description" />
        </ElTable>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect, onMounted } from "vue";
import { ElMessage, ElTable } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import RoleAPI, { RoleInfoDto, RoleModuleParam, ModuleInfoDto } from "@/api/role";
import { ModuleTreeDto } from "@/api/module";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义属性
const props = defineProps<{
  moduleData: ModuleTreeDto[];
  roleInfo: RoleInfoDto;
  readOnly: boolean;
}>();

// 扩展属性
interface ModuleTreeItemDto extends ModuleTreeDto {
  disabled?: boolean;
}
const menuTreeRef = ref(ElTree);
const menuData = ref<ModuleTreeItemDto[]>([]);
const menuLatestClickNode = ref<ModuleTreeDto>();
const actionMap = new Map<string, ModuleInfoDto[]>();
const actionTableData = ref<ModuleInfoDto[]>([]);
const treeMaxHeight = ref("auto");

/* ***************************** 初始数据 ********************************* */
/**
 * 解析菜单
 */
function parseMenuTree(modules: ModuleTreeDto[], disabled: boolean): ModuleTreeItemDto[] {
  return modules
    .filter((item: ModuleTreeDto) => {
      return DictionaryEnum.MODULE_TYPE_MENU == item.moduleType;
    })
    .map((item: ModuleTreeDto) => {
      let children: ModuleTreeDto[] = [];
      if (item.children && item.children.length > 0) {
        children = parseMenuTree(item.children, disabled);
      }
      const temp = { ...item } as ModuleTreeItemDto;
      temp.children = children;
      temp.disabled = disabled;
      return temp;
    });
}

/**
 * 解析功能按钮
 */
function parseActionData(modules: ModuleTreeDto[]) {
  modules
    .filter((item: ModuleTreeDto) => {
      return DictionaryEnum.MODULE_TYPE_MENU == item.moduleType;
    })
    .forEach((item: ModuleTreeDto) => {
      // 没有子节点，则不处理
      if (!item.children || item.children.length == 0) {
        return;
      }
      // 查找子节点中的功能按钮
      const children: ModuleInfoDto[] = [];
      item.children
        .filter((item: ModuleTreeDto) => {
          return DictionaryEnum.MODULE_TYPE_BUTTON == item.moduleType;
        })
        .forEach((child: ModuleTreeDto) => {
          const temp = { ...child } as ModuleInfoDto;
          children.push(temp);
        });
      if (children.length > 0) {
        actionMap.set(item.id, children);
      }
      // 递归处理子节点中的菜单
      parseActionData(item.children);
    });
}

/* ***************************** 模块树操作 ********************************* */
/**
 * 加载选中的模块
 */
const checkedModuleKeys = ref<string[]>([]); // 当前选中的
function loadSelectModule(roleId: string) {
  if (!roleId) {
    return;
  }
  RoleAPI.listRoleSelectedModule({ id: roleId }).then((data) => {
    checkedModuleKeys.value = data!.map((item) => item.id);
    // 变更菜单树选中效果
    menuTreeRef.value!.setCheckedKeys(checkedModuleKeys.value, true);
    // 变更按钮表选中效果
    if (menuLatestClickNode.value) {
      loadSelectedAction(menuLatestClickNode.value.id);
    }
  });
}

/**
 * 节点筛选
 */
const filterText = ref<string>("");
watch(
  () => filterText.value,
  () => {
    menuTreeRef.value!.filter(filterText.value);
  }
);
function handleFilter(value: string, data: any, _node: any): boolean {
  if (!value) {
    return true;
  }
  return (data as ModuleTreeDto).moduleName!.indexOf(value) !== -1;
}
/**
 * 节点单击
 */
function handleNodeClick(node: ModuleTreeItemDto) {
  if (menuLatestClickNode.value && menuLatestClickNode.value.id == node.id) {
    return;
  }
  // console.log("handleNodeClick", node);
  menuLatestClickNode.value = node;
  loadSelectedAction(node.id);
}
/**
 * 节点选中
 */
function handleNodeCheck(node: ModuleTreeDto, params: any) {
  // 当前节点选中状态
  const checked = params.checkedKeys!.includes(node.id);
  // 保存
  updateModuleRoleRelation([node.id], checked);
}

/* ***************************** 功能表格操作 ********************************* */
const actionTableRef = ref(ElTable);
/**
 * 功能按钮选中/取消
 */
function handleTableSelect(val: any) {
  const oldSelectKeys: string[] = actionTableData.value
    .filter((item) => checkedModuleKeys.value.includes(item.id))
    .map((item) => {
      return item.id;
    });
  const newSelectKeys: string[] = val.map((item: ModuleInfoDto) => item.id);
  // 筛选变化的模块ID（补集）
  const moduleIds = oldSelectKeys
    .filter(function (v) {
      return !newSelectKeys.includes(v);
    })
    .concat(
      newSelectKeys.filter(function (v) {
        return !oldSelectKeys.includes(v);
      })
    );
  // console.log("handleTableSelect", moduleIds);
  const checked = true; // 暂时无用
  updateModuleRoleRelation(moduleIds, checked);
}

/**
 * 显示指定菜单下的按钮选中情况
 */
function loadSelectedAction(menuId: string) {
  actionTableRef.value.clearSelection();
  const actionData = actionMap.get(menuId) || [];
  // 要等表格数据渲染完毕，再回显选中状态，所以需要setTimeout来延迟
  setTimeout(() => {
    actionData
      .filter((item) => checkedModuleKeys.value.includes(item.id))
      .forEach((item) => {
        actionTableRef.value.toggleRowSelection(item, true);
      });
  }, 50);
  actionTableData.value = actionData;
}

/**
 * 保存提交授权信息
 */
function updateModuleRoleRelation(moduleIds: string[], checked: boolean) {
  if (!moduleIds || moduleIds.length == 0) {
    return;
  }

  const params = {
    roleId: props.roleInfo.id,
    moduleIds,
    checked,
  } as RoleModuleParam;
  // console.log("updateModuleRoleRelation", params);
  RoleAPI.updateModuleRoleRelation(params).then((_res) => {
    ElMessage.success("授权成功");
    loadSelectModule(props.roleInfo.id);
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 */
watchEffect(() => {
  menuData.value = parseMenuTree(props.moduleData, true);
  parseActionData(props.moduleData);
});
watch(
  () => props.readOnly,
  () => {
    // console.log("watchEffect props.readOnly", props.readOnly);
    menuData.value = parseMenuTree(props.moduleData, props.readOnly);
  }
  // {
  //   immediate: true,
  // }
);
watch(
  () => props.roleInfo,
  () => {
    menuTreeRef.value!.setCheckedKeys([], false);
    menuTreeRef.value!.setCurrentKey(null);
    actionTableData.value = [];
    menuLatestClickNode.value = undefined;
    loadSelectModule(props.roleInfo!.id);
  }
);
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const viewportHeight = window.innerHeight;
  const otherElementsHeight = 332; // 页面上其他元素的高度（如标题、分页等）
  treeMaxHeight.value = `${viewportHeight - otherElementsHeight}px`;
});
</script>
