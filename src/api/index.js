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
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    // 对图片请求不添加Authorization头
    const isImageRequest = config.url.includes('/covers/') || config.url.includes('/images/') || config.url.match(/\.(jpg|jpeg|png|gif|mp4)$/i)
    if (token && !isImageRequest) {
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
    // 处理错误
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token但不跳转，让用户继续浏览
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          // 不自动跳转登录页，由组件自己处理登录状态
          break
        case 403:
          // 禁止访问
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          // 资源不存在
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          // 服务器错误
          ElMessage.error('服务器内部错误')
          break
        default:
          // 其他错误
          ElMessage.error(error.response.data.message || '请求失败')
      }
    } else {
      // 网络错误
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 用户相关API
export const userApi = {
  // 注册
  register: (userData) => api.post('/user/register', userData),
  // 登录
  login: (username, password) => api.post('/user/login', { username, password }),
  // 获取用户信息
  getUserById: (id) => api.get(`/user/${id}`),
  // 更新用户信息
  updateUser: (id, userData) => api.put(`/user/${id}`, userData),
  // 上传用户头像
  uploadAvatar: (id, formData) => api.post(`/user/${id}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  // 关注/取消关注用户
  follow: (userId, follow) => follow ? api.post(`/follow/${userId}`) : api.delete(`/follow/${userId}`),
  // 检查是否关注用户
  checkFollow: (userId) => api.get(`/follow/check/${userId}`),
  // 获取用户关注列表
  getFollowingList: (userId) => api.get(`/user/${userId}/following`),
  // 获取用户粉丝列表
  getFollowerList: (userId) => api.get(`/user/${userId}/followers`)
}

// 视频相关API
export const videoApi = {
  // 获取推荐视频
  getRecommendedVideos: () => api.get('/video/recommended'),
  // 获取热门视频
  getHotVideos: () => api.get('/video/hot'),
  // 获取视频详情（旧接口，兼容）
  getVideoById: (id) => api.get(`/video/${id}`),
  // 根据稿件ID获取视频（新接口，用于稿件详情页）
  getVideoByManuscriptId: (manuscriptId, params) => api.get(`/video/manuscript/${manuscriptId}`, { params }),
  // 获取分类视频
  getVideosByCategoryId: (id) => api.get(`/video/category/${id}`),
  // 获取用户视频
  getVideosByUserId: (id, sort) => api.get(`/video/user/${id}${sort ? `?sort=${sort}` : ''}`),
  // 搜索用户视频
  searchUserVideos: (userId, keyword, sort) => api.get(`/video/user/${userId}/search?keyword=${encodeURIComponent(keyword)}${sort ? `&sort=${sort}` : ''}`),
  // 获取视频列表
  getVideoList: (page, size) => api.get(`/video/list?page=${page}&size=${size}`),
  // 上传视频
  uploadVideo: (formData, onProgress) => api.post('/video/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress ? (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      if (onProgress) {
        onProgress(percentCompleted)
      }
      return percentCompleted
    } : undefined
  })
}

// 评论相关API
export const commentApi = {
  // 新接口：获取评论列表（支持视频和动态）
  getComments: (targetType, targetId, page = 1, size = 20) => 
    api.get(`/comment/list?targetType=${targetType}&targetId=${targetId}&page=${page}&size=${size}`),
  
  // 新接口：发表评论（支持视频和动态）
  postComment: (targetType, targetId, content) => 
    api.post('/comment/add', `targetType=${targetType}&targetId=${targetId}&content=${encodeURIComponent(content)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }),
  
  // 向后兼容：获取视频评论
  getCommentsByVideoId: (videoId, page, size) => api.get(`/comment/video/${videoId}?page=${page}&size=${size}`),
  
  // 向后兼容：发表视频评论
  postVideoComment: (videoId, content) => api.post('/comment', `videoId=${videoId}&content=${encodeURIComponent(content)}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }),
  
  // 回复评论
  replyComment: (commentId, content, replyToUserId) => api.post('/comment/reply', `commentId=${commentId}&content=${encodeURIComponent(content)}${replyToUserId ? `&replyToUserId=${replyToUserId}` : ''}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }),
  
  // 点赞评论
  likeComment: (commentId) => api.post(`/comment/${commentId}/like`),
  
  // 取消点赞评论
  unlikeComment: (commentId) => api.delete(`/comment/${commentId}/like`),
  
  // 获取评论回复
  getRepliesByCommentId: (commentId, page, size) => api.get(`/comment/${commentId}/replies?page=${page}&size=${size}`),
  
  // 点赞回复
  likeReply: (replyId) => api.post(`/comment/reply/${replyId}/like`),
  
  // 取消点赞回复
  unlikeReply: (replyId) => api.delete(`/comment/reply/${replyId}/like`)
}

