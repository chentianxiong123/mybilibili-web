import api from './index.js'

export const historyApi = {
  getHistoryList: (page = 1, size = 10) => {
    return api.get('/history/list', { params: { page, size } })
  },

  clearHistory: () => {
    return api.delete('/history/clear')
  },

  deleteHistoryItem: (id) => {
    return api.delete(`/history/${id}`)
  }
}

export default historyApi
