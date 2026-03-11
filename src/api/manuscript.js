import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5分钟超时，因为上传文件可能较大
  headers: {
    'Content-Type': 'multipart/form-data'
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

// 稿件相关API
export const manuscriptApi = {
  /**
   * 上传稿件（包含多个视频分P）
   * @param {Object} manuscriptData - 稿件数据
   * @param {string} manuscriptData.title - 稿件标题
   * @param {string} manuscriptData.description - 稿件描述
   * @param {File} manuscriptData.cover - 封面文件
   * @param {number} manuscriptData.categoryId - 分类ID
   * @param {string[]} manuscriptData.tags - 标签数组
   * @param {Array} manuscriptData.videos - 视频分P数组
   * @param {File} manuscriptData.videos[].file - 视频文件
   * @param {string} manuscriptData.videos[].title - 分P标题
   * @param {number} manuscriptData.videos[].sortOrder - 排序顺序
   * @param {Function} onProgress - 上传进度回调
   */
  uploadManuscript: (manuscriptData, onProgress) => {
    const formData = new FormData()
    
    // 添加稿件基本信息
    formData.append('title', manuscriptData.title)
    formData.append('description', manuscriptData.description || '')
    formData.append('cover', manuscriptData.cover)
    formData.append('categoryId', manuscriptData.categoryId)
    
    // 添加标签
    if (manuscriptData.tags && manuscriptData.tags.length > 0) {
      manuscriptData.tags.forEach(tag => {
        formData.append('tags', tag)
      })
    }
    
    // 添加视频分P信息
    if (manuscriptData.videos && manuscriptData.videos.length > 0) {
      manuscriptData.videos.forEach((video, index) => {
        formData.append(`videos[${index}].video`, video.file)
        formData.append(`videos[${index}].title`, video.title || `P${index + 1}`)
        formData.append(`videos[${index}].videoOrder`, video.sortOrder || index)
      })
    }
    
    return api.post('/manuscript/upload', formData, {
      onUploadProgress: onProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
        return percentCompleted
      } : undefined
    })
  },

  /**
   * 获取稿件列表
   * @param {number} page - 页码
   * @param {number} size - 每页数量
   * @param {string} status - 稿件状态筛选
   */
  getManuscriptList: (page = 1, size = 10, status = null) => {
    let url = `/manuscript/list?page=${page}&size=${size}`
    if (status) {
      url += `&status=${status}`
    }
    return api.get(url)
  },

  /**
   * 获取稿件详情
   * @param {number} id - 稿件ID
   */
  getManuscriptById: (id) => {
    return api.get(`/manuscript/${id}`)
  },

  /**
   * 获取推荐稿件列表（用于首页）
   */
  getRecommendedManuscripts: () => {
    return api.get('/manuscript/recommended')
  },

  /**
   * 更新稿件
   * @param {number} id - 稿件ID
   * @param {Object} manuscriptData - 稿件数据
   */
  updateManuscript: (id, manuscriptData) => {
    const formData = new FormData()
    
    if (manuscriptData.title) {
      formData.append('title', manuscriptData.title)
    }
    if (manuscriptData.description !== undefined) {
      formData.append('description', manuscriptData.description)
    }
    if (manuscriptData.cover) {
      formData.append('cover', manuscriptData.cover)
    }
    if (manuscriptData.categoryId) {
      formData.append('categoryId', manuscriptData.categoryId)
    }
    if (manuscriptData.tags) {
      manuscriptData.tags.forEach(tag => {
        formData.append('tags', tag)
      })
    }
    
    return api.put(`/manuscript/${id}`, formData)
  },

  /**
   * 删除稿件
   * @param {number} id - 稿件ID
   */
  deleteManuscript: (id) => {
    return api.delete(`/manuscript/${id}`)
  },

  /**
   * 获取用户的所有稿件
   * @param {number} userId - 用户ID
   * @param {number} page - 页码
   * @param {number} size - 每页数量
   * @param {number} status - 稿件状态筛选（可选）
   */
  getUserManuscripts: (userId, page = 1, size = 10, status = null) => {
    let url = `/manuscript/user/${userId}?page=${page}&size=${size}`
    if (status !== null) {
      url += `&status=${status}`
    }
    return api.get(url)
  },

  /**
   * 获取用户稿件统计信息
   * @param {number} userId - 用户ID
   */
  getManuscriptStats: (userId) => {
    return api.get(`/manuscript/user/${userId}/stats`)
  }
}

export default manuscriptApi
