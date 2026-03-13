<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择要引用的视频"
    width="600px"
    :close-on-click-modal="true"
    class="video-select-dialog"
  >
    <div class="video-select-content">
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索我的视频"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 视频列表 -->
      <div v-loading="loading" class="video-list">
        <div
          v-for="video in filteredVideoList"
          :key="video.id"
          :class="['video-item', { selected: selectedId === video.id }]"
          @click="handleSelect(video)"
        >
          <img
            :src="video.coverUrl || 'https://picsum.photos/160/100'"
            alt="封面"
            class="video-cover"
          />
          <div class="video-info">
            <div class="video-title" :title="video.title">{{ video.title }}</div>
            <div class="video-meta">
              <span class="video-time">{{ formatTime(video.createdAt) }}</span>
            </div>
          </div>
          <div v-if="selectedId === video.id" class="selected-icon">
            <el-icon><Check /></el-icon>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && filteredVideoList.length === 0" class="empty-state">
          <el-icon :size="48"><VideoPlay /></el-icon>
          <p>{{ searchKeyword ? '没有找到相关视频' : '暂无视频' }}</p>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :disabled="!selectedId" @click="handleConfirm">
          确认选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Check, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { manuscriptApi } from '@/api/manuscript.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'select'])

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 数据状态
const loading = ref(false)
const videoList = ref([])
const selectedId = ref(null)
const selectedVideo = ref(null)
const searchKeyword = ref('')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 过滤后的视频列表
const filteredVideoList = computed(() => {
  if (!searchKeyword.value) return videoList.value
  const keyword = searchKeyword.value.toLowerCase()
  return videoList.value.filter(video =>
    video.title.toLowerCase().includes(keyword)
  )
})

// 获取视频列表
const fetchVideoList = async () => {
  if (!props.userId) {
    ElMessage.warning('请先登录')
    return
  }

  loading.value = true
  try {
    const res = await manuscriptApi.getUserManuscripts(
      props.userId,
      currentPage.value,
      pageSize.value
    )
    if (res.code === 200) {
      videoList.value = res.data?.list || res.data || []
      total.value = res.data?.total || videoList.value.length
    } else {
      ElMessage.error(res.message || '获取视频列表失败')
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
    ElMessage.error('获取视频列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理（防抖）
let searchTimer = null
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    // 前端搜索，无需重新请求
  }, 300)
}

// 选择视频
const handleSelect = (video) => {
  selectedId.value = video.id
  selectedVideo.value = video
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchVideoList()
}

// 取消选择
const handleCancel = () => {
  dialogVisible.value = false
  selectedId.value = null
  selectedVideo.value = null
}

// 确认选择
const handleConfirm = () => {
  if (selectedVideo.value) {
    emit('select', selectedVideo.value)
    dialogVisible.value = false
    selectedId.value = null
    selectedVideo.value = null
  }
}

// 格式化时间
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / 86400000)

  if (days < 1) return '今天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return date.toLocaleDateString()
}

// 监听对话框显示，打开时加载数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedId.value = null
    selectedVideo.value = null
    searchKeyword.value = ''
    currentPage.value = 1
    fetchVideoList()
  }
})
</script>

<style scoped>
.video-select-content {
  min-height: 300px;
}

.search-box {
  margin-bottom: 16px;
}

.video-list {
  max-height: 400px;
  overflow-y: auto;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.video-item:hover {
  background: #f5f7fa;
}

.video-item.selected {
  background: #e6f7ff;
  border-color: #00aeec;
}

.video-cover {
  width: 120px;
  height: 75px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  font-size: 14px;
  color: #18191c;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}

.video-meta {
  font-size: 12px;
  color: #9499a0;
}

.selected-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #00aeec;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9499a0;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
