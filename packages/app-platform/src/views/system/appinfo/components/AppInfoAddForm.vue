<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    draggable
    @close="handleCloseDialog"
  >
    <el-steps :active="stepActive" align-center finish-status="success">
      <el-step title="基本信息" />
      <el-step title="访问授权" />
    </el-steps>
    <div v-show="stepActive === 0">
      <el-form
        ref="infoFormRef"
        :model="infoFormData"
        :rules="infoFormRules"
        status-icon
        label-width="100px"
        class="mt-5"
      >
        <el-form-item label="机构" prop="instituteId">
          <el-select
            v-model="infoFormData.instituteId"
            placeholder="请选择所属机构，可以为空，保存后不可修改"
            value-key="id"
            filterable
            clearable
            remote
            remote-show-suffix
            :remote-method="autoCompleteInstitute"
          >
            <el-option
              v-for="item in instituteList"
              :key="item.id"
              :label="item.instituteName"
              :value="item.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="平台" prop="moduleId">
          <el-select
            v-model="infoFormData.moduleId"
            placeholder="请选择授权的平台，可以为空"
            clearable
          >
            <el-option
              v-for="item in moduleList"
              :key="item.id"
              :label="item.moduleName"
              :value="item.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="appName">
          <el-input v-model="infoFormData.appName" clearable placeholder="授权的名称" />
        </el-form-item>
        <el-form-item label="账号" prop="appkey">
          <el-input
            v-model="infoFormData.appkey"
            clearable
            placeholder="授权访问的APPKEY，全局唯一，保存后不可修改"
          >
            <template #append>
              <el-button type="primary" @click="generateAppKey">生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="秘钥" prop="secret">
          <el-input v-model="infoFormData.secret" clearable placeholder="授权访问的SECRET">
            <template #append>
              <el-button type="primary" @click="generateSecret">生成</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="模板" prop="templateType">
          <el-switch
            v-model="infoFormData.templateType"
            active-text="是"
            inactive-text="否"
            :active-value="DictionaryEnum.TEMPLATE_TYPE_NORMAL"
            :inactive-value="DictionaryEnum.TEMPLATE_TYPE_NONE"
            :style="`--el-switch-on-color: #409eff; --el-switch-off-color: rgb(237.5 189.9 118.5);`"
            inline-prompt
          />
        </el-form-item>
      </el-form>
    </div>
    <div v-show="stepActive === 1">
      <el-form :disabled="templateDisable" label-width="100px" class="mt-5">
        <el-form-item label="复制权限">
          <el-autocomplete
            v-model="templateAppName"
            value-key="showName"
            class="my-autocomplete"
            popper-class="my-autocomplete"
            placeholder="请输入APP名称或APPKEY"
            clearable
            :popper-append-to-body="false"
            :fetch-suggestions="loadAutoCompleteAppInfo"
            @clear="() => (templateAppId = '')"
            @select="handleAutoCompleteAppInfoSelect"
          >
            <template #default="{ item }">
              <span class="name">
                {{ item.appName }}
                <span class="addr">（{{ item.appkey }}）</span>
              </span>
              <span class="desc">{{ item.instituteName }}</span>
            </template>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button type="primary" @click="handleCopyAppPermission">确定</el-button>
            </template>
            <template #loading>
              <svg class="circular" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" />
              </svg>
            </template>
          </el-autocomplete>
        </el-form-item>
      </el-form>
      <AppPermission
        :template-id="templateAppId"
        :info-data="authAppInfoData"
        @on-change="handleAuthSelect"
      />
    </div>

    <template #footer>
      <span v-show="stepActive === 0">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleInfoSubmit">提交并授权</el-button>
      </span>
      <span v-show="stepActive === 1">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import type { FormRules } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useDebounceFn } from "@vueuse/core";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { ModuleInfoDto } from "@/api/module";
import InstituteAPI, { InstituteListParam, InstituteInfoDto } from "@/api/institute";
import SystemAPI, {
  AppInfoListParam,
  AppInfoParam,
  AppInfoDto,
  AppPermissionCopyParam,
} from "@/api/system";
import AppPermission from "./AppPermission.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-submit"]);
// 暴露给父级的自定义属性
const props = defineProps<{
  moduleList: ModuleInfoDto[];
  defaultInstitute: InstituteInfoDto;
}>();

const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("新增");
const stepActive = ref<number>(0);

/* ***************************** 表单信息 ********************************* */
// 初始表单数据
const initialFormData = ref<AppInfoParam>({
  id: "",
  instituteId: "",
  moduleId: "",
  appName: "",
  appkey: "",
  secret: "",
  templateType: DictionaryEnum.TEMPLATE_TYPE_NONE,
});
const infoFormRef = ref(ElForm);
const infoFormData = ref<AppInfoParam>({ ...initialFormData.value }); // 表单数据
const authAppInfoData = ref<AppInfoDto>({ id: "" }); // 授权时的对象
const infoFormRules = reactive<FormRules<AppInfoParam>>({
  appName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  appkey: [
    { required: true, message: "请输入账号", trigger: "blur" },
    {
      min: 16,
      max: 32,
      pattern: /^[a-zA-Z0-9]+$/,
      message: "只能输入 16 到 32 位的字母和数字",
      trigger: "blur",
    },
  ],
  secret: [
    { required: true, message: "请输入秘钥", trigger: "blur" },
    {
      min: 16,
      max: 32,
      pattern: /^[a-zA-Z0-9!-~]+$/,
      message: "只能输入 16 到 32 位以内的字符",
      trigger: "blur",
    },
  ],
});

