import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api', // 后端API地址（通过Nginx反向代理）
  timeout: 10000, // 请求超时时间
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
          ElMessage.error(error.response.data.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 字幕相关API
export const subtitleApi = {
  // 获取视频的所有字幕
  getSubtitles(videoId) {
    return api.get(`/subtitle/video/${videoId}`)
  },

  // 获取指定语言的字幕
  getSubtitle(videoId, language) {
    return api.get(`/subtitle/video/${videoId}/${language}`)
  },

  // 上传字幕
  uploadSubtitle(data) {
    return api.post('/subtitle/upload', data)
  },

  // 上传SRT字幕文件
  uploadSrt(videoId, srtContent, language, languageName, uploadedBy) {
    return api.post('/subtitle/upload-srt', {
      videoId,
      srtContent,
      language,
      languageName,
      uploadedBy
    })
  },

  // 删除字幕
  deleteSubtitle(subtitleId) {
    return api.delete(`/subtitle/${subtitleId}`)
  },

  // 设置默认字幕
  setDefaultSubtitle(videoId, language) {
    return api.post('/subtitle/set-default', { videoId, language })
  }
}

export default subtitleApi
