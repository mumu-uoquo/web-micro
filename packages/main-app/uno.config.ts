// https://unocss.nodejs.cn/guide/config-file
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

import fs from "node:fs";
import path from "node:path";

// 本地SVG图标目录
const iconsDir = "./src/assets/icons";

/**
 * 递归扫描目录，收集所有 SVG 文件并生成 safelist
 * 子目录中的图标使用 `i-svg:子目录-图标名` 的格式（用连字符而非斜杠）
 */
const generateSafeList = (dir: string = iconsDir, prefix: string = ""): string[] => {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory()) {
        // 递归处理子目录，前缀追加目录名（用 `-` 拼接）
        const subPrefix = prefix ? `${prefix}-${entry.name}` : entry.name;
        return generateSafeList(path.join(dir, entry.name), subPrefix);
      }
      if (entry.name.endsWith(".svg")) {
        const iconName = entry.name.replace(".svg", "");
        const fullName = prefix ? `${prefix}-${iconName}` : iconName;
        return [`i-svg:${fullName}`];
      }
      return [];
    });
  } catch (error) {
    console.error("无法读取图标目录:", error);
    return [];
  }
};

/**
 * 自定义 SVG 图标 loader，支持子目录
 * 图标名约定：根目录图标用 `图标名`，子目录图标用 `子目录-图标名`
 * 对应用法：`i-svg:图标名`、`i-svg:子目录-图标名`
 */
const createSvgIconLoader = (dir: string) => {
  return async (name: string) => {
    // 将连字符前缀还原为子目录路径，例如 `site-wechat` -> `site/wechat`
    const parts = name.split("-");
    // 逐级尝试：优先匹配最长的子目录前缀
    for (let i = parts.length - 1; i >= 1; i--) {
      const subDir = parts.slice(0, i).join("/");
      const iconName = parts.slice(i).join("-");
      const filePath = path.join(dir, subDir, `${iconName}.svg`);
      try {
        const stat = await fs.promises.lstat(filePath);
        if (stat.isFile()) {
          let svg = await fs.promises.readFile(filePath, "utf-8");
          const cleanupIdx = svg.indexOf("<svg");
          if (cleanupIdx > 0) svg = svg.slice(cleanupIdx);
          return svg.includes('fill="') ? svg : svg.replace(/^<svg /, '<svg fill="currentColor" ');
        }
      } catch {
        // 继续尝试下一级
      }
    }
    // 无子目录，直接在根目录查找
    const filePath = path.join(dir, `${name}.svg`);
    try {
      const stat = await fs.promises.lstat(filePath);
      if (stat.isFile()) {
        let svg = await fs.promises.readFile(filePath, "utf-8");
        const cleanupIdx = svg.indexOf("<svg");
        if (cleanupIdx > 0) svg = svg.slice(cleanupIdx);
        return svg.includes('fill="') ? svg : svg.replace(/^<svg /, '<svg fill="currentColor" ');
      }
    } catch {
      // 文件不存在
    }
    return undefined;
  };
};

export default defineConfig({
  // 自定义快捷类
  shortcuts: {
    "wh-full": "w-full h-full",
    "flex-center": "flex justify-center items-center",
    "flex-x-center": "flex justify-center",
    "flex-y-center": "flex items-center",
    "flex-x-start": "flex items-center justify-start",
    "flex-x-between": "flex items-center justify-between",
    "flex-x-end": "flex items-center justify-end",
  },
  theme: {
    colors: {
      primary: "var(--el-color-primary)",
      primary_dark: "var(--el-color-primary-light-5)",
    },
    breakpoints: Object.fromEntries(
      [640, 768, 1024, 1280, 1536, 1920, 2560].map((size, index) => [
        ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"][index],
        `${size}px`,
      ])
    ),
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      // 额外属性
      extraProperties: {
        display: "inline-block",
        width: "1em",
        height: "1em",
      },
      // 图标集合
      collections: {
        // svg 是图标集合名称，使用 `i-svg:图标名` 或 `i-svg:子目录-图标名` 调用
        svg: createSvgIconLoader(iconsDir),
      },
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        // ...
      },
    }),
  ],
  safelist: generateSafeList(),
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
