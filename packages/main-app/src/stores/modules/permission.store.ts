import type { RouteRecordRaw, RouteMeta } from "vue-router";
import router, { constantRoutes } from "@/router";
import { store } from "@/stores";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import AuthAPI, { type ModuleTreeDto } from "@/api/auth";
import { isExternal } from "@/utils";
import { getGlobalActions } from "@/micro/global-state";
import { buildHostRoutePath, isVisitorRoute, resolveMicroAppName } from "@/micro/config";

/**
 * 菜单节点扩展类型（包含 target / fullscreen / params 字段）
 */
export interface MenuNode {
  id: string;
  moduleCode: string;
  moduleType: "005001" | "005002";
  menuName: string;
  visible: boolean;
  sortIdx: number;
  popup: boolean;
  url: string;
  path: string;
  /** 宿主路由 path（含子应用前缀；弹窗 / 外链 iframe 不带前缀），与动态路由的 path 一致 */
  hostPath: string;
  microApp?: string;
  params: { key: string; val: string; enabled: boolean }[] | null;
  children: MenuNode[];
  target: "_self" | "_blank";
  fullscreen: boolean;
}

const modules = import.meta.glob("/src/views/**/**.vue");
const Layout = () => import("@/layouts/index.vue");
const LayIframe = () => import("@/layouts/frame.vue");
const LayRedirect = () => import("@/layouts/redirect.vue");
const Page404 = () => import("@/views/error/404.vue");

