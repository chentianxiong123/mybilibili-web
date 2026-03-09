import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

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

export const creatorApi = {
  getStats: () => api.get('/creator/stats'),
  
  getLatestComments: (limit = 5) => api.get('/creator/latest-comments', { params: { limit } }),
  
  getRankings: (type = 'view', limit = 10) => api.get('/creator/rankings', { params: { type, limit } }),
  
  getComments: (params) => api.get('/creator/comments', { params }),
  
  deleteComment: (commentId) => api.delete(`/creator/comments/${commentId}`),
  
  replyComment: (commentId, content, replyToUserId) => 
    api.post(`/creator/comments/${commentId}/reply`, { content, replyToUserId }),
  
  getFans: (params) => api.get('/creator/fans', { params }),
  
  getFansStats: () => api.get('/creator/fans/stats'),
  
  getSettings: () => api.get('/creator/settings'),
  
  updateSettings: (settings) => api.put('/creator/settings', settings)
}

export const manuscriptApi = {
  getUserManuscripts: (userId, params) => api.get(`/manuscript/user/${userId}/list`, { params }),
  
  getManuscriptStats: (userId) => api.get(`/manuscript/user/${userId}/stats`),
  
  getManuscriptById: (id) => api.get(`/manuscript/${id}`),
  
  updateManuscript: (id, data) => api.put(`/manuscript/${id}`, data),
  
  deleteManuscript: (id) => api.delete(`/manuscript/${id}`)
}

export const collectionApi = {
  getCollections: (userId) => api.get(`/collection/user/${userId}`),
  
  createCollection: (formData) => api.post('/collection', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  updateCollection: (id, formData) => api.put(`/collection/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  deleteCollection: (id) => api.delete(`/collection/${id}`),
  
  addManuscriptToCollection: (collectionId, manuscriptId, order = 0) => 
    api.post(`/collection/${collectionId}/manuscript/${manuscriptId}`, null, { params: { order } }),
  
  removeManuscriptFromCollection: (collectionId, manuscriptId) => 
    api.delete(`/collection/${collectionId}/manuscript/${manuscriptId}`),
  
  getCollectionManuscripts: (collectionId, page = 1, size = 20) => 
    api.get(`/collection/${collectionId}/manuscripts`, { params: { page, size } })
}

export const followApi = {
  follow: (userId) => api.post(`/follow/${userId}`),
  
  unfollow: (userId) => api.delete(`/follow/${userId}`),
  
  checkFollow: (userId) => api.get(`/follow/check/${userId}`)
}

export default api
