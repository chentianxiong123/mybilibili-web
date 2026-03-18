<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ArrowLeft, ArrowRight, View, Star } from '@element-plus/icons-vue'
import { videoApi } from '../api/index.js'
import { manuscriptApi } from '../api/manuscript.js'
import { getHomeBanners } from '../api/banner.js'

// 轮播图数据
const bannerList = ref([])

// 轮播图组件引用
const carouselRef = ref(null)

// 轮播图当前索引
const currentBannerIndex = ref(0)

// 轮播图控制函数
const handleBannerChange = (index) => {
  currentBannerIndex.value = index
}

const changeBanner = (index) => {
  currentBannerIndex.value = index
  if (carouselRef.value) {
    carouselRef.value.setActiveItem(index)
  }
}

const prevBanner = () => {
  currentBannerIndex.value = (currentBannerIndex.value - 1 + bannerList.value.length) % bannerList.value.length
  if (carouselRef.value) {
    carouselRef.value.prev()
  }
}

const nextBanner = () => {
  currentBannerIndex.value = (currentBannerIndex.value + 1) % bannerList.value.length
  if (carouselRef.value) {
    carouselRef.value.next()
  }
}

// 推荐视频列表
const videoList = ref([])
// 标记是否已经加载过视频列表
const hasLoadedVideos = ref(false)
// 组件唯一标识符
const componentId = Math.random().toString(36).substring(2, 10)

// 加载状态
const loading = ref(false)

// 动态设置轮播图高度，使其与第二行video-cover底部对齐
const adjustBannerHeight = () => {
  nextTick(() => {
    // 获取第二行的video-cover元素（第4-6个video-item中的video-cover）
    const videoCovers = document.querySelectorAll('.video-cover')
    if (videoCovers.length >= 6) {
      // 获取第二行第一个video-cover的底部位置
      const secondRowCover = videoCovers[3]
      const bannerSection = document.querySelector('.banner-section')

      if (secondRowCover && bannerSection) {
        // 计算第二行video-cover的底部位置（相对于video-grid）
        const videoGrid = document.querySelector('.video-grid')
        const gridRect = videoGrid.getBoundingClientRect()
        const coverRect = secondRowCover.getBoundingClientRect()

        // banner-section的高度 = 第二行video-cover的底部位置 - grid的顶部位置
        const bannerHeight = coverRect.bottom - gridRect.top
        bannerSection.style.height = `${bannerHeight}px`
      }
    }
  })
}

// 从后端API获取稿件列表数据（首页显示稿件而非视频）
const fetchVideoList = async () => {
  // 防止重复加载
  if (hasLoadedVideos.value) {
    return
  }

  loading.value = true
  try {
    // 获取推荐稿件列表
    const recommendedResponse = await manuscriptApi.getRecommendedManuscripts()
    if (recommendedResponse.code === 200) {
      const manuscripts = recommendedResponse.data

      // 清空现有视频列表
      videoList.value = []

      // 添加去重逻辑
      const uniqueItems = []
      const itemIds = new Set()

      if (manuscripts && Array.isArray(manuscripts)) {
        for (const manuscript of manuscripts) {
          if (manuscript && manuscript.id) {
            if (!itemIds.has(manuscript.id)) {
              itemIds.add(manuscript.id)
              // 将稿件数据转换为视频卡片格式（兼容现有UI）
              uniqueItems.push({
                id: manuscript.firstVideoId || manuscript.id, // 使用第一个视频ID用于跳转
                title: manuscript.title,
                coverUrl: manuscript.coverUrl,
                viewCount: manuscript.viewCount || 0,
                commentCount: manuscript.commentCount || 0,
                uploadTime: manuscript.uploadTime,
                uploader: manuscript.uploader, // 添加上传者信息
                duration: manuscript.duration, // 添加视频时长
                // 保留稿件原始数据
                manuscriptId: manuscript.id,
                manuscript: manuscript
              })
            }
          }
        }
      }

      videoList.value = uniqueItems

      // 标记视频列表已经加载过
      hasLoadedVideos.value = true
    }
  } catch (error) {
    console.error('获取稿件列表失败:', error)
  } finally {
    loading.value = false
    // 视频列表加载完成后，调整轮播图高度
    adjustBannerHeight()
  }
}

