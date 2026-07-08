<template>
  <el-drawer v-model="dialogVisible" :title="dialogTitle" size="40%" @close="handleCloseDialog">
    <el-descriptions label-width="100px" :column="2" border>
      <el-descriptions-item label="用户名称" label-align="right" :span="2">
        <el-tag>{{ infoFormData.userId }}</el-tag>
        {{ infoFormData.userName }}
      </el-descriptions-item>

      <el-descriptions-item label="所属机构" label-align="right">
        {{ infoFormData.instituteId }}
      </el-descriptions-item>
      <el-descriptions-item label="会话标识" label-align="right">
        {{ infoFormData.token }}
      </el-descriptions-item>

      <div v-if="infoFormData.loginStatus === '00000' && infoFormData.logoutTime">
        <el-descriptions-item label="登录时间" label-align="right">
          {{ formatDate(infoFormData.loginTime, "YYYY-MM-DD HH:mm:ss") }}
          <el-tag>{{ parseReturnCode(infoFormData.loginStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="在线时长" label-align="right">
          {{ formatWithDayjs(infoFormData.loginTime, infoFormData.logoutTime) }}
        </el-descriptions-item>
      </div>
      <div v-else>
        <el-descriptions-item label="登录时间" label-align="right" :span="2">
          {{ formatDate(infoFormData.loginTime, "YYYY-MM-DD HH:mm:ss") }}
          <el-tag>{{ parseReturnCode(infoFormData.loginStatus) }}</el-tag>
        </el-descriptions-item>
      </div>

      <el-descriptions-item label="退出时间" label-align="right" :span="2">
        {{ formatDate(infoFormData.logoutTime, "YYYY-MM-DD HH:mm:ss") }}
        <el-tag v-if="infoFormData.logoutStatus">
          {{ parseReturnCode(infoFormData.logoutStatus) }}
        </el-tag>
      </el-descriptions-item>

      <el-descriptions-item label="设备指纹" label-align="right">
        {{ infoFormData.deviceSn }}
      </el-descriptions-item>
      <el-descriptions-item label="请求标识" label-align="right">
        {{ infoFormData.traceId }}
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
      <el-descriptions-item label="应用授权" label-align="right" :span="2">
        <el-tag>
          {{ infoFormData.appKey }}
        </el-tag>
        {{ infoFormData.appModuleName }}
      </el-descriptions-item>

      <el-descriptions-item label="登录参数" label-align="right" :span="2">
        <el-descriptions label-width="100px" :column="1" size="small" border>
          <el-descriptions-item
            v-for="(value, key) in infoFormData.loginParam"
            :key="key"
            :label="key"
            label-align="right"
            label-class-name="label-no-background"
          >
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>
      </el-descriptions-item>
    </el-descriptions>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { parseReturnCode } from "@/utils/common";
import { formatDate, parseDate } from "@/utils/format";
import { LogUserLoginDto } from "@/api/adminLogs";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

/* ***************************** 参数定义 ********************************* */
const dialogVisible = ref<boolean>(false);
const dialogTitle = ref<string>("日志详情");
// 初始表单数据
const initialFormData = ref<LogUserLoginDto>({
  id: "",
  traceId: "",
});
const infoFormData = ref<LogUserLoginDto>({ ...initialFormData.value });

/* ***************************** 工具函数 ********************************* */
function formatWithDayjs(startStr: string | undefined, endStr: string | undefined) {
  if (!startStr || !endStr) {
    return "";
  }
  const start = dayjs(parseDate(startStr));
  const end = dayjs(parseDate(endStr));
  const diff = dayjs.duration(end.diff(start));

  const days = diff.days();
  const hours = diff.hours();
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟${seconds}秒`;
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`;
  } else if (seconds > 0) {
    return `${seconds}秒`;
  }
}

/* ***************************** 窗体操作 ********************************* */
/**
 * 显示弹窗
 */
const openDialog = async (data: LogUserLoginDto) => {
  // 最后显示弹窗
  dialogVisible.value = true;
  Object.assign(infoFormData.value, data);
};

/**
 * 关闭弹窗
 */
function handleCloseDialog() {
  dialogVisible.value = false;
  Object.assign(infoFormData.value, initialFormData.value);
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
// 去除内嵌表格的背景色
:deep(.label-no-background) {
  background: none !important;
}
</style>
