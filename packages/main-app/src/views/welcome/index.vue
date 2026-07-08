<template>
  <h1>欢迎使用 {{ appConfig.title }}({{ appConfig.version }}) {{ $t("route.welcome") }}</h1>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { appConfig } from "@/settings";
defineOptions({
  name: "Welcome",
});
const { t } = useI18n();
console.log(t("route.welcome"));
</script>
