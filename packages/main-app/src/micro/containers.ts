/**
 * 子应用挂载容器的常驻管理。
 *
 * 布局切换（左侧/顶部/混合）会销毁并重建 LayoutMain。如果容器由 LayoutMain 的模板创建，
 * 已挂载的子应用会随旧容器一起脱离页面，新容器是空的，表现为内容区空白。
 * 因此容器在模块级创建一次，布局重建时只是把同一个元素移动到新的位置，子应用的 DOM 与状态得以保留。
 */

const containers = new Map<string, HTMLElement>();

/** 获取（不存在则创建）指定 id 的常驻子应用容器。 */
export function getPersistentSubAppContainer(id: string): HTMLElement {
  let el = containers.get(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "sub-app-container";
    containers.set(id, el);
  }
  return el;
}
