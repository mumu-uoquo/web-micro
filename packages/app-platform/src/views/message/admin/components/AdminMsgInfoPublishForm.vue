<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    draggable
    @close="handleCloseDialog"
  >
    <el-form
      ref="infoFormRef"
      :model="infoFormData"
      :rules="infoFormRules"
      status-icon
      label-width="100px"
    >
      <el-steps :active="stepActive" align-center finish-status="success" class="bt-5">
        <el-step title="消息预览" />
        <el-step title="发布范围" />
      </el-steps>

      <div v-show="stepActive === 0" class="mt-5">
        <el-descriptions label-width="100px" :column="2" border>
          <el-descriptions-item label="业务类型" label-align="right">
            <DictTag :code="infoFormData.businessType" />
          </el-descriptions-item>
          <el-descriptions-item label="推送方式" label-align="right">
            <DictTag :code="infoFormData.pushWay" />
          </el-descriptions-item>
          <el-descriptions-item label="消息分类" label-align="right">
            <DictTag :code="infoFormData.messageType" />
          </el-descriptions-item>
          <el-descriptions-item label="消息级别" label-align="right">
            <DictTag :code="infoFormData.messageLevel" />
          </el-descriptions-item>
          <el-descriptions-item label="消息标题" label-align="right" :span="2">
            {{ infoFormData.messageTitle }}
          </el-descriptions-item>
          <el-descriptions-item label="消息内容" label-align="right" :span="2">
            <div class="preview-container" v-html="infoFormData.messageContent"></div>
          </el-descriptions-item>
          <el-descriptions-item label="附件列表" label-align="right" :span="2">
            <FileListViewer
              v-model="infoFormData.attachments as any"
              :style="{ width: '80px', height: '80px' }"
              @on-download="handleDownloadAttachment"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-show="stepActive === 1" class="mt-5">
        <el-row>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="expireTime">
              <DatePicker v-model="expireTime" type="date" width="310px" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推送方式" prop="pushWay">
              <DictTag :code="infoFormData.pushWay" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="发布范围" prop="receiverRange">
              <el-select
                v-model="infoFormData.receiverRange"
                placeholder="请选择"
                @change="handleChangePushRange"
              >
                <el-option
                  v-for="item in pushRangeList"
                  :key="item.dicCode"
                  :label="item.dicValue"
                  :value="item.dicCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="选择机构" prop="receiverInstituteId">
              <el-select
                v-model="infoFormData.receiverInstituteId"
                placeholder="不限制"
                value-key="id"
                filterable
                clearable
                remote
                remote-show-suffix
                :disabled="infoFormData.receiverRange == DictionaryEnum.PUSH_RANGE_ALL"
                :remote-method="autoCompleteInstitute"
                @change="handleInstituteSelect"
              >
                <el-option
                  v-for="item in instituteList"
                  :key="item.id"
                  :label="item.instituteName"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="发布目标" prop="receiverIds">
              <el-transfer
                v-model="receiverIds"
                filterable
                :titles="['待选择', '已选择']"
                :data="receiverList"
                :props="{
                  key: 'id',
                  label: 'name',
                }"
              >
                <template #default="{ option }">
                  <el-tooltip class="item" effect="dark" :content="option.name" placement="top">
                    <span>{{ option.name }}</span>
                  </el-tooltip>
                </template>
                <template #left-empty>
                  <el-empty :image-size="60" description="No data" />
                </template>
                <template #right-empty>
                  <el-empty :image-size="60" description="No data" />
                </template>
              </el-transfer>
              <div class="el-form-item__info">“不选择”或“全选择”的效果一致，均为所有目标</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注说明" prop="description">
              <el-input
                v-model="infoFormData.description"
                maxlength="100"
                show-word-limit
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
    <template #footer>
      <span v-show="stepActive === 0">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="stepActive++">下一步</el-button>
      </span>
      <span v-show="stepActive === 1">
        <el-button @click="stepActive--">上一步</el-button>
        <el-button type="primary" @click="handleInfoSubmit">提 交</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import { formatDate, parseDate } from "@/utils/format";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import DictTag from "@/components/DictTag/index.vue";
import { useDictStore } from "@/stores";
import DatePicker from "@/components/DatePicker/index.vue";
import FileListViewer from "@/components/Upload/FileListViewer.vue";
import AdminMessageAPI, {
  MsgInfoParam,
  MsgInfoDto,
  MsgReceiverSearchParam,
  MsgReceiverSearchDto,
  MsgAttachmentDto,
} from "@/api/adminMessage";
import AdminInstituteAPI, { InstituteListParam, InstituteInfoDto } from "@/api/adminInstitute";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("发布");
const stepActive = ref<number>(0);
const expireTime = ref<Date | null | undefined>();

