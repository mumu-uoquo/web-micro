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
        <el-step title="基本信息" />
        <el-step title="发布范围" />
      </el-steps>

      <div v-show="stepActive === 0" class="mt-5">
        <el-row>
          <el-col :span="12">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="infoFormData.businessType" placeholder="请选择">
                <el-option
                  v-for="item in businessTypeList"
                  :key="item.dicCode"
                  :label="item.dicValue"
                  :value="item.dicCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="推送方式" prop="pushWay">
              <el-select v-model="infoFormData.pushWay" placeholder="请选择">
                <el-option
                  v-for="item in pushWayList"
                  :key="item.dicCode"
                  :label="item.dicValue"
                  :value="item.dicCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="消息分类" prop="messageType">
              <el-select v-model="infoFormData.messageType" placeholder="请选择">
                <el-option
                  v-for="item in messageTypeList"
                  :key="item.dicCode"
                  :label="item.dicValue"
                  :value="item.dicCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="消息级别" prop="messageLevel">
              <el-select v-model="infoFormData.messageLevel" placeholder="请选择">
                <el-option
                  v-for="item in messageLevelList"
                  :key="item.dicCode"
                  :label="item.dicValue"
                  :value="item.dicCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="消息标题" prop="messageTitle">
              <el-input
                v-model="infoFormData.messageTitle"
                placeholder="请输入消息标题"
                maxlength="50"
                show-word-limit
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="消息内容" prop="messageContent">
              <el-input
                v-if="infoFormData.pushWay && infoFormData.pushWay == DictionaryEnum.PUSH_WAY_SMS"
                v-model="infoFormData.messageContent"
                placeholder="请输入消息内容"
                type="textarea"
                :rows="10"
                style="height: 342px"
                maxlength="60"
                show-word-limit
                clearable
              />
              <WangEditor
                v-else
                ref="editorRef"
                v-model="infoFormData.messageContent"
                placeholder="请输入消息内容"
                height="300px"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="附件列表" prop="attachments">
              <MultiFileUpload
                ref="attachmentRef"
                :limit="5"
                :style="{ width: '80px', height: '80px' }"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div v-show="stepActive === 1" class="mt-5">
        <el-row>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="expireTime">
              <DatePicker v-model="expireTime" type="date" width="310px" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布状态" prop="status">
              <el-radio-group v-model="infoFormData.status">
                <el-radio-button :value="DictionaryEnum.PUSH_STATUS_WAITING">
                  稍后发布
                </el-radio-button>
                <el-radio-button :value="DictionaryEnum.PUSH_STATUS_PUBLISH">
                  立即发布
                </el-radio-button>
              </el-radio-group>
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
        <el-button type="primary" @click="handleValidateForm">下一步</el-button>
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
import WangEditor from "@/components/WangEditor/index.vue";
import { formatDate, parseDate } from "@/utils/format";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useDictStore } from "@/stores";
import DatePicker from "@/components/DatePicker/index.vue";
import MultiFileUpload from "@/components/Upload/MultiFileUpload.vue";
import MessageAPI, {
  MsgInfoParam,
  MsgInfoDto,
  MsgReceiverSearchParam,
  MsgReceiverSearchDto,
} from "@/api/message";
import InstituteAPI, { InstituteListParam, InstituteInfoDto } from "@/api/institute";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  defaultInstitute: InstituteInfoDto;
}>();

const isEditMode = ref<boolean>(false);
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");
const stepActive = ref<number>(0);
const expireTime = ref<Date | null | undefined>();

const dictStore = useDictStore();
const businessTypeList = dictStore.listDictionary(DictionaryEnum.BUSINESS_TYPE);
const pushWayList = dictStore.listDictionary(DictionaryEnum.PUSH_WAY);
const messageTypeList = dictStore.listDictionary(DictionaryEnum.MESSAGE_CATEGORY);
const messageLevelList = dictStore.listDictionary(DictionaryEnum.PRIOR_LEVEL);
const pushRangeList = dictStore.listDictionary(DictionaryEnum.PUSH_RANGE);

/* ***************************** 表单操作 ********************************* */
// 扩展部分属性
interface InfoFormParam extends MsgInfoParam {
  // 预留扩展
  extends?: string;
}
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

// 注：自定义校验规则必须在使用前定义
/**
 * 自定义校验规则：富文本长度校验
 */
