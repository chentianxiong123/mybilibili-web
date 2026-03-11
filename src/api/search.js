import api from './index.js'

/**
 * 搜索相关API
 */
export const searchApi = {
  /**
   * 搜索视频
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {number} params.page - 页码，默认1
   * @param {number} params.size - 每页数量，默认20
   * @param {string} params.sort - 排序方式：relevance(相关度)/time(最新)/hot(最热)
   * @param {number} params.categoryId - 分类ID
   * @returns {Promise} 搜索结果
   */
  searchVideos: (params) => {
    const { keyword, page = 1, size = 20, sort = 'relevance', categoryId } = params
    let url = `/search/videos?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}&sort=${sort}`
    if (categoryId) {
      url += `&categoryId=${categoryId}`
    }
    return api.get(url)
  },

  /**
   * 获取搜索建议
   * @param {string} keyword - 搜索关键词
   * @returns {Promise} 搜索建议列表
   */
  getSearchSuggestions: (keyword) => {
    return api.get(`/search/suggest?keyword=${encodeURIComponent(keyword)}`)
  },

  /**
   * 获取热搜榜 Top10
   * @returns {Promise} 热搜榜列表
   */
  getHotSearch: () => {
    return api.get('/search/hot')
  },

  /**
   * 获取搜索历史
   * @returns {Promise} 搜索历史列表
   */
  getSearchHistory: () => {
    return api.get('/search/history')
  },

  /**
   * 清除搜索历史
   * @returns {Promise}
   */
  clearSearchHistory: () => {
    return api.delete('/search/history')
  },

  /**
   * 删除单条搜索历史
   * @param {string} keyword - 要删除的关键词
   * @returns {Promise}
   */
  deleteSearchHistory: (keyword) => {
    return api.delete(`/search/history?keyword=${encodeURIComponent(keyword)}`)
  }
}

export default searchApi
