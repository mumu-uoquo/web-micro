<template>
  <div v-loading="props.loading" style="width: 100%">
    <el-table :data="model" border :height="height" :max-height="maxHeight" size="small">
      <el-table-column label="序号" type="index" width="60" align="center" />
      <el-table-column label="参数" prop="key" min-width="120" align="center">
        <template #default="{ row }">
          <el-input v-model="row.key" size="small" maxlength="20" clearable />
        </template>
      </el-table-column>
      <el-table-column label="内容" prop="val" min-width="120">
        <template #default="{ row }">
          <el-input v-model="row.val" size="small" maxlength="50" clearable />
        </template>
      </el-table-column>
      <el-table-column label="隐藏" prop="enabled" width="60" align="center">
        <template #default="{ row }">
          <el-checkbox v-model="row.enabled" />
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="description" min-width="120">
        <template #default="scope">
          <el-input v-model="scope.row.description" size="small" maxlength="50" clearable />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="60" align="center">
        <template #default="scope">
          <el-popconfirm
            :icon="WarnTriangleFilled"
            icon-color="red"
            width="160"
            :title="`您确定要删除吗？`"
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
        </template>
      </el-table-column>
    </el-table>
    <el-button :icon="Plus" style="width: 100%; margin-top: -14px" size="small" @click="onAddItem">
      添加
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from "vue";
import { Plus, Delete, WarnTriangleFilled } from "@element-plus/icons-vue";
import { ModuleParam } from "@/api/module";

/* ***************************** 参数定义 ********************************* */
// 父级组件绑定的v-modle
const model = defineModel({
  type: Array as () => ModuleParam[] | undefined,
  default: () => [],
});
// 暴露给父级的自定义事件
// const emits = defineEmits<{
//   (e: "on-add", row: MsgTemplateVariable): void;
//   (e: "on-edit", row: MsgTemplateVariable): void;
//   (e: "on-delete", row: MsgTemplateVariable): void;
// }>();
// 暴露给父级的自定义属性
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  height: {
    type: [Number, String],
    default: "auto",
  },
  maxHeight: {
    type: [Number, String],
    default: "auto",
  },
});

/* ***************************** 按钮操作 ********************************* */
/**
 * 新增：插入行
 */
function onAddItem() {
  const temp: ModuleParam = {
    key: "",
    val: "",
    enabled: false,
    description: "",
  };
  if (!model.value) {
    model.value = [];
  }
  model.value.push(temp);
}

/**
 * 删除
 */
function handleDelete(index: number, _row: ModuleParam) {
  // console.log("before on-delete", row);
  model.value?.splice(index, 1);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 * https://cn.vuejs.org/api/reactivity-core.html#watch
 */
// watch(
//   model,
//   (newVal, oldVal) => {
//     console.log("model watchEffect", newVal, oldVal);
//   },
//   {
//     immediate: true,
//     deep: true, // 复杂类型（如：对象、数组）需深度监听
//   }
// );
/**
 * 页面加载时
 */
onMounted(() => {
  // handleQuery();
});
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  // handleResetQuery,
});
</script>
