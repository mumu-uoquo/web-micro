<template>
  <div class="w-full h-full text-center">
    <h1>访客页面 /ecg/index</h1>
    <p>使用场景：xxxx</p>
    <div class="back" title="返回上一页" @click="router.go(-1)">
      <svg-icon name="back" :size="100" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({
  name: "Empty",
});

const router = useRouter();
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
