<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  Star, House, Search, Bell, Clock, Edit, Upload, 
  Message, User, Lock, Delete, ChatDotRound 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userApi } from '../../api/index.js'
import { messageApi } from '../../api/message.js'
import { searchApi } from '../../api/search.js'
import MessageDropdown from './dropdowns/MessageDropdown.vue'
import DynamicDropdown from './dropdowns/DynamicDropdown.vue'
import FavoriteDropdown from './dropdowns/FavoriteDropdown.vue'
import HistoryDropdown from './dropdowns/HistoryDropdown.vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'transparent', // 'transparent' 或 'white'
    validator: (value) => ['transparent', 'white'].includes(value)
  }
})

const emit = defineEmits(['showLogin', 'logout'])

const router = useRouter()
const route = useRoute()



// 登录状态
const isLogged = ref(false)
const userInfo = ref(null)

// 滚动状态
const isScrolled = ref(false)

// 缩放状态 - 当页面放大时触发简化逻辑
const isZoomed = ref(false)
// 触发简化的浏览器缩放阈值 (1.1 表示放大10%触发)
const ZOOM_THRESHOLD = 1.1

// 下拉组件悬停状态
const showMessageDropdown = ref(false)
const showDynamicDropdown = ref(false)
const showFavoriteDropdown = ref(false)
const showHistoryDropdown = ref(false)

// 未读消息计数
const unreadCounts = ref({
  private: 0,
  reply: 0,
  at: 0,
  like: 0,
  system: 0,
  dynamic: 0
})

// 计算总未读消息数
const totalUnreadCount = computed(() => {
  return unreadCounts.value.private + unreadCounts.value.reply + 
         unreadCounts.value.at + unreadCounts.value.like + unreadCounts.value.system
})

// 获取未读消息数
const fetchUnreadCounts = async () => {
  try {
    const res = await messageApi.getUnreadCounts()
    if (res.code === 200) {
      unreadCounts.value = { ...unreadCounts.value, ...res.data }
    }
  } catch (error) {
    console.error('获取未读消息数失败:', error)
  }
}



// 搜索相关
const searchText = ref('')
const showSearchDropdown = ref(false)
const showAllHistory = ref(false)
const isSearchFocused = ref(false)
const searchHistory = ref([])
const hotSearchList = ref([])

// 从 localStorage 加载搜索历史
const loadSearchHistory = () => {
  try {
    const stored = localStorage.getItem('searchHistory')
    if (stored) {
      searchHistory.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
    searchHistory.value = []
  }
}

// 保存搜索历史到 localStorage
const saveSearchHistory = () => {
  try {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 获取热搜榜
const fetchHotSearch = async () => {
  try {
    const response = await searchApi.getHotSearch()
    if (response.code === 200 && response.data) {
      hotSearchList.value = response.data.map(item => ({
        rank: item.rank,
        keyword: item.keyword,
        score: item.score
      }))
    }
  } catch (error) {
    console.error('获取热搜榜失败:', error)
    hotSearchList.value = []
  }
}

// 计算属性：是否应该显示为白底状态
const shouldShowScrolled = computed(() => {
  if (props.mode === 'white') return true
  return isScrolled.value
})

// 计算属性：是否在搜索页面（用于隐藏搜索栏）
const isSearchPage = computed(() => {
  return route.path === '/search'
})

// 获取最新用户信息
const fetchUserInfo = async () => {
  const token = localStorage.getItem('token')
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const userId = payload.sub
    
    const response = await userApi.getUserById(userId)
    if (response.code === 200) {
      userInfo.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      return true
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
  return false
}

// 检查token是否过期
const checkTokenExpiration = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    localStorage.removeItem('user')
    isLogged.value = false
    userInfo.value = null
    return false
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    if (Date.now() > exp) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      isLogged.value = false
      userInfo.value = null
      return false
    }
    const userData = localStorage.getItem('user')
    if (userData) {
      userInfo.value = JSON.parse(userData)
      isLogged.value = true
    }
    fetchUserInfo()
    return true
  } catch (error) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    isLogged.value = false
    userInfo.value = null
    return false
  }
}

// 处理头像点击
const handleAvatarClick = () => {
  if (checkTokenExpiration() && isLogged.value && userInfo.value && userInfo.value.id) {
    router.push(`/profile/${userInfo.value.id}/home`)
  } else {
    emit('showLogin')
  }
}

