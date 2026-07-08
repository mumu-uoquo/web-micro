<!-- 部门树 -->
<template>
  <el-input v-model="filterText" placeholder="名称" clearable />

  <el-scrollbar :max-height="treeMaxHeight">
    <ElTree
      ref="treeRef"
      :data="treeData"
      :props="{
        label: 'moduleName',
        children: 'children',
      }"
      node-key="id"
      accordion
      highlight-current
      class="menu-item"
      :current-node-key="currentNode"
      :default-expanded-keys="[currentNode]"
      :expand-on-click-node="false"
      :filter-node-method="handleFilter"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <MenuIcon :icon="data.icon" />
        <span class="ml-1">{{ node.label }}</span>
      </template>
    </ElTree>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted } from "vue";
import { ElTree } from "element-plus";
import { ModuleTreeDto } from "@/api/module";
import MenuIcon from "@/components/MenuIcon/index.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["node-click"]);
// 暴露给父级的自定义属性
const props = defineProps({
  moduleData: {
    type: Array as PropType<ModuleTreeDto[]>,
    required: true,
  },
  currentNode: {
    type: String,
    default: "",
  },
});

// 树形结构
const treeRef = ref(ElTree);
// 搜索框
const filterText = ref<string>("");
const treeMaxHeight = ref("auto");

/**
 * 筛选
 */
function handleFilter(value: string, data: any) {
  if (!value) {
    return true;
  }
  return data.moduleName.indexOf(value) !== -1;
}

/**
 * 单击节点
 */
function handleNodeClick(param: any) {
  emits("node-click", param); // 触发自定义事件
}

/**
 * 解析数据：去除children为空节点时的children属性
 */
const treeData = ref<ModuleTreeDto[]>([]);
function parseData(data: ModuleTreeDto[]): ModuleTreeDto[] {
  return data.map((item) => {
    let children = null;
    if (item.children && item.children.length > 0) {
      children = parseData(item.children);
    }
    return { ...item, children } as ModuleTreeDto;
  });
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 */
watchEffect(
  () => {
    treeRef.value.filter(filterText.value);
    treeRef.value.setCurrentKey(props.currentNode);
  },
  {
    flush: "post", // watchEffect会在DOM挂载或者更新之前就会触发，此属性控制在DOM元素更新后运行
  }
);
watch(
  () => props.moduleData,
  (newVal) => {
    // 去除无子节点的children属性，防止el-tree组件显示三角符号
    treeData.value = parseData(newVal ?? []);
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
  const viewportHeight = window.innerHeight;
  const otherElementsHeight = 0; // 页面上其他元素的高度（如标题、分页等）
  treeMaxHeight.value = `${viewportHeight - otherElementsHeight}px`;
});
</script>

<style lang="scss" scoped>
.menu-item {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  font-size: var(--el-menu-item-font-size);
  color: var(--el-menu-text-color);
  white-space: nowrap;
  cursor: pointer;
  // padding: 0 var(--el-menu-base-level-padding);
  list-style: none;
  transition:
    border-color var(--el-transition-duration),
    background-color var(--el-transition-duration),
    color var(--el-transition-duration);
}
.menu-item:hover,
.menu-item:focus {
  outline: none;
}
.menu-item {
  .is-current {
    color: var(--el-menu-active-color);
  }

  .el-icon {
    width: 1em !important;
    margin-right: 0 !important;
    font-size: 18px;
    color: currentcolor;
  }

  [class^="i-svg:"] {
    width: 18px;
    height: 18px;
    font-size: 18px;
    color: currentcolor !important;
  }
}
/* 隐藏没有实际子元素的三角图标 */
.menu-item :deep(.el-tree-node__expand-icon.is-leaf) {
  visibility: hidden;
}
</style>
