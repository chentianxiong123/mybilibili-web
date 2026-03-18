<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { View, Star, Search } from '@element-plus/icons-vue'
import { searchApi } from '../api/search.js'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 从URL获取搜索关键词
const searchKeyword = ref(route.query.keyword || '')

// 固定搜索栏显示状态
const showFixedSearch = ref(false)

// 搜索下拉框相关
const showSearchDropdown = ref(false)
const isSearchFocused = ref(false)

// 搜索历史和热搜
const searchHistory = ref([])
const hotSearchList = ref([])

// 搜索结果
const searchResults = ref([])
const loading = ref(false)
const hasMore = ref(true)

// 分页参数
const currentPage = ref(1)
const pageSize = 24
const totalElements = ref(0)

// 排序方式
const sortType = ref('relevance') // relevance, time, hot
const sortOptions = [
  { key: 'relevance', label: '综合排序' },
  { key: 'hot', label: '最多播放' },
  { key: 'time', label: '最新发布' }
]

// 格式化日期，只显示月和日
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// 格式化播放量
const formatCount = (count) => {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toString()
}

// 跳转到视频详情页（稿件详情）
const goToVideo = (manuscriptId) => {
  if (manuscriptId) {
    router.push(`/manuscript/${manuscriptId}`)
  }
}

