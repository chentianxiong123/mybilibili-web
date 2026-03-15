import { createPinia } from 'pinia'

// 导入所有store
export * from './counter'
export * from './user'
export * from './video'

export default createPinia()