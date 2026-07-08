<template>
  <el-dropdown trigger="click" @command="handleLanguageChange">
    <div class="i-svg:language" :class="size" />
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item in langOptions"
          :key="item.value"
          :disabled="appStore.language === item.value"
          :command="item.value"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores";
import { localesConfigs } from "@/plugins/i18n";

defineProps({
  size: {
    type: String,
    required: false,
  },
});

interface LangOptions {
  label: string;
  value: string;
}
const langOptions = ref<LangOptions[]>([]);

const appStore = useAppStore();
const { locale, t } = useI18n();

/**
 * 处理语言切换
 *
 * @param lang  语言（zh-CN、en）
 */
function handleLanguageChange(lang: string) {
  locale.value = lang;
  appStore.changeLanguage(lang);

  ElMessage.success(t("langSelect.message.success"));
}

onMounted(() => {
  // 根据i18n配置生成语言选项
  langOptions.value = Object.entries(localesConfigs)
    .filter(([_key, value]: any) => {
      return value.langOptions;
    })
    .map(([_key, value]: any) => {
      return {
        label: value.langOptions.label,
        value: value.langOptions.value,
      } as LangOptions;
    });
});
</script>
