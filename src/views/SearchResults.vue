<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { View, Star, Search, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { searchApi } from '../api/search.js'

const route = useRoute()
const router = useRouter()

// 搜索关键词
const searchKeyword = ref(route.query.keyword || '')

// 搜索结果
const searchResults = ref([])
const loading = ref(false)
const totalResults = ref(0)

// 分页信息
const pagination = ref({
  currentPage: 1,
  pageSize: 24,
  total: 0
})

// 排序方式
const sortOptions = [
  { value: 'relevance', label: '相关度' },
  { value: 'time', label: '最新发布' },
  { value: 'hot', label: '最多播放' }
]
const currentSort = ref('relevance')

// 分类筛选
const categories = ref([
  { id: null, name: '全部' },
  { id: 1, name: '动画' },
  { id: 2, name: '游戏' },
  { id: 3, name: '音乐' },
  { id: 4, name: '舞蹈' },
  { id: 5, name: '知识' },
  { id: 6, name: '科技' },
  { id: 7, name: '生活' },
  { id: 8, name: '美食' },
  { id: 9, name: '影视' },
  { id: 10, name: '时尚' }
])
const selectedCategory = ref(null)

// 搜索历史
const searchHistory = ref([])

// 热门搜索
const hotSearchList = ref([])

// 搜索下拉框显示状态
const showSearchDropdown = ref(false)
const isSearchFocused = ref(false)

// 固定搜索栏显示状态
const showFixedSearch = ref(false)

// 高亮关键词
const highlightKeyword = (text) => {
  if (!searchKeyword.value || !text) return text
  const keyword = searchKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 执行搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  // 更新URL
  router.push({
    path: '/search-results',
    query: { keyword: searchKeyword.value.trim() }
  })

  await performSearch()
}

// 实际搜索逻辑
const performSearch = async () => {
  if (!searchKeyword.value.trim()) return

  loading.value = true
  try {
    const response = await searchApi.searchVideos({
      keyword: searchKeyword.value.trim(),
      page: pagination.value.currentPage,
      size: pagination.value.pageSize,
      sort: currentSort.value,
      categoryId: selectedCategory.value
    })

    if (response.code === 200) {
      searchResults.value = response.data.list || []
      pagination.value.total = response.data.total || 0
      totalResults.value = response.data.total || 0
    } else {
      searchResults.value = []
      pagination.value.total = 0
      totalResults.value = 0
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

// 页码变化
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  performSearch()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 排序变化
const handleSortChange = (sort) => {
  currentSort.value = sort
  pagination.value.currentPage = 1
  performSearch()
}

// 分类变化
const handleCategoryChange = (categoryId) => {
  selectedCategory.value = categoryId
  pagination.value.currentPage = 1
  performSearch()
}

// 获取搜索历史
const loadSearchHistory = async () => {
  try {
    const response = await searchApi.getSearchHistory()
    if (response.code === 200) {
      searchHistory.value = response.data || []
    }
  } catch (error) {
    console.error('获取搜索历史失败:', error)
  }
}

// 获取热门搜索
const loadHotSearch = async () => {
  try {
    const response = await searchApi.getHotSearch(10)
    if (response.code === 200) {
      hotSearchList.value = response.data || []
    }
  } catch (error) {
    console.error('获取热门搜索失败:', error)
  }
}

// 清空搜索历史
const clearSearchHistory = async () => {
  try {
    await searchApi.clearSearchHistory()
    searchHistory.value = []
    ElMessage.success('搜索历史已清空')
  } catch (error) {
    console.error('清空搜索历史失败:', error)
  }
}

// 点击搜索历史项
const handleHistoryClick = (keyword) => {
  searchKeyword.value = keyword
  showSearchDropdown.value = false
  handleSearch()
}

// 点击热门搜索项
const handleHotSearchClick = (keyword) => {
  searchKeyword.value = keyword
  showSearchDropdown.value = false
  handleSearch()
}

// 搜索框获得焦点
const handleSearchFocus = () => {
  showSearchDropdown.value = true
  isSearchFocused.value = true
}

// 搜索框失去焦点
const handleSearchBlur = () => {
  setTimeout(() => {
    showSearchDropdown.value = false
    isSearchFocused.value = false
  }, 200)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  }
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// 跳转到视频详情页
const goToVideo = (video) => {
  if (video.manuscriptId) {
    window.location.href = `/manuscript/${video.manuscriptId}`
  } else {
    window.location.href = `/video/${video.id}`
  }
}

// 跳转到作者主页
const goToAuthor = (authorId) => {
  if (authorId) {
    window.open(`/profile/${authorId}/home`, '_blank')
  }
}

// 处理滚动事件
const handleScroll = () => {
  const scrollTop = window.scrollY
  showFixedSearch.value = scrollTop > 200
}

// 监听路由参数变化
watch(() => route.query.keyword, (newKeyword) => {
  if (newKeyword && newKeyword !== searchKeyword.value) {
    searchKeyword.value = newKeyword
    pagination.value.currentPage = 1
    performSearch()
  }
})

onMounted(() => {
  // 加载搜索历史和热门搜索
  loadSearchHistory()
  loadHotSearch()

  // 如果有搜索关键词，执行搜索
  if (searchKeyword.value) {
    performSearch()
  }

  // 添加滚动监听
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="search-results-page">
    <!-- 搜索栏区域 -->
    <div class="search-header">
      <div class="search-container">
        <!-- 搜索框 -->
        <div :class="['search-box', { 'focused': isSearchFocused }]">
          <div class="search-box-wrapper">
            <div class="search-icon-left">
              <el-icon><Search /></el-icon>
            </div>
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索视频、UP主..."
              @keyup.enter="handleSearch"
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
            >
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
            <!-- 热门搜索 -->
            <div class="hot-search">
              <div class="hot-search-header">
                <span class="hot-search-title">热搜</span>
              </div>
              <div class="hot-search-list">
                <div
                  v-for="(item, index) in hotSearchList"
                  :key="index"
                  class="hot-item"
                  @click="handleHotSearchClick(item.keyword)"
                >
                  <span :class="['hot-rank', { 'top-three': index < 3 }]">{{ index + 1 }}</span>
                  <span class="hot-keyword">{{ item.keyword }}</span>
                  <span class="hot-count">{{ item.hot }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-container">
        <!-- 分类筛选 -->
        <div class="category-filter">
          <div
            v-for="category in categories"
            :key="category.id || 'all'"
            :class="['category-item', { active: selectedCategory === category.id }]"
            @click="handleCategoryChange(category.id)"
          >
            {{ category.name }}
          </div>
        </div>
        <!-- 排序选项 -->
        <div class="sort-filter">
          <div
            v-for="option in sortOptions"
            :key="option.value"
            :class="['sort-item', { active: currentSort === option.value }]"
            @click="handleSortChange(option.value)"
          >
            {{ option.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="results-container">
      <!-- 结果统计 -->
      <div class="results-stats" v-if="!loading">
        <span v-if="totalResults > 0">找到 {{ totalResults.toLocaleString() }} 个结果</span>
        <span v-else-if="searchKeyword">未找到与 "{{ searchKeyword }}" 相关的结果</span>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 搜索结果列表 -->
      <div v-else-if="searchResults.length > 0" class="results-grid">
        <div
          v-for="video in searchResults"
          :key="video.id"
          class="video-item"
          @click="goToVideo(video)"
        >
          <div class="video-cover">
            <img :src="video.coverUrl || video.cover || 'https://via.placeholder.com/320x180?text=视频封面'" :alt="video.title">
            <!-- 播放量 -->
            <div class="video-stats-overlay">
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ (video.viewCount || 0).toLocaleString() }}
              </span>
              <span class="stat-item">
                <el-icon><Star /></el-icon>
                {{ video.commentCount || 0 }}
              </span>
            </div>
            <!-- 时长 -->
            <span class="video-duration">{{ video.duration || '00:00' }}</span>
          </div>
          <div class="video-info">
            <h4 class="video-title" v-html="highlightKeyword(video.title)"></h4>
            <div class="video-meta">
              <span class="video-author" @click.stop="goToAuthor(video.uploader?.id)">
                {{ video.uploader?.name || video.author || '未知UP主' }}
              </span>
              <span class="video-separator"> · </span>
              <span class="video-date">{{ formatDate(video.uploadTime || video.publishDate) }}</span>
            </div>
            <p v-if="video.description" class="video-desc" v-html="highlightKeyword(video.description)"></p>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="searchKeyword && !loading" class="empty-state">
        <el-icon :size="64"><Search /></el-icon>
        <p>未找到相关结果</p>
        <p class="empty-subtitle">换个关键词试试吧</p>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next, jumper"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 固定搜索栏 -->
    <div class="fixed-search-bar" v-if="showFixedSearch">
      <div class="fixed-search-container">
        <div :class="['search-box', { 'focused': isSearchFocused }]">
          <div class="search-box-wrapper">
            <div class="search-icon-left">
              <el-icon><Search /></el-icon>
            </div>
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索视频、UP主..."
              @keyup.enter="handleSearch"
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
            >
            <button class="search-button" @click="handleSearch">
              搜索
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 搜索页面整体样式 */
.search-results-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 60px;
}

/* 搜索头部 */
.search-header {
  background-color: #fff;
  padding: 20px 0;
  border-bottom: 1px solid #e0e0e0;
}

.search-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 搜索框 */
.search-box {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.search-box-wrapper {
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
  height: 44px;
  transition: all 0.3s;
}

.search-box.focused .search-box-wrapper {
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.search-icon-left {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 100%;
  color: #9499a0;
  font-size: 18px;
}

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

.search-button {
  height: calc(100% - 8px);
  padding: 0 30px;
  border: none;
  outline: none;
  background-color: #00aeec;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 4px;
  margin-right: 4px;
}

.search-button:hover {
  background-color: #0091c6;
}

/* 搜索下拉框 */
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
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

.hot-count {
  font-size: 12px;
  color: #999;
}

/* 筛选栏 */
.filter-bar {
  background-color: #fff;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.category-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-item {
  padding: 6px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.3s;
  background: #f5f5f5;
}

.category-item:hover {
  background: #e0e0e0;
  color: #333;
}

.category-item.active {
  background: #00aeec;
  color: #fff;
}

.sort-filter {
  display: flex;
  gap: 4px;
}

.sort-item {
  padding: 6px 12px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.sort-item:hover {
  color: #00aeec;
}

.sort-item.active {
  color: #00aeec;
  font-weight: 500;
}

/* 结果容器 */
.results-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.results-stats {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

/* 加载状态 */
.loading-state {
  padding: 40px 0;
}

/* 结果网格 */
.results-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.video-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.video-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.video-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background: #f5f5f5;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.video-item:hover .video-cover img {
  transform: scale(1.05);
}

.video-stats-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: #fff;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
}

.video-info {
  padding: 12px;
}

.video-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 42px;
}

.video-title :deep(.highlight) {
  color: #fb7299;
  font-weight: 600;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.video-author {
  color: #999;
  transition: color 0.3s;
}

.video-author:hover {
  color: #00aeec;
}

.video-desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-desc :deep(.highlight) {
  color: #fb7299;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #c0c4cc;
}

.empty-state p {
  margin: 16px 0 0;
  font-size: 16px;
  color: #666;
}

.empty-subtitle {
  font-size: 14px !important;
  color: #999 !important;
  margin-top: 8px !important;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding: 20px 0;
}

/* 固定搜索栏 */
.fixed-search-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 10px 20px;
  z-index: 1000;
  animation: slideDown 0.3s ease;
}

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

.fixed-search-container {
  max-width: 600px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .results-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .results-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .filter-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .hot-search-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .results-grid {
    grid-template-columns: 1fr;
  }

  .search-container,
  .results-container {
    padding: 0 12px;
  }
}
</style>