export const usePermissionStore = defineStore("permission", () => {
  // 所有路由（静态路由 + 动态路由）
  const routes = ref<RouteRecordRaw[]>([]);
  // 混合布局的左侧菜单路由
  const mixLayoutSideMenus = ref<RouteRecordRaw[]>([]);
  // 动态路由是否已生成
  const isDynamicRoutesGenerated = ref(false);
  // UOQUO扩展：缓存权限
  const permsInfo = useStorage<string[]>("permsInfo", []);
  // 扁平化的菜单节点列表（用于 path 查找）
  const menuNodes = ref<MenuNode[]>([]);
  // 已注册动态路由的移除函数（router.addRoute 的返回值）。
  // 根级 iframe / redirect 菜单会被包一层无名的 Layout 路由，无法按 name 移除，因此统一用移除函数。
  const removeDynamicRoutes: Array<() => void> = [];

  /**
   * 获取后台动态路由数据，解析并注册到全局路由
   */
  async function generateRoutes(roleId: string): Promise<RouteRecordRaw[]> {
    try {
      // 1. 获取当前登录人拥有的菜单路由
      const data = await AuthAPI.permission({ id: roleId });
      // 2. 解析菜单数据
      let menuData: RouteRecordRaw[] = [];
      if (data?.length > 0 && data[0].children) {
        // 筛选菜单
        menuData = parseMenuTree(undefined, data[0].children, data[0].microApp);
        // 缓存扁平化菜单节点（用于 findMenuByPath）
        menuNodes.value = flattenMenuNodes(data[0].children, data[0].microApp);
        // 缓存按钮数据
        permsInfo.value = [];
        cachePerms(data[0].children);
      }
      // console.log("menuData", menuData);
      // 3. 组装路由
      // 将菜单转换为路由
      const dynamicRoutes = transformRoutes(menuData);
      // 一级菜单没有指定激活菜单时，则默认激活第一个子菜单
      dynamicRoutes.forEach((item) => {
        if (!item.redirect && item.children && item.children.length > 0) {
          const child = item.children[0];
          item.redirect = child.path;
        }
      });
      // console.log("dynamicRoutes", dynamicRoutes);
      routes.value = mergeRoutes(constantRoutes, dynamicRoutes);
      isDynamicRoutesGenerated.value = true;

      // 4. 注册动态路由（Requirements: 3.9）
      dynamicRoutes.forEach((route: RouteRecordRaw) => {
        removeDynamicRoutes.push(router.addRoute(toRegisterRoute(route)));
      });
      // 弹窗菜单的目标页面：新窗口按这个地址加载，宿主必须有对应路由，否则会被守卫判为 404
      buildPopupTargetRoutes(menuNodes.value).forEach((route: RouteRecordRaw) => {
        removeDynamicRoutes.push(router.addRoute(route));
      });

      // 5. 收集 moduleType === '005002' 的 moduleCode，写入 Global_State（Requirements: 3.10）
      getGlobalActions().setState({ permissions: [...permsInfo.value] });

      return routes.value;
    } catch (error) {
      console.error("❌ Failed to generate routes:", error);
      isDynamicRoutesGenerated.value = false;
      throw error;
    }
  }

  /**
   * 合并静态路由和动态路由
   * 替换跟路径"/"为第一个菜单
   */
  function mergeRoutes(
    constantRoutes: RouteRecordRaw[],
    dynamicRoutes: RouteRecordRaw[]
  ): RouteRecordRaw[] {
    if (dynamicRoutes.length == 0) {
      return [...constantRoutes];
    }
    const first = dynamicRoutes[0];
    const tempRoutes = constantRoutes.map((item) => {
      const temp = { ...item };
      // 根路径默认重定向到第一个子菜单
      if (temp.path === "/") {
        temp.redirect = first.redirect ? first.redirect : first.path;
      }
      return temp;
    });
    // console.log("tempRoutes", tempRoutes);
    return [...tempRoutes, ...dynamicRoutes];
  }

  /**
   * 设置混合布局的左侧菜单
   */
  const setMixLayoutSideMenus = (parentPath: string): void => {
    const parentMenu = routes.value.find((item: RouteRecordRaw) => item.path === parentPath);
    mixLayoutSideMenus.value = parentMenu?.children || [];
  };

  /**
   * 重置路由状态
   */
  const resetRouter = (): void => {
    // 移除动态路由
    removeDynamicRoutes.splice(0).forEach((remove) => remove());

    // 重置状态
    routes.value = [...constantRoutes];
    mixLayoutSideMenus.value = [];
    isDynamicRoutesGenerated.value = false;
    menuNodes.value = [];
  };

  /**
   * 根据路由 path 查找对应的菜单节点
   * @param path 路由路径
   */
  function findMenuByPath(path: string): MenuNode | undefined {
    const hostPath = buildHostRoutePath(path);
    return menuNodes.value.find((node) => node.hostPath === hostPath);
  }

  /**
   * 缓存按钮权限
   */
  function cachePerms(modules: ModuleTreeDto[]): void {
    modules
      .filter((item: ModuleTreeDto) => {
        return DictionaryEnum.MODULE_TYPE_BUTTON == item.moduleType;
      })
      .forEach((item) => {
        if (item.children && item.children.length > 0) {
          cachePerms(item.children);
        }
        if (item.moduleCode) {
          permsInfo.value.push(item.moduleCode);
        }
      });
  }

  return {
    routes,
    permsInfo,
    mixLayoutSideMenus,
    isDynamicRoutesGenerated,
    menuNodes,
    generateRoutes,
    setMixLayoutSideMenus,
    resetRouter,
    findMenuByPath,
  };
});

/**
 * 菜单节点是否配置了 path
 */
function hasRoutablePath(item: ModuleTreeDto): boolean {
  return DictionaryEnum.MODULE_TYPE_MENU == item.moduleType && !!item.path && item.path.length > 0;
}

/**
 * 子孙节点中是否存在带 path 的菜单
 */
function hasRoutableDescendant(children?: ModuleTreeDto[]): boolean {
  return (children || []).some(
    (child) => hasRoutablePath(child) || hasRoutableDescendant(child.children)
  );
}

type OpenTarget = "" | "window" | "iframe" | "redirect";

/**
 * 生成 /redirect/** 的跳转地址。
 *
 * url 填写的是应用内部路径，不含微前端前缀。带 microApp 时要补上子应用前缀，
 * 才能命中宿主中注册的子应用菜单路由（宿主没有微应用路径的通配兜底）。
 */
function buildRedirectSrc(url: string, microApp?: string): string {
  const isRedirectUrl = url.startsWith("/redirect/");
  if (!microApp || !url) {
    return isRedirectUrl ? url : `/redirect/${url}`;
  }
  // 已是 /redirect/xxx 形式时，先取出真正的目标地址
  const dest = isRedirectUrl ? url.slice("/redirect".length) : url;
  return `/redirect${buildHostRoutePath(dest, microApp)}`;
}

