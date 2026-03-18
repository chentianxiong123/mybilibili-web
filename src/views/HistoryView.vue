<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Delete, List, Grid, VideoPlay, Clock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { watchHistoryApi } from '../api/watchHistory.js'

const router = useRouter()

// 加载状态
const loading = ref(false)

// 视图模式：grid 或 list
const viewMode = ref('grid')

// 是否开启记录浏览历史
const recordHistory = ref(true)

// 搜索关键词
const searchKeyword = ref('')

// 批量管理模式
const isBatchMode = ref(false)

// 选中的历史记录ID
const selectedIds = ref([])

// 分页信息
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 历史记录数据
const historyList = ref([])

// 按日期分组的历史记录
const groupedHistory = computed(() => {
  let filtered = historyList.value

  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(keyword) ||
      item.author.toLowerCase().includes(keyword)
    )
  }

  const groups = {}

  filtered.forEach(item => {
    const date = new Date(item.watchedAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateKey
    if (isSameDay(date, today)) {
      dateKey = '今天'
    } else if (isSameDay(date, yesterday)) {
      dateKey = '昨天'
    } else {
      dateKey = formatDate(date)
    }

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(item)
  })

  return groups
})

// 判断是否同一天
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

// 格式化日期
const formatDate = (date) => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

// 格式化时间（显示完整日期时间）
const formatTime = (date) => {
  const now = new Date()
  const isToday = isSameDay(date, now)

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const timeStr = `${hours}:${minutes}`

  if (isToday) {
    // 今天只显示时间
    return timeStr
  } else {
    // 非今天显示月-日 时:分
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day} ${timeStr}`
  }
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '00:00'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 格式化进度时间
const formatProgress = (progress, total, percentage) => {
  if (!progress || progress === 0) return ''
  if (percentage && percentage > 0) {
    return `看到 ${formatDuration(progress)} · ${percentage}%`
  }
  return `看到 ${formatDuration(progress)}`
}

// 加载历史记录
const loadHistory = async () => {
  loading.value = true
  try {
    const response = await watchHistoryApi.getWatchHistory(
      pagination.value.currentPage,
      pagination.value.pageSize
    )
    if (response.code === 200) {
      // 转换后端数据为前端格式
      historyList.value = (response.data || []).map(item => {
        const video = item.video || {}
        const uploader = video.uploader || {}
        return {
          id: item.id,
          videoId: item.videoId,
          title: video.title || '未知视频',
          author: uploader.name || '未知UP主',
          cover: video.coverUrl || '',
          duration: item.progressSeconds || 0,
          watchedAt: item.watchedAt ? new Date(item.watchedAt) : new Date(),
          progress: item.progressSeconds || 0,
          totalDuration: item.videoDuration || 0,
          watchPercentage: item.watchPercentage || 0,
          isFinished: (item.watchPercentage || 0) >= 90, // 90%以上算看完
          authorAvatar: uploader.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(uploader.name || '未知')}&background=0D8ABC&color=fff`,
          manuscriptId: video.manuscriptId
        }
      })
      pagination.value.total = historyList.value.length
    } else {
      ElMessage.error(response.message || '加载历史记录失败')
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

// 清空历史
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复。',
      '清空历史',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await watchHistoryApi.clearWatchHistory()
    historyList.value = []
    pagination.value.total = 0
    ElMessage.success('历史记录已清空')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空历史记录失败:', error)
      ElMessage.error('清空历史记录失败')
    }
  }
}

// 切换批量管理模式
const toggleBatchMode = () => {
  isBatchMode.value = !isBatchMode.value
  if (!isBatchMode.value) {
    selectedIds.value = []
  }
}

