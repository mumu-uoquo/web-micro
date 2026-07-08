<template>
  <div class="tabs-container">
    <el-tabs v-model="stepActive" type="border-card" class="tabs-header">
      <el-tab-pane name="0" label="模板授权" :disabled="inhertTabPaneDisabled">
        <div style="text-align: center">
          <el-form :disabled="readOnly">
            <el-transfer
              v-model="appInherts"
              filterable
              :titles="['未授权', '已授权']"
              :data="appTemplateList"
              :props="{
                key: 'id',
                label: 'appName',
              }"
            >
              <template #default="{ option }">
                <el-tooltip class="item" effect="dark" :content="option.appName" placement="top">
                  <span>{{ option.appName }}</span>
                </el-tooltip>
              </template>
              <template #left-empty>
                <el-empty :image-size="60" description="No data" />
              </template>
              <template #right-empty>
                <el-empty :image-size="60" description="No data" />
              </template>
            </el-transfer>
          </el-form>
        </div>
      </el-tab-pane>
      <el-tab-pane name="1" label="个性授权">
        <ResourceTable
          ref="resourceTableRef"
          :read-only="readOnly"
          :app-id="currentAppId"
          @on-change="handleResourceChange"
        />
      </el-tab-pane>
    </el-tabs>
    <div class="button-wrapper">
      <div v-show="stepActive === '0'">
        <el-button type="primary" :disabled="readOnly" @click="handleAuthInhertSubmit">
          保 存
        </el-button>
      </div>
      <div v-show="stepActive === '1'">
        <el-button type="primary" :disabled="readOnly" @click="openResourceForm()">新增</el-button>
        <el-button type="primary" :disabled="readOnly" @click="openResourceImport()">
          导入
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, onBeforeMount } from "vue";
import { ElMessage } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import SystemAPI, { AppInfoDto, AppInhertAddParam } from "@/api/system";
import ResourceTable from "./ResourceTable.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits<{
  // 提交保存：所有的授权信息（包含之前已经授权的）
  (e: "on-change", appId: string, parentIds?: string[], resourceIds?: string[]): void;
}>();
// 暴露给父级的自定义属性
const props = defineProps<{
  // 模板ID（新建时用）
  templateId?: string;
  // 当前APP信息
  infoData: AppInfoDto;
}>();

const stepActive = ref<string>("0");
const readOnly = ref<boolean>(false);
const currentAppId = ref<string>("");
const inhertTabPaneDisabled = ref<boolean>(false);

/* ***************************** 模板授权 ********************************* */
const appInherts = ref<string[]>([]);
const appTemplateList = ref<AppInfoDto[]>([]);

/**
 * 模板授权：加载所有模板列表
 */
function loadTemplateList() {
  SystemAPI.listAppInfoByTemplate().then((data) => {
    appTemplateList.value = data || [];
  });
}

/**
 * 模板授权：加载已授权的列表
 */
function loadInhertList(appId: string) {
  // console.log("loadInhertList", appId);
  appInherts.value = [];
  SystemAPI.listRelateInherit({ id: appId }).then((data) => {
    appInherts.value = data!.map((item) => item.id);
  });
}

/**
 * 模板授权：保存
 */
function handleAuthInhertSubmit() {
  const param = { appId: currentAppId.value, parentIdList: appInherts.value } as AppInhertAddParam;
  // console.log("handleAuthInhertSubmit", param);
  SystemAPI.addRelateInherit(param).then((_data) => {
    ElMessage.success("保存成功");
    emits("on-change", currentAppId.value, appInherts.value, []); // 触发自定义事件
  });
}

/* ***************************** 个性授权 ********************************* */
const resourceTableRef = ref(ResourceTable);
function openResourceForm() {
  resourceTableRef.value.openResourceForm();
}
function openResourceImport() {
  resourceTableRef.value.openResourceImport();
}

/**
 * 当资源有变更时，应该锁定模板选择框
 */
function handleResourceChange(appId: string, resourceIds?: string[]) {
  // console.log("handleResourceChange", appId, resourceIds);
  emits("on-change", currentAppId.value, [], resourceIds); // 触发自定义事件
}

/* ***************************** 监听器等（需放在最后） ********************************* */
/**
 * 在组件挂载前执行（无法获取到 DOM 元素）
 */
onBeforeMount(() => {
  loadTemplateList();
});
/**
 * 监听属性变化（watch：首次不会监听）
 */
// watch([() => props.templateId, () => props.infoData], () => {
watchEffect(() => {
  // console.log("props change, templateId", props.templateId, "infoData", props.infoData);
  // 提取当前应用ID
  if (props.templateId && props.templateId != "") {
    readOnly.value = true;
    currentAppId.value = props.templateId;
  } else {
    readOnly.value = false;
    currentAppId.value = props.infoData.id;
  }
  // 应用为模板时只能做“个性授权”
  if (props.infoData.templateType != DictionaryEnum.TEMPLATE_TYPE_NONE) {
    stepActive.value = "1";
    inhertTabPaneDisabled.value = true;
  } else {
    stepActive.value = "0";
    inhertTabPaneDisabled.value = false;
    // 加载关联的授权模板
    loadInhertList(currentAppId.value);
  }
});
</script>

<style lang="scss" scoped>
// tabs右侧按钮
.tabs-container {
  position: relative; /* 为内部元素提供定位上下文 */
  .button-wrapper {
    position: absolute; /* 绝对定位 */
    top: 4px;
    right: 10px;
  }
}
// transfer面板样式
.el-transfer {
  width: 100%;

  :deep(.el-transfer-panel) {
    width: 300px;
  }
  :deep(.el-transfer__buttons) {
    padding: 0 15px;
  }
}
</style>
