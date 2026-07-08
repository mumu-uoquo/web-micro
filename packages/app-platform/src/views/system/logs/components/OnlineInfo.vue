<template>
  <el-drawer v-model="dialogVisible" :title="dialogTitle" size="40%" @close="handleCloseDialog">
    <el-descriptions label-width="100px" :column="2" border>
      <el-descriptions-item label="用户ID" label-align="right">
        {{ infoFormData.userId }}
      </el-descriptions-item>
      <el-descriptions-item label="当前会话" label-align="right">
        {{ infoFormData.userId }}
      </el-descriptions-item>
      <el-descriptions-item label="所属机构" label-align="right">
        {{ infoFormData.instituteId }}
      </el-descriptions-item>
      <el-descriptions-item label="登录时间" label-align="right">
        {{ formatDate(infoFormData.createTime, "YYYY-MM-DD HH:mm:ss") }}
      </el-descriptions-item>
      <el-descriptions-item label="设备指纹" label-align="right">
        {{ infoFormData.deviceSn }}
      </el-descriptions-item>
      <el-descriptions-item label="刷新时间" label-align="right">
        {{ formatDate(infoFormData.loginTime, "YYYY-MM-DD HH:mm:ss") }}
      </el-descriptions-item>

      <el-descriptions-item label="设备信息" label-align="right" :span="2">
        <el-tag v-if="infoFormData.deviceOs">{{ infoFormData.deviceOs }}</el-tag>
        {{ infoFormData.deviceUa }}
      </el-descriptions-item>
      <el-descriptions-item label="登录地点" label-align="right" :span="2">
        <el-tag v-if="infoFormData.loginIp">{{ infoFormData.loginIp }}</el-tag>
        {{ infoFormData.loginAddress }}
      </el-descriptions-item>
      <el-descriptions-item label="应用平台" label-align="right" :span="2">
        <el-tag>
          {{ infoFormData.appName }}
          <span v-if="infoFormData.appVersion">({{ infoFormData.appVersion }})</span>
        </el-tag>
        {{ infoFormData.appModuleName }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <div style="flex: auto">
        <el-popconfirm
          :icon="WarnTriangleFilled"
          icon-color="red"
          :title="`确定踢出【${infoFormData.userName}】吗？`"
          width="160"
          @confirm="handleKickOut(infoFormData)"
        >
          <template #reference>
            <el-button type="danger">踢出</el-button>
          </template>
          <template #actions="{ confirm, cancel }">
            <el-button size="small" @click="cancel">取消</el-button>
            <el-button size="small" type="danger" @click="confirm">确定</el-button>
          </template>
        </el-popconfirm>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { WarnTriangleFilled } from "@element-plus/icons-vue";
import { formatDate } from "@/utils/format";
import { type LogUserOnlineDto } from "@/api/adminLogs";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-kick-out"]);
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("详情");
// 初始表单数据
const initialFormData = ref<LogUserOnlineDto>({
  id: "",
  token: "",
  userId: "",
});
const infoFormData = ref<LogUserOnlineDto>({ ...initialFormData.value });

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (data: LogUserOnlineDto) => {
  // 最后显示弹窗
  dialogVisible.value = true;
  dialogTitle.value = data.userName || data.userId;
  Object.assign(infoFormData.value, data);
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  Object.assign(infoFormData.value, initialFormData.value);
}

/**
 * 操作：踢出在线用户
 */
function handleKickOut(row: LogUserOnlineDto) {
  emits("on-kick-out", row);
}

/* ***************************** 监听器等 ********************************* */
// 监听属性变化
watchEffect(() => {
  // areaTreeData.value = props.areaData;
});
// 暴露给父级的自定义方法（需放在最后）
defineExpose({
  openDialog,
});
</script>

<style lang="scss" scoped>
// 提示信息
.el-form-item__info {
  position: absolute;
  top: 100%;
  left: 0;
  padding-top: 2px;
  font-size: 12px;
  line-height: 1;
  color: #e6a23c;
}
// transfer面板样式
.el-transfer {
  width: 100%;

  :deep(.el-transfer-panel) {
    width: 276px;
  }
}
</style>
