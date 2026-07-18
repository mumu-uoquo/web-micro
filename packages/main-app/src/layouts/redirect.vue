<template>
  <div />
</template>

<script setup lang="ts">
import { useRoute, useRouter, type LocationQuery } from "vue-router";
import { isExternal } from "@/utils/index";

/* ***************************** 提取URL和参数 ********************************* */
const router = useRouter();
const route = useRoute();

const { params, path, query, meta } = route;
let _path =
  (meta.src as string) || (Array.isArray(params.path) ? params.path.join("/") : params.path);
if (!_path) {
  _path = path?.replace(/\/redirect\/?/, "");
}

// 1. 参数处理
const _params = handleParams({ ...query, ...(meta.params as Record<string, string>) });
// 2. 路由处理
if (!_path) {
  router.push({ path: "/error/404", replace: true });
} else if ("window" == meta.target || isExternal(_path)) {
  openWindow(_path, _params);
} else if (_path.startsWith("/")) {
  router.replace({ path: _path, query: _params });
} else {
  router.replace({ path: "/" + _path, query: _params });
}

/**
 * 参数处理
 */
function handleParams(params: LocationQuery): Record<string, string> {
  const _params = {} as Record<string, string>;
  Object.entries(params).map(([key, val]: any) => {
    // TODO 需要处理 val 中的变量 ${}
    _params[key] = val;
  });
  return _params;
}

/**
 * 打开外部链接
 */
function openWindow(url: string, params: Record<string, string>) {
  // 1. 构建完整的URL（包含查询参数）
  if (!isExternal(url)) {
    url = url.startsWith("/") ? url.substring(1) : url;
    url = `${window.location.origin}/#/${url}`;
  }
  // 当url中有#连接时，只能采用 new URLSearchParams() 的方式，
  // 如果用 URL.searchParams.set 的方式，会自动把参数挪到井号前面
  let targetUrl = url;
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    targetUrl += (targetUrl.includes("?") ? "&" : "?") + queryString;
  }
  // const targetUrl = new URL(url, window.location.origin);
  // Object.entries(params).map(([key, value]) => {
  //   targetUrl.searchParams.set(key, value);
  // });
  // 2. 新窗口打开外部链接
  window.open(targetUrl, "_blank");
  // 3. 当前标签页返回前一页
  setTimeout(() => {
    if (window.history.length > 1) {
      // 步骤1：用replaceState替换当前历史记录，覆盖掉当前页的记录
      // 三个参数：状态对象（可传null）、标题（浏览器大多忽略，传''）、上一页的URL（可传当前上一页的实际地址，或用location.href暂存）
      window.history.replaceState(null, "", document.referrer || window.location.href);
      // 步骤2：执行回退，此时回退后，原当前页的历史记录已被覆盖，不会保留
      router.go(-1);
    } else {
      router.replace("/");
    }
  }, 1000);
}

/* ***************************** 监听器等（需放在最后） ********************************* */
defineOptions({
  name: "Redirect",
});
</script>
