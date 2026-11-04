/**
 * 布局 Composable
 *
 * 整合布局状态、设备检测、菜单数据
 */
import { useRoute, useRouter } from "vue-router";
import { useWindowSize } from "@vueuse/core";
import { useAppStore, usePermissionStore, useSettingsStore } from "@/stores";
import { DeviceEnum } from "@/enums/settings/device.enum";
import { defaults } from "@/settings";
import { AuthStorage, isExternal } from "@/utils";
import { writeTabTicket } from "@/utils";
import type { MenuNode } from "@/stores/modules/permission.store";

const DESKTOP_BREAKPOINT = 992;

/**
 * 构建查询字符串（仅包含 enabled=true 的参数）
 */
export function buildQueryString(params: MenuNode["params"]): string {
  if (!params?.length) return "";
  const parts = params
    .filter((p) => p.enabled)
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.val)}`);
  return parts.length ? "?" + parts.join("&") : "";
}

/**
 * 弹窗打开菜单地址，不执行路由跳转。
 *
 * 外链原样打开；内部路径按主应用的 Hash 路由拼成 origin/#/xxx（与 redirect.vue 的 openWindow 一致），
 * 否则会被当成服务端路径打开。
 *
 * 外链与内部页面使用不同的 window.open 特性，见下方注释。
 */
export function openMenuPopup(url: string, query: Record<string, string> = {}): void {
  let target = url;
  if (!isExternal(url)) {
    target = `${window.location.origin}/#${url.startsWith("/") ? url : `/${url}`}`;
  }
  const search = new URLSearchParams(query).toString();
  if (search) {
    target += (target.includes("?") ? "&" : "?") + search;
  }
  // 外链：断开 opener 并去掉 Referer，防止外部站点通过 window.opener 反向操作本页面。
  // 内部页面：保留 opener —— 浏览器会复制当前标签页的 sessionStorage（未勾选「记住我」时令牌在其中），
  // 并且 isMainWindow() 依赖 opener 判断是否主窗口，弹出的页面不应再建立 SSE 连接。
  window.open(target, "_blank", isExternal(url) ? "noopener,noreferrer" : undefined);
}

export function useLayout() {
  const route = useRoute();
  const router = useRouter();
  const appStore = useAppStore();
  const settingsStore = useSettingsStore();
  const permissionStore = usePermissionStore();
  const { width } = useWindowSize();

  // ============================================
  // 设备检测
  // ============================================

  const isDesktop = computed(() => width.value >= DESKTOP_BREAKPOINT);
  const isMobile = computed(() => appStore.device === DeviceEnum.MOBILE);

  // 监听窗口变化，自动调整设备类型和侧边栏
  watchEffect(() => {
    const device = isDesktop.value ? DeviceEnum.DESKTOP : DeviceEnum.MOBILE;
    appStore.toggleDevice(device);

    if (isDesktop.value) {
      appStore.openSideBar();
    } else {
      appStore.closeSideBar();
    }
  });

  // ============================================
  // 布局状态
  // ============================================

  const currentLayout = computed(() => settingsStore.layout);
  const isSidebarOpen = computed(() => appStore.sidebar.opened);
  const showTagsView = computed(() => settingsStore.showTagsView);
  const showSettings = computed(() => defaults.showSettings);
  const showLogo = computed(() => settingsStore.showAppLogo);

  const layoutClass = computed(() => ({
    hideSidebar: !appStore.sidebar.opened,
    openSidebar: appStore.sidebar.opened,
    mobile: appStore.device === DeviceEnum.MOBILE,
    [`layout-${settingsStore.layout}`]: true,
  }));

  // ============================================
  // 菜单数据
  // ============================================

  /** 路由列表（左侧/顶部菜单） */
  const routes = computed(() => permissionStore.routes);

  /** 混合布局侧边菜单 */
  const sideMenuRoutes = computed(() => permissionStore.mixLayoutSideMenus);

  /** 顶部菜单激活路径 */
  const activeTopMenuPath = computed(() => appStore.activeTopMenuPath);

  /** 当前激活菜单 */
  const activeMenu = computed(() => {
    const { meta, path } = route;
    return meta?.activeMenu || path;
  });

  // ============================================
  // 操作方法
  // ============================================

  function toggleSidebar() {
    appStore.toggleSidebar();
  }

  function closeSidebar() {
    appStore.closeSideBar();
  }

  // ============================================
  // 菜单点击行为
  // ============================================

  /**
   * 处理菜单点击（四种场景，优先级从高到低）：
   * 1. popup=true → window.open 弹窗
   * 2. target='_blank' → Tab_Ticket + 新标签页
   * 3. fullscreen=true → 全屏模式 + router.push
   * 4. 默认 → router.push
   */
  function handleMenuClick(node: MenuNode) {
    const qs = buildQueryString(node.params);
    const fullUrl = node.url + qs;

    // 场景1：popup=true → 弹窗打开，不执行路由跳转
    if (node.popup) {
      openMenuPopup(
        node.url,
        Object.fromEntries((node.params ?? []).filter((p) => p.enabled).map((p) => [p.key, p.val]))
      );
      return;
    }

    // 场景2：target='_blank' → Tab_Ticket + 新标签页
    if (node.target === "_blank") {
      writeTabTicket(AuthStorage.getAccessToken() || "");
      const ticketUrl = fullUrl + (qs ? "&" : "?") + "_ticket=1";
      window.open(ticketUrl, "_blank");
      return;
    }

    // 场景3：fullscreen=true → 全屏模式
    if (node.fullscreen) {
      appStore.setFullscreen(true);
    }

    // 场景3 + 4：router.push 路由跳转
    router.push(node.path + qs).catch(() => {});
  }

  return {
    // 设备
    isDesktop,
    isMobile,
    // 布局
    currentLayout,
    layoutClass,
    isSidebarOpen,
    showTagsView,
    showSettings,
    showLogo,
    // 菜单
    routes,
    sideMenuRoutes,
    activeMenu,
    activeTopMenuPath,
    // 方法
    toggleSidebar,
    closeSidebar,
    handleMenuClick,
    buildQueryString,
  };
}
