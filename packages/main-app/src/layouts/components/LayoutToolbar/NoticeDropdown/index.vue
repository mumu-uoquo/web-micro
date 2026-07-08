<template>
  <!-- 小屏模式：仅图标 + 数量，点击跳转消息页 -->
  <div v-if="mobile" class="notice notice--mobile" @click="router.push('/message/receiver')">
    <el-badge v-if="noticeCount > 0" :value="noticeCount" :max="99" :offset="[0, 4]">
      <el-icon><Bell /></el-icon>
    </el-badge>
    <el-icon v-else><Bell /></el-icon>
  </div>

  <!-- 桌面模式：下拉面板 + 消息详情 -->
  <div v-else class="notice">
    <el-dropdown class="h-full items-center justify-center" trigger="click">
      <!-- 消息图标 -->
      <el-badge v-if="noticeCount > 0" :offset="[0, 15]" :value="noticeCount" :max="99">
        <el-icon><Bell /></el-icon>
      </el-badge>
      <div v-else>
        <el-icon><Bell /></el-icon>
      </div>
      <!-- 消息列表 -->
      <template #dropdown>
        <el-dropdown-menu>
          <el-tabs v-model="activeName" :stretch="true" class="dropdown-tabs w350px">
            <el-tab-pane :label="formatTabHeader('通知', notifyList.length)" name="notify">
              <NoticeList :list="notifyList" @on-show-detail="handleReadNotice" />
            </el-tab-pane>
            <el-tab-pane :label="formatTabHeader('消息', messageList.length)" name="message">
              <NoticeList :list="messageList" @on-show-detail="handleReadNotice" />
            </el-tab-pane>
            <el-tab-pane :label="formatTabHeader('任务', todoList.length)" name="todo">
              <NoticeList :list="todoList" @on-show-detail="handleReadNotice" />
            </el-tab-pane>
          </el-tabs>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 消息详情 -->
    <el-dialog
      v-model="detailVisible"
      :title="detailInfo?.messageTitle ?? '通知详情'"
      :close-on-click-modal="false"
      width="600px"
      custom-class="notice-detail"
    >
      <div v-if="detailInfo" class="notice-detail__wrapper">
        <div class="notice-detail__meta">
          <span>
            <el-icon><User /></el-icon>
            {{ detailInfo.senderName }}
          </span>
          <span class="ml-2">
            <el-icon><Timer /></el-icon>
            {{ formatDate(detailInfo.senderTime, "YYYY-MM-DD HH:mm:ss") }}
          </span>
        </div>

        <div class="notice-detail__content">
          <div v-html="detailInfo.messageContent"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { formatDate } from "@/utils/format";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import { useNoticeSync } from "@/composables/sse";
import MessageAPI, { type MsgInfoViewDto } from "@/api/message";
import NoticeList from "./NoticeList.vue";

const props = defineProps({
  /** 小屏模式：只显示图标和消息数，点击跳转消息页 */
  mobile: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();
const noticeSync = useNoticeSync();

/* ***************************** 实时消息 ********************************* */
/**
 * 推入消息到对应列表，重复则忽略，新消息弹出通知
 */
function pushIfAbsent(list: MsgInfoViewDto[], data: MsgInfoViewDto) {
  if (list.some((item) => item.messageId === data.messageId)) return;
  list.push(data);
  noticeCount.value += 1;
  ElNotification({
    title: "您收到一条新的消息！",
    message: data.messageTitle || data.messageContent,
    type: "success",
    position: "bottom-right",
  });
}

/* ***************************** 消息列表 ********************************* */
const activeName = ref("notify");
const noticeCount = ref<number>(0);
const notifyList = ref<MsgInfoViewDto[]>([]);
const messageList = ref<MsgInfoViewDto[]>([]);
const todoList = ref<MsgInfoViewDto[]>([]);

/**
 * 获取我的未读消息
 */
function featchMyNotice() {
  MessageAPI.listMyMessageByUnread({}).then((data) => {
    noticeCount.value = data.length || 0;
    parseNoticeList(data || []);
  });
}

/**
 * 解析消息列表
 */
function parseNoticeList(list: MsgInfoViewDto[]) {
  notifyList.value = list.filter(
    (item) => DictionaryEnum.MESSAGE_CATEGORY_NOTICE === item.messageType
  );
  messageList.value = list.filter(
    (item) => DictionaryEnum.MESSAGE_CATEGORY_SYSTEM === item.messageType
  );
  todoList.value = list.filter((item) => DictionaryEnum.MESSAGE_CATEGORY_TODO === item.messageType);
}

/**
 * 格式化标签名称
 */
function formatTabHeader(name: string, count: number) {
  return count === 0 ? name : `${name} (${count})`;
}

/* ***************************** 消息详情（桌面模式） ********************************* */
const detailVisible = ref(false);
const detailInfo = ref<MsgInfoViewDto | null>(null);

/**
 * 阅读通知公告
 */
function handleReadNotice(messageId: string) {
  MessageAPI.viewMessage({ id: messageId }).then((data) => {
    detailVisible.value = true;
    detailInfo.value = data;
  });
}

/* ***************************** 监听器等 ********************************* */
let unsubscribes: (() => void)[] = [];

onMounted(() => {
  featchMyNotice();
  noticeSync.initialize();
  unsubscribes = [
    noticeSync.onNotify((data) => pushIfAbsent(notifyList.value, data)),
    noticeSync.onMessage((data) => pushIfAbsent(messageList.value, data)),
    noticeSync.onTodo((data) => pushIfAbsent(todoList.value, data)),
  ];
});

onBeforeUnmount(() => {
  unsubscribes.forEach((unsub) => unsub());
  unsubscribes = [];
  noticeSync.cleanup();
});
</script>

<style lang="scss" scoped>
.dropdown-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 0 36px;
  }

  :deep(.el-tabs__nav-wrap)::after {
    height: 1px;
  }
}

.notice {
  :deep(.el-badge) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  :deep(.el-dialog) {
    line-height: initial;
    cursor: default;
  }

  &--mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    :deep(.el-badge) {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .el-icon {
      font-size: 20px;
    }
  }

  .notice-detail {
    &__wrapper {
      padding: 0 20px;
    }

    &__meta {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      font-size: 13px;
      line-height: initial;
      color: var(--el-text-color-secondary);
    }

    &__content {
      max-height: 60vh;
      padding-top: 16px;
      margin-bottom: 24px;
      overflow-y: auto;
      line-height: initial;
      text-align: initial;
      border-top: 1px solid var(--el-border-color);

      &::-webkit-scrollbar {
        width: 6px;
      }
    }
  }
}
</style>
