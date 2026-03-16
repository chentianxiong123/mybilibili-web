<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, View, Star } from '@element-plus/icons-vue'
import { videoApi } from '../api/index.js'
import { getCategoryBanners } from '../api/banner.js'

const route = useRoute()
const categoryId = ref(route.params.id)
const categoryName = ref('')

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

// 分类视频列表
const videoList = ref([])
// 标记是否已经加载过视频列表
const hasLoadedVideos = ref(false)
// 加载状态
const loading = ref(false)

// 动态设置轮播图高度，使其与第一行视频格子的下边对齐
const adjustBannerHeight = () => {
  nextTick(() => {
    // 获取第一行的video-item元素
    const videoItems = document.querySelectorAll('.video-item')
    if (videoItems.length > 0) {
      // 获取第一个video-item
      const firstItem = videoItems[0]
      const bannerSection = document.querySelector('.banner-section')

      if (firstItem && bannerSection) {
        // 计算第一行video-item的底部位置（相对于video-grid）
        const videoGrid = document.querySelector('.video-grid')
        const gridRect = videoGrid.getBoundingClientRect()
        const itemRect = firstItem.getBoundingClientRect()

        // banner-section的高度 = 第一行video-item的底部位置 - grid的顶部位置
        const bannerHeight = itemRect.bottom - gridRect.top
        bannerSection.style.height = `${bannerHeight}px`
      }
    }
  })
}

// 从后端API获取分类视频列表数据
const fetchVideoList = async () => {
  // 防止重复加载
  if (hasLoadedVideos.value) {
    console.log('视频列表已经加载过，跳过')
    return
  }
  
  loading.value = true
  try {
    console.log(`开始获取${categoryName.value}分类的视频列表`)
    let response
    // 根据分类ID选择不同的API
    if (categoryId.value === '0') {
      // 热门标签，获取热门视频
      response = await videoApi.getHotVideos()
    } else {
      // 普通分类，获取分类视频
      response = await videoApi.getVideosByCategoryId(categoryId.value)
    }
    console.log('视频响应:', response)
    if (response.code === 200) {
      const videos = response.data
      console.log('原始视频列表:', videos)
      console.log('原始视频数量:', videos ? videos.length : 0)
      
      // 清空现有视频列表
      videoList.value = []
      console.log('清空视频列表后:', videoList.value)
      
      // 添加去重逻辑
      const uniqueVideos = []
      const videoIds = new Set()
      
      if (videos && Array.isArray(videos)) {
        for (const video of videos) {
          console.log('处理视频:', video)
          if (video && video.id) {
            console.log('视频ID:', video.id)
            if (!videoIds.has(video.id)) {
              videoIds.add(video.id)
              uniqueVideos.push(video)
              console.log('添加视频:', video.id, video.title)
            } else {
              console.log('跳过重复视频:', video.id, video.title)
            }
          } else {
            console.log('跳过无效视频:', video)
          }
        }
      }
      
      console.log('去重后视频列表:', uniqueVideos)
      console.log('去重后视频数量:', uniqueVideos.length)
      
      videoList.value = uniqueVideos
      console.log('最终视频列表:', videoList.value)
      console.log('最终视频数量:', videoList.value.length)
      
      // 标记视频列表已经加载过
      hasLoadedVideos.value = true
      console.log('视频列表加载完成，标记为已加载')
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
  } finally {
    loading.value = false
    // 视频列表加载完成后，调整轮播图高度
    adjustBannerHeight()
  }
}

// 从API获取分类轮播图数据
const fetchCategoryBanners = async (catId) => {
  try {
    const res = await getCategoryBanners(catId)
    if (res.code === 200 && res.data && res.data.length > 0) {
      bannerList.value = res.data.map(banner => ({
        id: banner.id,
        img: banner.imageUrl,
        link: banner.linkUrl || '/',
        title: banner.title
      }))
    } else {
      bannerList.value = []
    }
  } catch (error) {
    console.error('获取分类轮播图失败:', error)
    bannerList.value = []
  }
}

// 格式化日期，只显示月和日
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// 跳转到稿件详情页
const goToVideo = (video) => {
  // 优先使用稿件ID
  const manuscriptId = video.manuscriptId || video.id
  window.location.href = `/manuscript/${manuscriptId}`
}

// 跳转到作者主页
const goToAuthor = (authorId) => {
  window.open(`/profile/${authorId}/home`, '_blank')
}

// 监听路由参数变化，当categoryId变化时重新加载数据
watch(() => route.params.id, (newId) => {
  if (newId) {
    categoryId.value = newId
    // 根据分类ID获取分类名称
    const categoryMap = {
      0: '热门',
      1: '动画',
      2: '番剧',
      3: '国创',
      4: '音乐',
      5: '舞蹈',
      6: '游戏',
      7: '知识',
      8: '科技',
      9: '运动',
      10: '汽车',
      11: '生活',
      12: '美食',
      13: '动物',
      14: '鬼畜',
      15: '时尚',
      16: '资讯',
      17: '娱乐',
      18: '影视',
      19: '纪录片',
      20: '电影',
      21: '电视剧',
      22: '综艺'
    }
    categoryName.value = categoryMap[categoryId.value] || '未知分类'

    console.log(`加载${categoryName.value}分类的视频列表`)

    // 重置加载状态
    hasLoadedVideos.value = false
    // 从API获取轮播图数据
    fetchCategoryBanners(newId)
    // 从API获取数据
    fetchVideoList()

    // DOM更新后调整轮播图高度
    nextTick(() => {
      adjustBannerHeight()
    })
  }
}, { immediate: true })

onMounted(() => {
  // 初始调整轮播图高度
  adjustBannerHeight()
  
  // 监听窗口大小变化，重新调整高度
  window.addEventListener('resize', adjustBannerHeight)
})
</script>

<template>
  <!-- 主内容区域：5列网格布局 -->
  <div class="main-section">
    <!-- 分类标题 -->
    <div class="category-header">
      <h1 class="category-title">{{ categoryName }}</h1>
    </div>
    
    <!-- 统一的视频网格：包含轮播图和视频项 -->
    <div class="video-grid">
      <!-- 左侧轮播图：占据2x1的位置（只占一行高度） -->
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
      
      <!-- 视频项：显示分类视频列表 -->
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

/* 分类标题 */
.category-header {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-title {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

/* 统一的视频网格：5列布局，自动行 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-auto-rows: auto;
  gap: 20px;
  width: 100%;
}

/* 轮播图：占据2x1的位置（只占一行高度） */
.banner-section {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  /* 默认高度，防止JS设置前高度为0 */
  min-height: 200px;
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
  .main-section {
    padding-left: 120px;
    padding-right: 120px;
  }
}

@media (max-width: 2200px) {
  .main-section {
    padding-left: 100px;
    padding-right: 100px;
  }
}

@media (max-width: 1920px) {
  .main-section {
    padding-left: 80px;
    padding-right: 80px;
  }
}

@media (max-width: 1400px) {
  .main-section {
    padding-left: 40px;
    padding-right: 40px;
  }
}

@media (max-width: 1200px) {
  .main-section {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 1000px) {
  .main-section {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 768px) {
  .main-section {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .category-title {
    font-size: 24px;
  }
  
  .banner-section {
    grid-column: 1 / 6;
    grid-row: 1 / 2;
  }
  
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .main-section {
    padding-left: 12px;
    padding-right: 12px;
  }
  
  .video-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 360px) {
  .main-section {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>