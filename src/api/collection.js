import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          // 不自动跳转登录页，由组件自己处理登录状态
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 合集相关API
export const collectionApi = {
  /**
   * 获取用户的所有合集
   * @param {number} userId - 用户ID
   * @param {number} page - 页码
   * @param {number} size - 每页数量
   */
  getUserCollections: (userId, page = 1, size = 20) => {
    return api.get(`/collection/user/${userId}?page=${page}&size=${size}`)
  },

  /**
   * 获取合集详情
   * @param {number} collectionId - 合集ID
   */
  getCollectionById: (collectionId) => {
    return api.get(`/collection/${collectionId}`)
  },

  /**
   * 创建合集
   * @param {Object} collectionData - 合集数据
   * @param {string} collectionData.name - 合集名称
   * @param {string} collectionData.description - 合集描述
   * @param {File} collectionData.cover - 封面文件
   * @param {boolean} collectionData.isPublic - 是否公开
   */
  createCollection: (collectionData) => {
    const formData = new FormData()
    formData.append('name', collectionData.name)
    if (collectionData.description) {
      formData.append('description', collectionData.description)
    }
    if (collectionData.cover) {
      formData.append('cover', collectionData.cover)
    }
    // 将布尔值转换为字符串
    formData.append('isPublic', collectionData.isPublic === false ? 'false' : 'true')
    return api.post('/collection', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      transformRequest: [(data) => data]
    })
  },

  /**
   * 更新合集
   * @param {number} collectionId - 合集ID
   * @param {Object} collectionData - 合集数据
   */
  updateCollection: (collectionId, collectionData) => {
    const formData = new FormData()
    if (collectionData.name) {
      formData.append('name', collectionData.name)
    }
    if (collectionData.description !== undefined) {
      formData.append('description', collectionData.description)
    }
    if (collectionData.cover) {
      formData.append('cover', collectionData.cover)
    }
    if (collectionData.isPublic !== undefined) {
      formData.append('isPublic', collectionData.isPublic === false ? 'false' : 'true')
    }
    return api.put(`/collection/${collectionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      transformRequest: [(data) => data]
    })
  },

  /**
   * 删除合集
   * @param {number} collectionId - 合集ID
   */
  deleteCollection: (collectionId) => {
    return api.delete(`/collection/${collectionId}`)
  },

  /**
   * 添加稿件到合集
   * @param {number} collectionId - 合集ID
   * @param {number} manuscriptId - 稿件ID
   * @param {number} sortOrder - 排序顺序
   */
  addManuscriptToCollection: (collectionId, manuscriptId, sortOrder) => {
    return api.post(`/collection/${collectionId}/manuscript/${manuscriptId}?order=${sortOrder}`)
  },

  /**
   * 从合集中移除稿件
   * @param {number} collectionId - 合集ID
   * @param {number} manuscriptId - 稿件ID
   */
  removeManuscriptFromCollection: (collectionId, manuscriptId) => {
    return api.delete(`/collection/${collectionId}/manuscript/${manuscriptId}`)
  },

  /**
   * 更新合集中稿件的排序
   * @param {number} collectionId - 合集ID
   * @param {Array} manuscriptOrders - 稿件排序数组 [{manuscriptId, sortOrder}]
   */
  updateManuscriptOrder: (collectionId, manuscriptOrders) => {
    return api.put(`/collection/${collectionId}/manuscripts/order`, {
      manuscriptOrders
    })
  },

  /**
   * 获取合集中的稿件列表
   * @param {number} collectionId - 合集ID
   * @param {number} page - 页码
   * @param {number} size - 每页数量
   */
  getCollectionManuscripts: (collectionId, page = 1, size = 20) => {
    return api.get(`/collection/${collectionId}/manuscripts?page=${page}&size=${size}`)
  },

  /**
   * 获取当前用户的所有合集（用于选择）
   */
  getMyCollections: () => {
    return api.get('/collection/my')
  }
}

export default collectionApi
