<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Edit } from '@element-plus/icons-vue'

const router = useRouter()

// 当前用户信息
const currentUser = ref(null)

// 用户信息
const userInfo = ref({
  nickname: '',
  avatar: '',
  level: 5,
  experience: 23894,
  maxExperience: 28800,
  memberType: '正式会员',
  coins: 0,
  wallet: 1942.8
})

// 经验进度百分比
const experiencePercent = computed(() => {
  return (userInfo.value.experience / userInfo.value.maxExperience) * 100
})

// 加载用户信息
onMounted(() => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      currentUser.value = JSON.parse(userData)
      // 填充用户信息
      userInfo.value.nickname = currentUser.value.nickname || currentUser.value.username || '未设置昵称'
      userInfo.value.avatar = currentUser.value.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
      userInfo.value.level = currentUser.value.level || 5
      userInfo.value.experience = currentUser.value.experience || 23894
      userInfo.value.memberType = currentUser.value.memberType || '正式会员'
      userInfo.value.coins = currentUser.value.coins || 0
      userInfo.value.wallet = currentUser.value.wallet || 1942.8
      
      console.log('当前用户:', currentUser.value)
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
})

// 跳转到修改资料页面
const goToEditProfile = () => {
  router.push('/personal-center/info')
}

// 跳转到个人空间页
const goToSpace = () => {
  if (currentUser.value && currentUser.value.id) {
    router.push(`/profile/${currentUser.value.id}/home`)
  }
}
</script>

<template>
  <div class="home-section">
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <!-- 头像 -->
      <div class="avatar-wrapper" @click="goToSpace" title="点击查看个人空间">
        <img :src="userInfo.avatar" alt="头像" class="user-avatar">
        <div class="avatar-overlay">
          <el-icon :size="24"><Edit /></el-icon>
        </div>
      </div>
      
      <!-- 用户信息 -->
      <div class="user-info">
        <!-- 用户名和会员类型 -->
        <div class="user-header">
          <div class="left-section">
            <span class="nickname">{{ userInfo.nickname }}</span>
            <span class="member-badge">{{ userInfo.memberType }}</span>
            <el-icon class="level-icon" :size="24">
              <User />
            </el-icon>
          </div>
        </div>
        
        <!-- 等级进度条 -->
        <div class="level-section">
          <div class="level-bar">
            <div class="level-label">LV{{ userInfo.level }}</div>
            <div class="progress-container">
              <div class="progress-bar" :style="{ width: experiencePercent + '%' }"></div>
            </div>
            <div class="experience-text">{{ userInfo.experience }} / {{ userInfo.maxExperience }}</div>
          </div>
        </div>
        
        <!-- 硬币和钱包 -->
        <div class="coins-section">
          <div class="coin-item">
            <span class="coin-icon-b">B</span>
            <span class="coin-value">{{ userInfo.coins }}</span>
          </div>
          <div class="coin-item">
            <span class="coin-icon-w">币</span>
            <span class="coin-value">{{ userInfo.wallet }}</span>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button class="edit-btn" @click="goToEditProfile">
          修改资料
        </el-button>
        <el-button class="space-btn" @click="goToSpace">
          个人空间
          <el-icon><Edit /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-section {
  padding: 0;
  width: 100%;
  height: 100%;
}

.user-card {
  display: flex;
  align-items: flex-start;
  gap: 30px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 头像 */
.avatar-wrapper {
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.avatar-overlay .el-icon {
  color: #fff;
}

.avatar-wrapper:hover .user-avatar {
  filter: brightness(0.8);
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

/* 用户信息 */
.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.user-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nickname {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.member-badge {
  padding: 4px 12px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.level-icon {
  color: #00aeec;
}

/* 等级进度条 */
.level-section {
  width: 100%;
}

.level-bar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.level-label {
  background-color: #ff8547;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
}

.progress-container {
  flex: 1;
  height: 20px;
  background-color: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
  max-width: 400px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #ff8547, #ff9f6b);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.experience-text {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* 硬币和钱包 */
.coins-section {
  display: flex;
  gap: 20px;
}

.coin-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coin-icon-b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #ffd700;
  color: #333;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.coin-icon-w {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #00aeec;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.coin-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.edit-btn,
.space-btn {
  height: 36px;
  padding: 0 20px;
  border: 1px solid #e4e7ed;
  background-color: #fff;
  color: #606266;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.3s;
}

.edit-btn:hover,
.space-btn:hover {
  border-color: #00aeec;
  color: #00aeec;
}

.space-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-card {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  
  .user-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .left-section {
    flex-wrap: wrap;
  }
  
  .level-bar {
    flex-wrap: wrap;
  }
  
  .progress-container {
    max-width: 100%;
  }
  
  .coins-section {
    flex-wrap: wrap;
  }
  
  .action-buttons {
    width: 100%;
  }
  
  .edit-btn,
  .space-btn {
    flex: 1;
  }
}
</style>
