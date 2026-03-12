<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-show="visible"
        ref="popoverRef"
        class="emoji-popover"
        :style="popoverStyle"
      >
        <div class="emoji-grid">
          <span
            v-for="emoji in emojiList"
            :key="emoji"
            class="emoji-item"
            @click="handleSelect(emoji)"
          >{{ emoji }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  triggerRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'select'])

const popoverRef = ref(null)
const popoverPosition = ref({ top: 0, left: 0 })

// 表情列表
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😜', '😝',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '👍', '👎', '👏', '🙌', '🤝', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍'
]

// 计算弹出框样式
const popoverStyle = computed(() => ({
  top: `${popoverPosition.value.top}px`,
  left: `${popoverPosition.value.left}px`
}))

// 计算位置
const calculatePosition = () => {
  if (!props.triggerRef || !popoverRef.value) return

  const triggerRect = props.triggerRef.getBoundingClientRect()
  const popoverRect = popoverRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // 默认显示在触发器下方
  let top = triggerRect.bottom + 8
  let left = triggerRect.left

  // 如果下方空间不足，显示在上方
  if (top + popoverRect.height > viewportHeight) {
    top = triggerRect.top - popoverRect.height - 8
  }

  // 如果右侧超出视口，向左对齐
  if (left + popoverRect.width > viewportWidth) {
    left = triggerRect.right - popoverRect.width
  }

  // 确保不超出左侧边界
  if (left < 8) {
    left = 8
  }

  popoverPosition.value = { top, left }
}

// 选择表情
const handleSelect = (emoji) => {
  emit('select', emoji)
  emit('update:visible', false)
}

// 点击外部关闭
const handleClickOutside = (event) => {
  if (
    popoverRef.value &&
    !popoverRef.value.contains(event.target) &&
    props.triggerRef &&
    !props.triggerRef.contains(event.target)
  ) {
    emit('update:visible', false)
  }
}

// 监听 visible 变化，显示时计算位置
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      calculatePosition()
    })
  }
})

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
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleScroll, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleScroll, true)
})
</script>

<style scoped>
.emoji-popover {
  position: fixed;
  z-index: 2000;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 280px;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
  user-select: none;
}

.emoji-item:hover {
  background: #f0f0f0;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