/**
 * 菜单的打开方式：
 * - window：popup=true，弹窗打开 url
 * - iframe：url（或 path）是外链，在内容区内嵌
 * - redirect：url 是内部路径且与 path 不同（或 path 本身是 /redirect/xxx），经 /redirect/** 跳转
 * - ""：普通页面
 */
function resolveOpenTarget(
  item: ModuleTreeDto,
  microApp?: string
): { target: OpenTarget; src: string } {
  const src = item.url || item.path || "";
  if (item.popup) {
    // url 是应用内部路径（不含微前端前缀）。带 microApp 的内部页面必须补上前缀，
    // 否则弹出的是主应用地址，而主应用不承载任何业务页面
    const popupSrc = microApp && src && !isExternal(src) ? buildHostRoutePath(src, microApp) : src;
    return { target: "window", src: popupSrc };
  }
  if (isExternal(src)) {
    return { target: "iframe", src };
  }
  if (src !== item.path) {
    return { target: "redirect", src: buildRedirectSrc(src, microApp) };
  }
  if (src.startsWith("/redirect/")) {
    // path 本身就是 /redirect/xxx：无微应用时由 redirect.vue 直接解析 path；
    // 带微应用时宿主 path 已改为 /${moduleCode}，目标需要显式补上子应用前缀
    return { target: "redirect", src: microApp ? buildRedirectSrc(src, microApp) : "" };
  }
  return { target: "", src };
}

/**
 * 菜单是否只在宿主中打开（弹窗 / 外链 iframe / 内部跳转），不会进入子应用
 */
function isHostOnlyMenu(item: ModuleTreeDto): boolean {
  if (!hasRoutablePath(item)) return false;
  return resolveOpenTarget(item).target !== "";
}

/**
 * 菜单在宿主路由表中的 path。
 *
 * 普通子应用菜单带上子应用的 activeRule 前缀（如 /platform/xxx），由 qiankun 渲染。
 * 弹窗 / 外链 iframe / 内部跳转由宿主自己渲染，不能带该前缀：否则地址命中 activeRule，会激活子应用并落到
 * 子应用的 404，而且在 Layout 内会被 LayoutMain 当作微应用路由而不渲染宿主组件。
 * 这类菜单用全局唯一的 moduleCode 作为宿主 path。
 */
function resolveMenuHostPath(item: ModuleTreeDto, microApp?: string): string {
  if (microApp && item.moduleCode && isHostOnlyMenu(item)) {
    return `/${item.moduleCode}`;
  }
  const microPath = hasRoutablePath(item) ? (item.path as string) : `/${item.moduleCode}`;
  return buildHostRoutePath(microPath, microApp);
}

/**
 * 筛选菜单
 */
