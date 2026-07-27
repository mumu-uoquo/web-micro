import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(configDir, "src/assets/icons");

const generateSafeList = (dir: string = iconsDir, prefix = ""): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      const subPrefix = prefix ? `${prefix}-${entry.name}` : entry.name;
      return generateSafeList(path.join(dir, entry.name), subPrefix);
    }

    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".svg") return [];

    const iconName = path.basename(entry.name, path.extname(entry.name));
    return [`i-svg:${prefix ? `${prefix}-${iconName}` : iconName}`];
  });

const createSvgIconLoader = (dir: string) => async (name: string) => {
  const iconFiles = new Map<string, string>();

  const collectIconFiles = (currentDir: string, prefix = "") => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const subPrefix = prefix ? `${prefix}-${entry.name}` : entry.name;
        collectIconFiles(path.join(currentDir, entry.name), subPrefix);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".svg") {
        const iconName = path.basename(entry.name, path.extname(entry.name));
        iconFiles.set(
          prefix ? `${prefix}-${iconName}` : iconName,
          path.join(currentDir, entry.name)
        );
      }
    }
  };

  collectIconFiles(dir);
  const filePath = iconFiles.get(name);
  if (!filePath) return undefined;

  let svg = await fs.promises.readFile(filePath, "utf8");
  const svgStart = svg.indexOf("<svg");
  if (svgStart > 0) svg = svg.slice(svgStart);
  return svg.includes('fill="') ? svg : svg.replace(/^<svg /, '<svg fill="currentColor" ');
};

export default defineConfig({
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
      extraProperties: {
        display: "inline-block",
        width: "1em",
        height: "1em",
      },
      collections: {
        svg: createSvgIconLoader(iconsDir),
      },
    }),
    presetTypography(),
  ],
  safelist: generateSafeList(),
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
