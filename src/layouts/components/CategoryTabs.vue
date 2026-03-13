<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, Bell, ArrowDown } from '@element-plus/icons-vue'
import { dynamicApi } from '@/api/dynamic.js'
import api from '@/api/index.js'

const router = useRouter()

const activeTab = ref('热门')
const hotTab = { name: '热门', special: true, id: 0 }
const dynamicTab = { name: '动态', special: true, id: -1 }

// 第一条动态的用户头像
const firstDynamicAvatar = ref('')
// 是否显示头像（false则显示默认图标），每次刷新页面随机决定
const showAvatar = ref(Math.random() > 0.5)

// 分类列表
const categories = ref([])

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await api.get('/category')
    if (res.code === 200 && res.data) {
      categories.value = res.data.map(cat => ({
        name: cat.name,
        id: cat.id
      }))
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 从数据库获取的分类标签（排除热门和动态）
const tabs = computed(() => {
  return categories.value.filter(cat => cat.id !== 0 && cat.id !== -1)
})

// 第一行显示的分类（前11个）
const firstRowTabs = computed(() => {
  return tabs.value.slice(0, 11)
})

// 第二行显示的分类（第12-21个，最多10个）
const secondRowTabs = computed(() => {
  return tabs.value.slice(11, 21)
})

// 更多分类（第22个及以后）
const moreTabs = computed(() => {
  return tabs.value.slice(21)
})

// 是否有更多分类
const hasMoreTabs = computed(() => {
  return moreTabs.value.length > 0
})

// 获取第一条动态的用户头像
const fetchFirstDynamicAvatar = async () => {
  try {
    const res = await dynamicApi.getDynamicList(1, 1)
    if (res.code === 200 && res.data && res.data.length > 0) {
      const firstDynamic = res.data[0]
      if (firstDynamic.user && firstDynamic.user.avatar) {
        firstDynamicAvatar.value = firstDynamic.user.avatar
      }
    }
  } catch (error) {
    console.error('获取动态头像失败:', error)
  }
}

// 跳转到动态页面
const handleDynamicTabClick = () => {
  activeTab.value = dynamicTab.name
  router.push('/dynamic')
}

onMounted(() => {
  // 获取头像（如果随机结果是显示头像）
  if (showAvatar.value) {
    fetchFirstDynamicAvatar()
  }
  // 获取分类列表
  fetchCategories()
})

const handleTabClick = (tab) => {
  activeTab.value = tab.name
  router.push(`/category/${tab.id}`)
}

const handleHotTabClick = () => {
  activeTab.value = hotTab.name
  router.push(`/category/${hotTab.id}`)
}
</script>

<template>
  <div class="tab-bar">
    <div class="tab-container">
      <div class="tabs-main-container">
        <!-- 动态独立标签 -->
      <div
        :class="['dynamic-tab', { 'active': activeTab === dynamicTab.name }]"
        @click="handleDynamicTabClick"
      >
        <div class="dynamic-icon">
          <img v-if="showAvatar && firstDynamicAvatar" :src="firstDynamicAvatar" alt="动态头像" class="dynamic-avatar-img">
          <el-icon v-else class="dynamic-default-icon"><Bell /></el-icon>
        </div>
        <span class="dynamic-text">{{ dynamicTab.name }}</span>
      </div>
      
      <!-- 热门独立标签 -->
      <div
        :class="['hot-tab', { 'active': activeTab === hotTab.name }]"
        @click="handleHotTabClick"
      >
        <el-icon class="hot-icon"><Star /></el-icon>
        <span class="hot-text">{{ hotTab.name }}</span>
      </div>
        
        <!-- 其他标签栏 -->
        <div class="tabs-wrapper">
          <div class="tabs-row">
            <div
              v-for="tab in firstRowTabs"
              :key="tab.id"
              :class="['tab-item', { 'active': activeTab === tab.name }]"
              @click="handleTabClick(tab)"
            >
              {{ tab.name }}
            </div>
          </div>
          <div class="tabs-row">
            <div
              v-for="tab in secondRowTabs"
              :key="tab.id"
              :class="['tab-item', { 'active': activeTab === tab.name }]"
              @click="handleTabClick(tab)"
            >
              {{ tab.name }}
            </div>
            <!-- 更多分类下拉 -->
            <el-dropdown v-if="hasMoreTabs" trigger="hover" popper-class="category-dropdown">
              <div
                :class="['tab-item', 'more-tab', { 'active': moreTabs.some(t => t.name === activeTab) }]"
              >
                更多<el-icon class="more-icon"><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="tab in moreTabs"
                    :key="tab.id"
                    :class="{ 'active': activeTab === tab.name }"
                    @click="handleTabClick(tab)"
                  >
                    {{ tab.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 标签栏 */
.tab-bar {
  background-color: transparent;
  position: relative;
  z-index: 10;
  width: 100%;
}

.tab-container {
  max-width: 2560px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  height: 100px;
  width: 100%;
  box-sizing: border-box;
  min-height: 100px;
  max-height: 100px;
}

/* 新容器：包裹热门标签和其他标签项 */
.tabs-main-container {
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: calc(2560px - 240px);
  padding: 0 120px;
  box-sizing: border-box;
}

/* 动态独立标签 */
.dynamic-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.dynamic-tab:hover {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: none;
}

.dynamic-tab:hover:not([style*="transform"]) {
  transform: none;
}

/* 动态标签悬浮效果 */
.dynamic-tab:hover .dynamic-icon {
  transform: scale(1.1);
}

.dynamic-tab:hover .dynamic-text {
  color: #00aeec;
  font-weight: 500;
}

.dynamic-tab.active {
  background-color: #fff;
}

.dynamic-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 4px;
  transition: all 0.3s ease;
  border-radius: 50%;
  background-color: #00aeec;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #00aeec;
  overflow: hidden;
}

.dynamic-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dynamic-default-icon {
  font-size: 20px;
  color: #fff;
}

.dynamic-text {
  font-size: 14px;
  font-weight: normal;
  color: #333;
  transition: color 0.3s ease;
}

/* 热门独立标签 */
.hot-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.hot-tab:hover {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: none;
}

.hot-tab:hover:not([style*="transform"]) {
  transform: none;
}

/* 新的悬浮效果 */
.hot-tab:hover .hot-icon {
  background-color: #ff6b9d;
  border-color: #ff6b9d;
  transform: scale(1.1);
}

.hot-tab:hover .hot-text {
  color: #fb7299;
  font-weight: 500;
}

.hot-tab.active {
  background-color: #fff;
}

.hot-icon {
  font-size: 36px;
  color: #fff;
  margin-bottom: 4px;
  transition: color 0.3s ease;
  border-radius: 50%;
  background-color: #fb7299;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fb7299;
}

.hot-text {
  font-size: 14px;
  font-weight: normal;
  color: #333;
  transition: color 0.3s ease;
}

/* 其他标签栏容器 */
.tabs-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

/* 标签行 */
.tabs-row {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  align-items: center;
  gap: 8px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

/* 普通标签 */
.tab-item {
  padding: 10px 32px;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex: 1 1 auto;
  background-color: #f5f5f5;
  min-width: 0;
  text-align: center;
  max-width: none;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-item:hover {
  background-color: #e0e0e0;
  color: #00a1d6;
}

.tab-item.active {
  background-color: #00a1d6;
  color: #fff;
}

/* 更多标签 */
.more-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.more-icon {
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 2560px) {
  .tab-container {
    padding-left: 0;
    padding-right: 0;
  }
  
  .tabs-main-container {
    padding-left: 120px;
    padding-right: 120px;
  }
}

@media (max-width: 2200px) {
  .tabs-main-container {
    padding-left: 100px;
    padding-right: 100px;
  }
  
  .tab-item {
    padding: 7px 20px;
    font-size: 14px;
  }
}

@media (max-width: 1920px) {
  .tabs-main-container {
    padding-left: 80px;
    padding-right: 80px;
  }
  
  .tab-item {
    padding: 6px 16px;
    font-size: 14px;
  }
}

@media (max-width: 1400px) {
  .tabs-main-container {
    padding-left: 40px;
    padding-right: 40px;
  }
  
  .tab-item {
    padding: 5px 14px;
    font-size: 13px;
  }
}

@media (max-width: 1200px) {
  .tabs-main-container {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .tab-item {
    padding: 5px 12px;
    font-size: 13px;
  }
}

@media (max-width: 1000px) {
  .tabs-main-container {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 768px) {
  .tabs-main-container {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .tab-item {
    padding: 2px 8px;
    font-size: 10px;
  }
  
  .dynamic-tab {
    width: 45px;
    height: 45px;
  }
  
  .dynamic-icon {
    width: 24px;
    height: 24px;
  }
  
  .dynamic-default-icon {
    font-size: 14px;
  }
  
  .dynamic-text {
    font-size: 9px;
  }
  
  .hot-tab {
    width: 45px;
    height: 45px;
  }
  
  .hot-icon {
    font-size: 16px;
  }
  
  .hot-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .tabs-main-container {
    padding-left: 12px;
    padding-right: 12px;
  }
  
  .tab-item {
    padding: 2px 6px;
    font-size: 9px;
  }
  
  .dynamic-tab {
    width: 40px;
    height: 40px;
  }
  
  .dynamic-icon {
    width: 20px;
    height: 20px;
  }
  
  .dynamic-default-icon {
    font-size: 12px;
  }
  
  .dynamic-text {
    font-size: 8px;
  }
  
  .hot-tab {
    width: 40px;
    height: 40px;
  }
  
  .hot-icon {
    font-size: 14px;
  }
  
  .hot-text {
    font-size: 8px;
  }
}

@media (max-width: 360px) {
  .tabs-main-container {
    padding-left: 8px;
    padding-right: 8px;
  }
  
  .tab-item {
    padding: 1px 4px;
    font-size: 8px;
  }
  
  .dynamic-tab {
    width: 35px;
    height: 35px;
  }
  
  .dynamic-icon {
    width: 18px;
    height: 18px;
  }
  
  .dynamic-default-icon {
    font-size: 10px;
  }
  
  .dynamic-text {
    font-size: 7px;
  }
  
  .hot-tab {
    width: 35px;
    height: 35px;
  }
  
  .hot-icon {
    font-size: 12px;
  }
  
  .hot-text {
    font-size: 7px;
  }
}
</style>

<style>
/* 下拉菜单样式 */
.category-dropdown .el-dropdown-menu {
  max-height: 400px;
  overflow-y: auto;
}

.category-dropdown .el-dropdown-menu__item.active {
  background-color: #00a1d6;
  color: #fff;
}
</style>
