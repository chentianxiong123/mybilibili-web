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
      config.headers['Authorization'] = `Bearer ${token}`
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default {
  // 获取动态评论列表
  getComments(dynamicId, page = 1, size = 10) {
    return api({
      url: '/dynamic/comment/list',
      method: 'get',
      params: { dynamicId, page, size }
    })
  },

  // 发表评论
  addComment(dynamicId, content, parentId = null, replyUserId = null) {
    return api({
      url: '/dynamic/comment/add',
      method: 'post',
      params: { dynamicId, content, parentId, replyUserId }
    })
  },

  // 删除评论
  deleteComment(commentId) {
    return api({
      url: `/dynamic/comment/delete/${commentId}`,
      method: 'delete'
    })
  },

  // 获取评论回复列表
  getReplies(commentId) {
    return api({
      url: '/dynamic/comment/replies',
      method: 'get',
      params: { commentId }
    })
  },

  // 点赞评论
  likeComment(commentId) {
    return api({
      url: `/dynamic/comment/like/${commentId}`,
      method: 'post'
    })
  },

  // 取消点赞评论
  unlikeComment(commentId) {
    return api({
      url: `/dynamic/comment/like/${commentId}`,
      method: 'delete'
    })
  }
}
