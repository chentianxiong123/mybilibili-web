<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 当前登录用户信息
const currentUser = ref(JSON.parse(localStorage.getItem('user')) || null)

// 导航选项
const navItems = [
  { name: '首页', icon: 'Home', path: '/personal-center/home' },
  { name: '我的信息', icon: 'User', path: '/personal-center/info' },
  { name: '我的头像', icon: 'Avatar', path: '/personal-center/avatar' },
  { name: '个人空间', icon: 'UserFilled', path: 'space', special: true },
  { name: '创作中心', icon: 'Brush', path: '/create-center', special: true }
]

// 当前活跃的导航选项
const activeNav = computed(() => {
  return navItems.find(item => route.path === item.path)?.name || '首页'
})

// 处理导航点击
const handleNavClick = (item) => {
  if (item.special) {
    // 特殊处理：个人空间
    if (item.name === '个人空间') {
      if (currentUser.value && currentUser.value.id) {
        // 打开新标签页到用户主页
        const url = `${window.location.origin}/profile/${currentUser.value.id}/home`
        window.open(url, '_blank')
      } else {
        // 打开新标签页到登录页
        const url = `${window.location.origin}/login`
        window.open(url, '_blank')
      }
    } 
    // 特殊处理：创作中心
    else if (item.name === '创作中心') {
      // 打开新标签页到创作中心
      const url = `${window.location.origin}/create-center`
      window.open(url, '_blank')
    }
    // 其他特殊项
    else {
      router.push(item.path)
    }
  } else {
    router.push(item.path)
  }
}
</script>

<template>
  <div class="personal-center">
    <!-- 主内容区域 -->
    <div class="content-container">
      <!-- 左侧侧部导航栏 -->
      <div class="side-nav">
        <div class="nav-header">
          <h3>个人中心</h3>
        </div>
        <div class="nav-list">
          <div
            v-for="item in navItems"
            :key="item.name"
            :class="['nav-item', { active: activeNav === item.name }]"
            @click="handleNavClick(item)"
          >
            <el-icon class="nav-icon"><component :is="ElementPlusIconsVue[item.icon]" /></el-icon>
            <span class="nav-text">{{ item.name }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧主内容 -->
      <div class="main-content">
        <div class="content-header">
          <h2>{{ activeNav }}</h2>
        </div>
        <div class="content-body">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 个人中心整体样式 */
.personal-center {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* 主内容容器 */
.content-container {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 20px;
  display: flex;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 左侧侧部导航栏 */
.side-nav {
  width: 200px;
  min-width: 200px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px 0;
}

.nav-header {
  padding: 0 20px 15px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 15px;
}

.nav-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.nav-list {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.nav-item:hover {
  background-color: rgba(0, 174, 236, 0.1);
  color: #00aeec;
}

.nav-item.active {
  background-color: rgba(0, 174, 236, 0.1);
  color: #00aeec;
  border-left: 3px solid #00aeec;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  min-width: 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.content-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.content-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.content-body {
  min-height: 400px;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-container {
    flex-direction: column;
  }
  
  .side-nav {
    width: 100%;
    min-width: auto;
    margin-bottom: 20px;
  }
  
  .nav-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .nav-item {
    flex: 1;
    min-width: 120px;
    justify-content: center;
    border-left: none;
  }
  
  .nav-item.active {
    border-left: none;
    border-bottom: 3px solid #00aeec;
  }
}
</style>