// 处理退出登录
const handleLogout = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  isLogged.value = false
  userInfo.value = null
  ElMessage.success('退出登录成功')
  emit('logout')
}

// 滚动监听
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

// 当前检测到的缩放比例
let currentZoomRatio = 1

// 初始 devicePixelRatio（页面加载时的值，作为基准）
let initialDPR = 0

// 防抖定时器
let zoomDebounceTimer = null

// 是否已初始化
let isZoomInitialized = false

// 检测页面缩放 - 使用 devicePixelRatio
const checkZoom = () => {
  // 获取当前 devicePixelRatio
  const currentDPR = window.devicePixelRatio || 1

  // 初始化基准值（只在第一次调用时设置）
  if (!isZoomInitialized) {
    initialDPR = currentDPR
    currentZoomRatio = 1
    isZoomed.value = false
    isZoomInitialized = true
    return
  }

  // 计算相对于基准的缩放比例
  const newZoomRatio = currentDPR / initialDPR

  // 只有当缩放比例真正变化时才更新状态（避免闪烁）
  if (Math.abs(newZoomRatio - currentZoomRatio) > 0.001) {
    currentZoomRatio = newZoomRatio
    const shouldBeZoomed = currentZoomRatio >= ZOOM_THRESHOLD
    
    // 只有状态真正改变时才更新
    if (isZoomed.value !== shouldBeZoomed) {
      isZoomed.value = shouldBeZoomed
    }
  }
}

// 防抖版本的缩放检测
const debouncedCheckZoom = () => {
  if (zoomDebounceTimer) {
    clearTimeout(zoomDebounceTimer)
  }
  zoomDebounceTimer = setTimeout(() => {
    checkZoom()
    zoomDebounceTimer = null
  }, 100)
}

// 重置基准值
const resetZoomBase = () => {
  initialDPR = 0
  checkZoom()
}

// visualViewport 缩放监听 (用于支持 visualViewport 的浏览器，主要是移动端)
// 桌面浏览器 Ctrl+滚轮 不会改变 visualViewport.scale，所以禁用此监听
const handleVisualViewportResize = () => {
  // 移动端双指缩放时才使用 visualViewport.scale
  // 桌面浏览器不使用此逻辑，避免干扰
}

// 处理键盘缩放快捷键 (Ctrl + +/- 或 Ctrl + 滚轮)
const handleKeyZoom = (e) => {
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0')) {
    debouncedCheckZoom()
  }
}

// 处理滚轮缩放 (Ctrl + 滚轮)
const handleWheelZoom = (e) => {
  if (e.ctrlKey) {
    debouncedCheckZoom()
  }
}

// 强制检测缩放（用于调试）
const forceCheckZoom = () => {
  resetZoomBase()
  setTimeout(checkZoom, 100)
}

// 搜索框获得焦点
const handleSearchFocus = () => {
  showSearchDropdown.value = true
  isSearchFocused.value = true
}

// 搜索框失去焦点
const handleSearchBlur = (event) => {
  const searchBox = document.querySelector('.search-box')
  if (searchBox && searchBox.contains(event.relatedTarget)) {
    return
  }
  
  setTimeout(() => {
    const searchBox = document.querySelector('.search-box')
    if (searchBox && !searchBox.contains(document.activeElement)) {
      showSearchDropdown.value = false
      isSearchFocused.value = false
    }
  }, 200)
}

// 阻止搜索框内部的mousedown事件触发blur
const handleSearchContentMouseDown = (event) => {
  event.preventDefault()
}

// 点击搜索历史项
const handleHistoryClick = (keyword) => {
  searchText.value = keyword
  handleSearch()
}

// 点击热搜项
const handleHotSearchClick = (keyword) => {
  searchText.value = keyword
  handleSearch()
}

// 清空搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  saveSearchHistory()
}

// 搜索
const handleSearch = () => {
  if (searchText.value.trim()) {
    const keyword = searchText.value.trim()
    // 添加到搜索历史（去重，最多保存10条）
    const index = searchHistory.value.indexOf(keyword)
    if (index > -1) {
      // 如果已存在，移到最前面
      searchHistory.value.splice(index, 1)
    }
    searchHistory.value.unshift(keyword)
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
    saveSearchHistory()
    router.push(`/search?keyword=${encodeURIComponent(keyword)}`)
    showSearchDropdown.value = false
  }
}

