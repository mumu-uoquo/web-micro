<template>
  <el-drawer v-model="dialogVisible" :title="dialogTitle" size="40%" @close="handleCloseDialog">
    <el-descriptions label-width="100px" :column="2" border>
      <el-descriptions-item label="业务类型" label-align="right">
        <DictTag :code="infoFormData.businessType" />
      </el-descriptions-item>
      <el-descriptions-item label="推送方式" label-align="right">
        <DictTag :code="infoFormData.pushWay" />
      </el-descriptions-item>
      <el-descriptions-item label="发布时间" label-align="right">
        {{ formatDate(infoFormData.senderTime, "YYYY-MM-DD") }}
      </el-descriptions-item>
      <el-descriptions-item label="过期时间" label-align="right">
        {{ formatDate(infoFormData.expireTime, "YYYY-MM-DD") }}
      </el-descriptions-item>
      <el-descriptions-item label="消息标题" label-align="right" :span="2">
        <DictTag :code="infoFormData.messageLevel" />
        {{ infoFormData.messageTitle }}
      </el-descriptions-item>
      <el-descriptions-item label="消息内容" label-align="right" :span="2">
        <div class="preview-container" v-html="infoFormData.messageContent"></div>
      </el-descriptions-item>
      <el-descriptions-item label="附件列表" label-align="right" :span="2">
        <FileListViewer
          v-model="infoFormData.attachments"
          :style="{ width: '80px', height: '80px' }"
          @on-download="handleDownloadAttachment"
        />
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="handleCloseDialog">关闭</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils/format";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import FileListViewer from "@/components/Upload/FileListViewer.vue";
import MessageAPI, { MsgInfoViewDto, MsgAttachmentDto } from "@/api/message";

/* ***************************** 参数定义 ********************************* */
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("详情");

/* ***************************** 表单操作 ********************************* */
// 扩展部分属性
interface InfoFormParam extends MsgInfoViewDto {
  // 预留扩展
  extends?: string;
}
// 初始表单数据
const initialFormData = ref<InfoFormParam>({
  recordId: "",
  messageId: "",
  businessType: "",
  pushWay: DictionaryEnum.PUSH_WAY_UNLIMITED,
  messageType: "",
  messageLevel: DictionaryEnum.PRIOR_LEVEL_NORMAL,
  messageTitle: "",
  messageContent: "",
  attachments: [],
});
const infoFormData = ref<InfoFormParam>({ ...initialFormData.value }); // 表单数据

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗：新增
 */
const openDialog = async (data: MsgInfoViewDto) => {
  // 最后显示弹窗
  dialogVisible.value = true;
  dialogTitle.value = "详情";
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
 * 删除
 */
function handleDelete() {
  MessageAPI.deleteMessageOne({ messageId: infoFormData.value.messageId }).then(() => {
    ElMessage.success("删除成功");
    handleCloseDialog();
  });
}

/**
 * 附件下载
 */
function handleDownloadAttachment(row: MsgAttachmentDto) {
  MessageAPI.downloadAttachment({ id: row.id });
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
