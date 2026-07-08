<template>
  <el-card>
    <template #header>
      <div class="flex-x-between">
        <span>安全设置</span>
        <div style="width: 150px">
          <el-progress :percentage="securityScore" :color="colors" :stroke-width="16">
            <template #default>
              <div>{{ securityScore }} 分</div>
            </template>
          </el-progress>
        </div>
      </div>
    </template>

    <div class="security-list">
      <!-- 账户密码 -->
      <div class="security-item">
        <div class="security-item-main">
          <div class="security-item-info">
            <span class="security-item-label">账户密码</span>
            <span class="security-item-status">
              <DictTag v-if="userInfo?.pwdLevel" :code="userInfo?.pwdLevel" />
              <span v-else>未设置</span>
            </span>
          </div>
          <div class="security-item-actions">
            <el-button type="primary" link @click="showPasswordDialog = true">修改</el-button>
          </div>
        </div>
      </div>

      <!-- 绑定手机 -->
      <div class="security-item">
        <div class="security-item-main">
          <div class="security-item-info">
            <span class="security-item-label">绑定手机</span>
            <span class="security-item-status">
              {{ userInfo?.phone ? maskPhone(userInfo.phone) : "未绑定" }}
            </span>
          </div>
          <div class="security-item-actions">
            <el-button type="primary" link @click="showPhoneDialog = true">
              {{ userInfo?.phone ? "更换" : "绑定" }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 绑定邮箱 -->
      <div class="security-item">
        <div class="security-item-main">
          <div class="security-item-info">
            <span class="security-item-label">绑定邮箱</span>
            <span class="security-item-status">
              {{ userInfo?.email ? maskEmail(userInfo.email) : "未绑定" }}
            </span>
          </div>
          <div class="security-item-actions">
            <el-button type="primary" link @click="showEmailDialog = true">
              {{ userInfo?.email ? "更换" : "绑定" }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 双因子认证 -->
      <div class="security-item">
        <div class="security-item-main">
          <div class="security-item-info">
            <span class="security-item-label">MFA认证</span>
            <span class="security-item-status">
              <el-tag :type="mfaBound ? 'success' : 'info'" size="small">
                {{ mfaBound ? "已绑定" : "未绑定" }}
              </el-tag>
            </span>
          </div>
          <div class="security-item-actions">
            <el-switch v-model="mfaEnabled" @change="handleMfaToggle" />
            <el-button type="primary" link @click="showMfaDialog = true">
              {{ mfaBound ? "更换" : "绑定" }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 密码修改弹窗 -->
    <PasswordDialog v-model:visible="showPasswordDialog" @success="emit('refresh')" />

    <!-- 手机号修改弹窗 -->
    <PhoneDialog
      v-model:visible="showPhoneDialog"
      :current-phone="userInfo?.phone"
      @success="emit('refresh')"
    />

    <!-- 邮箱修改弹窗 -->
    <EmailDialog
      v-model:visible="showEmailDialog"
      :current-email="userInfo?.email"
      @success="emit('refresh')"
    />

    <!-- 双因子认证弹窗 -->
    <MfaDialog v-model:visible="showMfaDialog" @success="handleMfaSuccess" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import DictTag from "@/components/DictTag/index.vue";
import UserAPI, { type UserInfoDto } from "@/api/user";
import { maskPhone, maskEmail } from "@/views/profile/composables/useMaskUtils";
import PasswordDialog from "./PasswordDialog.vue";
import PhoneDialog from "./PhoneDialog.vue";
import EmailDialog from "./EmailDialog.vue";
import MfaDialog from "./MfaDialog.vue";

/* ***************************** 参数定义 ********************************* */
interface Props {
  userInfo: UserInfoDto | null;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  refresh: [];
}>();

// 弹窗显示控制
const showPasswordDialog = ref(false);
const showPhoneDialog = ref(false);
const showEmailDialog = ref(false);
const showMfaDialog = ref(false);

/* ***************************** 安全分值 ********************************* */
/**
 * 各段颜色定义
 */
const colors = [
  { color: "#f56c6c", percentage: 40 },
  { color: "#e6a23c", percentage: 80 },
  { color: "#5cb87a", percentage: 100 },
];

/**
 * 计算安全分值
 * 密码占 50%，双因子认证占 20%，手机号占 20%，邮箱占 10%
 * Validates: Requirements 3.21
 */
const securityScore = computed(() => {
  if (!props.userInfo) return 0;

  let score = 0;

  // 密码强度得分（50%）
  let pwdScore = 0;
  switch (props.userInfo.pwdLevel) {
    case DictionaryEnum.PASSWORD_STRONG:
      pwdScore = 50 * 1.0;
      break;
    case DictionaryEnum.PASSWORD_MIDDLE:
      pwdScore = 50 * 0.66;
      break;
    case DictionaryEnum.PASSWORD_WEAK:
      pwdScore = 50 * 0.33;
      break;
  }
  score += pwdScore;

  // 双因子认证得分（20%）：已开启且已绑定得满分
  if (mfaEnabled.value && mfaBound.value) {
    score += 20;
  }

  // 手机号得分（20%）：已绑定得满分
  if (props.userInfo.phone) {
    score += 20;
  }

  // 邮箱得分（10%）：已绑定得满分
  if (props.userInfo.email) {
    score += 10;
  }

  return Math.round(score);
});

/* ***************************** 双因子开关 ********************************* */
// 双因子开关状态
const mfaEnabled = ref(false);
// 双因子绑定状态
const mfaBound = ref(true);

/**
 * 保存双因子认证开关状态
 */
async function handleMfaToggle(val: string | number | boolean) {
  await UserAPI.saveUserSetting([
    {
      configCode: "security.mfa.enabled",
      configValue: `${val}`,
    },
  ]);
  ElMessage.success(val ? "双因子认证已开启" : "双因子认证已关闭");
}

/**
 * 双因子认证绑定成功后刷新用户信息
 * 注：绑定成功后，默认开启双因子认证开关
 */
function handleMfaSuccess() {
  mfaBound.value = true;
  mfaEnabled.value = true;
  emit("refresh");
}

/**
 * 初始获取双因子开关状态
 */
async function getMfaStatus() {
  try {
    const res = await UserAPI.getUserSetting({
      configCode: "security.mfa.enabled",
    });
    mfaEnabled.value = Boolean(res === "true");
  } catch (_error) {
    mfaEnabled.value = false; // 默认关闭
  }
}

/* ***************************** 监听器等（需放在最后） ********************************* */
// 页面挂载时自动获取
onMounted(() => {
  getMfaStatus();
});
</script>

<style scoped>
.security-score {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 20px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.score-label {
  min-width: 80px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.score-content {
  display: flex;
  flex: 1;
  gap: 16px;
  align-items: center;
}

.score-value {
  min-width: 50px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.security-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
}

.security-item {
  border-bottom: 1px solid var(--el-border-color-light);
}

.security-item:last-child {
  border-bottom: none;
}

.security-item-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.security-item-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.security-item-label {
  min-width: 80px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.security-item-status {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.security-item-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
