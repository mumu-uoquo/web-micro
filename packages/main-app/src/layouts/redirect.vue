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
  let targetUrl = url;
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    targetUrl += (targetUrl.includes("?") ? "&" : "?") + queryString;
  }
  // 2. 新窗口打开外部链接
  window.open(targetUrl, "_blank");
  // 3. 当前标签页返回前一页
  setTimeout(() => {
    if (window.history.length > 1) {
      window.history.replaceState(null, "", document.referrer || window.location.href);
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
