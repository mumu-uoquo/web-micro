import type { RouteRecordRaw, RouteMeta } from "vue-router";
import router, { constantRoutes } from "@/router";
import { store } from "@/stores";
import { DictionaryEnum } from "@/enums/system/dictionary.enum";
import AuthAPI, { type ModuleTreeDto } from "@/api/auth";
import { isExternal } from "@/utils";
import { getGlobalActions } from "@/micro/global-state";
import { buildHostRoutePath, resolveMicroAppName } from "@/micro/config";

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
        router.addRoute(route);
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
    const constantRouteNames = new Set(constantRoutes.map((route) => route.name).filter(Boolean));
    routes.value.forEach((route: RouteRecordRaw) => {
      if (route.name && !constantRouteNames.has(route.name)) {
        router.removeRoute(route.name);
      }
    });

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
    return menuNodes.value.find(
      (node) => buildHostRoutePath(node.path, node.microApp) === hostPath
    );
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
      // 菜单一定要有URL，不然后续的map方法中会报错
      return item.path && item.path.length > 0;
    })
    .map((item: ModuleTreeDto) => {
      const microApp = resolveMicroAppName(item.microApp || inheritedMicroApp);
      const microPath = item.path as string;
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
      let src = item.url || item.path || "";
      let target = "";
      if (item.popup) {
        target = "window";
      } else if (isExternal(src)) {
        target = "iframe";
      } else if (src !== item.path) {
        target = "redirect";
        if (!src.startsWith("/redirect/")) {
          src = `/redirect/${src}`;
        }
      } else if (src.startsWith("/redirect/")) {
        // 当 src == item.path 且以 /redirect/ 开头时
        target = "redirect";
        src = "";
      }
      // 菜单：基本信息
      const info = {
        id: item.id,
        name: item.moduleCode,
        path: buildHostRoutePath(microPath, microApp),
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
        info.redirect = children[0].path;
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
          url: item.url || item.path || "",
          path: item.path,
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