// 视频互动相关API
export const interactionApi = {
  // 点赞视频
  likeVideo: (videoId, liked) => liked ? api.post(`/video/${videoId}/like`) : api.delete(`/video/${videoId}/like`),
  // 投币支持
  coinVideo: (videoId, coinCount) => api.post(`/video/${videoId}/coin`, { coinCount }),
  // 收藏视频
  collectVideo: (videoId, collected) => collected ? api.post(`/video/${videoId}/collect`) : api.delete(`/video/${videoId}/collect`),
  // 分享视频
  shareVideo: (videoId, channel) => api.post(`/video/${videoId}/share`, { channel }),
  // 获取分享统计
  getShareStatistics: (videoId) => api.get(`/video/${videoId}/share/statistics`),
  // 发送弹幕
  sendDanmaku: (videoId, content, time, color, mode) => api.post(`/video/${videoId}/danmaku`, `content=${encodeURIComponent(content)}&time=${time}&color=${encodeURIComponent(color || '#ffffff')}&mode=${mode || 0}`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }),
  // 获取视频弹幕
  getDanmakus: (videoId) => api.get(`/video/${videoId}/danmakus`),
  // 获取互动状态
  getInteractionStatus: (videoId) => api.get(`/video/${videoId}/status`),
  // 获取用户点赞视频
  getLikedVideos: () => api.get('/video/user/likes'),
  // 获取用户收藏视频
  getCollectedVideos: () => api.get('/video/user/collections'),
  // 获取收藏夹列表
  getFavoriteFolders: () => api.get('/video/favorite/folders'),
  // 创建收藏夹
  createFavoriteFolder: (folderData) => api.post('/video/favorite/folders', folderData),
  // 更新收藏夹
  updateFavoriteFolder: (folderId, name) => api.put(`/video/favorite/folders/${folderId}`, { name }),
  // 删除收藏夹
  deleteFavoriteFolder: (folderId) => api.delete(`/video/favorite/folders/${folderId}`),
  // 获取收藏夹内的视频列表
  getFavoriteFolderVideos: (folderId, page = 1, size = 12) => 
    api.get(`/video/favorite/folders/${folderId}/videos`, { params: { page, size } }),
  // 添加视频到收藏夹
  addToFavoriteFolders: (videoId, folderIds) => api.post(`/video/${videoId}/favorite`, { folderIds }),
  // 从收藏夹移除视频
  removeVideoFromFavoriteFolder: (folderId, videoId) => 
    api.delete(`/video/favorite/folders/${folderId}/videos/${videoId}`),
  // 获取视频在哪些收藏夹中
  getVideoFavoriteFolders: (videoId) => api.get(`/video/${videoId}/favorite/folders`),
  // 更新视频的收藏夹
  updateVideoFavoriteFolders: (videoId, folderIds) => api.put(`/video/${videoId}/favorite/folders`, { folderIds })
}

// 历史记录相关API
export const historyApi = {
  // 获取历史记录列表
  getHistoryList: (page = 1, size = 20) => api.get('/history/list', { params: { page, size } }),
  // 清空历史记录
  clearHistory: () => api.delete('/history/clear'),
  // 删除单条历史记录
  deleteHistoryItem: (id) => api.delete(`/history/${id}`)
}

// 分类相关API
export const categoryApi = {
  // 获取分类列表
  getCategoryList: () => api.get('/category')
}

export default api