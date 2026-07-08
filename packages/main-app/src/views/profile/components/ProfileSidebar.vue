<template>
  <el-card class="profile-sidebar">
    <el-skeleton :loading="loading" animated>
      <template #template>
        <div class="skeleton-wrapper">
          <el-skeleton-item
            variant="circle"
            style="width: 80px; height: 80px; margin: 0 auto 16px"
          />
          <el-skeleton-item variant="text" style="width: 60%; margin: 0 auto 8px" />
          <el-skeleton-item variant="text" style="width: 80%; margin: 0 auto 8px" />
          <el-skeleton-item variant="text" style="width: 70%; margin: 0 auto 8px" />
          <el-skeleton-item variant="text" style="width: 80%; margin: 0 auto 8px" />
          <el-skeleton-item variant="text" style="width: 60%; margin: 0 auto 8px" />
          <el-skeleton-item variant="text" style="width: 70%; margin: 0 auto 8px" />
          <el-skeleton-item variant="text" style="width: 50%; margin: 0 auto 8px" />
        </div>
      </template>
      <template #default>
        <div class="sidebar-content">
          <!-- Avatar -->
          <div class="avatar-section">
            <AvatarUpload :current-avatar="userInfo?.avatar ?? ''" @success="emit('refresh')" />
          </div>

          <!-- User name -->
          <div class="user-name">{{ userInfo?.userName }}</div>

          <!-- Basic Info using el-descriptions -->
          <el-descriptions :column="1" border size="small" class="info-descriptions">
            <el-descriptions-item label="姓名">
              <div class="editable-field">
                <template v-if="!isEditingRealName">
                  <span>{{ maskRealName(userInfo?.realName ?? "-") }}</span>
                  <el-button
                    type="primary"
                    link
                    size="small"
                    :icon="Edit"
                    @click="startEditRealName"
                  />
                </template>
                <template v-else>
                  <div class="edit-inline">
                    <el-input
                      v-model="editRealName"
                      size="small"
                      :disabled="savingRealName"
                      @keyup.enter="saveRealName"
                      @keyup.escape="cancelEditRealName"
                    />
                    <el-button
                      link
                      size="small"
                      type="success"
                      :icon="Select"
                      :loading="savingRealName"
                      @click.stop="saveRealName"
                    />
                    <el-button
                      link
                      size="small"
                      type="warning"
                      :icon="Close"
                      :disabled="savingRealName"
                      @click.stop="cancelEditRealName"
                    />
                  </div>
                </template>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="账号">
              {{ userInfo?.userName ?? "—" }}
            </el-descriptions-item>
            <el-descriptions-item label="手机">{{ maskedPhone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ maskedEmail }}</el-descriptions-item>
            <el-descriptions-item label="机构">
              {{ userInfo?.instituteName ?? "—" }}
            </el-descriptions-item>
            <el-descriptions-item label="部门">
              {{ userInfo?.deptName ?? "—" }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              <template v-if="userInfo?.userRoleList?.length">
                <el-tag
                  v-for="role in userInfo.userRoleList"
                  :key="role.id"
                  size="small"
                  type="info"
                  class="role-tag"
                >
                  {{ role.roleName }}
                </el-tag>
              </template>
              <template v-else>—</template>
            </el-descriptions-item>
            <el-descriptions-item label="注册">
              {{ formatDate(userInfo?.createTime, "YYYY-MM-DD HH:mm:ss", "-") }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- Last Login Info -->
          <el-divider>最后登录信息</el-divider>
          <el-descriptions :column="1" border size="small" class="info-descriptions">
            <el-descriptions-item label="时间">
              {{ formatDate(userInfo?.lastedLoginTime, "YYYY-MM-DD HH:mm:ss", "-") }}
            </el-descriptions-item>
            <el-descriptions-item label="地址">
              {{ userInfo?.lastedLoginIp ?? "—" }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
    </el-skeleton>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { Edit, Select, Close } from "@element-plus/icons-vue";
import { formatDate } from "@/utils/format";
import UserAPI, { type UserInfoDto } from "@/api/user";
import { maskRealName, maskPhone, maskEmail } from "@/views/profile/composables/useMaskUtils";
import AvatarUpload from "./AvatarUpload.vue";

/* ***************************** 参数定义 ********************************* */
interface Props {
  userInfo: UserInfoDto | null;
  loading: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  refresh: [];
}>();

const maskedPhone = computed(() => (props.userInfo?.phone ? maskPhone(props.userInfo.phone) : "—"));

const maskedEmail = computed(() => (props.userInfo?.email ? maskEmail(props.userInfo.email) : "—"));

/* ***************************** 姓名编辑 ********************************* */
/**
 * 开始编辑
 * Validates: Requirements 1.11
 */
const isEditingRealName = ref(false);
const editRealName = ref("");
function startEditRealName() {
  editRealName.value = props.userInfo?.realName ?? "";
  isEditingRealName.value = true;
}

/**
 * 取消编辑
 */
function cancelEditRealName() {
  isEditingRealName.value = false;
  editRealName.value = "";
}

/**
 * 保存编辑
 * Validates: Requirements 1.11
 */
const savingRealName = ref(false);
async function saveRealName() {
  // 基础校验
  if (!editRealName.value.trim()) {
    ElMessage.warning("姓名不能为空");
    return;
  }
  // 保存提交
  savingRealName.value = true;
  try {
    await UserAPI.updateSelfRealName({ realName: editRealName.value.trim() });
    isEditingRealName.value = false;
    ElMessage.success("姓名修改成功");
    emit("refresh");
  } finally {
    savingRealName.value = false;
  }
}
</script>

<style scoped>
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  margin-bottom: 16px;
}

.user-name {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
/* 信息描述 */
.info-descriptions {
  width: 100%;
}
.info-descriptions :deep(.el-descriptions__label) {
  width: 60px;
  font-weight: 500;
  text-align: center;
}
/* 可编辑字段 */
.editable-field,
.edit-inline {
  display: flex;
  gap: 8px;
  align-items: center;
}
.edit-inline :deep(.el-input) {
  width: 130px;
}
.edit-inline :deep(.el-button) {
  margin-left: 0;
}
/* 角色标签 */
.role-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}
.role-tag:last-child {
  margin-right: 0;
}
</style>