const dictStore = useDictStore();
const pushRangeList = dictStore.listDictionary(DictionaryEnum.PUSH_RANGE);

/* ***************************** 表单操作 ********************************* */
// 扩展部分属性
type InfoFormParam = MsgInfoParam;
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

const infoFormRef = ref(ElForm);
const infoFormData = ref<InfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<InfoFormParam>>({
  receiverRange: [{ required: true, message: "请选择发布范围", trigger: "change" }],
  expireTime: [{ required: true, message: "请选择过期时间", trigger: "change" }],
});

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(async () => {
  // 补全表单数据
  if (receiverIds.value.length > 0 && receiverIds.value.length < receiverList.value.length) {
    infoFormData.value.receiverIds = receiverIds.value.join(",");
  } else {
    infoFormData.value.receiverIds = "";
  }
  if (expireTime.value) {
    infoFormData.value.expireTime = formatDate(expireTime.value, "YYYY-MM-DD");
  } else {
    infoFormData.value.expireTime = "";
  }
  // console.log("提交表单", receiverIds.value, infoFormData.value.receiverIds);
  // 校验和提交
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    AdminMessageAPI.publishMessage(infoFormData.value).then((_data) => {
      ElMessage.success("发布成功");
      dialogVisible.value = false;
      emits("on-submit", infoFormData.value);
    });
  });
}, 500);

/**
 * 附件下载
 */
function handleDownloadAttachment(row: MsgAttachmentDto) {
  AdminMessageAPI.downloadAttachment({ id: row.id });
}

/* ***************************** 机构列表 ********************************* */
/**
 * 自动加载：机构列表（默认显示自己机构）
 */
const instituteList = ref<InstituteInfoDto[]>([]);
function autoCompleteInstitute(keyword: string) {
  if (!keyword || keyword == "") {
    instituteList.value = [props.defaultInstitute];
    return;
  }
  const param = { pageNum: 1, pageSize: 10, instituteName: keyword } as InstituteListParam;
  AdminInstituteAPI.listInstituteByAbbr(param).then((data) => {
    if (data.length > 0) {
      instituteList.value = data;
    }
  });
}
/**
 * 自动加载：选中机构
 */
function handleInstituteSelect(_data: string) {
  // console.log("handleInstituteSelect", data, infoFormData.value.receiverInstituteId);
  loadReceiverList();
}

/* ***************************** 发布目标搜索 ********************************* */
const receiverIds = ref<string[]>([]);
const receiverList = ref<MsgReceiverSearchDto[]>([]);

/**
 * 发布范围：变更
 */
function handleChangePushRange() {
  receiverIds.value = [];
  loadReceiverList();
}

/**
 * 发布目标：加载可选范围
 */
function loadReceiverList() {
  if (infoFormData.value.receiverRange === DictionaryEnum.PUSH_RANGE_ALL) {
    infoFormData.value.receiverInstituteId = "";
    receiverList.value = [];
    return;
  }
  const param = {
    pageNum: 1,
    pageSize: 100,
    receiverRange: infoFormData.value.receiverRange,
    instituteId: infoFormData.value.receiverInstituteId,
  } as MsgReceiverSearchParam;
  AdminMessageAPI.searchReceiverByRange(param).then((data) => {
    receiverList.value = data!.result || [];
  });
}

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (data: MsgInfoDto) => {
  dialogVisible.value = true;
  dialogTitle.value = "发布";
  Object.assign(infoFormData.value, data);
  // 目标机构回显
  if (infoFormData.value.receiverInstituteId) {
    instituteList.value = [
      {
        id: infoFormData.value.receiverInstituteId || "",
        instituteName: infoFormData.value.receiverInstituteName || "",
      },
    ];
  } else {
    instituteList.value = [props.defaultInstitute];
  }
  // 发布目标回显
  if (infoFormData.value.receiverIds) {
    receiverIds.value = infoFormData.value.receiverIds.split(",");
  } else {
    receiverIds.value = [];
  }
  // 过期时间回显
  if (infoFormData.value.expireTime) {
    expireTime.value = parseDate(infoFormData.value.expireTime);
  } else {
    expireTime.value = undefined;
  }
  loadReceiverList();
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  stepActive.value = 0;
  infoFormRef.value.clearValidate();
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
// 预览样式
.preview-container {
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
