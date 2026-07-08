<template>
  <div class="notice-container">
    <el-avatar
      v-if="info.senderAvatar"
      :size="30"
      :src="info.senderAvatar"
      class="notice-container-avatar"
    />
    <div class="notice-container-text">
      <div class="notice-text-title">
        <div class="notice-title-content" @click="handleShowDetail(info.messageId)">
          {{ props.info.messageTitle }}
        </div>
        <DictTag
          v-if="info.messageLevel"
          :code="info.messageLevel"
          size="small"
          class="notice-title-extra"
        />
      </div>
      <div class="notice-text-description">
        {{ removeHtmlTagsWithRegex(props.info.messageContent || "") }}
      </div>
      <div class="notice-text-datetime text-[#00000073] dark:text-white">
        {{ formatDate(props.info.senderTime, "YYYY-MM-DD HH:mm:ss") }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatDate } from "@/utils/format";
import { MsgInfoViewDto } from "@/api/message";
import DictTag from "@/components/DictTag/index.vue";

// 暴露给父级的自定义事件
const emits = defineEmits(["on-show-detail"]);
// 暴露给父级的自定义属性
const props = defineProps({
  info: {
    type: Object as PropType<MsgInfoViewDto>,
    required: true,
  },
});
/**
 * 移除 HTML 标签的正则方法
 */
const removeHtmlTagsWithRegex = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]+>/g, "");
};

/**
 * 查看详情
 */
function handleShowDetail(messageId: string) {
  emits("on-show-detail", messageId);
}
</script>

<style lang="scss" scoped>
.notice-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  .notice-container-avatar {
    margin-right: 16px;
    background: #f0f0f0;
  }

  .notice-container-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
  }

  .notice-text-title {
    display: flex;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5715;
    color: #000000d9;
    cursor: pointer;

    .notice-title-content {
      flex: 1;
      width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notice-title-extra {
      float: right;
      margin-top: -1.5px;
      font-weight: 400;
    }

    .notice-text-description,
    .notice-text-datetime {
      font-size: 12px;
      line-height: 1.5715;
    }

    .notice-text-description {
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .notice-text-datetime {
      margin-top: 4px;
      color: #00000073;
    }
  }
}
// 去掉最后一行的底部边框
.notice-container:last-child {
  border-bottom: none;
}
.notice-title-popper {
  max-width: 238px;
}
// 暗黑模式
.dark .notice-container {
  border-color: #303030;
  .notice-container-avatar {
    background: #fff;
  }
  .notice-container-text {
    .notice-text-title {
      color: #fff;
    }
    .notice-text-datetime {
      color: #fff;
    }
  }
}
</style>
