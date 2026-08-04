<template>
  <FrameView v-if="showFrame" :src="_path" :params="_params" />
  <Page404 v-else />
</template>

<script setup lang="ts">
import { ref, unref } from "vue";
import { useRouter } from "vue-router";
import FrameView from "./components/FrameView/index.vue";
import Page404 from "@/views/error/404.vue";
import { isExternal } from "@/utils";

const router = useRouter();
const showFrame = ref<boolean>(false);

const { params, query, meta } = unref(router.currentRoute);
const _path = (meta.src || params.src) as string;
const _params = { ...query, ...(meta.params as Record<string, string>) };
if (_path && isExternal(_path)) {
  showFrame.value = true;
} else {
  showFrame.value = false;
  // 采用router.push将会打开新标签，所以采用组件的方式引入404页面
  // router.push({ path: "/error/404", replace: true });
}
</script>
