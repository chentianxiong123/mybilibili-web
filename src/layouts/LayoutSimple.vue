<script setup>
import { inject } from 'vue'
import AppHeader from './components/AppHeader.vue'

const showLoginDialog = inject('showLoginDialog')

const handleShowLogin = () => {
  if (showLoginDialog) {
    showLoginDialog.value = true
  }
}

const handleLogout = () => {
  // 登出逻辑由 AppHeader 内部处理
}
</script>

<template>
  <div class="layout-simple">
    <!-- 顶部导航栏（白底模式） -->
    <AppHeader mode="white" @show-login="handleShowLogin" @logout="handleLogout" />
    
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
.layout-simple {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  max-width: 2560px;
  margin: 0 auto;
}

.layout-content {
  flex: 1;
  min-height: calc(100vh - 80px);
  padding-top: 80px; /* 为固定导航栏留出空间 */
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