// 跳转到作者主页
const goToAuthor = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`)
  }
}

// 执行搜索
const performSearch = async (isLoadMore = false) => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  if (!isLoadMore) {
    loading.value = true
    currentPage.value = 1
    searchResults.value = []
  }

  try {
    const params = {
      keyword: searchKeyword.value.trim(),
      page: currentPage.value,
      size: pageSize,
      sort: sortType.value
    }

    const response = await searchApi.searchVideos(params)
    
    if (response.code === 200 && response.data) {
      const { content, totalElements: total, last } = response.data
      
      // 转换后端数据为前端展示格式
      const formattedResults = content.map(item => ({
        manuscriptId: item.manuscriptId,
        title: item.title,
        cover: item.coverUrl || '/default-cover.jpg',
        author: item.userName || '未知UP主',
        userId: item.userId,
        viewCount: item.viewCount || 0,
        commentCount: item.commentCount || 0,
        duration: item.duration || '00:00',
        publishDate: item.uploadTime,
        videoCount: item.videoCount || 1
      }))

      if (isLoadMore) {
        searchResults.value.push(...formattedResults)
      } else {
        searchResults.value = formattedResults
      }

      totalElements.value = total
      hasMore.value = !last

      // 保存搜索历史
      saveSearchHistory(searchKeyword.value.trim())
    } else {
      ElMessage.error(response.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    // 更新URL参数
    router.push({
      path: '/search',
      query: { keyword: searchKeyword.value.trim() }
    })
    performSearch(false)
  }
}

// 处理排序切换
const handleSortChange = (sortKey) => {
  sortType.value = sortKey
  performSearch(false)
}

// 加载更多
const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  currentPage.value++
  await performSearch(true)
}

// 获取搜索建议
const fetchSearchSuggestions = async (keyword) => {
  if (!keyword || keyword.length < 1) return
  try {
    const response = await searchApi.getSearchSuggestions(keyword)
    if (response.code === 200 && response.data) {
      // 可以在这里实现搜索建议下拉框
    }
  } catch (error) {
    console.error('获取搜索建议失败:', error)
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

// 获取搜索历史（使用本地存储）
const fetchSearchHistory = async () => {
  try {
    // 从localStorage获取搜索历史
    const stored = localStorage.getItem('searchHistory')
    if (stored) {
      searchHistory.value = JSON.parse(stored).slice(0, 5)
    }
  } catch (error) {
    console.error('获取搜索历史失败:', error)
    searchHistory.value = []
  }
}

// 保存搜索历史
const saveSearchHistory = async (keyword) => {
  try {
    // 添加到本地历史记录
    if (!searchHistory.value.includes(keyword)) {
      searchHistory.value.unshift(keyword)
      if (searchHistory.value.length > 5) {
        searchHistory.value = searchHistory.value.slice(0, 5)
      }
      // 保存到localStorage
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
    }
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 清空搜索历史
const clearSearchHistory = async () => {
  try {
    searchHistory.value = []
    localStorage.removeItem('searchHistory')
  } catch (error) {
    console.error('清空搜索历史失败:', error)
    searchHistory.value = []
  }
}

// 搜索框获得焦点
const handleSearchFocus = () => {
  showSearchDropdown.value = true
  isSearchFocused.value = true
}

// 搜索框失去焦点
const handleSearchBlur = (event) => {
  setTimeout(() => {
    showSearchDropdown.value = false
    isSearchFocused.value = false
  }, 200)
}

// 点击搜索历史项
const handleHistoryClick = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

// 点击热搜项
const handleHotSearchClick = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

// 监听路由参数变化
watch(() => route.query.keyword, (newKeyword) => {
  if (newKeyword && newKeyword !== searchKeyword.value) {
    searchKeyword.value = newKeyword
    performSearch(false)
  }
})

// 处理滚动事件，显示/隐藏固定搜索栏
const handleScroll = () => {
  const scrollTop = window.scrollY
  showFixedSearch.value = scrollTop > 200
  
  // 滚动到底部加载更多
  const scrollHeight = document.documentElement.scrollHeight
  const clientHeight = document.documentElement.clientHeight
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}

// 页面加载时
onMounted(() => {
  // 如果有搜索词，执行搜索
  if (searchKeyword.value) {
    performSearch(false)
  }
  
  // 获取热门搜索
  fetchHotSearch()
  
  // 获取搜索历史
  fetchSearchHistory()
  
  // 添加滚动事件监听
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="search-page">
    <!-- 搜索栏区域 -->
    <div class="search-section">
      <div class="search-container">
        <!-- 主搜索容器：包含搜索栏、分类选择和视频列表 -->
        <div class="main-search-container">
          <!-- 结果上方的居中搜索栏 -->
          <div class="results-search-bar">
            <div :class="['search-box', { 'focused': isSearchFocused }]">
              <div class="search-box-wrapper">
                <!-- 问号图标在左侧 -->
                <div class="search-icon-left">
                  <el-icon><Search /></el-icon>
                </div>
                <!-- 搜索输入框 -->
                <input
                  v-model="searchKeyword"
                  type="text"
                  class="search-input"
                  placeholder="搜索视频、UP主..."
                  @keyup.enter="handleSearch"
                  @focus="handleSearchFocus"
                  @blur="handleSearchBlur"
                >
                <!-- 浅蓝色搜索按钮在右侧 -->
                <button class="search-button" @click="handleSearch">
                  搜索
                </button>
              </div>
              <!-- 搜索下拉框 -->
              <div class="search-dropdown" v-show="showSearchDropdown">
                <!-- 搜索历史 -->
                <div class="search-history" v-if="searchHistory.length > 0">
                  <div class="search-history-header">
                    <span class="search-history-title">搜索历史</span>
                    <span class="clear-history" @click="clearSearchHistory">清除</span>
                  </div>
                  <div class="search-history-list">
                    <div
                      v-for="(item, index) in searchHistory"
                      :key="index"
                      class="history-item"
                      @click="handleHistoryClick(item)"
                    >
                      {{ item }}
                    </div>
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

          <!-- 搜索分类和排序选项 -->
          <div class="search-category-container">
            <div class="search-category-tabs">
              <div 
                v-for="option in sortOptions" 
                :key="option.key"
                :class="['category-tab', { 'active': sortType === option.key }]"
                @click="handleSortChange(option.key)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>

          <!-- 搜索结果统计 -->
          <div class="search-stats" v-if="searchResults.length > 0">
            共找到 {{ totalElements }} 个结果
          </div>

          <!-- 六列视频网格布局 -->
          <div class="video-grid" v-loading="loading">
            <div v-for="video in searchResults" :key="video.manuscriptId" class="video-item">
              <div class="video-cover" @click="goToVideo(video.manuscriptId)">
                <img :src="video.cover" alt="视频封面">
                <!-- 左下角：播放量和评论量 -->
                <div class="video-stats-overlay">
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ formatCount(video.viewCount) }}
                  </span>
                  <span class="stat-item">
                    <el-icon><Star /></el-icon>
                    {{ formatCount(video.commentCount) }}
                  </span>
                </div>
                <!-- 右下角：视频时长 -->
                <span class="video-duration">{{ video.duration }}</span>
                <!-- 分P数显示 -->
                <span class="video-count" v-if="video.videoCount > 1">{{ video.videoCount }}P</span>
              </div>
              <span class="video-title">
                <span class="video-title-text" @click="goToVideo(video.manuscriptId)">{{ video.title }}</span>
              </span>
              <div class="video-meta">
                <span class="video-author" @click.stop="goToAuthor(video.userId)">{{ video.author }}</span>
                <span class="video-separator"> · </span>
                <span class="video-date">{{ formatDate(video.publishDate) }}</span>
              </div>
            </div>
          </div>

          <!-- 加载更多提示 -->
          <div class="load-more" v-if="searchResults.length > 0">
            <el-button v-if="hasMore && !loading" @click="loadMore" type="primary" plain>加载更多</el-button>
            <el-button v-if="loading" type="primary" plain loading>加载中...</el-button>
            <span v-if="!hasMore && searchResults.length > 0" class="no-more">没有更多了</span>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-if="!loading && searchResults.length === 0 && searchKeyword">
            <el-empty description="没有找到相关结果" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 固定定位的搜索栏，滚动时显示 -->
    <div class="fixed-search-bar" v-if="showFixedSearch">
      <div :class="['search-box', { 'focused': isSearchFocused }]">
        <div class="search-box-wrapper">
          <!-- 问号图标在左侧 -->
          <div class="search-icon-left">
            <el-icon><Search /></el-icon>
          </div>
          <!-- 搜索输入框 -->
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索视频、UP主..."
            @keyup.enter="handleSearch"
            @focus="handleSearchFocus"
            @blur="handleSearchBlur"
          >
          <!-- 浅蓝色搜索按钮在右侧 -->
          <button class="search-button" @click="handleSearch">
            搜索
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 搜索页面整体样式 */
.search-page {
  width: 100%;
  min-height: 100vh;
  background-color: #fff;
}

/* 搜索栏区域 */
.search-section {
  background-color: #fff;
  padding: 20px 0;
  margin-bottom: 0;
}

.search-container {
  max-width: 1980px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
}

/* 主搜索容器：包含搜索栏、分类选择和视频列表 */
.main-search-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 固定搜索栏样式 */
.fixed-search-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 10px 20px;
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

/* 下滑动画 */
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 搜索框包装器 - 包含左侧问号图标、输入框和右侧搜索按钮 */
.search-box-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  background-color: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
  height: 40px;
}

/* 左侧问号图标 */
.search-icon-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 100%;
  color: #9499a0;
  font-size: 18px;
  background-color: transparent;
}

/* 搜索输入框 */
.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background-color: transparent;
  padding: 0 15px;
  font-size: 16px;
  color: #333;
}

.search-input::placeholder {
  color: #9499a0;
}

/* 右侧浅蓝色搜索按钮 */
.search-button {
  height: calc(100% - 8px);
  padding: 0 35px;
  border: none;
  outline: none;
  background-color: #00aeec;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
  margin-right: 5px;
}

.search-button:hover {
  background-color: #0091c6;
}

/* 结果上方的居中搜索栏 */
.results-search-bar {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: #fff;
  border-bottom: none;
}

/* 搜索分类和排序选项 */
.search-category-container {
  background-color: #fff;
  padding: 15px 20px;
  border-bottom: none;
}

.search-category-tabs {
  display: flex;
  gap: 20px;
}

.category-tab {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.3s ease;
  background-color: #f0f2f5;
}

.category-tab:hover {
  background-color: #e0e2e5;
  color: #333;
}

.category-tab.active {
  background-color: #00aeec;
  color: #fff;
}

/* 搜索结果统计 */
.search-stats {
  padding: 10px 20px;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

/* 六列视频网格布局 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  width: 100%;
  background-color: #fff;
  padding: 20px;
  min-height: 300px;
}

/* 视频项样式 - 与首页视频结构一致 */
.video-item {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.video-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  cursor: pointer;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.video-cover:hover img {
  transform: scale(1.05);
}

/* 视频统计信息覆盖层 */
.video-stats-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: transparent;
  padding: 4px 8px;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.stat-item .el-icon {
  font-size: 12px;
}

/* 视频时长 */
.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* 分P数显示 */
.video-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* 视频标题 */
.video-title {
  font-size: 15px;
  font-weight: 500;
  color: #212121;
  margin: 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 42px;
  flex: 0 0 auto;
  pointer-events: none;
}

.video-title-text {
  cursor: pointer;
  transition: color 0.3s;
  pointer-events: auto;
}

.video-title-text:hover {
  color: #00aeec;
}

/* 视频元信息 */
.video-meta {
  margin: 0 10px 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.video-author {
  font-size: 11px;
  color: #9499a0;
  cursor: pointer;
  transition: color 0.3s;
}

.video-author:hover {
  color: #00aeec;
}

.video-date {
  font-size: 11px;
  color: #9499a0;
}

.video-separator {
  color: #9499a0;
  font-size: 11px;
}

/* 搜索框容器样式 */
.search-box {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
}

.search-box.focused .search-box-wrapper {
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

/* 搜索下拉框样式 */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
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
  color: #00aeec;
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
  color: #00aeec;
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.no-more {
  color: #999;
  font-size: 14px;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
}

/* 响应式设计 */
@media (max-width: 1920px) {
  .video-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1400px) {
  .video-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .search-box-wrapper {
    max-width: 100%;
  }
  
  .search-button {
    padding: 0 20px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  .search-button {
    padding: 0 15px;
    font-size: 13px;
  }
  
  .search-category-tabs {
    flex-wrap: wrap;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
</style>