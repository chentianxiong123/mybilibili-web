<script setup>
import { inject } from 'vue'
import TopBackground from './components/TopBackground.vue'
import CategoryTabs from './components/CategoryTabs.vue'
import AppHeader from './components/AppHeader.vue'

const showLoginDialog = inject('showLoginDialog')

const handleShowLogin = () => {
  if (showLoginDialog) {
    showLoginDialog.value = true
  }
}

const handleLogout = () => {
  // 登出逻辑由 AppHeader 内部处理，这里可以添加额外的全局处理
}
</script>

<template>
  <div class="layout-home">
    <!-- 顶部背景图 -->
    <TopBackground />
    
    <!-- 分区栏 -->
    <CategoryTabs />
    
    <!-- 顶部导航栏（透明模式） -->
    <AppHeader mode="transparent" @show-login="handleShowLogin" @logout="handleLogout" />
    
    <!-- 主内容区域 -->
    <div class="layout-content">
      <slot />
    </div>
    
    <!-- 底部 -->
    <footer class="app-footer">
      <p>© 2025 哔哩哔哩 (゜-゜)つロ 干杯~</p>
    </footer>
  </div>
</template>

<style scoped>
.layout-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  max-width: 2560px;
  margin: 0 auto;
}

.layout-content {
  flex: 1;
  min-height: calc(100vh - 80px);
  padding-top: 0;
}

/* 底部 */
.app-footer {
  height: 80px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e5e5e5;
  margin-top: 40px;
  font-size: 14px;
  color: #999;
}
</style>
