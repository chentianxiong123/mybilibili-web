<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  subtitles: {
    type: Array,
    default: () => []
  },
  currentTime: {
    type: Number,
    default: 0
  },
  enabled: {
    type: Boolean,
    default: true
  }
})

// 字幕设置
const subtitleSettings = ref({
  fontSize: 20,
  color: '#ffffff',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  borderRadius: 4,
  padding: '8px 16px',
  lineHeight: 1.5
})

// 拖拽相关 - 使用相对偏移量
const subtitleRef = ref(null)
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const initialOffsetX = ref(0)
const initialOffsetY = ref(0)

// 当前显示的字幕文本
const currentSubtitleText = computed(() => {
  if (!props.enabled || !props.subtitles || props.subtitles.length === 0) {
    return ''
  }

  const current = props.subtitles.find(item =>
    props.currentTime >= item.startTime && props.currentTime <= item.endTime
  )

  return current ? current.text : ''
})

// 字幕容器样式
const containerStyle = computed(() => ({
  transform: `translate(calc(-50% + ${offsetX.value}px), ${offsetY.value}px)`
}))

// 字幕文本样式
const textStyle = computed(() => ({
  fontSize: `${subtitleSettings.value.fontSize}px`,
  color: subtitleSettings.value.color,
  backgroundColor: subtitleSettings.value.backgroundColor,
  textShadow: subtitleSettings.value.textShadow,
  borderRadius: `${subtitleSettings.value.borderRadius}px`,
  padding: subtitleSettings.value.padding,
  lineHeight: subtitleSettings.value.lineHeight
}))

// 开始拖拽
const startDrag = (e) => {
  isDragging.value = true
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  startX.value = clientX
  startY.value = clientY
  initialOffsetX.value = offsetX.value
  initialOffsetY.value = offsetY.value
}

// 拖拽中
const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY
  
  // 计算偏移量
  const deltaX = clientX - startX.value
  const deltaY = clientY - startY.value
  
  offsetX.value = initialOffsetX.value + deltaX
  offsetY.value = initialOffsetY.value + deltaY
}

// 结束拖拽
const endDrag = () => {
  isDragging.value = false
}

// 更新设置
const updateSettings = (newSettings) => {
  subtitleSettings.value = { ...subtitleSettings.value, ...newSettings }
}

// 重置位置
const resetPosition = () => {
  offsetX.value = 0
  offsetY.value = 0
}

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
})

// 暴露方法给父组件
defineExpose({
  updateSettings,
  resetPosition,
  getSettings: () => subtitleSettings.value
})
</script>

<template>
  <div
    v-if="enabled && currentSubtitleText"
    ref="subtitleRef"
    class="subtitle-display"
    :class="{ 'is-dragging': isDragging }"
    :style="containerStyle"
  >
    <div
      class="subtitle-text"
      :style="textStyle"
      @mousedown="startDrag"
      @touchstart="startDrag"
      v-html="currentSubtitleText.replace(/\\n/g, '<br>')"
    ></div>
    <div class="drag-hint" v-if="isDragging">拖拽中</div>
  </div>
</template>

<style scoped>
.subtitle-display {
  position: relative;
  display: inline-block;
  z-index: 100;
  pointer-events: auto;
  max-width: 95%;
  text-align: center;
  user-select: none;
}

.subtitle-display.is-dragging {
  z-index: 1000;
}

.subtitle-text {
  display: inline-block;
  cursor: move;
  transition: opacity 0.2s ease;
  word-wrap: break-word;
  min-width: 100px;
}

.subtitle-text:hover {
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.subtitle-text:active {
  cursor: grabbing;
}

.drag-hint {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}
</style>
