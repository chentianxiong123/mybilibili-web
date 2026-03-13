<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-show="visible"
        ref="cardRef"
        class="user-float-card"
        :style="cardStyle"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- 顶部背景图 -->
        <div class="card-header-bg">
          <img :src="userBanner || userInfo.banner || defaultBanner" alt="背景">
        </div>
        
        <!-- 用户信息区域 -->
        <div class="card-content">
          <!-- 用户头像和基本信息 -->
          <div class="user-basic-info">
            <img 
              :src="userInfo.avatar || defaultAvatar" 
              class="user-avatar-large"
              @click="goToUserProfile"
            >
            <div class="user-meta">
              <div class="user-name-row">
                <span class="user-name" @click="goToUserProfile">{{ userInfo.name || '未知用户' }}</span>
                <span v-if="userInfo.level" class="user-level">LV{{ userInfo.level }}</span>
              </div>
            </div>
          </div>
          
          <!-- 统计数据 -->
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-value">{{ formatNumber(userInfo.followingCount || 0) }}</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formatNumber(userInfo.followerCount || 0) }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formatNumber(userInfo.likeCount || 0) }}</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
          
          <!-- 个人简介 -->
          <div class="user-bio" :title="userInfo.bio || userInfo.signature">
            {{ userInfo.bio || userInfo.signature || '该用户暂无简介' }}
          </div>
          
          <!-- 操作按钮 -->
          <div class="card-actions">
            <el-button
              :type="isFollowing ? 'default' : 'primary'"
              class="follow-btn"
              @click="handleFollow"
              :loading="loadingFollow"
            >
              {{ isFollowing ? '已关注' : '+ 关注' }}
            </el-button>
            <el-button
              class="message-btn"
              @click="handleSendMessage"
            >
              发消息
            </el-button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '../api/index.js'
import { getUserProfileBackground } from '../api/banner.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  triggerRef: {
    type: Object,
    default: null
  },
  userInfo: {
    type: Object,
    default: () => ({})
  },
  placement: {
    type: String,
    default: 'bottom'
  },
  autoPlacement: {
    type: Boolean,
    default: false
  },
  // 新增：桥接区域元素引用
  bridgeRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'follow-change', 'mouseenter', 'mouseleave'])

const router = useRouter()
const cardRef = ref(null)
const cardPosition = ref({ top: 0, left: 0 })
const isFollowing = ref(false)
const loadingFollow = ref(false)
const hideTimer = ref(null)
const userBanner = ref('')

// 默认背景图和头像
const defaultBanner = 'https://picsum.photos/400/120?random=1'
const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'

// 获取用户背景图
const loadUserBanner = async () => {
  if (!props.userInfo.id) return
  try {
    const res = await getUserProfileBackground()
    if (res.code === 200 && res.data) {
      userBanner.value = res.data.imageUrl
    }
  } catch (error) {
    console.error('获取用户背景图失败:', error)
  }
}

// 计算卡片样式
const cardStyle = computed(() => ({
  top: `${cardPosition.value.top}px`,
  left: `${cardPosition.value.left}px`
}))

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 计算位置
const calculatePosition = () => {
  if (!props.triggerRef || !cardRef.value) return

  const triggerRect = props.triggerRef.getBoundingClientRect()
  const cardRect = cardRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let top = 0
  let left = 0

  // 自动判断位置模式 - 用于评论区头像，显示在头像右下方
  if (props.autoPlacement) {
    // 默认显示在头像的右下方（左侧与头像左侧对齐）
    left = triggerRect.left
    top = triggerRect.bottom + 8
    
    // 如果右侧空间不足，改为左对齐显示在左侧
    if (left + cardRect.width > viewportWidth - 8) {
      left = triggerRect.right - cardRect.width
      if (left < 8) left = 8
    }
    
    // 如果下方空间不足，显示在上方
    if (top + cardRect.height > viewportHeight - 8) {
      top = triggerRect.top - cardRect.height - 8
      if (top < 8) top = 8
    }
  } else {
    // 固定位置模式
    if (props.placement === 'bottom') {
      top = triggerRect.bottom + 8
      left = triggerRect.left + (triggerRect.width / 2) - (cardRect.width / 2)
    } else if (props.placement === 'top') {
      top = triggerRect.top - cardRect.height - 8
      left = triggerRect.left + (triggerRect.width / 2) - (cardRect.width / 2)
    } else if (props.placement === 'left') {
      top = triggerRect.top + (triggerRect.height / 2) - (cardRect.height / 2)
      left = triggerRect.left - cardRect.width - 8
    } else if (props.placement === 'right') {
      top = triggerRect.top + (triggerRect.height / 2) - (cardRect.height / 2)
      left = triggerRect.right + 8
    }
    
    // 边界检查
    if (left < 8) left = 8
    if (left + cardRect.width > viewportWidth - 8) {
      left = viewportWidth - cardRect.width - 8
    }
    if (top < 8) top = 8
    if (top + cardRect.height > viewportHeight - 8) {
      top = viewportHeight - cardRect.height - 8
    }
  }

  cardPosition.value = { top, left }
  
  // 更新桥接区域位置
  updateBridgePosition(triggerRect, top, left, cardRect.width)
}