// 选择/取消选择
const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// 全选当前组
const selectAllInGroup = (groupItems, selected) => {
  if (selected) {
    groupItems.forEach(item => {
      if (!selectedIds.value.includes(item.id)) {
        selectedIds.value.push(item.id)
      }
    })
  } else {
    groupItems.forEach(item => {
      const index = selectedIds.value.indexOf(item.id)
      if (index > -1) {
        selectedIds.value.splice(index, 1)
      }
    })
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条历史记录吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await Promise.all(selectedIds.value.map(id => watchHistoryApi.deleteWatchHistory(id)))
    historyList.value = historyList.value.filter(item => !selectedIds.value.includes(item.id))
    selectedIds.value = []
    isBatchMode.value = false
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除历史记录失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 删除单条记录
const deleteItem = async (item) => {
  try {
    await watchHistoryApi.deleteWatchHistory(item.id)
    const index = historyList.value.findIndex(h => h.id === item.id)
    if (index > -1) {
      historyList.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除历史记录失败:', error)
    ElMessage.error('删除失败')
  }
}

// 点击视频
const handleVideoClick = (item) => {
  if (isBatchMode.value) {
    toggleSelect(item.id)
  } else {
    // 使用 manuscriptId 跳转，如果没有则使用 videoId
    const targetId = item.manuscriptId || item.videoId
    if (targetId) {
      router.push(`/manuscript/${targetId}`)
    }
  }
}

// 切换记录浏览历史
const handleRecordChange = (val) => {
  if (!val) {
    ElMessage.info('已关闭浏览历史记录')
  } else {
    ElMessage.success('已开启浏览历史记录')
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <div class="history-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-icon class="header-icon"><Clock /></el-icon>
        <h1 class="page-title">历史记录</h1>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <!-- 记录浏览历史开关 -->
        <div class="record-toggle">
          <el-switch
            v-model="recordHistory"
            active-color="#00a1d6"
            @change="handleRecordChange"
          />
          <span class="toggle-label">记录浏览历史</span>
        </div>

        <!-- 视图切换 -->
        <div class="view-toggle">
          <el-button
            :class="['view-btn', { active: viewMode === 'grid' }]"
            @click="viewMode = 'grid'"
          >
            <el-icon><Grid /></el-icon>
          </el-button>
          <el-button
            :class="['view-btn', { active: viewMode === 'list' }]"
            @click="viewMode = 'list'"
          >
            <el-icon><List /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- 搜索框 -->
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索标题/up主昵称"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <el-icon class="search-icon" @click="handleSearch"><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 清空历史 -->
        <el-button class="action-btn" @click="clearHistory">
          <el-icon><Delete /></el-icon>
          清空历史
        </el-button>

        <!-- 批量管理 -->
        <el-button
          :class="['action-btn', { 'batch-active': isBatchMode }]"
          @click="toggleBatchMode"
        >
          <el-icon><List /></el-icon>
          {{ isBatchMode ? '完成' : '批量管理' }}
        </el-button>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="isBatchMode" class="batch-bar">
      <span class="batch-info">已选择 {{ selectedIds.length }} 项</span>
      <el-button type="danger" size="small" @click="batchDelete">
        删除选中
      </el-button>
    </div>

    <!-- 历史记录内容 -->
    <div v-loading="loading" class="history-content">
      <template v-if="Object.keys(groupedHistory).length > 0">
        <div
          v-for="(groupItems, dateKey) in groupedHistory"
          :key="dateKey"
          class="history-group"
        >
          <!-- 时间分组标题 -->
          <div class="group-header">
            <div class="timeline-dot"></div>
            <h3 class="group-title">{{ dateKey }}</h3>

            <!-- 组内全选（批量模式下） -->
            <el-checkbox
              v-if="isBatchMode"
              :model-value="groupItems.every(item => selectedIds.includes(item.id))"
              @change="(val) => selectAllInGroup(groupItems, val)"
            >
              全选
            </el-checkbox>
          </div>

          <!-- 视频列表 -->
          <div :class="['video-list', viewMode]">
            <div
              v-for="item in groupItems"
              :key="item.id"
              :class="['video-item', { selected: selectedIds.includes(item.id) }]"
              @click="handleVideoClick(item)"
            >
              <!-- 批量选择框 -->
              <div v-if="isBatchMode" class="select-box" @click.stop>
                <el-checkbox
                  :model-value="selectedIds.includes(item.id)"
                  @change="toggleSelect(item.id)"
                />
              </div>

              <!-- 视频封面 -->
              <div class="video-cover">
                <img :src="item.cover" :alt="item.title" />

                <!-- 进度条 -->
                <div v-if="!item.isFinished && item.progress > 0" class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: `${(item.progress / item.totalDuration) * 100}%` }"
                  ></div>
                </div>

                <!-- 视频总时长 -->
                <div class="video-duration">
                  {{ formatDuration(item.totalDuration) }}
                </div>

                <!-- 收藏标记 -->
                <div v-if="item.isCollected" class="collected-badge">已收藏</div>

                <!-- 删除按钮 -->
                <div
                  v-if="!isBatchMode"
                  class="delete-btn"
                  @click.stop="deleteItem(item)"
                >
                  <el-icon><Delete /></el-icon>
                </div>
              </div>

              <!-- 视频信息 -->
              <div class="video-info">
                <h4 class="video-title" :title="item.title">{{ item.title }}</h4>
                <div class="video-meta">
                  <span class="author-name">{{ item.author }}</span>
                  <span class="watch-time">{{ formatTime(new Date(item.watchedAt)) }}</span>
                </div>
                <div v-if="!item.isFinished" class="watch-progress">
                  {{ formatProgress(item.progress, item.totalDuration, item.watchPercentage) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <el-icon :size="64"><Clock /></el-icon>
        <p>暂无历史记录</p>
        <p class="empty-subtitle">开启记录浏览历史，不错过任何精彩视频</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.history-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 80px);
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  color: #333;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 记录开关 */
.record-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-label {
  font-size: 14px;
  color: #666;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  gap: 4px;
}

.view-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #666;
  transition: all 0.3s;
}

.view-btn:hover {
  border-color: #00a1d6;
  color: #00a1d6;
}

.view-btn.active {
  background: #00a1d6;
  border-color: #00a1d6;
  color: #fff;
}

/* 搜索框 */
.search-box {
  width: 200px;
}

.search-box :deep(.el-input__wrapper) {
  border-radius: 4px;
}

.search-icon {
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.search-icon:hover {
  color: #00a1d6;
}

/* 操作按钮 */
.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.action-btn:hover {
  color: #00a1d6;
}

.action-btn.batch-active {
  background: #00a1d6;
  border-color: #00a1d6;
  color: #fff;
}

/* 批量操作栏 */
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.batch-info {
  font-size: 14px;
  color: #666;
}

/* 历史记录内容 */
.history-content {
  position: relative;
}

/* 时间分组 */
.history-group {
  margin-bottom: 32px;
  position: relative;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-left: 20px;
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: #00a1d6;
  border-radius: 50%;
}

.group-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

/* 视频列表 - 网格模式 */
.video-list.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding-left: 20px;
}

/* 视频列表 - 列表模式 */
.video-list.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 20px;
}

.video-list.list .video-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.video-list.list .video-cover {
  width: 200px;
  padding-top: 112px;
  flex-shrink: 0;
}

.video-list.list .video-info {
  flex: 1;
  padding: 0;
}

/* 视频项 */
.video-item {
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;
}

.video-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-item.selected {
  box-shadow: 0 0 0 2px #00a1d6;
}

/* 选择框 */
.select-box {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 4px;
}

/* 视频封面 */
.video-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.video-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.video-item:hover .video-cover img {
  transform: scale(1.05);
}

/* 进度条 */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  background: #fb7299;
  transition: width 0.3s;
}

/* 视频时长 */
.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
}

/* 收藏标记 */
.collected-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #fb7299;
  color: #fff;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
}

/* 删除按钮 */
.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.3s;
  cursor: pointer;
}

.video-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 77, 79, 0.8);
}

/* 视频信息 */
.video-info {
  padding: 12px 0;
}

.video-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  height: 2.8em;
}

.video-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.author-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}

.watch-time {
  color: #ccc;
}

.watch-progress {
  margin-top: 4px;
  font-size: 12px;
  color: #fb7299;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
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

/* 响应式设计 */
@media (max-width: 1200px) {
  .video-list.grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: space-between;
  }

  .video-list.grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    padding-left: 0;
  }

  .group-header {
    padding-left: 16px;
  }

  .video-list.list .video-cover {
    width: 140px;
    padding-top: 78px;
  }
}

@media (max-width: 480px) {
  .history-page {
    padding: 12px;
  }

  .video-list.grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .video-title {
    font-size: 13px;
  }
}
</style>
