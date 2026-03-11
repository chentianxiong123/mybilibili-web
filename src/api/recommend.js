import api from './index.js'

/**
 * 推荐相关API
 */
export const recommendApi = {
  /**
   * 获取相关视频推荐
   * @param {number} videoId - 视频ID
   * @param {number} size - 返回数量，默认8
   * @returns {Promise} 相关视频列表
   */
  getRelatedVideos: (videoId, size = 8) => {
    return api.get(`/recommend/related/${videoId}?size=${size}`)
  },

  /**
   * 获取热门视频
   * @param {number} categoryId - 分类ID，不传则获取全站热门
   * @param {number} size - 返回数量，默认10
   * @returns {Promise} 热门视频列表
   */
  getHotVideos: (categoryId, size = 10) => {
    let url = `/recommend/hot?size=${size}`
    if (categoryId) {
      url += `&categoryId=${categoryId}`
    }
    return api.get(url)
  },

  /**
   * 获取个性化推荐视频
   * @param {number} size - 返回数量，默认10
   * @returns {Promise} 个性化推荐视频列表
   */
  getRecommendedVideos: (size = 10) => {
    return api.get(`/recommend/personalized?size=${size}`)
  },

  /**
   * 获取基于用户行为的推荐
   * @param {number} size - 返回数量，默认10
   * @returns {Promise} 推荐视频列表
   */
  getBehaviorBasedRecommendations: (size = 10) => {
    return api.get(`/recommend/behavior?size=${size}`)
  },

  /**
   * 获取协同过滤推荐
   * @param {number} size - 返回数量，默认10
   * @returns {Promise} 推荐视频列表
   */
  getCollaborativeRecommendations: (size = 10) => {
    return api.get(`/recommend/collaborative?size=${size}`)
  },

  /**
   * 获取内容相似推荐
   * @param {number} videoId - 视频ID
   * @param {number} size - 返回数量，默认8
   * @returns {Promise} 相似内容视频列表
   */
  getContentBasedRecommendations: (videoId, size = 8) => {
    return api.get(`/recommend/content/${videoId}?size=${size}`)
  },

  /**
   * 获取猜你喜欢
   * @param {number} size - 返回数量，默认12
   * @returns {Promise} 猜你喜欢视频列表
   */
  getGuessYouLike: (size = 12) => {
    return api.get(`/recommend/guess-you-like?size=${size}`)
  },

  /**
   * 获取实时热门
   * @param {number} size - 返回数量，默认10
   * @returns {Promise} 实时热门视频列表
   */
  getRealtimeHot: (size = 10) => {
    return api.get(`/recommend/realtime-hot?size=${size}`)
  },

  /**
   * 获取分类热门
   * @param {number} size - 每个分类返回数量，默认5
   * @returns {Promise} 各分类热门视频
   */
  getCategoryHot: (size = 5) => {
    return api.get(`/recommend/category-hot?size=${size}`)
  }
}

export default recommendApi
