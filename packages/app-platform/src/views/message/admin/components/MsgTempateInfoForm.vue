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
      class="mt-5"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="模板名称" prop="templateName">
            <el-input
              v-model="infoFormData.templateName"
              maxlength="20"
              show-word-limit
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模板编码" prop="templateCode">
            <el-input
              v-model="infoFormData.templateCode"
              placeholder="系统唯一，用于代码硬编码，不可修改"
              maxlength="20"
              :disabled="isEditMode"
              show-word-limit
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="消息分类" prop="messageType">
            <el-select v-model="infoFormData.messageType" placeholder="请选择" clearable>
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
          <el-form-item label="推送方式" prop="pushWay">
            <el-select v-model="infoFormData.pushWay" placeholder="请选择" clearable>
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
        <el-col :span="24">
          <el-form-item label="消息标题" prop="titleTemplate">
            <el-input
              v-model="infoFormData.titleTemplate"
              placeholder="消息标题的模板"
              maxlength="50"
              show-word-limit
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="消息内容" prop="contentTemplate">
            <el-input
              v-if="infoFormData.pushWay && infoFormData.pushWay == DictionaryEnum.PUSH_WAY_SMS"
              v-model="infoFormData.contentTemplate"
              placeholder="消息内容的模板"
              type="textarea"
              :rows="10"
              style="height: 242px"
              show-word-limit
              clearable
            />
            <WangEditor
              v-else
              ref="editorRef"
              v-model="infoFormData.contentTemplate"
              placeholder="消息内容的模板"
              height="200px"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="变量说明" prop="variables">
            <VariablesList v-model="infoFormData.variables" height="100" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-form-item label="备注描述" prop="description">
            <el-input
              v-model="infoFormData.description"
              maxlength="100"
              show-word-limit
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleInfoSubmit">保 存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { useDebounceFn } from "@vueuse/core";
import WangEditor from "@/components/WangEditor/index.vue";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useDictStore } from "@/stores";
import MessageAPI, { MsgTemplateInfoParam, MsgTemplateDto } from "@/api/message";
import VariablesList from "./MsgTemplateVariablesList.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);

const isEditMode = ref<boolean>(false);
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");

const dictStore = useDictStore();
const messageTypeList = dictStore.listDictionary(DictionaryEnum.MESSAGE_CATEGORY);
const pushWayList = dictStore.listDictionary(DictionaryEnum.PUSH_WAY);

/* ***************************** 表单操作 ********************************* */
// 扩展部分属性
interface InfoFormParam extends MsgTemplateInfoParam {
  // 预留扩展
  extends?: string;
}
// 初始表单数据
const initialFormData = ref<InfoFormParam>({
  id: "",
  templateName: "",
  templateCode: "",
  messageType: "",
  pushWay: "",
  status: "",
  defaulted: false,
  titleTemplate: "",
  contentTemplate: "",
  description: "",
  variables: [],
});

const editorRef = ref(WangEditor);
const infoFormRef = ref(ElForm);
const infoFormData = ref<InfoFormParam>({ ...initialFormData.value }); // 表单数据
const infoFormRules = reactive<FormRules<InfoFormParam>>({
  templateName: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  templateCode: [
    { required: true, message: "请输入编码", trigger: "blur" },
    {
      min: 2,
      max: 20,
      pattern: /^[a-zA-Z]+[a-zA-Z0-9]+$/,
      message: "只能输入 2 到 20 位的字母和数字",
      trigger: "blur",
    },
  ],
  messageType: [{ required: true, message: "请选择消息类型", trigger: "change" }],
  pushWay: [{ required: true, message: "请选择推送方式", trigger: "change" }],
  contentTemplate: [{ required: true, message: "请填写消息模板内容", trigger: "blur" }],
});

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(async () => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    if (isEditMode.value) {
      MessageAPI.updateTemplateInfo(infoFormData.value).then((_data) => {
        ElMessage.success("保存成功");
        editorRef.value.clearNotUseFile();
        editorRef.value.clearContent();
        dialogVisible.value = false;
        emits("on-submit");
      });
    } else {
      MessageAPI.addTemplateInfo(infoFormData.value).then((_data) => {
        ElMessage.success("保存成功");
        editorRef.value.clearNotUseFile();
        editorRef.value.clearContent();
        dialogVisible.value = false;
        emits("on-submit");
      });
    }
  });
}, 500);

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗：新增
 */
const openAddDialog = async () => {
  // 最后显示弹窗
  dialogVisible.value = true;
  dialogTitle.value = "新增";
};

/**
 * 显示弹窗：编辑
 */
const openEditDialog = async (data: MsgTemplateDto) => {
  isEditMode.value = true;
  dialogVisible.value = true;
  dialogTitle.value = "编辑";
  Object.assign(infoFormData.value, data);
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  isEditMode.value = false;
  dialogVisible.value = false;
  infoFormRef.value.clearValidate();
  editorRef.value.clearAllFile();
  editorRef.value.clearContent();
  Object.assign(infoFormData.value, initialFormData.value);
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
