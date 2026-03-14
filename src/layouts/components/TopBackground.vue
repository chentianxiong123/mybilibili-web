<script setup>
import { ref, onMounted } from 'vue'
import { getBackgroundImage } from '../../api/banner.js'

// 背景图数据
const backgroundImage = ref(null)

// 从API获取背景图数据
const fetchBackgroundImage = async () => {
  try {
    const res = await getBackgroundImage()
    if (res.code === 200 && res.data) {
      backgroundImage.value = res.data
    }
  } catch (error) {
    console.error('获取背景图失败:', error)
  }
}

onMounted(() => {
  fetchBackgroundImage()
})
</script>

<template>
  <div
    class="top-background"
    :style="backgroundImage ? {
      backgroundImage: `url(${backgroundImage.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } : {}"
  >
    <!-- 渐变遮罩层 -->
    <div class="gradient-overlay"></div>
  </div>
</template>

<style scoped>
.top-background {
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
  padding: 0 290px;
  box-sizing: border-box;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  pointer-events: none;
}

@media (max-width: 2560px) {
  .top-background {
    padding-left: 120px;
    padding-right: 120px;
  }
}

@media (max-width: 2200px) {
  .top-background {
    padding-left: 100px;
    padding-right: 100px;
  }
}

@media (max-width: 1920px) {
  .top-background {
    padding-left: 80px;
    padding-right: 80px;
  }
}

@media (max-width: 1400px) {
  .top-background {
    padding-left: 40px;
    padding-right: 40px;
  }
}

@media (max-width: 1200px) {
  .top-background {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 768px) {
  .top-background {
    padding-left: 16px;
    padding-right: 16px;
  }
}

@media (max-width: 480px) {
  .top-background {
    padding-left: 12px;
    padding-right: 12px;
  }
}

@media (max-width: 360px) {
  .top-background {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