onMounted(() => {
  checkTokenExpiration()

  if (props.mode === 'transparent') {
    window.addEventListener('scroll', handleScroll)
  }



  // 初始化缩放检测
  checkZoom()

  // 监听 visualViewport 缩放变化（现代浏览器，主要是移动端）
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleVisualViewportResize)
  }

  // 监听窗口 resize 来检测缩放
  window.addEventListener('resize', checkZoom)

  // 监听键盘缩放快捷键 (Ctrl + +/-)
  window.addEventListener('keydown', handleKeyZoom)
  // 监听滚轮缩放 (Ctrl + 滚轮)
  window.addEventListener('wheel', handleWheelZoom, { passive: false })
  
  // 获取未读消息数
  fetchUnreadCounts()
  // 定时刷新未读消息数（每30秒）
  const unreadInterval = setInterval(fetchUnreadCounts, 30000)
  
  // 加载搜索历史
  loadSearchHistory()
  
  // 获取热搜榜
  fetchHotSearch()
  
  // 清理函数
  onUnmounted(() => {
    clearInterval(unreadInterval)
  })
})

onUnmounted(() => {
  if (props.mode === 'transparent') {
    window.removeEventListener('scroll', handleScroll)
  }
  window.removeEventListener('resize', checkZoom)
  window.removeEventListener('keydown', handleKeyZoom)
  window.removeEventListener('wheel', handleWheelZoom)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleVisualViewportResize)
  }
  // 清理防抖定时器
  if (zoomDebounceTimer) {
    clearTimeout(zoomDebounceTimer)
    zoomDebounceTimer = null
  }
})
</script>