// 更新桥接区域位置
const updateBridgePosition = (triggerRect, cardTop, cardLeft, cardWidth) => {
  if (!props.bridgeRef) return
  
  const isCardBelow = cardTop > triggerRect.bottom
  
  if (isCardBelow) {
    // 卡片在下方，桥接区域在头像下方
    props.bridgeRef.style.top = `${triggerRect.bottom}px`
    props.bridgeRef.style.left = `${triggerRect.left}px`
    props.bridgeRef.style.width = `${triggerRect.width}px`
    props.bridgeRef.style.height = '12px'
  } else {
    // 卡片在上方，桥接区域在头像上方
    props.bridgeRef.style.top = `${triggerRect.top - 12}px`
    props.bridgeRef.style.left = `${triggerRect.left}px`
    props.bridgeRef.style.width = `${triggerRect.width}px`
    props.bridgeRef.style.height = '12px'
  }
}

// 跳转到用户主页
const goToUserProfile = () => {
  if (props.userInfo.id) {
    window.open(`/profile/${props.userInfo.id}/home`, '_blank')
  }
  emit('update:visible', false)
}

// 处理关注
const handleFollow = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
  if (currentUser && currentUser.id === props.userInfo.id) {
    ElMessage.warning('无法关注自己')
    return
  }

  if (loadingFollow.value) return

  try {
    loadingFollow.value = true
    const response = await userApi.follow(props.userInfo.id, true)
    if (response.code === 200) {
      const isNowFollowing = response.data === '关注成功'
      isFollowing.value = isNowFollowing
      emit('follow-change', { userId: props.userInfo.id, isFollowing: isNowFollowing })
      ElMessage.success(isNowFollowing ? '关注成功' : '取消关注成功')
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    loadingFollow.value = false
  }
}

// 处理发消息
const handleSendMessage = () => {
  if (props.userInfo.id) {
    router.push(`/message?userId=${props.userInfo.id}`)
  }
  emit('update:visible', false)
}

// 鼠标进入卡片
const handleMouseEnter = () => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
    hideTimer.value = null
  }
  // 向上层传递鼠标进入事件
  emit('mouseenter')
}

// 鼠标离开卡片
const handleMouseLeave = () => {
  hideTimer.value = setTimeout(() => {
    emit('update:visible', false)
  }, 300)
  // 向上层传递鼠标离开事件
  emit('mouseleave')
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    isFollowing.value = props.userInfo.following || false
    loadUserBanner()
    nextTick(() => {
      calculatePosition()
    })
  }
})

// 监听userInfo变化
watch(() => props.userInfo, (newVal) => {
  if (newVal) {
    isFollowing.value = newVal.following || false
  }
}, { immediate: true })

// 监听窗口大小变化
const handleResize = () => {
  if (props.visible) {
    calculatePosition()
  }
}

// 监听滚动
const handleScroll = () => {
  if (props.visible) {
    emit('update:visible', false)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll, true)
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
  }
})
</script>

<style scoped>
.user-float-card {
  position: fixed;
  z-index: 3000;
  width: 360px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.card-header-bg {
  width: 100%;
  height: 100px;
  overflow: hidden;
}

.card-header-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 0 16px 16px;
}

.user-basic-info {
  display: flex;
  align-items: flex-end;
  margin-top: -25px;
  margin-bottom: 12px;
}

.user-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
  background: #fff;
}

.user-avatar-large:hover {
  transform: scale(1.05);
}

.user-meta {
  margin-left: 12px;
  margin-bottom: 5px;
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: color 0.3s ease;
}

.user-name:hover {
  color: #00a1d6;
}

.user-level {
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.user-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.user-bio {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.card-actions {
  display: flex;
  gap: 12px;
}

.follow-btn {
  flex: 1;
  height: 36px;
  font-size: 14px;
  font-weight: 500;
}

.follow-btn:deep(.el-button--primary) {
  background-color: #00a1d6;
  border-color: #00a1d6;
}

.follow-btn:deep(.el-button--primary:hover) {
  background-color: #0091c6;
  border-color: #0091c6;
}

.message-btn {
  flex: 1;
  height: 36px;
  font-size: 14px;
  font-weight: 500;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