// 从API获取轮播图数据
const fetchBannerList = async () => {
  try {
    const res = await getHomeBanners()
    if (res.code === 200 && res.data && res.data.length > 0) {
      bannerList.value = res.data.map(banner => ({
        id: banner.id,
        img: banner.imageUrl,
        link: banner.linkUrl || '/',
        title: banner.title
      }))
    }
  } catch (error) {
    console.error('获取轮播图失败:', error)
  }
}

onMounted(() => {
  // 从API获取轮播图数据
  fetchBannerList()

  // 从API获取数据
  fetchVideoList()

  // 动态调整轮播图高度
  adjustBannerHeight()

  // 监听窗口大小变化，重新调整高度
  window.addEventListener('resize', adjustBannerHeight)
})

// 格式化日期，只显示月和日
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// 跳转到视频详情页（使用稿件ID）
const goToVideo = (item) => {
  // item.manuscriptId 是稿件ID
  if (item.manuscriptId) {
    window.location.href = `/manuscript/${item.manuscriptId}`
  } else {
    // 兼容旧数据
    window.location.href = `/manuscript/${item.id}`
  }
}

// 跳转到作者主页
const goToAuthor = (authorId) => {
  window.open(`/profile/${authorId}/home`, '_blank')
}

</script>

<template>
  <!-- 主内容区域：5列网格布局 -->
  <div class="main-section">
    <!-- 统一的视频网格：包含轮播图和视频项 -->
    <div class="video-grid">
      <!-- 左侧轮播图：占据2x2的位置 -->
      <section class="banner-section" v-if="bannerList.length > 0">
        <div class="banner-wrapper">
          <el-carousel ref="carouselRef" :autoplay="true" :interval="3000" arrow="never" indicator-position="none" @change="handleBannerChange">
            <el-carousel-item v-for="(banner, index) in bannerList" :key="banner.id">
              <a :href="banner.link" class="banner-item">
                <img :src="banner.img" alt="轮播图" class="banner-img">
              </a>
            </el-carousel-item>
          </el-carousel>
          <!-- 底部透明黑色区域：固定在底部，不随图片切换 -->
          <div class="banner-overlay">
            <div class="banner-content">
              <!-- 左边：标题和点位 -->
              <div class="banner-left">
                <h3 class="banner-title">{{ bannerList[currentBannerIndex]?.title }}</h3>
                <div class="banner-indicators">
                  <span
                    v-for="(item, i) in bannerList"
                    :key="i"
                    :class="['indicator', { active: i === currentBannerIndex }]"
                    @click="changeBanner(i)"
                  ></span>
                </div>
              </div>
              <!-- 右边：左右箭头 -->
              <div class="banner-right">
                <button class="arrow-btn arrow-prev" @click="prevBanner">
                  <el-icon><ArrowLeft /></el-icon>
                </button>
                <button class="arrow-btn arrow-next" @click="nextBanner">
                  <el-icon><ArrowRight /></el-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 视频项：只显示推荐视频列表 -->
      <div v-for="video in videoList" :key="video.id" class="video-item">
        <div class="video-cover">
          <a :href="'/manuscript/' + (video.manuscriptId || video.id)" class="video-cover-link">
            <img :src="video.coverUrl || 'https://via.placeholder.com/320x180?text=视频封面'" alt="视频封面">
          </a>
          <!-- 左下角：播放量和评论量 -->
          <div class="video-stats-overlay">
            <span class="stat-item">
              <el-icon><View /></el-icon>
              {{ video.viewCount ? video.viewCount.toLocaleString() : 0 }}
            </span>
            <span class="stat-item">
              <el-icon><Star /></el-icon>
              {{ video.commentCount || 0 }}
            </span>
          </div>
          <!-- 右下角：视频时长 -->
          <span class="video-duration">{{ video.duration || '00:00' }}</span>
        </div>
        <span class="video-title">
          <span class="video-title-text" @click="goToVideo(video)">{{ video.title }}</span>
        </span>
        <div class="video-meta">
          <span class="video-author" @click="goToAuthor(video.uploader?.id)">{{ video.uploader?.name }}</span>
          <span class="video-separator"> · </span>
          <span class="video-date">{{ formatDate(video.uploadTime) }}</span>
        </div>
      </div>
    </div>


  </div>
