<template>
  <el-scrollbar max-height="330px">
    <div v-if="props.list.length === 0" class="notice-list">
      <el-empty :description="emptyText ? emptyText : '暂无消息'" />
    </div>
    <div v-else class="notice-list">
      <NoticeItem
        v-for="item in props.list"
        :key="item.messageId"
        :info="item"
        @on-show-detail="handleShowDetail"
      />
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts">
import { MsgInfoViewDto } from "@/api/message";
import NoticeItem from "./NoticeItem.vue";

/* ***************************** 参数定义 ********************************* */
// 暴露给父级的自定义事件
const emits = defineEmits(["on-show-detail"]);
// 暴露给父级的自定义属性
const props = defineProps({
  list: {
    type: Array as PropType<Array<MsgInfoViewDto>>,
    required: true,
  },
  emptyText: {
    type: String,
    default: "",
  },
});

/**
 * 查看详情
 */
function handleShowDetail(messageId: string) {
  emits("on-show-detail", messageId);
}
</script>

<style lang="scss" scoped>
.notice-list {
  height: 330px;
  padding: 15px 24px 0;
}
</style>
