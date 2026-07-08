<template>
  <el-card shadow="never">
    <template #header>
      <el-input v-model="filterText" size="small" placeholder="名称" clearable />
    </template>
    <!-- 机构树 -->
    <el-scrollbar :max-height="treeMaxHeight">
      <ElTree
        ref="treeRef"
        :data="treeData as any[]"
        :props="{
          label: 'instituteName',
          children: 'children',
          disabled: '',
        }"
        node-key="id"
        accordion
        highlight-current
        :current-node-key="currentNode"
        :default-expanded-keys="[currentNode]"
        :expand-on-click-node="false"
        :filter-node-method="handleFilter"
        @node-click="handleNodeClick"
      />
    </el-scrollbar>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watchEffect, onMounted } from "vue";
import { ElTree } from "element-plus";
/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["node-click"]);
// 暴露给父级的自定义属性
const props = defineProps({
  treeData: {
    type: Array,
    default: () => {
      return [];
    },
  },
  currentNode: {
    type: String,
    default: "",
  },
});

/* ***************************** 树形操作 ********************************* */
// 对象：树形结构
const treeRef = ref(ElTree);
// 值：搜索框
const filterText = ref<string>("");
const treeMaxHeight = ref("auto");

/**
 * 机构筛选
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

/* ***************************** 监听器等（需放在最后） ********************************* */
// 监听属性变化
watchEffect(
  () => {
    treeRef.value.filter(filterText.value);
    treeRef.value.setCurrentKey(props.currentNode);
  },
  {
    flush: "post", // watchEffect会在DOM挂载或者更新之前就会触发，此属性控制在DOM元素更新后运行
  }
);
/**
 * 页面加载时
 */
onMounted(() => {
  // 动态计算最大高度（例如：视口高度 - 其他元素高度）
  const viewportHeight = window.innerHeight;
  const otherElementsHeight = 220; // 页面上其他元素的高度（如标题、分页等）
  treeMaxHeight.value = `${viewportHeight - otherElementsHeight}px`;
});
</script>