function parseMenuTree(
  parentId: string | undefined,
  modules: ModuleTreeDto[],
  inheritedMicroApp?: string
): RouteRecordRaw[] {
  if (!modules || modules.length == 0) {
    return [];
  }
  // 按 sortIdx 升序排序（递归应用于所有层级）
  const sorted = [...modules].sort((a, b) => (a.sortIdx ?? 0) - (b.sortIdx ?? 0));
  return sorted
    .filter((item: ModuleTreeDto) => {
      return DictionaryEnum.MODULE_TYPE_MENU == item.moduleType;
    })
    .filter((item: ModuleTreeDto) => {
      // 菜单一定要有URL，不然后续的map方法中会报错；
      // 仅作分组的目录节点允许 path 为空，但其下必须有可用的子菜单
      return hasRoutablePath(item) || hasRoutableDescendant(item.children);
    })
    .map((item: ModuleTreeDto) => {
      const microApp = resolveMicroAppName(item.microApp || inheritedMicroApp);
      // 目录节点 path 为空时，用全局唯一的 moduleCode 生成宿主路径
      const microPath = hasRoutablePath(item) ? (item.path as string) : `/${item.moduleCode}`;
      // 补全 target 和 fullscreen 默认值
      const nodeTarget: "_self" | "_blank" = (item as any).target === "_blank" ? "_blank" : "_self";
      const nodeFullscreen: boolean = (item as any).fullscreen === true;

      // 使用不含宿主 activeRule 的业务路径查找子应用 view。
      const urls = microPath.length > 1 ? microPath.slice(1) : microPath;
      // 提取参数
      const { params, querys } = (item.params || []).reduce(
        (acc, p) => {
          const target = p.enabled ? acc.params : acc.querys;
          target[p.key] = p.val;
          return acc;
        },
        { params: {} as Record<string, string>, querys: {} as Record<string, string> }
      );
      // 打开方式
      const { target, src } = resolveOpenTarget(item, microApp);
      // 菜单：基本信息
      const info = {
        id: item.id,
        name: item.moduleCode,
        path: resolveMenuHostPath(item, microApp),
        redirect: "",
        component: target == "window" ? "" : parentId ? urls : "Layout",
        children: undefined,
        meta: {
          alwaysShow: false,
          hidden: !item.visible,
          icon: item.icon ? item.icon : "el-icon-menu",
          params,
          querys,
          target,
          src,
          keepAlive: true,
          title: item.menuName,
          rank: item.sortIdx,
          // 微应用名与原始业务路径供宿主布局和路由桥接识别。
          microApp,
          microPath,
          // 扩展字段：菜单节点的 target / fullscreen（用于 handleMenuClick）
          menuTarget: nodeTarget,
          menuFullscreen: nodeFullscreen,
          menuPopup: item.popup ?? false,
          menuUrl: item.url || item.path || "",
          menuParams: item.params || [],
        } as RouteMeta,
      } as unknown as RouteRecordRaw;
      // 菜单：子菜单信息
      const children: RouteRecordRaw[] = parseMenuTree(item.id, item.children || [], microApp);
      if (children.length > 0) {
        info.children = children;
        if (hasRoutablePath(item)) {
          info.redirect = children[0].path;
        } else {
          // path 为空的目录节点：默认跳转第一个可见的子菜单；子菜单全部隐藏时，该目录也不显示
          const firstShowing = children.find((child) => !child.meta?.hidden);
          info.redirect = (firstShowing ?? children[0]).path;
          if (!firstShowing) {
            info.meta!.hidden = true;
          }
        }
      }
      return info;
    });
}

/**
 * 将菜单树扁平化为 MenuNode 数组（仅 005001 节点）
 */
function flattenMenuNodes(modules: ModuleTreeDto[], inheritedMicroApp?: string): MenuNode[] {
  const result: MenuNode[] = [];
  function walk(list: ModuleTreeDto[], parentMicroApp?: string) {
    for (const item of list) {
      const microApp = resolveMicroAppName(item.microApp || parentMicroApp);
      if (item.moduleType === DictionaryEnum.MODULE_TYPE_MENU && item.path) {
        result.push({
          id: item.id,
          moduleCode: item.moduleCode || "",
          moduleType: item.moduleType as "005001" | "005002",
          menuName: item.menuName || "",
          visible: item.visible ?? true,
          sortIdx: item.sortIdx ?? 0,
          popup: item.popup ?? false,
          // 弹窗菜单的内部地址已补全微前端前缀，与路由 meta.src 保持一致
          url: item.popup ? resolveOpenTarget(item, microApp).src : item.url || item.path || "",
          path: item.path,
          hostPath: resolveMenuHostPath(item, microApp),
          microApp,
          params: (item.params as { key: string; val: string; enabled: boolean }[] | null) ?? null,
          children: [],
          target: (item as any).target === "_blank" ? "_blank" : "_self",
          fullscreen: (item as any).fullscreen === true,
        });
      }
      if (item.children && item.children.length > 0) {
        walk(item.children, microApp);
      }
    }
  }
  walk(modules, resolveMicroAppName(inheritedMicroApp));
  return result;
}

/**
 * 转换路由数据为组件
 */
const transformRoutes = (menuData: RouteRecordRaw[]) => {
  // console.log("modules", modules);
  const parsedRoutes: RouteRecordRaw[] = [];
  ascending(menuData).forEach((menu) => {
    const tmpRoute = { ...menu } as RouteRecordRaw;
    // 组件映射
    const componentStr = tmpRoute.component?.toString();
    const target = tmpRoute.meta?.target;
    if (componentStr === "Layout") {
      // 一级菜单，替换为 Layout 组件
      tmpRoute.component = Layout;
    } else if (target === "iframe") {
      tmpRoute.component = LayIframe;
    } else if (target === "window" || target === "redirect") {
      tmpRoute.component = LayRedirect;
    } else {
      const component = modules[`/src/views/${tmpRoute.component}.vue`];
      tmpRoute.component = component || Page404;
    }

    if (menu.children) {
      tmpRoute.children = transformRoutes(menu.children);
    }

    // console.log("tmpRoute", tmpRoute);
    parsedRoutes.push(tmpRoute);
  });

  return parsedRoutes;
};

