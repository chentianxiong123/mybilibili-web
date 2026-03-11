import api from './index.js'

export const messageApi = {
  getConversations: () => api.get('/message/conversations'),

  getConversationDetail: (id) => api.get(`/message/conversations/${id}`),

  deleteConversation: (id) => api.delete(`/message/conversations/${id}`),

  getMessages: (conversationId, page = 1, size = 20) =>
    api.get(`/message/conversations/${conversationId}/messages`, { params: { page, size } }),

  sendMessage: (data) => api.post('/message/send', data),

  markAsRead: (messageId) => api.put(`/message/${messageId}/read`),

  batchMarkAsRead: (ids) => api.put('/message/batch/read', { ids }),

  getUnreadCount: () => api.get('/message/unread/count'),

  getUnreadCounts: () => api.get('/message/unread/counts'),

  getMessageSettings: () => api.get('/message/settings'),

  updateMessageSettings: (data) => api.put('/message/settings', data),

  deleteMessage: (messageId) => api.delete(`/message/${messageId}`),

  // 回复我的
  getReplies: (params) => api.get('/message/replies', { params }),

  // @我的
  getAtList: (params) => api.get('/message/at', { params }),

  // 收到的赞
  getLikes: (params) => api.get('/message/likes', { params }),

  // 系统通知
  getSystemNotifications: (params) => api.get('/message/system', { params })
}