</template>

<style scoped>
/* 主内容区域：5列网格布局 */
.main-section {
  width: 100%;
  max-width: 1980px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;
  margin-bottom: 20px;
}

/* 热门视频区域 */
.hot-videos-section {
  max-width: 1980px;
  margin: 40px auto;
  padding: 0 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.title-icon {
  font-size: 24px;
  color: #fb7299;
}

.hot-videos-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.hot-video-item {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.rank-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  z-index: 10;
}

.rank-badge.top-three {
  background: #fb7299;
}

/* 统一的视频网格：5列布局，自动行 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: auto;
  gap: 20px;
  width: 100%;
}

/* 轮播图：占据2x2的位置 */
.banner-section {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  /* 默认最小高度，防止JS设置前高度为0 */
  min-height: 400px;
  height: auto;
}

.video-item {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.video-item:hover {
  transform: none;
  box-shadow: none;
}

.video-cover-link {
  text-decoration: none;
  color: inherit;
  display: inline-block;
}

.video-cover-link img {
  display: block;
}

.video-title {
  font-size: 15px;
  font-weight: 500;
  color: #212121;
  margin: 10px 10px 4px 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 42px; /* 固定两行高度：15px * 1.4 * 2 = 42px */
  flex: 0 0 auto;
  pointer-events: none; /* 外层不响应鼠标事件 */
}

.video-title-text {
  cursor: pointer;
  transition: color 0.3s;
  pointer-events: auto; /* 内层响应鼠标事件 */
}

.video-title-text:hover {
  color: #00aeec;
}

.video-meta {
  margin: 0 10px 6px 10px;
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

.video-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-cover:hover img {
  transform: scale(1.05);
  transition: transform 0.3s;
}

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

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: transparent;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.banner-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.banner-section :deep(.el-carousel) {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.banner-section :deep(.el-carousel__container) {
  height: 100%;
  flex: 1;
}

.banner-section :deep(.el-carousel__item) {
  height: 100%;
}

.banner-item {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  flex: 1;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0) 100%);
  padding: 20px;
  display: flex;
  align-items: flex-end;
  z-index: 10;
}

.banner-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
}

.banner-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.banner-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.banner-indicators {
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.indicator:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.indicator.active {
  background-color: #fff;
  transform: scale(1.2);
}

.banner-right {
  display: flex;
  gap: 10px;
}

.arrow-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.arrow-btn:hover {
  background-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.arrow-btn:active {
  transform: scale(0.95);
}

.arrow-btn .el-icon {
  font-size: 18px;
}

/* 响应式：调整左右白边 */
@media (max-width: 2560px) {
  .main-section,
  .hot-videos-section {
    padding-left: 120px;
    padding-right: 120px;
  }
}

@media (max-width: 2200px) {
  .main-section,
  .hot-videos-section {
    padding-left: 100px;
    padding-right: 100px;
  }
}

@media (max-width: 1920px) {
  .main-section,
  .hot-videos-section {
    padding-left: 80px;
    padding-right: 80px;
  }
}

@media (max-width: 1400px) {
  .main-section,
  .hot-videos-section {
    padding-left: 40px;
    padding-right: 40px;
  }

  .hot-videos-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1200px) {
  .main-section,
  .hot-videos-section {
    padding-left: 20px;
    padding-right: 20px;
  }

  .hot-videos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1000px) {
  .main-section,
  .hot-videos-section {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 768px) {
  .main-section,
  .hot-videos-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hot-videos-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .main-section,
  .hot-videos-section {
    padding-left: 12px;
    padding-right: 12px;
  }

  .section-title h2 {
    font-size: 18px;
  }
}

@media (max-width: 360px) {
  .main-section,
  .hot-videos-section {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>