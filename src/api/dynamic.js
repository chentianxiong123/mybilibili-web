import api from './index.js'

export const dynamicApi = {
  getDynamicList: (page = 1, size = 10) => {
    return api.get('/dynamic/list', { params: { page, size } })
  },

  getFollowingDynamics: (page = 1, size = 10, userId = null) => {
    const params = { page, size }
    if (userId) {
      params.userId = userId
    }
    return api.get('/dynamic/following', { params })
  },

  getUserDynamics: (userId, page = 1, limit = 10) => {
    return api.get(`/dynamic/user/${userId}`, { params: { page, limit } })
  },

  getDynamicById: (id) => {
    return api.get(`/dynamic/${id}`)
  },

  publishDynamic: (formData) => {
    return api.post('/dynamic/publish', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  deleteDynamic: (id) => {
    return api.delete(`/dynamic/${id}`)
  },

  likeDynamic: (id) => {
    return api.post(`/dynamic/like/${id}`)
  },

  unlikeDynamic: (id) => {
    return api.delete(`/dynamic/like/${id}`)
  },

  checkLikeStatus: (id) => {
    return api.get(`/dynamic/like/status/${id}`)
  },

  shareDynamic: (id) => {
    return api.post(`/dynamic/share/${id}`)
  },

  getComments: (dynamicId, page = 1, limit = 10) => {
    return api.get(`/dynamic/${dynamicId}/comments`, { params: { page, limit } })
  },

  addComment: (dynamicId, content, parentId = null, replyUserId = null) => {
    const params = { content }
    if (parentId) params.parentId = parentId
    if (replyUserId) params.replyUserId = replyUserId
    return api.post(`/dynamic/${dynamicId}/comment`, null, { params })
  },

  deleteComment: (commentId) => {
    return api.delete(`/dynamic/comment/${commentId}`)
  },

  likeComment: (commentId) => {
    return api.post(`/dynamic/comment/like/${commentId}`)
  },

  unlikeComment: (commentId) => {
    return api.delete(`/dynamic/comment/like/${commentId}`)
  }
}

export default dynamicApi
