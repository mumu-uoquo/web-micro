/**
 * 补全缺少类型声明的第三方模块
 */

declare module "vxe-table" {
  const VXETable: any;
  export default VXETable;
}

declare module "codemirror-editor-vue3" {
  import type { Plugin } from "vue";
  export const InstallCodeMirror: Plugin;
}

declare module "path-browserify" {
  const path: typeof import("path");
  export = path;
}

declare module "path-to-regexp" {
  export function compile(path: string, options?: any): (params?: any) => string;
  export function match(path: string, options?: any): (url: string) => any;
  export function pathToRegexp(path: string, keys?: any[], options?: any): RegExp;
}

declare module "qrcode" {
  const QRCode: {
    toDataURL(text: string, options?: any): Promise<string>;
    toString(text: string, options?: any): Promise<string>;
    toCanvas(canvas: HTMLCanvasElement, text: string, options?: any): Promise<any>;
  };
  export default QRCode;
}
