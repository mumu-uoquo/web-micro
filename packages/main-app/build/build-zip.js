import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require("fs");
const archiver = require("archiver");
const pkg = require("../package.json");
const dayjs = require("dayjs");

// 包名去掉 scope 前缀：@web-micro/main-app → main-app
const appName = pkg.name.replace(/^@[^/]+\//, "");

// 打包文件名：build-main-app-v1.0.0-202507181530.zip
const buildTime = dayjs().format("YYYYMMDDHHmm");
const outputFileName = `build-${appName}-v${pkg.version}-${buildTime}.zip`;

if (!fs.existsSync("./dist")) {
  console.error("dist 目录不存在，请先执行 build");
  process.exit(1);
}

// 创建压缩包
const archive = archiver("zip", { zlib: { level: 9 } });
const stream = fs.createWriteStream(outputFileName);

stream.on("close", () => {
  const kb = (archive.pointer() / 1024).toFixed(1);
  console.log(`打包完成：${outputFileName}（${kb} KB）`);
});

archive.on("error", (err) => {
  console.error("打包失败:", err);
  process.exit(1);
});

archive.pipe(stream);
archive.directory("./dist", false);
archive.finalize();
