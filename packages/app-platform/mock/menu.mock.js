/**
 * mock/menu.mock.js
 * 菜单树 mock 接口
 * 格式：vite-plugin-mock-dev-server defineMock
 *
 * 菜单数据从根目录 mock/menu.json 共享，使用相对路径引入。
 */

import { defineMock } from 'vite-plugin-mock-dev-server'
import menuData from '../../../mock/menu.json'

export default defineMock({
  url: '/api/menu',
  method: 'GET',
  body: menuData
})
