import { defineStore } from 'pinia'

// 用户store
export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    // 用户信息
    userInfo: {
      id: '',
      username: '',
      nickname: '',
      avatar: '',
      email: '',
      phone: '',
      gender: 0, // 0: 未知, 1: 男, 2: 女
      birthdate: '',
      signature: '',
      level: 1,
      followingCount: 0,
      followerCount: 0,
      videoCount: 0,
      likedCount: 0,
      coinCount: 0,
      pointCount: 0
    },
    // 登录状态
    isLoggedIn: false,
    // 登录令牌
    token: '',
    // 刷新令牌
    refreshToken: '',
    // 登录加载状态
    loginLoading: false,
    // 注册加载状态
    registerLoading: false
  }),

  // Getters
  getters: {
    // 获取用户ID
    getUserId: (state) => state.userInfo.id,
    // 获取用户名
    getUsername: (state) => state.userInfo.username,
    // 获取用户昵称
    getNickname: (state) => state.userInfo.nickname,
    // 获取用户头像
    getAvatar: (state) => state.userInfo.avatar,
    // 获取登录状态
    getIsLoggedIn: (state) => state.isLoggedIn,
    // 获取用户等级
    getUserLevel: (state) => state.userInfo.level,
    // 获取关注数
    getFollowingCount: (state) => state.userInfo.followingCount,
    // 获取粉丝数
    getFollowerCount: (state) => state.userInfo.followerCount,
    // 获取视频数
    getVideoCount: (state) => state.userInfo.videoCount
  },

  // Actions
  actions: {
    // 设置登录状态
    setLoginStatus(status) {
      this.isLoggedIn = status
    },

    // 设置用户信息
    setUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
    },

    // 设置令牌
    setToken(token, refreshToken) {
      this.token = token
      this.refreshToken = refreshToken
      // 保存到本地存储
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
    },

    // 清除令牌
    clearToken() {
      this.token = ''
      this.refreshToken = ''
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },

    // 加载本地存储的令牌
    loadTokenFromStorage() {
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      if (token && refreshToken) {
        this.token = token
        this.refreshToken = refreshToken
        this.isLoggedIn = true
        // 可以在这里调用接口获取用户信息
        // this.getUserInfo()
      }
    },

    // 登录操作
    async login(loginForm) {
      try {
        this.loginLoading = true
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 模拟登录成功
        const mockToken = 'mock-jwt-token-' + Date.now()
        const mockRefreshToken = 'mock-refresh-token-' + Date.now()
        
        // 设置令牌
        this.setToken(mockToken, mockRefreshToken)
        
        // 设置用户信息
        this.setUserInfo({
          id: '1',
          username: loginForm.username,
          nickname: loginForm.username + '的昵称',
          avatar: 'https://picsum.photos/id/1005/40/40',
          email: 'user@example.com',
          phone: '13800138000',
          level: 5,
          followingCount: 120,
          followerCount: 85,
          videoCount: 15
        })
        
        // 设置登录状态
        this.setLoginStatus(true)
        
        return { success: true, message: '登录成功' }
      } catch (error) {
        console.error('登录失败:', error)
        return { success: false, message: '登录失败，请检查用户名和密码' }
      } finally {
        this.loginLoading = false
      }
    },

    // 注册操作
    async register(registerForm) {
      try {
        this.registerLoading = true
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 模拟注册成功
        return { success: true, message: '注册成功，请登录' }
      } catch (error) {
        console.error('注册失败:', error)
        return { success: false, message: '注册失败，请稍后重试' }
      } finally {
        this.registerLoading = false
      }
    },

    // 退出登录
    logout() {
      // 清除用户信息
      this.setUserInfo({
        id: '',
        username: '',
        nickname: '',
        avatar: '',
        email: '',
        phone: '',
        gender: 0,
        birthdate: '',
        signature: '',
        level: 1,
        followingCount: 0,
        followerCount: 0,
        videoCount: 0,
        likedCount: 0,
        coinCount: 0,
        pointCount: 0
      })
      
      // 清除令牌
      this.clearToken()
      
      // 设置登录状态
      this.setLoginStatus(false)
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 模拟获取用户信息成功
        this.setUserInfo({
          id: '1',
          username: 'testuser',
          nickname: '测试用户',
          avatar: 'https://picsum.photos/id/1005/40/40',
          email: 'test@example.com',
          phone: '13800138000',
          level: 5,
          followingCount: 120,
          followerCount: 85,
          videoCount: 15,
          likedCount: 320,
          coinCount: 150,
          pointCount: 5000
        })
        
        return { success: true }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return { success: false }
      }
    },

    // 更新用户信息
    async updateUserInfo(updateInfo) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 更新用户信息
        this.setUserInfo(updateInfo)
        
        return { success: true, message: '用户信息更新成功' }
      } catch (error) {
        console.error('更新用户信息失败:', error)
        return { success: false, message: '更新失败，请稍后重试' }
      }
    },

    // 更新用户头像
    async updateAvatar(avatarUrl) {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 更新用户头像
        this.setUserInfo({ avatar: avatarUrl })
        
        return { success: true, message: '头像更新成功' }
      } catch (error) {
        console.error('更新头像失败:', error)
        return { success: false, message: '头像更新失败，请稍后重试' }
      }
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
        key: 'userStore',
        // 存储方式
        storage: localStorage,
        // 存储字段
        paths: ['userInfo', 'isLoggedIn', 'token', 'refreshToken']
      }
    ]
  }
})
