<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, VideoPlay, Clock, View, Edit, Share, More } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { collectionApi } from '../api/collection.js'

const route = useRoute()
const router = useRouter()

// 合集ID
const collectionId = ref(route.params.id)

// 当前用户ID
const currentUserId = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.id
})

// 加载状态
const loading = ref(false)

// 合集信息
const collection = ref({
  id: null,
  name: '',
  description: '',
  coverUrl: '',
  isPublic: true,
  userId: null,
  userName: '',
  userAvatar: '',
  videoCount: 0,
  viewCount: 0,
  createTime: '',
  updateTime: ''
})

// 稿件列表
const manuscripts = ref([])

// 当前播放的稿件索引
const currentIndex = ref(0)

// 分页
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 排序方式
const sortBy = ref('default') // default-默认, newest-最新, oldest-最早

// 判断是否是自己的合集
const isOwnCollection = computed(() => {
  return currentUserId.value && collection.value.userId && 
         String(currentUserId.value) === String(collection.value.userId)
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 获取默认封面
const getDefaultCover = () => {
  return 'https://picsum.photos/id/1025/400/225'
}

// 加载合集详情
const loadCollectionDetail = async () => {
  loading.value = true
  try {
    const response = await collectionApi.getCollectionById(collectionId.value)
    if (response.code === 200) {
      collection.value = response.data
    }
  } catch (error) {
    console.error('获取合集详情失败:', error)
    ElMessage.error('获取合集详情失败')
  }
}

// 加载合集中的稿件
const loadManuscripts = async () => {
  loading.value = true
  try {
    const response = await collectionApi.getCollectionManuscripts(
      collectionId.value,
      pagination.value.currentPage,
      pagination.value.pageSize
    )
    if (response.code === 200) {
      manuscripts.value = response.data?.list || []
      pagination.value.total = response.data?.total || 0
    }
  } catch (error) {
    console.error('获取稿件列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 播放稿件
const playManuscript = (manuscript, index) => {
  currentIndex.value = index
  // 跳转到视频播放页面
  if (manuscript.id) {
    router.push(`/video/${manuscript.id}`)
  }
}

// 播放全部
const playAll = () => {
  if (manuscripts.value.length > 0) {
    playManuscript(manuscripts.value[0], 0)
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到用户主页
const goToUserProfile = () => {
  if (collection.value.userId) {
    router.push(`/profile/${collection.value.userId}`)
  }
}

// 跳转到编辑页面
const goToEdit = () => {
  router.push(`/collection/${collectionId.value}/edit`)
}

// 处理分页变化
const handlePageChange = (page) => {
  pagination.value.currentPage = page
  loadManuscripts()
}

// 处理每页数量变化
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  loadManuscripts()
}

// 处理排序变化
const handleSortChange = (value) => {
  sortBy.value = value
  // 根据排序方式重新排序稿件
  if (value === 'newest') {
    manuscripts.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
  } else if (value === 'oldest') {
    manuscripts.value.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
  } else {
    // 默认排序，重新加载
    loadManuscripts()
  }
}

onMounted(() => {
  loadCollectionDetail()
  loadManuscripts()
})
</script>

<template>
  <div class="collection-detail-page">
    <!-- 头部导航 -->
    <div class="detail-header">
      <div class="header-left">
        <el-button text :icon="ArrowLeft" @click="goBack">
          返回
        </el-button>
      </div>
      <div class="header-right">
        <el-button v-if="isOwnCollection" text :icon="Edit" @click="goToEdit">
          编辑合集
        </el-button>
        <el-button text :icon="Share">
          分享
        </el-button>
      </div>
    </div>

    <!-- 合集信息区 -->
    <div class="collection-info-section">
      <div class="info-container">
        <!-- 封面 -->
        <div class="collection-cover">
          <img
            :src="collection.coverUrl || getDefaultCover()"
            :alt="collection.name"
          />
          <div class="cover-overlay">
            <el-button type="primary" size="large" :icon="Play" @click="playAll">
              播放全部
            </el-button>
          </div>
          <div class="video-count-badge">
            <el-icon><VideoPlay /></el-icon>
            <span>{{ collection.videoCount }} 个视频</span>
          </div>
        </div>

        <!-- 信息 -->
        <div class="collection-meta">
          <h1 class="collection-title">{{ collection.name }}</h1>
          <p class="collection-desc">{{ collection.description || '暂无描述' }}</p>
          
          <!-- 作者信息 -->
          <div class="author-info" @click="goToUserProfile">
            <img
              :src="collection.userAvatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'"
              :alt="collection.userName"
              class="author-avatar"
            />
            <span class="author-name">{{ collection.userName }}</span>
          </div>

          <!-- 统计信息 -->
          <div class="stats-info">
            <span class="stat-item">
              <el-icon><View /></el-icon>
              {{ collection.viewCount || 0 }} 次观看
            </span>
            <span class="stat-item">
              <el-icon><Clock /></el-icon>
              更新于 {{ formatDate(collection.updateTime) }}
            </span>
            <span v-if="!collection.isPublic" class="private-tag">私密合集</span>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button type="primary" size="large" :icon="Play" @click="playAll">
              播放全部
            </el-button>
            <el-button v-if="isOwnCollection" size="large" :icon="Edit" @click="goToEdit">
              管理合集
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 稿件列表区 -->
    <div class="manuscripts-section">
      <div class="section-header">
        <h2 class="section-title">
          视频列表
          <span class="video-count">({{ pagination.total }})</span>
        </h2>
        
        <!-- 排序选项 -->
        <div class="sort-options">
          <el-radio-group v-model="sortBy" size="small" @change="handleSortChange">
            <el-radio-button value="default">默认排序</el-radio-button>
            <el-radio-button value="newest">最新发布</el-radio-button>
            <el-radio-button value="oldest">最早发布</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="manuscripts.length === 0" class="empty-state">
        <el-empty description="暂无视频">
          <el-button v-if="isOwnCollection" type="primary" @click="goToEdit">
            添加视频
          </el-button>
        </el-empty>
      </div>

      <!-- 稿件列表 -->
      <div v-else class="manuscripts-list">
        <div
          v-for="(manuscript, index) in manuscripts"
          :key="manuscript.id"
          class="manuscript-item"
          :class="{ active: currentIndex === index }"
          @click="playManuscript(manuscript, index)"
        >
          <!-- 序号 -->
          <div class="item-index">
            <span v-if="currentIndex !== index" class="index-number">{{ index + 1 }}</span>
            <el-icon v-else class="playing-icon"><VideoPlay /></el-icon>
          </div>

          <!-- 封面 -->
          <div class="item-cover">
            <img
              :src="manuscript.coverUrl || getDefaultCover()"
              :alt="manuscript.title"
            />
            <div class="duration">{{ formatDuration(manuscript.duration) }}</div>
          </div>

          <!-- 信息 -->
          <div class="item-info">
            <h3 class="item-title">{{ manuscript.title }}</h3>
            <p class="item-desc">{{ manuscript.description || '暂无描述' }}</p>
            <div class="item-meta">
              <span class="meta-item">
                <el-icon><View /></el-icon>
                {{ manuscript.viewCount || 0 }}
              </span>
              <span class="meta-item">
                {{ formatDate(manuscript.uploadTime) }}
              </span>
            </div>
          </div>

          <!-- 播放按钮 -->
          <div class="item-play">
            <el-button type="primary" circle>
              <el-icon><VideoPlay /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.collection-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
}

/* 头部导航 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left,
.header-right {
  display: flex;
  gap: 12px;
}

/* 合集信息区 */
.collection-info-section {
  margin-bottom: 20px;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-container {
  display: flex;
  gap: 24px;
}

/* 封面 */
.collection-cover {
  position: relative;
  width: 320px;
  height: 180px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.collection-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.collection-cover:hover .cover-overlay {
  opacity: 1;
}

.video-count-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 13px;
  border-radius: 4px;
}

/* 合集元信息 */
.collection-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.collection-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 作者信息 */
.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: fit-content;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 14px;
  color: #00aeec;
  font-weight: 500;
}

.author-info:hover .author-name {
  text-decoration: underline;
}

/* 统计信息 */
.stats-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #9499a0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.private-tag {
  padding: 2px 8px;
  background-color: #f0f0f0;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
}

/* 稿件列表区 */
.manuscripts-section {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.video-count {
  font-size: 14px;
  color: #9499a0;
  font-weight: normal;
}

/* 排序选项 */
.sort-options {
  display: flex;
  gap: 8px;
}

/* 加载状态 */
.loading-state {
  padding: 40px 0;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
}

/* 稿件列表 */
.manuscripts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manuscript-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.manuscript-item:hover {
  background-color: #f5f7fa;
}

.manuscript-item.active {
  background-color: rgba(0, 174, 236, 0.1);
}

/* 序号 */
.item-index {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.index-number {
  font-size: 16px;
  font-weight: 500;
  color: #9499a0;
}

.playing-icon {
  font-size: 20px;
  color: #00aeec;
}

/* 封面 */
.item-cover {
  position: relative;
  width: 160px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  border-radius: 2px;
}

/* 信息 */
.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-desc {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #9499a0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 播放按钮 */
.item-play {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.manuscript-item:hover .item-play {
  opacity: 1;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .info-container {
    flex-direction: column;
  }

  .collection-cover {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .action-buttons {
    margin-top: 12px;
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .manuscript-item {
    flex-wrap: wrap;
  }

  .item-play {
    opacity: 1;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
}

@media (max-width: 576px) {
  .collection-title {
    font-size: 18px;
  }

  .stats-info {
    flex-wrap: wrap;
  }

  .item-cover {
    width: 120px;
    height: 68px;
  }

  .item-index {
    width: 30px;
  }
}
</style>
