// @web-micro/shared 统一导出入口

// encrypt / decrypt — Task 2.2
export { encrypt, decrypt } from './utils/crypto'

// AuthStorage / redirectToLogin — Task 2.4
export { AuthStorage, redirectToLogin } from './utils/auth'
export type { TokenDto } from './utils/auth'

// createHttpInstance / UserStoreAdapter — Task 2.5
export { createHttpInstance, generateSignature } from './utils/http'
export type { UserStoreAdapter } from './utils/http'

// guid / getRangeDate / assert / passwordComplex — Task 2.6
export { guid, getRangeDate, assert, passwordComplex } from './utils/common'

// FileUtil — Task 2.6
export { default as FileUtil } from './utils/file'
export type { UploadConfigParam } from './utils/file'

// ResultEnum — Task 2.6
export { ResultEnum } from './enums/result.enum'

// Constants — Task 2.6
export { APP_PREFIX, ROLE_ROOT, ROOT_ROLE_ID, PLATFORM_TENANT_ID, STORAGE_KEYS } from './constants/index'
export type { StorageKey } from './constants/index'
