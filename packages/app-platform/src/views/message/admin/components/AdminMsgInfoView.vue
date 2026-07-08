<template>
  <el-drawer v-model="dialogVisible" size="50%" :with-header="false" @close="closeDialog">
    <el-tabs tab-position="top">
      <el-tab-pane label="详情明细">
        <el-container>
          <el-main>
            <el-descriptions label-width="100px" :column="3" border>
              <el-descriptions-item label="业务类型" label-align="right">
                <DictTag :code="infoFormData.businessType" />
              </el-descriptions-item>
              <el-descriptions-item label="发布时间" label-align="right">
                {{ formatDate(infoFormData.senderTime, "YYYY-MM-DD") }}
              </el-descriptions-item>
              <el-descriptions-item label="过期时间" label-align="right">
                {{ formatDate(infoFormData.expireTime, "YYYY-MM-DD") }}
              </el-descriptions-item>

              <el-descriptions-item label="消息类型" label-align="right">
                <DictTag :code="infoFormData.messageType" />
              </el-descriptions-item>
              <el-descriptions-item label="推送方式" label-align="right">
                <DictTag :code="infoFormData.pushWay" />
              </el-descriptions-item>
              <el-descriptions-item label="消息级别" label-align="right">
                <DictTag :code="infoFormData.messageLevel" />
              </el-descriptions-item>

              <el-descriptions-item label="消息标题" label-align="right" :span="3">
                {{ infoFormData.messageTitle }}
              </el-descriptions-item>

              <el-descriptions-item label="消息内容" label-align="right" :span="3">
                <div class="preview-container" v-html="infoFormData.messageContent"></div>
              </el-descriptions-item>

              <el-descriptions-item label="附件列表" label-align="right" :span="3">
                <FileListViewer
                  v-model="infoFormData.attachments"
                  :style="{ width: '80px', height: '80px' }"
                  @on-download="handleDownloadAttachment"
                />
              </el-descriptions-item>
            </el-descriptions>
          </el-main>
          <el-footer>
            <el-button
              type="primary"
              :icon="Edit"
              :disabled="infoFormData.status !== DictionaryEnum.PUSH_STATUS_WAITING"
              @click="handleOpenInfoEditDialog(infoFormData)"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              :icon="Promotion"
              :disabled="infoFormData.status !== DictionaryEnum.PUSH_STATUS_WAITING"
              @click="handleOpenInfoPublishDialog(infoFormData)"
            >
              发布
            </el-button>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要撤回吗？`"
              width="160"
              @confirm="handleWithdraw(infoFormData)"
            >
              <template #reference>
                <el-button
                  type="info"
                  :icon="ToiletPaper"
                  :disabled="infoFormData.status !== DictionaryEnum.PUSH_STATUS_PUBLISH"
                >
                  撤回
                </el-button>
              </template>
              <template #actions="{ confirm, cancel }">
                <el-button size="small" @click="cancel">取消</el-button>
                <el-button size="small" type="danger" @click="confirm">确定</el-button>
              </template>
            </el-popconfirm>
            <el-popconfirm
              :icon="WarnTriangleFilled"
              icon-color="red"
              :title="`您确定要删除吗？`"
              width="160"
              @confirm="handleDelete(infoFormData)"
            >
              <template #reference>
                <el-button type="danger" :icon="Delete">删除</el-button>
              </template>
              <template #actions="{ confirm, cancel }">
                <el-button size="small" @click="cancel">取消</el-button>
                <el-button size="small" type="danger" @click="confirm">确定</el-button>
              </template>
            </el-popconfirm>
          </el-footer>
        </el-container>
      </el-tab-pane>

      <el-tab-pane label="接收列表">
        <SendMsgReceiver
          :message-id="infoFormData.id"
          :table-data="pageResult4Receiver"
          :on-query="handleListReceiver4Message"
          :on-delete="handleDeleteReceiver4Message"
        />
      </el-tab-pane>
      <el-tab-pane label="推送日志">
        <SendMsgLog
          :message-id="infoFormData.id"
          :table-data="pageResult4Logs"
          :on-query="handleListLogs4Message"
        />
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils/format";
import { Edit, Delete, Promotion, ToiletPaper, WarnTriangleFilled } from "@element-plus/icons-vue";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import FileListViewer from "@/components/Upload/FileListViewer.vue";
import AdminMessageAPI, {
  MsgInfoListParam,
  MsgInfoDto,
  PageResultMsgReceiverDto,
  MsgReceiverDto,
  PageResultMsgPushLogDto,
  MsgAttachmentDto,
} from "@/api/adminMessage";
import SendMsgLog from "../../components/SendMsgLog.vue";
import SendMsgReceiver from "../../components/SendMsgReceiver.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit", "on-edit", "on-publish", "on-withdraw", "on-delete"]);

const dialogVisible = ref<boolean>(false);
const stepActive = ref<number>(0);

/* ***************************** 表单操作 ********************************* */
// 扩展部分属性
type InfoFormParam = MsgInfoDto;
// 初始表单数据
const initialFormData = ref<InfoFormParam>({
  id: "",
  businessType: "",
  pushWay: DictionaryEnum.PUSH_WAY_UNLIMITED,
  messageType: "",
  messageLevel: DictionaryEnum.PRIOR_LEVEL_NORMAL,
  messageTitle: "",
  messageContent: "",
  attachments: [],
  status: DictionaryEnum.PUSH_STATUS_WAITING,
  expireTime: "",
  receiverRange: DictionaryEnum.PUSH_RANGE_ALL,
  receiverInstituteId: "",
  receiverIds: "",
  description: "",
});
const infoFormData = ref<InfoFormParam>({ ...initialFormData.value }); // 表单数据

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = (data: MsgInfoDto) => {
  dialogVisible.value = true;
  Object.assign(infoFormData.value, data);
};
/**
 * 关闭弹窗
 */
function closeDialog() {
  if (!dialogVisible.value) {
    return;
  }
  dialogVisible.value = false;
  stepActive.value = 0;
  Object.assign(infoFormData.value, initialFormData.value);
}
/**
 * 刷新数据
 */
const refreshData = (messageId: string) => {
  if (!dialogVisible.value) {
    return;
  }
  AdminMessageAPI.getMessage({ id: messageId }).then((data) => {
    Object.assign(infoFormData.value, data);
  });
};

/* ***************************** 详情操作 ********************************* */
/**
 * 展示：编辑弹窗（未发布的）
 */
function handleOpenInfoEditDialog(row: MsgInfoDto) {
  emits("on-edit", row);
}
/**
 * 展示：发布弹窗（未发布的）
 */
function handleOpenInfoPublishDialog(row: MsgInfoDto) {
  emits("on-publish", row);
}
/**
 * 操作：撤回（已发布的）
 */
function handleWithdraw(row: MsgInfoDto) {
  emits("on-withdraw", row);
}
/**
 * 操作：删除
 */
function handleDelete(row: MsgInfoDto) {
  emits("on-delete", row);
}

/**
 * 附件下载
 */
function handleDownloadAttachment(row: MsgAttachmentDto) {
  AdminMessageAPI.downloadAttachment({ id: row.id });
}

/* ***************************** 接收列表 ********************************* */
/**
 * 接收信息：删除
 */
async function handleDeleteReceiver4Message(row: MsgReceiverDto) {
  await AdminMessageAPI.deleteReceiver4Message({
    messageId: row.messageId,
    receiverId: row.receiverId,
  });
  ElMessage.success("删除成功");
}
/**
 * 接收信息：查询
 */
const pageResult4Receiver = ref<PageResultMsgReceiverDto>();
async function handleListReceiver4Message(param: MsgInfoListParam) {
  pageResult4Receiver.value = await AdminMessageAPI.listReceiverByMessageId({
    pageNum: param.pageNum,
    pageSize: param.pageSize,
    messageId: param.messageId,
  });
}

/* ***************************** 推送日志 ********************************* */
/**
 * 推送日志：查询
 */
const pageResult4Logs = ref<PageResultMsgPushLogDto>();
async function handleListLogs4Message(param: MsgInfoListParam) {
  pageResult4Logs.value = await AdminMessageAPI.listPushLogByMessageId({
    pageNum: param.pageNum,
    pageSize: param.pageSize,
    messageId: param.messageId,
  });
}

/* ***************************** 监听器等 ********************************* */
// 监听属性变化
watchEffect(() => {
  // areaTreeData.value = props.areaData;
});
// 暴露给父级的自定义方法（需放在最后）
defineExpose({
  openDialog,
  closeDialog,
  refreshData,
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
// 布局容器的footer固定到底部
.el-container {
  .el-main {
    margin-bottom: 60px;
  }

  .el-footer {
    position: fixed;
    right: 20px;
    bottom: 0;
    height: 60px;
    line-height: 60px;
  }
}
</style>
