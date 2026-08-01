/**
 * vue-router RouteMeta 类型扩展
 *
 * 将路由 meta 中的自定义字段声明为具体类型，避免 unknown 类型错误。
 */
import "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    /** 页面标题 */
    title?: string;
    /** 菜单图标 */
    icon?: string;
    /** 是否固定在标签栏 */
    affix?: boolean;
    /** 是否开启页面缓存（keep-alive） */
    keepAlive?: boolean;
    /** 是否隐藏菜单 */
    hidden?: boolean;
    /** 是否始终显示（即使只有一个子路由） */
    alwaysShow?: boolean;
    /** 当前激活的菜单路径（用于子路由高亮父级菜单） */
    activeMenu?: string;
    /** 路由 rank（用于菜单排序） */
    rank?: number;
    /** 路由跳转目标（iframe/redirect/window/''） */
    target?: string;
    /** iframe / redirect src */
    src?: string;
    /** 路由 URL 参数 */
    params?: Record<string, string>;
    /** 路由 query 参数 */
    querys?: Record<string, string>;
    /** 规范化后的微应用名称 */
    microApp?: string;
    /** 后端返回的子应用原始业务路径 */
    microPath?: string;
    /** 菜单节点 target（'_self' | '_blank'） */
    menuTarget?: "_self" | "_blank";
    /** 菜单节点是否全屏 */
    menuFullscreen?: boolean;
    /** 菜单节点是否弹窗 */
    menuPopup?: boolean;
    /** 菜单节点 url */
    menuUrl?: string;
    /** 菜单节点参数 */
    menuParams?: { key: string; val: string; enabled: boolean }[];
  }
}
