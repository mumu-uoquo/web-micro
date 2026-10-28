<template>
  <div class="app-container">
    <!-- 上部：当前授权信息 -->
    <el-card shadow="never" class="info-card">
      <template #header>
        <div class="flex-x-between">
          <span>授权信息</span>
          <div>
            <el-button type="primary" :icon="Download" :loading="exporting" @click="handleExportMachineCode">
              导出机器码
            </el-button>
            <el-upload
              class="import-upload"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :disabled="importing"
              :on-change="handleSelectLicenseFile"
            >
              <el-button type="success" :icon="Upload" :loading="importing">导入license</el-button>
            </el-upload>
          </div>
        </div>
      </template>
      <el-descriptions v-loading="infoLoading" :column="3" border>
        <el-descriptions-item label="拥有人">{{ licenseInfo.owner || "-" }}</el-descriptions-item>
        <el-descriptions-item label="序列号">{{ licenseInfo.serialNo || "-" }}</el-descriptions-item>
        <el-descriptions-item label="系统版本">
          {{ licenseInfo.systemVersion || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="授权时间">
          {{ licenseInfo.authorizedTime || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="有效期开始">{{ licenseInfo.validFrom || "-" }}</el-descriptions-item>
        <el-descriptions-item label="有效期结束">
          {{ licenseInfo.validExpire || "永久有效" }}
        </el-descriptions-item>
        <el-descriptions-item label="过期时间">
          {{ licenseInfo.expireTime || "永久有效" }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 下部：License导入记录 -->
    <el-card shadow="never" class="table-container">
      <template #header>
        <div class="flex-x-between">
          <span>导入记录</span>
          <el-button :icon="Refresh" circle title="刷新" @click="handleQuery()" />
        </div>
      </template>
      <el-table
        v-loading="tableLoading"
        :data="tableData"
        style="width: 100%"
        border
        :max-height="tableMaxHeight"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="serialNo" label="序列号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="systemVersion" label="系统版本" width="120" align="center" />
        <el-table-column prop="validFrom" label="有效期开始" width="170" align="center" />
        <el-table-column prop="validExpire" label="有效期结束" width="170" align="center">
          <template #default="{ row }">{{ row.validExpire || "永久有效" }}</template>
        </el-table-column>
        <el-table-column prop="importResult" label="导入结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.importResult ? 'success' : 'danger'">
              {{ row.importResult ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isCurrent" label="当前生效" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isCurrent" type="primary">当前</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="failReason" label="失败原因" min-width="180" show-overflow-tooltip />
        <el-table-column prop="description" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column prop="createUser" label="导入人" width="120" align="center" />
        <el-table-column prop="createTime" label="导入时间" width="170" align="center" />
      </el-table>

      <template #footer>
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="tableDataTotal"
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          @current-change="handlePagNumChange"
          @size-change="handlePagSizeChange"
          @change="handleQuery"
        />
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { UploadFile } from "element-plus";
import { Download, Upload, Refresh } from "@element-plus/icons-vue";
import SystemAPI, { LicenseInfoDto, LicenseRecordDto, LicenseRecordPageParam } from "@/api/system";

/* ***************************** 授权信息 ********************************* */
const infoLoading = ref(false);
const licenseInfo = ref<LicenseInfoDto>({});

/**
 * 加载当前授权信息
 */
function loadLicenseInfo() {
  infoLoading.value = true;
  SystemAPI.getLicenseInfo()
    .then((data) => {
      licenseInfo.value = data || {};
    })
    .finally(() => {
      infoLoading.value = false;
    });
}

/* ***************************** 导出机器码 ********************************* */
const exporting = ref(false);

/**
 * 格式化当前时间：yyyymmddhhmmss
 */
function formatNow(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/**
 * 导出机器码：将接口返回内容写入 machineCode-yyyymmddhhmmss.dat
 */
function handleExportMachineCode() {
  exporting.value = true;
  SystemAPI.getMachineCode()
    .then((code) => {
      const blob = new Blob([code ?? ""], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `machineCode-${formatNow()}.dat`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      ElMessage.success("机器码导出成功");
    })
    .finally(() => {
      exporting.value = false;
    });
}

/* ***************************** 导入license ********************************* */
const importing = ref(false);

/**
 * 选择license文件后，读取内容并上传服务端
 */
async function handleSelectLicenseFile(file: UploadFile) {
  if (!file.raw || importing.value) {
    return;
  }
  importing.value = true;
  try {
    const content = (await file.raw.text()).trim();
    if (!content) {
      ElMessage.warning("license文件内容为空");
      return;
    }
    await SystemAPI.importLicense({ license: content });
    ElMessage.success("授权导入成功，请重新登录");
    // 刷新授权信息与导入记录
    loadLicenseInfo();
    handleSubmitQuery();
  } catch {
    // 接口异常已由 http 统一提示；文件读取失败无需额外处理
  } finally {
    importing.value = false;
  }
}

/* ***************************** 导入记录 ********************************* */
const queryParams = reactive<LicenseRecordPageParam>({
  pageNum: 1,
  pageSize: 10,
});
const tableLoading = ref(false);
const tableMaxHeight = ref("auto");
const tableDataTotal = ref(0);
const tableData = ref<LicenseRecordDto[]>([]);

/**
 * 分页变更：页码变更（会自动触发分页的 change 事件）
 */
function handlePagNumChange(val: number) {
  queryParams.pageNum = val;
}

/**
 * 分页变更：每页条数变更（会自动触发分页的 change 事件）
 */
function handlePagSizeChange(val: number) {
  queryParams.pageNum = 1;
  queryParams.pageSize = val;
}

/**
 * 回到第一页并查询
 */
function handleSubmitQuery() {
  queryParams.pageNum = 1;
  handleQuery();
}

/**
 * 数据查询
 */
function handleQuery() {
  tableLoading.value = true;
  SystemAPI.listLicenseRecord(queryParams)
    .then((data) => {
      tableDataTotal.value = data.total || 0;
      tableData.value = data.result || [];
    })
    .finally(() => {
      tableLoading.value = false;
    });
}

/**
 * 页面名称，需与路由中保持一致
 */
defineOptions({
  name: "system-license",
  inheritAttrs: false,
});

onMounted(() => {
  // 动态计算表格最大高度（视口高度 - 其他元素高度）
  tableMaxHeight.value = `${Math.max(200, window.innerHeight - 460)}px`;
  loadLicenseInfo();
  handleQuery();
});
</script>

<style lang="scss" scoped>
.info-card {
  margin-bottom: 12px;
}

// 导入按钮与导出按钮同行排列
.import-upload {
  display: inline-block;
  margin-left: 12px;
  vertical-align: top;
}

// card中的表格铺满
.table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table-container > :deep(.el-card__body) {
  padding: 0;
}

.table-container > :deep(.el-card__footer) {
  border-top: 0;
}
</style>
