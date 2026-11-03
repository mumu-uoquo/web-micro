// 表格相关
export { useTableSelection } from "./useTableSelection";

// 订阅主应用转发的 SSE 事件（子应用禁止自建 SSE 连接）
export { useHostSse } from "./useHostSse";

// 最近访问菜单
export { useRecentMenus, addRecentMenu } from "./useRecentMenus";
export type { RecentMenuItem } from "./useRecentMenus";