/**
 * 弹窗菜单的目标页面路由（仅注册到 router，不进入菜单展示）。
 *
 * 弹窗菜单本身的宿主 path 是不带子应用前缀的 /${moduleCode}（见 resolveMenuHostPath），
 * 而它弹出的页面地址是带前缀的真实页面，如 /platform/logs/auth。新窗口按后者加载，
 * 路由守卫在生成动态路由后会检查地址是否有匹配的路由，没有就进入 /error/404。
 * 因此要为这个目标地址补一条根级 Layout 路由，页面本身由 qiankun 渲染（与根级子应用菜单一致）。
 *
 * 不处理的情况：
 * - 外链、没有 microApp 的内部地址：不属于子应用页面
 * - 访客页面（/<前缀>/visitor/**）：由静态的 MicroAppHost 路由承载，不能再套 Layout
 * - 目标地址已被其他菜单注册，或多个弹窗菜单指向同一地址：避免重复注册
 * 菜单已授权即视为有权打开其目标页面，与“菜单列表即页面白名单”的现有约定一致。
 */
function buildPopupTargetRoutes(nodes: MenuNode[]): RouteRecordRaw[] {
  const occupied = new Set(nodes.map((node) => node.hostPath));
  const result: RouteRecordRaw[] = [];
  for (const node of nodes) {
    if (!node.popup || !node.microApp || !node.url || isExternal(node.url)) continue;
    // node.url 已补全子应用前缀；路由匹配只看 path，去掉可能带的查询串
    const target = buildHostRoutePath(node.url.split("?")[0], node.microApp);
    if (isVisitorRoute(target) || occupied.has(target)) continue;
    occupied.add(target);
    result.push({
      path: target,
      name: `${node.moduleCode}-popup-target`,
      component: Layout,
      meta: {
        title: node.menuName,
        hidden: true,
        keepAlive: true,
        microApp: node.microApp,
        // 在新窗口里让对应的弹窗菜单项保持高亮
        activeMenu: node.hostPath,
      },
    } as RouteRecordRaw);
  }
  return result;
}

/**
 * 转换成实际注册到 router 的路由记录（菜单展示仍使用转换前的路由）。
 *
 * 根级的 iframe / redirect 叶子菜单在 transformRoutes 中会得到 Layout 组件，但没有子路由，
 * Layout 的内容区（router-view）无页面可渲染，表现为空白页。这里补一个空 path 的子路由承载
 * frame.vue / redirect.vue。name 放在子路由上，父路由不设 name，避免 vue-router 对
 * “有名字的父路由 + 空 path 子路由” 的命名跳转只命中父路由。
 */
function toRegisterRoute(route: RouteRecordRaw): RouteRecordRaw {
  const target = route.meta?.target;
  const isRootLeaf = route.component === Layout && !route.children?.length;
  if (!isRootLeaf || (target !== "iframe" && target !== "redirect")) {
    return route;
  }
  return {
    path: route.path,
    component: Layout,
    meta: route.meta,
    children: [
      {
        path: "",
        name: route.name,
        component: target === "iframe" ? LayIframe : LayRedirect,
        meta: route.meta,
      },
    ],
  } as RouteRecordRaw;
}

/**
 * 按照路由中meta下的rank等级升序来排序路由
 */
function ascending(arr: any[]) {
  arr.forEach((v, index) => {
    // 当rank不存在时，根据顺序自动创建，首页路由永远在第一位
    if (!v.meta?.rank && v.meta?.rank != 0) {
      v.meta.rank = index + 2;
    }
  });
  return arr.sort((a: { meta: { rank: number } }, b: { meta: { rank: number } }) => {
    return a?.meta.rank - b?.meta.rank;
  });
}

/**
 * 在组件外使用 Pinia store 实例
 * @see https://pinia.vuejs.org/core-concepts/outside-component-usage.html
 */
export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
