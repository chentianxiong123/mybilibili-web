import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
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
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * AI摘要相关API
 */
export const aiSummaryApi = {
  /**
   * 流式获取视频AI摘要（使用fetch ReadableStream）
   * @param {number} videoId - 视频ID
   * @param {Object} callbacks - 回调函数对象
   *   - onStart: 开始生成时调用
   *   - onData: 接收到数据时调用
   *   - onDone: 生成完成时调用
   *   - onError: 发生错误时调用
   *   - onMeta: 接收到元数据时调用
   * @returns {Object} 包含abort方法的对象，用于取消请求
   */
  streamSummary(videoId, callbacks = {}) {
    const { onStart, onData, onDone, onError, onMeta } = callbacks
    
    // 构建URL
    const baseURL = window.location.origin
    const url = `${baseURL}/api/ai-summary/stream/${videoId}`
    
    // 获取token
    const token = localStorage.getItem('token')
    
    // 创建AbortController用于取消请求
    const controller = new AbortController()
    
    // 使用fetch API发送请求，支持自定义headers
    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'text/event-stream'
      },
      signal: controller.signal
    })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未登录或登录已过期')
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // 获取reader
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      // 读取流数据
      const readStream = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            if (onDone) onDone('摘要生成完成')
            return
          }
          
          // 解码数据
          buffer += decoder.decode(value, { stream: true })
          
          // 处理SSE格式的数据
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || '' // 保留未完整的部分
          
          lines.forEach(line => {
            const event = parseSSEEvent(line)
            if (event) {
              handleSSEEvent(event, { onStart, onData, onDone, onError, onMeta })
            }
          })
          
          // 继续读取
          readStream()
        }).catch(error => {
          console.error('读取流错误:', error)
          if (onError) onError(error.message || '读取流失败')
        })
      }
      
      // 开始读取
      readStream()
    })
    .catch(error => {
      console.error('SSE请求错误:', error)
      if (error.name === 'AbortError') {
        console.log('请求已取消')
      } else {
        if (onError) onError(error.message || '连接失败，请稍后重试')
      }
    })
    
    // 返回控制器，用于取消请求
    return {
      abort: () => controller.abort(),
      close: () => controller.abort()
    }
  },

  /**
   * 直接获取视频AI摘要（非流式）
   * @param {number} videoId - 视频ID
   * @returns {Promise}
   */
  getSummary(videoId) {
    return api.get(`/ai-summary/${videoId}`)
  },

  /**
   * 检查视频是否有AI摘要
   * @param {number} videoId - 视频ID
   * @returns {Promise}
   */
  checkSummary(videoId) {
    return api.get(`/ai-summary/check/${videoId}`)
  }
}

/**
 * 解析SSE事件
 * @param {string} raw - 原始SSE数据
 * @returns {Object|null} 解析后的事件对象
 */
function parseSSEEvent(raw) {
  const lines = raw.split('\n')
  let event = ''
  let data = ''
  
  lines.forEach(line => {
    if (line.startsWith('event:')) {
      event = line.substring(6).trim()
    } else if (line.startsWith('data:')) {
      data = line.substring(5).trim()
    }
  })
  
  if (!event && !data) return null
  
  return { event: event || 'message', data }
}

/**
 * 处理SSE事件
 */
function handleSSEEvent({ event, data }, callbacks) {
  const { onStart, onData, onDone, onError, onMeta } = callbacks
  
  switch (event) {
    case 'start':
      if (onStart) onStart(data)
      break
    case 'data':
      if (onData) {
        try {
          // Base64解码并处理UTF-8
          const decoded = decodeURIComponent(escape(atob(data)))
          onData(decoded)
        } catch (e) {
          console.error('解码数据失败:', e)
          onData(data)
        }
      }
      break
    case 'meta':
      if (onMeta) {
        try {
          const meta = JSON.parse(data)
          onMeta(meta)
        } catch (e) {
          console.error('解析元数据失败:', e)
        }
      }
      break
    case 'done':
      if (onDone) onDone(data)
      break
    case 'error':
      if (onError) onError(data)
      break
    default:
      console.log('未知事件类型:', event, data)
  }
}
