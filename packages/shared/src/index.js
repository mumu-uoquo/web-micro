// @web-micro/shared 统一导出入口

// HTTP 请求封装
export { createRequest, setGlobalTokenGetter } from './http/index.js'

// AES 加解密
export { encrypt, decrypt } from './crypto/index.js'

// 权限工具
export { hasPermission, setPermissions } from './permission/index.js'
export { permissionDirective } from './permission/directive.js'
