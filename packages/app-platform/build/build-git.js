import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require("fs");
const execSync = require("child_process").execSync;
const dayjs = require("dayjs");

/**
 * 安全执行 git 命令，失败时返回 fallback 而不是抛出异常
 */
function safeExec(cmd, fallback = "") {
  try {
    return execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

async function start() {
  console.log("获取GIT信息...");

  const branch = safeExec("git branch --show-current", "");
  const buildTime = dayjs().format("YYYY-MM-DD HH:mm:ss");

  // 优先使用 origin/<branch>，若不存在则回退到本地 HEAD
  const remoteRef = branch ? `origin/${branch}` : "HEAD";
  const localRef = branch || "HEAD";

  function resolveRef(remote, local) {
    const exists = safeExec(`git rev-parse --verify ${remote}`, "");
    return exists ? remote : local;
  }

  const ref = resolveRef(remoteRef, localRef);

  const gitDataMap = {
    "git.branch": "git rev-parse --abbrev-ref HEAD",
    "git.commit.id": `git rev-parse --verify ${ref}`,
    "git.commit.id.abbrev": `git rev-parse --short ${ref}`,
    "git.commit.message.full": `git log -1 ${ref} --format="%B"`,
    "git.commit.message.short": `git log -1 ${ref} --format="%s"`,
    "git.commit.time": `git log -1 ${ref} --format="%cd" --date=format:"%Y-%m-%d %H:%M:%S"`,
    "git.commit.user.email": `git log -1 ${ref} --format="%ae"`,
    "git.commit.user.name": `git log -1 ${ref} --format="%an"`,
    "git.dirty": "git status --porcelain",
    "git.remote.origin.url": "git remote get-url origin",
    "git.total.commit.count": "git rev-list --count HEAD",
  };

  const info = { "build.time": buildTime };
  Object.keys(gitDataMap).forEach((key) => {
    info[key] = safeExec(gitDataMap[key], "");
  });

  const content = JSON.stringify(info, null, 2);
  console.log(content);

  try {
    fs.writeFileSync("./dist/gitinfo.json", content, "utf-8");
    console.log("GIT信息已成功写入 dist/gitinfo.json");
  } catch (err) {
    console.error("GIT信息写入文件时出错:", err);
  }
}

start();
