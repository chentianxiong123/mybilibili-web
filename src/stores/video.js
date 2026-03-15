import { defineStore } from 'pinia'

// 视频store
export const useVideoStore = defineStore('video', {
  // 状态
  state: () => ({
    // 推荐视频列表
    recommendedVideos: [],
    // 分类视频列表
    categoryVideos: {},
    // 热门视频列表
    hotVideos: [],
    // 当前播放视频
    currentVideo: null,
    // 视频播放历史
    watchHistory: [],
    // 视频点赞状态
    likedVideos: new Set(),
    // 视频收藏状态
    collectedVideos: new Set(),
    // 视频投币状态
    coinVideos: new Set(),
    // 视频分享计数
    sharedCount: {},
    // 视频列表加载状态
    videosLoading: false,
    // 视频详情加载状态
    videoDetailLoading: false,
    // 视频评论列表
    comments: {},
    // 视频评论加载状态
    commentsLoading: false
  }),

  // Getters
  getters: {
    // 获取推荐视频列表
    getRecommendedVideos: (state) => state.recommendedVideos,
    // 获取分类视频列表
    getCategoryVideos: (state) => (categoryId) => state.categoryVideos[categoryId] || [],
    // 获取热门视频列表
    getHotVideos: (state) => state.hotVideos,
    // 获取当前播放视频
    getCurrentVideo: (state) => state.currentVideo,
    // 获取视频播放历史
    getWatchHistory: (state) => state.watchHistory,
    // 获取视频点赞状态
    getVideoLiked: (state) => (videoId) => state.likedVideos.has(videoId),
    // 获取视频收藏状态
    getVideoCollected: (state) => (videoId) => state.collectedVideos.has(videoId),
    // 获取视频投币状态
    getVideoCoined: (state) => (videoId) => state.coinVideos.has(videoId),
    // 获取视频分享计数
    getVideoSharedCount: (state) => (videoId) => state.sharedCount[videoId] || 0,
    // 获取视频评论列表
    getVideoComments: (state) => (videoId) => state.comments[videoId] || []
  },

  // Actions
  actions: {
    // 设置推荐视频列表
    setRecommendedVideos(videos) {
      this.recommendedVideos = videos
    },

    // 设置分类视频列表
    setCategoryVideos(categoryId, videos) {
      this.categoryVideos[categoryId] = videos
    },

    // 设置热门视频列表
    setHotVideos(videos) {
      this.hotVideos = videos
    },

    // 设置当前播放视频
    setCurrentVideo(video) {
      this.currentVideo = video
    },

    // 添加视频到播放历史
    addToWatchHistory(video) {
      // 检查是否已存在
      const index = this.watchHistory.findIndex(item => item.id === video.id)
      if (index > -1) {
        // 如果已存在，移到最前面
        this.watchHistory.splice(index, 1)
      }
      // 添加到最前面
      this.watchHistory.unshift(video)
      // 限制历史记录数量
      if (this.watchHistory.length > 50) {
        this.watchHistory = this.watchHistory.slice(0, 50)
      }
    },

    // 清除播放历史
    clearWatchHistory() {
      this.watchHistory = []
    },

    // 设置视频点赞状态
    setVideoLiked(videoId, isLiked) {
      if (isLiked) {
        this.likedVideos.add(videoId)
      } else {
        this.likedVideos.delete(videoId)
      }
    },

    // 设置视频收藏状态
    setVideoCollected(videoId, isCollected) {
      if (isCollected) {
        this.collectedVideos.add(videoId)
      } else {
        this.collectedVideos.delete(videoId)
      }
    },

    // 设置视频投币状态
    setVideoCoined(videoId, isCoined) {
      if (isCoined) {
        this.coinVideos.add(videoId)
      } else {
        this.coinVideos.delete(videoId)
      }
    },

    // 增加视频分享计数
    incrementSharedCount(videoId) {
      this.sharedCount[videoId] = (this.sharedCount[videoId] || 0) + 1
    },

    // 获取推荐视频
    async fetchRecommendedVideos() {
      try {
        this.videosLoading = true
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟推荐视频数据
        const mockVideos = Array.from({ length: 20 }, (_, index) => ({
          id: `video_${index + 1}`,
          title: `推荐视频标题 ${index + 1}`,
          description: `这是一个推荐视频的描述内容 ${index + 1}`,
          coverUrl: `https://picsum.photos/id/${1015 + index}/320/180`,
          playUrl: `https://example.com/video/${index + 1}`,
          uploader: {
            id: `user_${Math.floor(Math.random() * 10) + 1}`,
            name: `用户${Math.floor(Math.random() * 1000) + 1}`,
            avatar: `https://picsum.photos/id/${200 + Math.floor(Math.random() * 10)}/40/40`
          },
          categoryId: Math.floor(Math.random() * 8) + 1,
          categoryName: ['动画', '音乐', '舞蹈', '游戏', '知识', '资讯', '美食', '生活'][Math.floor(Math.random() * 8)],
          viewCount: Math.floor(Math.random() * 1000000) + 1,
          likeCount: Math.floor(Math.random() * 100000) + 1,
          coinCount: Math.floor(Math.random() * 10000) + 1,
          collectCount: Math.floor(Math.random() * 50000) + 1,
          shareCount: Math.floor(Math.random() * 10000) + 1,
          commentCount: Math.floor(Math.random() * 5000) + 1,
          uploadTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration: `${Math.floor(Math.random() * 59) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        }))
        
        this.setRecommendedVideos(mockVideos)
        return { success: true, data: mockVideos }
      } catch (error) {
        console.error('获取推荐视频失败:', error)
        return { success: false, message: '获取推荐视频失败' }
      } finally {
        this.videosLoading = false
      }
    },

    // 获取分类视频
    async fetchCategoryVideos(categoryId) {
      try {
        this.videosLoading = true
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟分类视频数据
        const mockVideos = Array.from({ length: 20 }, (_, index) => ({
          id: `cat_video_${categoryId}_${index + 1}`,
          title: `分类${categoryId}视频标题 ${index + 1}`,
          description: `这是分类${categoryId}视频的描述内容 ${index + 1}`,
          coverUrl: `https://picsum.photos/id/${300 + categoryId * 10 + index}/320/180`,
          playUrl: `https://example.com/video/${categoryId}_${index + 1}`,
          uploader: {
            id: `user_${Math.floor(Math.random() * 10) + 1}`,
            name: `用户${Math.floor(Math.random() * 1000) + 1}`,
            avatar: `https://picsum.photos/id/${200 + Math.floor(Math.random() * 10)}/40/40`
          },
          categoryId: categoryId,
          categoryName: ['动画', '音乐', '舞蹈', '游戏', '知识', '资讯', '美食', '生活'][categoryId - 1],
          viewCount: Math.floor(Math.random() * 1000000) + 1,
          likeCount: Math.floor(Math.random() * 100000) + 1,
          coinCount: Math.floor(Math.random() * 10000) + 1,
          collectCount: Math.floor(Math.random() * 50000) + 1,
          shareCount: Math.floor(Math.random() * 10000) + 1,
          commentCount: Math.floor(Math.random() * 5000) + 1,
          uploadTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration: `${Math.floor(Math.random() * 59) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        }))
        
        this.setCategoryVideos(categoryId, mockVideos)
        return { success: true, data: mockVideos }
      } catch (error) {
        console.error('获取分类视频失败:', error)
        return { success: false, message: '获取分类视频失败' }
      } finally {
        this.videosLoading = false
      }
    },

    // 获取热门视频
    async fetchHotVideos() {
      try {
        this.videosLoading = true
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟热门视频数据
        const mockVideos = Array.from({ length: 10 }, (_, index) => ({
          id: `hot_video_${index + 1}`,
          title: `热门视频标题 ${index + 1}`,
          description: `这是一个热门视频的描述内容 ${index + 1}`,
          coverUrl: `https://picsum.photos/id/${400 + index}/320/180`,
          playUrl: `https://example.com/video/hot/${index + 1}`,
          uploader: {
            id: `user_${Math.floor(Math.random() * 10) + 1}`,
            name: `用户${Math.floor(Math.random() * 1000) + 1}`,
            avatar: `https://picsum.photos/id/${200 + Math.floor(Math.random() * 10)}/40/40`
          },
          categoryId: Math.floor(Math.random() * 8) + 1,
          categoryName: ['动画', '音乐', '舞蹈', '游戏', '知识', '资讯', '美食', '生活'][Math.floor(Math.random() * 8)],
          viewCount: Math.floor(Math.random() * 10000000) + 1000000,
          likeCount: Math.floor(Math.random() * 1000000) + 100000,
          coinCount: Math.floor(Math.random() * 100000) + 10000,
          collectCount: Math.floor(Math.random() * 500000) + 50000,
          shareCount: Math.floor(Math.random() * 100000) + 10000,
          commentCount: Math.floor(Math.random() * 50000) + 5000,
          uploadTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
          duration: `${Math.floor(Math.random() * 59) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        }))
        
        this.setHotVideos(mockVideos)
        return { success: true, data: mockVideos }
      } catch (error) {
        console.error('获取热门视频失败:', error)
        return { success: false, message: '获取热门视频失败' }
      } finally {
        this.videosLoading = false
      }
    },

    // 获取视频详情
    async fetchVideoDetail(videoId) {
      try {
        this.videoDetailLoading = true
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟视频详情数据
        const mockVideo = {
          id: videoId,
          title: '视频详情标题',
          description: '这是一个视频详情的完整描述内容，可以包含多行文本。\n这是第二行描述内容。',
          coverUrl: `https://picsum.photos/id/1005/1280/720`,
          playUrl: `https://example.com/video/${videoId}`,
          uploader: {
            id: 'user_1',
            name: '测试用户',
            avatar: 'https://picsum.photos/id/200/40/40',
            level: 5,
            isFollowing: false
          },
          categoryId: 1,
          categoryName: '动画',
          tags: ['测试', '视频', '详情'],
          viewCount: 123456,
          likeCount: 12345,
          coinCount: 1234,
          collectCount: 2345,
          shareCount: 3456,
          commentCount: 456,
          uploadTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: '10:30',
          danmakuCount: 1234
        }
        
        this.setCurrentVideo(mockVideo)
        // 添加到观看历史
        this.addToWatchHistory(mockVideo)
        
        return { success: true, data: mockVideo }
      } catch (error) {
        console.error('获取视频详情失败:', error)
        return { success: false, message: '获取视频详情失败' }
      } finally {
        this.videoDetailLoading = false
      }
    },

    // 点赞视频
    async likeVideo(videoId) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 切换点赞状态
        const isLiked = this.likedVideos.has(videoId)
        this.setVideoLiked(videoId, !isLiked)
        
        // 更新当前视频的点赞数
        if (this.currentVideo && this.currentVideo.id === videoId) {
          this.currentVideo.likeCount += isLiked ? -1 : 1
        }
        
        return { success: true, liked: !isLiked }
      } catch (error) {
        console.error('点赞视频失败:', error)
        return { success: false, message: '点赞失败，请稍后重试' }
      }
    },

    // 收藏视频
    async collectVideo(videoId) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 切换收藏状态
        const isCollected = this.collectedVideos.has(videoId)
        this.setVideoCollected(videoId, !isCollected)
        
        // 更新当前视频的收藏数
        if (this.currentVideo && this.currentVideo.id === videoId) {
          this.currentVideo.collectCount += isCollected ? -1 : 1
        }
        
        return { success: true, collected: !isCollected }
      } catch (error) {
        console.error('收藏视频失败:', error)
        return { success: false, message: '收藏失败，请稍后重试' }
      }
    },

    // 投币视频
    async coinVideo(videoId, coinCount) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 记录投币状态
        this.coinVideos.add(videoId)
        
        // 更新当前视频的投币数
        if (this.currentVideo && this.currentVideo.id === videoId) {
          this.currentVideo.coinCount += coinCount
        }
        
        return { success: true, coined: true }
      } catch (error) {
        console.error('投币视频失败:', error)
        return { success: false, message: '投币失败，请稍后重试' }
      }
    },

    // 分享视频
    async shareVideo(videoId) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 更新分享计数
        this.incrementSharedCount(videoId)
        
        // 更新当前视频的分享数
        if (this.currentVideo && this.currentVideo.id === videoId) {
          this.currentVideo.shareCount += 1
        }
        
        return { success: true, shared: true }
      } catch (error) {
        console.error('分享视频失败:', error)
        return { success: false, message: '分享失败，请稍后重试' }
      }
    },

    // 获取视频评论列表
    async fetchVideoComments(videoId) {
      try {
        this.commentsLoading = true
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟评论数据
        const mockComments = Array.from({ length: 10 }, (_, index) => ({
          id: `comment_${videoId}_${index + 1}`,
          videoId: videoId,
          userId: `user_${Math.floor(Math.random() * 10) + 1}`,
          userName: `用户${Math.floor(Math.random() * 1000) + 1}`,
          userAvatar: `https://picsum.photos/id/${200 + Math.floor(Math.random() * 10)}/40/40`,
          content: `这是视频 ${videoId} 的第 ${index + 1} 条评论内容`,
          likeCount: Math.floor(Math.random() * 1000) + 1,
          replyCount: Math.floor(Math.random() * 100) + 1,
          createTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          replies: Array.from({ length: Math.floor(Math.random() * 5) }, (_, replyIndex) => ({
            id: `reply_${videoId}_${index + 1}_${replyIndex + 1}`,
            commentId: `comment_${videoId}_${index + 1}`,
            userId: `user_${Math.floor(Math.random() * 10) + 1}`,
            userName: `用户${Math.floor(Math.random() * 1000) + 1}`,
            userAvatar: `https://picsum.photos/id/${200 + Math.floor(Math.random() * 10)}/40/40`,
            content: `这是对评论 ${index + 1} 的回复 ${replyIndex + 1}`,
            likeCount: Math.floor(Math.random() * 100) + 1,
            createTime: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000).toISOString()
          }))
        }))
        
        // 保存评论列表
        this.comments[videoId] = mockComments
        
        return { success: true, data: mockComments }
      } catch (error) {
        console.error('获取视频评论失败:', error)
        return { success: false, message: '获取评论失败，请稍后重试' }
      } finally {
        this.commentsLoading = false
      }
    },

    // 发表评论
    async postComment(videoId, content) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 模拟新评论数据
        const newComment = {
          id: `comment_${videoId}_${Date.now()}`,
          videoId: videoId,
          userId: 'user_1',
          userName: '测试用户',
          userAvatar: 'https://picsum.photos/id/200/40/40',
          content: content,
          likeCount: 0,
          replyCount: 0,
          createTime: new Date().toISOString(),
          replies: []
        }
        
        // 添加到评论列表
        if (!this.comments[videoId]) {
          this.comments[videoId] = []
        }
        this.comments[videoId].unshift(newComment)
        
        // 更新当前视频的评论数
        if (this.currentVideo && this.currentVideo.id === videoId) {
          this.currentVideo.commentCount += 1
        }
        
        return { success: true, data: newComment }
      } catch (error) {
        console.error('发表评论失败:', error)
        return { success: false, message: '发表评论失败，请稍后重试' }
      }
    },

    // 清除当前视频
    clearCurrentVideo() {
      this.currentVideo = null
    }
  },

  // 持久化配置
  persist: {
    // 启用持久化
    enabled: true,
    // 持久化策略
    strategies: [
      {
        // 存储名称
        key: 'videoStore',
        // 存储方式
        storage: localStorage,
        // 存储字段
        paths: ['watchHistory', 'likedVideos', 'collectedVideos', 'coinVideos', 'sharedCount']
      }
    ]
  }
})