<template>
  <header :class="['app-header', { 'scrolled': shouldShowScrolled, 'white-mode': mode === 'white' }]">
    <div class="header-container">
      <!-- 左侧：首页图标 -->
      <div class="header-left">
        <el-button link @click="router.push('/')" class="home-icon">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-button>
      </div>
      
      <!-- 中间：搜索栏（在搜索页面隐藏） -->
      <div class="header-center" v-if="!isSearchPage">
        <div :class="['search-box', { 'focused': isSearchFocused }]">
          <el-input
            v-model="searchText"
            placeholder="搜索番剧、影视、UP主..."
            @keyup.enter="handleSearch"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
            clearable
          >
            <template #suffix>
              <el-icon class="search-icon" @click="handleSearch"><Search /></el-icon>
            </template>
          </el-input>
          <!-- 搜索下拉框 -->
          <div class="search-dropdown" v-show="showSearchDropdown" @mousedown="handleSearchContentMouseDown">
            <!-- 搜索历史 -->
            <div class="search-history" v-if="searchHistory.length > 0">
              <div class="search-history-header">
                <span class="search-history-title">搜索历史</span>
                <span class="clear-history" @click="clearSearchHistory">清除</span>
              </div>
              <div class="search-history-list" :class="{ 'expanded': showAllHistory }">
                <div
                  v-for="(item, index) in searchHistory"
                  :key="index"
                  class="history-item"
                  @click="handleHistoryClick(item)"
                >
                  {{ item }}
                </div>
              </div>
              <div class="history-more" v-if="searchHistory.length > 6">
                <span class="more-btn" @click="showAllHistory = !showAllHistory">
                  {{ showAllHistory ? '收起' : '展开更多' }}
                </span>
              </div>
            </div>
            
            <!-- 热搜 -->
            <div class="hot-search">
              <div class="hot-search-header">
                <span class="hot-search-title">热搜</span>
              </div>
              <div class="hot-search-list">
                <div
                  v-for="item in hotSearchList"
                  :key="item.rank"
                  class="hot-item"
                  @click="handleHotSearchClick(item.keyword)"
                >
                  <span :class="['hot-rank', { 'top-three': item.rank <= 3 }]">{{ item.rank }}</span>
                  <span class="hot-keyword">{{ item.keyword }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 搜索页面占位，保持布局平衡 -->
      <div class="header-center" v-else></div>
      
      <!-- 右侧：功能按钮 -->
      <div class="header-right">
        <!-- 个人头像按钮 -->
        <div class="avatar-container">
          <el-button link @click="handleAvatarClick" class="action-btn avatar-btn">
            <el-avatar 
              :size="60" 
              :src="userInfo?.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'" 
              class="header-avatar" 
            />
          </el-button>
          
          <!-- 个人详情弹出栏 -->
          <div class="user-profile-popup" v-if="isLogged && userInfo">
            <div class="popup-content">
              <div class="popup-username">{{ userInfo.nickname || userInfo.username || '用户名' }}</div>
              
              <div class="stats-buttons">
                <div class="stat-button" @click="router.push(`/profile/${userInfo.id}/following`)">
                  <div class="stat-number">{{ userInfo.followingCount || 0 }}</div>
                  <div class="stat-label">关注</div>
                </div>
                <div class="stat-button" @click="router.push(`/profile/${userInfo.id}/followers`)">
                  <div class="stat-number">{{ userInfo.followerCount || 0 }}</div>
                  <div class="stat-label">粉丝</div>
                </div>
                <div class="stat-button" @click="router.push(`/profile/${userInfo.id}/dynamic`)">
                  <div class="stat-number">{{ userInfo.dynamicCount || 0 }}</div>
                  <div class="stat-label">动态</div>
                </div>
              </div>
              
              <div class="profile-options">
                <div class="option-item" @click="router.push('/personal-center/home')">
                  <el-icon><User /></el-icon>
                  <span>个人中心</span>
                  <span class="option-arrow">></span>
                </div>
                <div class="option-item" @click="router.push('/create-center')">
                  <el-icon><Upload /></el-icon>
                  <span>投稿管理</span>
                  <span class="option-arrow">></span>
                </div>
                <div class="option-item logout-item" @click="handleLogout">
                  <el-icon><Lock /></el-icon>
                  <span>退出登录</span>
                  <span class="option-arrow">></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 消息按钮 -->
        <div 
          class="dropdown-container"
          @mouseenter="showMessageDropdown = true"
          @mouseleave="showMessageDropdown = false"
        >
          <div :class="['action-btn', { 'hide-text-on-small': isZoomed }]" @click="router.push('/message')">
            <div class="icon-with-badge">
              <el-icon><Message /></el-icon>
              <span v-if="totalUnreadCount > 0" class="badge">{{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}</span>
            </div>
            <span>消息</span>
          </div>
          <div class="dropdown-bridge"></div>
          <MessageDropdown v-show="showMessageDropdown" />
        </div>

        <!-- 收藏按钮 -->
        <div 
          class="dropdown-container"
          @mouseenter="showFavoriteDropdown = true"
          @mouseleave="showFavoriteDropdown = false"
        >
          <div :class="['action-btn', { 'hide-text-on-small': isZoomed }]" @click="router.push('/profile/favorites')">
            <el-icon><Star /></el-icon>
            <span>收藏</span>
          </div>
          <div class="dropdown-bridge"></div>
          <FavoriteDropdown v-show="showFavoriteDropdown" />
        </div>

        <!-- 历史按钮 -->
        <div
          class="dropdown-container"
          @mouseenter="showHistoryDropdown = true"
          @mouseleave="showHistoryDropdown = false"
        >
          <div :class="['action-btn', { 'hide-text-on-small': isZoomed }]" @click="router.push('/history')">
            <el-icon><Clock /></el-icon>
            <span>历史</span>
          </div>
          <div class="dropdown-bridge"></div>
          <HistoryDropdown v-show="showHistoryDropdown" @navigate="showHistoryDropdown = false" />
        </div>

        <!-- 动态按钮 -->
        <div 
          class="dropdown-container"
          @mouseenter="showDynamicDropdown = true"
          @mouseleave="showDynamicDropdown = false"
        >
          <div :class="['action-btn', { 'hide-text-on-small': isZoomed }]" @click="router.push('/dynamic')">
            <div class="icon-with-badge">
              <el-icon><ChatDotRound /></el-icon>
              <span v-if="unreadCounts.dynamic > 0" class="badge">{{ unreadCounts.dynamic > 99 ? '99+' : unreadCounts.dynamic }}</span>
            </div>
            <span>动态</span>
          </div>
          <div class="dropdown-bridge"></div>
          <DynamicDropdown v-show="showDynamicDropdown" />
        </div>
        
        <!-- 投稿按钮 -->
        <el-button type="primary" @click="router.push('/create-center')" class="upload-btn upload-btn-right">
          <el-icon><Upload /></el-icon>
          <span>投稿</span>
        </el-button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* 顶部导航栏 */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: transparent;
  display: flex;
  align-items: center;
  z-index: 100;
  transition: all 0.3s ease;
}

.app-header.scrolled,
.app-header.white-mode {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-container {
  max-width: 2560px;
  margin: 0 auto;
  padding: 10px 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

/* 左侧：首页图标 */
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  height: 60px;
}

.home-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  color: #fff;
  transition: all 0.3s;
  min-width: 60px;
  height: 60px;
}

.home-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.app-header.scrolled .home-icon span,
.app-header.white-mode .home-icon span {
  color: #333;
}

.app-header.scrolled .home-icon,
.app-header.white-mode .home-icon {
  color: #333;
}

.home-icon .el-icon {
  font-size: 20px;
}

.home-icon span {
  font-size: 12px;
}

/* 中间：搜索栏 */
.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 20px;
  height: 60px;
}