const validateRichTextLength = (min: number, max: number) => {
  return (rule: any, value: any, callback: any) => {
    const plainText = stripHtmlAndSpace(value);
    const length = plainText.length;
    if (length < min) {
      callback(new Error(`内容至少需要${min}个字符`));
    } else if (max && length > max) {
      callback(new Error(`内容不能超过${max}个字符`));
    } else {
      callback();
    }
  };
};
/**
 * 去除HTML标签和空白字符
 */
const stripHtmlAndSpace = (html: string) => {
  if (!html) return "";
  // 保留img标签的alt文本
  const withAltText = html.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, "$1");
  // 去除其他HTML标签
  const strippedText = withAltText.replace(/<(?!\/?(img|table)\b)[^>]+>/g, "");
  // 去除所有空白字符
  return strippedText.replace(/\s+/g, "");
};

const editorRef = ref(WangEditor);
const attachmentRef = ref(MultiFileUpload);
const infoFormRef = ref(ElForm);
const infoFormData = ref<InfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<InfoFormParam>>({
  businessType: [{ required: true, message: "请选择业务类型", trigger: "change" }],
  pushWay: [{ required: true, message: "请选择推送方式", trigger: "change" }],
  messageType: [{ required: true, message: "请选择消息类型", trigger: "change" }],
  messageLevel: [{ required: true, message: "请选择消息级别", trigger: "change" }],
  messageTitle: [{ required: true, message: "请输入消息标题", trigger: "blur" }],
  messageContent: [
    { required: true, message: "请填写消息内容", trigger: "blur" },
    { validator: validateRichTextLength(1, 500), trigger: "blur" },
  ],
  receiverRange: [{ required: true, message: "请选择发布范围", trigger: "change" }],
});

/**
 * 校验表单
 */
const handleValidateForm = async () => {
  let fieldsToValidate = [] as string[];
  if (stepActive.value === 0) {
    fieldsToValidate = [
      "businessType",
      "pushWay",
      "messageType",
      "messageLevel",
      "messageTitle",
      "messageContent",
    ];
  }
  const isValid = await new Promise((resolve) => {
    infoFormRef.value.validateField(fieldsToValidate, (valid: boolean) => {
      resolve(valid);
    });
  });
  if (isValid) {
    stepActive.value++;
  }
};

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
  infoFormData.value.attachments = attachmentRef.value.getFileList();
  // console.log("提交表单", receiverIds.value, infoFormData.value.receiverIds);
  // 校验和提交
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    if (isEditMode.value) {
      MessageAPI.updateMessage(infoFormData.value).then((_data) => {
        ElMessage.success("保存成功");
        editorRef.value.clearNotUseFile();
        editorRef.value.clearContent();
        attachmentRef.value.clear(false);
        dialogVisible.value = false;
        emits("on-submit", infoFormData.value);
      });
    } else {
      MessageAPI.addMessage(infoFormData.value).then((_data) => {
        ElMessage.success("保存成功");
        editorRef.value.clearNotUseFile();
        editorRef.value.clearContent();
        attachmentRef.value.clear(false);
        dialogVisible.value = false;
        emits("on-submit", infoFormData.value);
      });
    }
  });
}, 500);

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
  InstituteAPI.listInstituteByAbbr(param).then((data) => {
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
  MessageAPI.searchReceiverByRange(param).then((data) => {
    receiverList.value = data!.result || [];
  });
}

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗：新增
 */
const openAddDialog = async () => {
  // 最后显示弹窗
  dialogVisible.value = true;
  dialogTitle.value = "新增";
  receiverIds.value = [];
  receiverList.value = [];
  expireTime.value = undefined;
  instituteList.value = [props.defaultInstitute];
  Object.assign(infoFormData.value, initialFormData.value);
  nextTick(() => {
    attachmentRef.value.setFileList([]);
  });
};

/**
 * 显示弹窗：编辑
 */
const openEditDialog = async (data: MsgInfoDto) => {
  dialogVisible.value = true;
  dialogTitle.value = "编辑";
  isEditMode.value = true;
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
  // 附件回显
  nextTick(() => {
    attachmentRef.value.setFileList(infoFormData.value.attachments);
  });
  loadReceiverList();
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  isEditMode.value = false;
  dialogVisible.value = false;
  stepActive.value = 0;
  infoFormRef.value.clearValidate();
  editorRef.value.clearAllFile();
  editorRef.value.clearContent();
  attachmentRef.value.clear(true);
}

/* ***************************** 监听器等 ********************************* */
// 监听属性变化
watchEffect(() => {
  // areaTreeData.value = props.areaData;
});
// 暴露给父级的自定义方法（需放在最后）
defineExpose({
  openAddDialog,
  openEditDialog,
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