/**
 * 自动加载：机构列表
 */
const instituteList = ref<InstituteInfoDto[]>([]);
function autoCompleteInstitute(keyword: string) {
  if (!keyword || keyword == "") {
    instituteList.value = [props.defaultInstitute];
    return;
  }
  const param = { pageNum: 1, pageSize: 10, instituteName: keyword } as InstituteListParam;
  InstituteAPI.listInstituteByAbbr(param).then((data) => {
    instituteList.value = data;
  });
}

/**
 * 生成：APPKEY
 */
function generateAppKey(): void {
  const appKeyCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789";
  const appkey = generateRandomString(32, appKeyCharacters);
  infoFormData.value.appkey = appkey;
}

/**
 * 生成：SECRET
 */
function generateSecret(): void {
  const secretCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz0123456789!@#$%^&*.-~";
  const secret = generateRandomString(32, secretCharacters);
  infoFormData.value.secret = secret;
}

/**
 * 生成随机字符串
 */
function generateRandomString(length: number, characters: string): string {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }
  return result;
}

/**
 * 保存提交（防抖）
 */
const handleInfoSubmit = useDebounceFn(() => {
  infoFormRef.value.validate((isValid: boolean) => {
    if (!isValid) {
      return;
    }
    SystemAPI.addAppInfo(infoFormData.value).then((data) => {
      ElMessage.success("添加成功");
      // 刷新列表
      emits("on-submit");
      // 进入授权
      stepActive.value++;
      authAppInfoData.value = data;
    });
  });
}, 500);

/* ***************************** 授权信息 ********************************* */
// 扩展部分属性
interface AppInfoShowDto extends AppInfoDto {
  showName: string;
}
const templateAppId = ref<string>("");
const templateAppName = ref<string>("");
const templateDisable = ref<boolean>(false);

/**
 * 自动加载：列表
 */
function loadAutoCompleteAppInfo(keyword: string, callback: any) {
  const param = { pageNum: 1, pageSize: 10, keyword } as AppInfoListParam;
  if (DictionaryEnum.TEMPLATE_TYPE_NORMAL == infoFormData.value.templateType) {
    param.templateType = DictionaryEnum.TEMPLATE_TYPE_NORMAL;
  }
  SystemAPI.listAppInfoByAbbr(param).then((data) => {
    const result: AppInfoShowDto[] = data!.map((item: AppInfoDto) => {
      const temp: AppInfoShowDto = { ...item } as AppInfoShowDto;
      // 数据脱敏
      temp.appkey = temp.appkey!.replace(/(\S{4})\S*(\S{4})/, "$1****$2");
      temp.secret = temp.secret!.replace(/(\S{4})\S*(\S{4})/, "$1****$2");
      // 显示名称
      temp.showName = temp.appName + "(" + temp.appkey + ")";
      return temp;
    });
    callback(result);
  });
}

/**
 * 自动加载：选中
 */
function handleAutoCompleteAppInfoSelect(data: Record<string, any>) {
  templateAppId.value = data.id!;
}

/**
 * 确定选中的模板
 */
function handleCopyAppPermission() {
  const param = {
    fromAppId: templateAppId.value,
    toAppId: authAppInfoData.value.id,
  } as AppPermissionCopyParam;
  SystemAPI.copyAppInfoPermission(param).then(() => {
    ElMessage.success("复制成功");
    // 清空模板ID，触发加载应用自身的授权
    templateAppId.value = "";
    // 禁用模板选择
    templateDisable.value = true;
  });
}

/**
 * 选择权限
 */
function handleAuthSelect(_appId: string, _parentIds?: string[], _resourceIds?: string[]) {
  // console.log("handleAuthSelect", appId, parentIds, resourceIds);
  // 当权限变更时，将不能再选模板
  if (!templateDisable.value) {
    templateDisable.value = true;
  }
}

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (_param: AppInfoDto) => {
  dialogVisible.value = true;
  templateDisable.value = false;
  templateAppName.value = "";
  templateAppId.value = "";
  stepActive.value = 0;
  dialogTitle.value = "新增";
  // 默认填充自己所属机构
  instituteList.value = [props.defaultInstitute];
  infoFormData.value.instituteId = props.defaultInstitute.id;
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  infoFormRef.value.clearValidate();
  Object.assign(infoFormData.value, initialFormData.value);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 暴露给父级组件的方法
 */
defineExpose({
  openDialog,
});
</script>

<style lang="scss" scoped>
.my-autocomplete {
  // autocomplete 下拉框样式
  li {
    padding: 7px;
    line-height: normal;
  }

  li .name {
    float: left;
    overflow: hidden;
    text-overflow: ellipsis;

    .addr {
      font-size: 12px;
      color: #b4b4b4;
    }
  }

  li .desc {
    float: right;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  li .highlighted .addr {
    color: #ddd;
  }
  // autocomplete 加载动画
  .circular {
    display: inline;
    width: 30px;
    height: 30px;
    animation: loading-rotate 2s linear infinite;
  }

  .path {
    stroke: var(--el-color-primary);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 90, 150;
    stroke-dashoffset: 0;
    animation: loading-dash 1.5s ease-in-out infinite;
  }
}
</style>
