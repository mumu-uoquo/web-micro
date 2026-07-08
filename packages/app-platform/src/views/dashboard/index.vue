<template>
  <div class="w-full h-full text-center">
    <h1>控制台</h1>
    <div class="back" title="返回上一页" @click="router.go(-1)">back</div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

defineOptions({
  name: "home-dashboard_super",
  inheritAttrs: false,
});
</script>

<style lang="scss" scoped>
.back {
  position: relative;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  cursor: pointer;
  background: rgb(138 150 160 / 8%);
  border-radius: 18px;
  transform: translate(-50%, -50%);

  &:hover {
    background: rgb(138 150 160 / 20%);
    transition: background 0.6s;
  }
}
</style>
