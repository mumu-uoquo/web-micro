<template>
  <template v-if="item.children && item.children.length">
    <!-- 有子节点：渲染为 el-sub-menu -->
    <el-sub-menu :index="item.moduleCode">
      <template #title>
        <i v-if="item.icon" :class="['menu-icon', item.icon]" />
        <span>{{ item.menuName }}</span>
      </template>
      <!-- 递归渲染子节点 -->
      <sidebar-menu
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        @menu-click="onMenuClick"
      />
    </el-sub-menu>
  </template>

  <!-- 无子节点：渲染为 el-menu-item -->
  <el-menu-item
    v-else
    :index="item.moduleCode"
    @click="onMenuClick(item)"
  >
    <i v-if="item.icon" :class="['menu-icon', item.icon]" />
    <template #title>{{ item.menuName }}</template>
  </el-menu-item>
</template>

<script>
export default {
  name: 'SidebarMenu',
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  emits: ['menu-click'],
  methods: {
    onMenuClick(node) {
      // 冒泡给父级，最终由 Shell.vue 的 handleMenuClick 统一处理
      this.$emit('menu-click', node)
    },
  },
}
</script>