.search-box {
  width: 500px;
  display: flex;
  align-items: center;
  position: relative;
}

.search-box .el-input {
  border-radius: 8px;
}

.search-box :deep(.el-input__wrapper) {
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 50px;
  transition: all 0.3s ease;
}

.search-box.focused :deep(.el-input__wrapper) {
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.search-box .search-icon {
  color: #00a1d6;
  cursor: pointer;
  font-size: 18px;
}

.search-box .search-icon:hover {
  color: #0091c6;
}

/* 搜索下拉框 */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 500px;
  background: #fff;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-top: 0;
  z-index: 1000;
  overflow: hidden;
  max-height: 500px;
  overflow-y: auto;
}

.search-history {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.search-history-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.clear-history {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}

.clear-history:hover {
  color: #fb7299;
}

.search-history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 70px;
  overflow: hidden;
  align-content: flex-start;
}

.search-history-list.expanded {
  max-height: none;
}

.history-item {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item:hover {
  background: #e0e0e0;
  color: #00a1d6;
}

.history-more {
  margin-top: 8px;
  text-align: center;
}

.more-btn {
  font-size: 12px;
  color: #00a1d6;
  cursor: pointer;
  transition: color 0.3s;
}

.more-btn:hover {
  color: #0091c6;
}

.hot-search {
  padding: 16px;
}

.hot-search-header {
  margin-bottom: 12px;
}

.hot-search-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.hot-search-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.3s;
  border-radius: 4px;
}

.hot-item:hover {
  background: #f5f5f5;
}

.hot-rank {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  background: #f0f0f0;
  border-radius: 4px;
  flex-shrink: 0;
}

.hot-rank.top-three {
  background: #fb7299;
  color: #fff;
}

.hot-keyword {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-item:hover .hot-keyword {
  color: #00a1d6;
}

/* 右侧：功能按钮 */
.header-right {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-end;
}

/* 下拉容器 */
.dropdown-container {
  position: relative;
  display: inline-block;
  z-index: 1001;
}

/* 图标带红点 */
.icon-with-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #fb7299;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  font-weight: 500;
}

/* 下拉连接区域 - 填充图标和下拉组件之间的间隙 */
.dropdown-bridge {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 8px;
  background: transparent;
  z-index: 999;
}

