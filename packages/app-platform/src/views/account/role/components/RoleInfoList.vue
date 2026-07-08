<template>
  <el-table
    :data="tableData"
    :show-header="false"
    empty-text=""
    highlight-current-row
    :stripe="true"
    :max-height="maxHeight"
    style="min-height: 100px"
    @row-click="handleClick"
  >
    <el-table-column label="名称" prop="roleName" />
    <el-table-column label="操作" width="110" fixed="right">
      <template #default="scope">
        <el-button
          link
          size="small"
          type="primary"
          :icon="Edit"
          :disabled="scope.row.readOnly"
          @click.stop="handleEdit(scope.row)"
        />
        <el-button
          link
          size="small"
          type="success"
          :icon="CopyDocument"
          @click.stop="handleCopy(scope.row)"
        />
        <el-popconfirm
          :icon="WarnTriangleFilled"
          icon-color="red"
          :title="`您确定要删除吗？【${scope.row.roleName}】`"
          width="160"
          @confirm.stop="handleDelete(scope.row)"
        >
          <template #reference>
            <el-button
              link
              size="small"
              type="danger"
              :disabled="scope.row.readOnly"
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

  <RoleInfoForm ref="roleInfoFormRef" :institute="institute" @on-submit="handleSubmit" />
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { Edit, Delete, CopyDocument, WarnTriangleFilled } from "@element-plus/icons-vue";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { InstituteInfoDto } from "@/api/institute";
import RoleAPI, { RoleInfoDto } from "@/api/role";
import RoleInfoForm from "./RoleInfoForm.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits<{
  (e: "on-click", info: RoleInfoDto, readOnly: boolean): void;
  (e: "on-submit"): void;
}>();
// 暴露给父级的自定义属性
const props = defineProps<{
  dataList: RoleInfoDto[];
  institute: InstituteInfoDto;
  roleType: string;
  maxHeight: string;
}>();

// 扩展部分属性
interface RoleInfoItemDto extends RoleInfoDto {
  readOnly: boolean;
}
const tableData = reactive<RoleInfoItemDto[]>([]);

/* ***************************** 按钮操作 ********************************* */
const roleInfoFormRef = ref(RoleInfoForm);
/**
 * 行点击
 */
function handleClick(info: RoleInfoItemDto) {
  emits("on-click", info, info.readOnly);
}
/**
 * 按钮：编辑
 */
function handleEdit(info: RoleInfoItemDto) {
  roleInfoFormRef.value.openEditDialog(info, props.institute);
}
/**
 * 按钮：复制
 */
function handleCopy(info: RoleInfoItemDto) {
  roleInfoFormRef.value.openCopyDialog(info, props.roleType, props.institute);
}
/**
 * 按钮：删除
 */
function handleDelete(info: RoleInfoItemDto) {
  RoleAPI.deleteRoleInfo({ id: info.id }).then(() => {
    ElMessage.success("删除成功");
    tableData.splice(tableData.indexOf(info), 1);
  });
}
/**
 * 回调：表单提交成功
 */
function handleSubmit() {
  console.log("handleSubmit");
  emits("on-submit");
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 监听属性变化
 */
watchEffect(() => {
  tableData.length = 0; // 清空数组
  props.dataList
    .filter((item) => item.roleType === props.roleType)
    .map((item) => {
      const temp = { ...item } as RoleInfoItemDto;
      temp.readOnly = false;
      if (temp.roleType === DictionaryEnum.ROLE_TYPE_INNER) {
        // 内置的不可编辑
        temp.readOnly = true;
      } else if (temp.roleType === DictionaryEnum.ROLE_TYPE_NORMAL) {
        // 通用的只能编辑自己的（防止修改了父级的授权）
        if (props.institute.id !== temp.instituteId) {
          temp.readOnly = true;
        }
      }
      tableData.push(temp);
    });
});
</script>

<style lang="scss" scoped>
:deep(.el-table__empty-block) {
  min-height: 40px;
}
</style>
