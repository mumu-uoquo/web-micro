// 多组件库的国际化和本地项目国际化兼容
import type { App } from "vue";
import { createI18n, type I18n } from "vue-i18n";
import { useAppStoreHook } from "@/stores";

// element-plus国际化
import enLocale from "element-plus/es/locale/lang/en";
import zhLocale from "element-plus/es/locale/lang/zh-cn";

// 自定义国际化资源（仅初始化时，一次性加载）
const siphonI18n = (function () {
  // 1. 自动加载所有语言文件
  const modules: Record<string, any> = import.meta.glob(
    ["/src/lang/**/*.{yaml,yml}", "/src/lang/**/*.{js,json}"],
    { eager: true }
  );
  const messages: Record<string, any> = {};
  // 2. 处理每个模块
  Object.entries(modules).forEach(([path, module]) => {
    // 匹配所有支持的文件类型
    const match = path.match(/\/src\/lang\/([^/]+)\/.+\.(yaml|yml|json|js)$/);
    if (!match) {
      return;
    }
    const lang = match[1]; // 语言代码，如 'en', 'zh-CN'
    // 提取文件名（不含扩展名）作为命名空间
    const fileName =
      path
        .split("/")
        .pop()
        ?.replace(/\.(yaml|yml|json|js)$/, "") || "";
    if (!messages[lang]) {
      messages[lang] = {};
    }
    // 获取模块内容
    const content = module.default || module;
    // 如果文件是 index，直接合并到语言根级
    if (fileName === "index") {
      messages[lang] = {
        ...messages[lang],
        ...content,
      };
    } else {
      // 否则作为命名空间
      messages[lang][fileName] = content;
    }
  });
  return (prefix = "zh-CN") => {
    return messages[prefix];
  };
})();

// 导出：当前语言资源
export const currentLocale = computed(() =>
  useAppStoreHook().language === "en" ? enLocale : zhLocale
);

// 导出：多语言列表
export const localesConfigs = {
  "zh-CN": {
    langOptions: {
      label: "简体中文",
      value: "zh-CN",
    },
    ...siphonI18n("zh-CN"),
    ...zhLocale,
  },
  en: {
    langOptions: {
      label: "English",
      value: "en",
    },
    ...siphonI18n("en"),
    ...enLocale,
  },
};
// 多语言初始化
const i18n: I18n = createI18n({
  legacy: false,
  locale: computed(() => useAppStoreHook().language).value, // 初始值
  fallbackLocale: "zh-CN",
  messages: localesConfigs,
  globalInjection: true,
});

/**
 * 全局注册 I18n，使用示例：
 * <template>
 *   {{ $t("welcome") }}
 * </template>
 * <script setup lang="ts">
 *   import { useI18n } from "vue-i18n";
 *   const { t } = useI18n();
 *   console.log(t("welcome"));
 * </script>
 */
export function setupI18n(app: App<Element>) {
  app.use(i18n);
}

export default i18n;
