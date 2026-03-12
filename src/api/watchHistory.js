import api from './index.js'

/**
 * 浏览历史相关API
 */
export const watchHistoryApi = {
  /**
   * 获取浏览历史列表
   * @param {number} page - 页码，默认1
   * @param {number} size - 每页数量，默认20
   * @returns {Promise} 浏览历史列表
   */
  getWatchHistory: (page = 1, size = 20) => {
    return api.get(`/watch-history?page=${page}&size=${size}`)
  },

  /**
   * 记录浏览历史
   * @param {number} videoId - 视频ID
   * @param {number} progress - 播放进度（秒）
   * @param {number} manuscriptId - 稿件ID（可选）
   * @returns {Promise}
   */
  recordWatchHistory: (videoId, progress, manuscriptId, duration) => {
    const params = { 
      videoId, 
      progressSeconds: progress || 0, 
      videoDuration: duration || progress || 0 
    }
    return api.post('/watch-history', null, { params })
  },

  /**
   * 清空浏览历史
   * @returns {Promise}
   */
  clearWatchHistory: () => {
    return api.delete('/watch-history')
  },

  /**
   * 删除单条浏览历史
   * @param {number} id - 历史记录ID
   * @returns {Promise}
   */
  deleteWatchHistory: (id) => {
    return api.delete(`/watch-history/${id}`)
  },

  /**
   * 批量删除浏览历史
   * @param {Array<number>} ids - 历史记录ID列表
   * @returns {Promise}
   */
  batchDeleteWatchHistory: (ids) => {
    return api.post('/watch-history/batch-delete', { ids })
  },

  /**
   * 获取浏览历史统计
   * @returns {Promise} 浏览统计信息
   */
  getWatchHistoryStats: () => {
    return api.get('/watch-history/stats')
  },

  /**
   * 获取继续观看列表
   * @param {number} size - 返回数量，默认10
   * @returns {Promise} 未看完的视频列表
   */
  getContinueWatching: (size = 10) => {
    return api.get(`/watch-history/continue-watching?size=${size}`)
  },

  /**
   * 获取今日观看时长
   * @returns {Promise} 今日观看时长（秒）
   */
  getTodayWatchTime: () => {
    return api.get('/watch-history/today-time')
  },

  /**
   * 检查是否已观看
   * @param {number} videoId - 视频ID
   * @returns {Promise} 观看记录
   */
  checkWatchStatus: (videoId) => {
    return api.get(`/watch-history/check/${videoId}`)
  },

  /**
   * 更新观看进度
   * @param {number} videoId - 视频ID
   * @param {number} progress - 播放进度（秒）
   * @returns {Promise}
   */
  updateProgress: (videoId, progress) => {
    return api.put('/watch-history/progress', { videoId, progress })
  }
}

export default watchHistoryApi
