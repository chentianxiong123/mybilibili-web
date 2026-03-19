<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const userId = ref(route.params.id)

// 用户信息
const userInfo = ref({
  name: '前端教程',
  avatar: 'https://i0.hdslb.com/bfs/face/1234567890abcdef1234567890abcdef12345678.jpg',
  cover: 'https://i0.hdslb.com/bfs/archive/abcdef1234567890abcdef1234567890abcdef123.jpg',
  fansCount: 123456,
  followCount: 456,
  videoCount: 78,
  description: '专注于前端技术分享，包括Vue、React、JavaScript等内容。'
})

// 视频分类标签
const videoTabs = ref([
  { name: '全部', id: 'all' },
  { name: '投稿', id: 'upload' },
  { name: '收藏', id: 'favorite' },
  { name: '历史', id: 'history' }
])

const activeTab = ref('all')

// 用户视频列表
const userVideos = ref([
  { id: 1, title: '【Vue3从入门到精通】零基础教学', cover: 'https://i0.hdslb.com/bfs/archive/1234567890abcdef.jpg', viewCount: 123456, likeCount: 8901, duration: '45:23' },
  { id: 2, title: '【Vue3】组合式API详解', cover: 'https://i0.hdslb.com/bfs/archive/abcdef1234567890.jpg', viewCount: 56789, likeCount: 4567, duration: '38:15' },
  { id: 3, title: '【Vue3】响应式系统原理', cover: 'https://i0.hdslb.com/bfs/archive/9876543210fedcba.jpg', viewCount: 34567, likeCount: 2345, duration: '25:30' },
  { id: 4, title: '【Vue3】组件开发最佳实践', cover: 'https://i0.hdslb.com/bfs/archive/1357924680acbdfe.jpg', viewCount: 45678, likeCount: 3456, duration: '42:18' },
  { id: 5, title: '【JavaScript高级】异步编程详解', cover: 'https://i0.hdslb.com/bfs/archive/2468135790bdface.jpg', viewCount: 56789, likeCount: 4567, duration: '35:29' },
  { id: 6, title: '【ES6+】新特性详解', cover: 'https://i0.hdslb.com/bfs/archive/3579246810cedfab.jpg', viewCount: 23456, likeCount: 1234, duration: '28:42' }
])

onMounted(() => {
  console.log(`加载用户${userId.value}的主页信息`)
})
</script>

<template>
  <div class="user-container">
    <!-- 用户头部信息 -->
    <div class="user-header">
      <!-- 封面图 -->
      <div class="user-cover">
        <img :src="userInfo.cover" alt="用户封面">
      </div>
      
      <!-- 用户信息卡片 -->
      <div class="user-info-card">
        <!-- 头像和名称 -->
        <div class="user-avatar-section">
          <img :src="userInfo.avatar" alt="用户头像" class="user-avatar">
          <div class="user-meta">
            <h1 class="user-name">{{ userInfo.name }}</h1>
            <div class="user-stats">
              <span class="stat-item">
                <span class="stat-value">{{ userInfo.fansCount.toLocaleString() }}</span>
                <span class="stat-label">粉丝</span>
              </span>
              <span class="stat-item">
                <span class="stat-value">{{ userInfo.followCount }}</span>
                <span class="stat-label">关注</span>
              </span>
              <span class="stat-item">
                <span class="stat-value">{{ userInfo.videoCount }}</span>
                <span class="stat-label">投稿</span>
              </span>
            </div>
          </div>
          
          <!-- 关注按钮 -->
          <el-button type="primary" class="follow-btn">+ 关注</el-button>
        </div>
        
        <!-- 用户描述 -->
        <div class="user-description">
          {{ userInfo.description }}
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content-section">
      <!-- 视频标签 -->
      <div class="video-tabs">
        <el-tabs v-model="activeTab" class="video-tabs-container">
          <el-tab-pane v-for="tab in videoTabs" :key="tab.id" :label="tab.name" :name="tab.id">
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 视频列表 -->
      <div class="video-list">
        <div v-for="video in userVideos" :key="video.id" class="video-item">
          <a :href="'/video/' + video.id" class="video-link">
            <div class="video-cover">
              <img :src="video.cover" alt="视频封面">
              <span class="video-duration">{{ video.duration }}</span>
            </div>
            <div class="video-info">
              <h3 class="video-title">{{ video.title }}</h3>
              <div class="video-stats">
                <el-icon><View /></el-icon>
                <span>{{ video.viewCount.toLocaleString() }}</span>
                <el-icon><Star /></el-icon>
                <span>{{ video.likeCount }}</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-container {
  width: 100%;
}

/* 用户头部信息 */
.user-header {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.user-cover {
  height: 200px;
  overflow: hidden;
}

.user-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info-card {
  padding: 20px;
}

.user-avatar-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-top: -60px;
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-meta {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 10px 0;
}

.user-stats {
  display: flex;
  gap: 30px;
  font-size: 14px;
  color: #999;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
}

.follow-btn {
  border-radius: 20px;
  padding: 5px 30px;
  font-size: 14px;
}

.user-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  padding-top: 20px;
  border-top: 1px solid #e5e5e5;
}

/* 内容区域 */
.content-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 视频标签 */
.video-tabs {
  border-bottom: 1px solid #e5e5e5;
}

.video-tabs-container {
  border-bottom: none;
}

/* 视频列表 */
.video-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 20px;
}

.video-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.video-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.video-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.video-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例 */
  overflow: hidden;
}

.video-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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

.video-info {
  padding: 12px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.video-stats {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.video-stats el-icon {
  font-size: 12px;
  margin-right: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-avatar-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .user-avatar {
    margin-top: -40px;
    width: 80px;
    height: 80px;
  }
  
  .user-stats {
    gap: 20px;
  }
  
  .video-list {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    padding: 15px;
  }
}
</style>