/* 下拉组件样式 - 绝对定位 */
.dropdown-container :deep(.message-dropdown) {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* 收藏下拉组件 - 稍微向左移动 */
.dropdown-container :deep(.favorite-dropdown) {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-60%);
  margin-top: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* 历史下拉组件 - 向左移动更多 */
.dropdown-container :deep(.history-dropdown) {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-70%);
  margin-top: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* 动态下拉组件 - 向左移动最多 */
.dropdown-container :deep(.dynamic-dropdown) {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-80%);
  margin-top: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* 个人头像容器 */
.avatar-container {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 60px;
  z-index: 1001;
  cursor: pointer;
}

/* 导航栏头像 */
.header-avatar {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1003;
}

/* 鼠标悬停时头像动画 */
.avatar-container:hover .header-avatar {
  transform: translate(-20px, 30px) scale(1.7);
  z-index: 1004;
}

/* 个人详情弹出栏 */
.user-profile-popup {
  position: absolute;
  top: 60px;
  left: calc(10px - 140px);
  width: 280px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1002;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 鼠标悬停时显示弹出栏 */
.avatar-container:hover .user-profile-popup {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* 弹出栏内容区域 */
.popup-content {
  padding: 50px 0 16px;
}

/* 用户名 */
.popup-username {
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 20px;
}

/* 统计按钮容器 */
.stats-buttons {
  display: flex;
  justify-content: space-around;
  padding: 0 20px 16px;
  border-bottom: 1px solid #f0f0f0;
}

/* 统计按钮 */
.stat-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.stat-button:hover {
  background-color: #f5f5f5;
}

/* 统计数字 */
.stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

/* 统计标签 */
.stat-label {
  font-size: 12px;
  color: #999;
}

/* 操作选项容器 */
.profile-options {
  padding: 8px 0;
}

/* 操作选项 */
.option-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0 20px;
  gap: 12px;
  position: relative;
}

/* 调整右箭头位置 */
.option-arrow {
  color: #ccc;
  font-size: 12px;
  position: absolute;
  right: 20px;
}

.option-item .el-icon {
  font-size: 16px;
  color: #999;
  transition: color 0.3s;
  width: 20px;
  text-align: left;
}

.option-item span {
  flex: 1;
  text-align: left;
}

.option-item:hover {
  background-color: #f5f5f5;
  color: #00aeec;
}

.option-item:hover .el-icon {
  color: #00aeec;
}

.option-item:hover .option-arrow {
  color: #999;
}

/* 退出登录选项 */
.logout-item {
  color: #ff4d4f;
}

.logout-item .el-icon {
  color: #ff4d4f;
}

.logout-item:hover {
  background-color: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

.logout-item:hover .el-icon {
  color: #ff4d4f;
}

/* 功能按钮 */
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  min-width: 60px;
  height: 60px;
  text-align: center;
  width: 60px;
}

.action-btn:hover {
  background: transparent;
}

.action-btn .el-icon {
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0) scale(1);
}

.action-btn:hover .el-icon {
  animation: bounce 0.6s ease-in-out;
}

/* 弹跳动画关键帧 */
@keyframes bounce {
  0% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-10px) scale(1.1);
  }
  50% {
    transform: translateY(0) scale(1);
  }
  75% {
    transform: translateY(-5px) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

/* 头像按钮特殊样式，覆盖弹起效果 */
.action-btn.avatar-btn {
  margin-right: 10px;
}

.action-btn.avatar-btn:hover {
  background: transparent !important;
}

/* 确保头像按钮图标不继承弹跳动画 */
.action-btn.avatar-btn .el-icon {
  animation: none !important;
}

.action-btn.avatar-btn:hover .el-icon {
  animation: none !important;
  transform: none !important;
}

.action-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-top: 0;
  width: 100%;
}

.app-header.scrolled .action-btn,
.app-header.white-mode .action-btn {
  color: #333;
}

/* 头像按钮 - 覆盖action-btn的样式 */
.avatar-btn {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  min-width: 60px !important;
  width: 60px !important;
  height: 60px !important;
}

.avatar-btn .el-avatar {
  margin-bottom: 0;
  width: 50px !important;
  height: 50px !important;
}

/* 投稿按钮 */
.upload-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  background-color: #fb7299;
  color: #fff;
  border: none;
  border-radius: 15px;
  padding: 0 20px;
  font-size: 14px;
  height: 50px;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  background-color: #f75982;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.3);
}

.upload-btn .el-icon {
  font-size: 18px;
}

.upload-btn span {
  font-size: 14px;
  margin-top: 0;
}

/* 投稿按钮 - 增加右边距 */
.upload-btn-right {
  margin-right: 16px;
}

/* 缩放时隐藏按钮文字 - 全局样式 */
.hide-text-on-zoom span {
  display: none;
}

.hide-text-on-zoom {
  min-width: 60px;
  width: 60px;
}

/* 隐藏按钮文字的样式 - 由 JavaScript 控制类名 */
.hide-text-on-small span {
  display: none;
}

.hide-text-on-small {
  min-width: 50px;
  width: 50px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .header-right {
    gap: 2px;
  }
  
  .action-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 16px;
  }
  
  .header-center {
    padding: 0 16px;
  }
  
  .search-box {
    max-width: 300px;
  }
  
  .action-btn {
    padding: 6px 4px;
    min-width: 40px;
  }
  
  .upload-btn {
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  .header-right {
    gap: 2px;
  }
  
  .search-box {
    max-width: 200px;
  }
}
</style>
