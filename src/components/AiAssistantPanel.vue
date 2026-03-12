<script setup>
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Loading, MagicStick, DocumentCopy, RefreshRight } from '@element-plus/icons-vue'
import { aiSummaryApi } from '../api/aiSummary.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  videoId: {
    type: Number,
    required: true
  },
  videoTitle: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible'])

// 状态变量
const isLoading = ref(false)
const isGenerating = ref(false)
const summaryContent = ref('')
const errorMessage = ref('')
const hasSummary = ref(false)
const eventSource = ref(null)
const contentRef = ref(null)

// 监听面板显示状态
watch(() => props.visible, (newVal) => {
  if (newVal && props.videoId) {
    checkSummaryAndLoad()
  } else if (!newVal) {
    closeEventSource()
  }
})

// 检查摘要并加载
const checkSummaryAndLoad = async () => {
  isLoading.value = true
  errorMessage.value = ''
  summaryContent.value = ''
  
  try {
    const response = await aiSummaryApi.checkSummary(props.videoId)
    if (response.code === 200) {
      hasSummary.value = response.data
      if (hasSummary.value) {
        startStreamSummary()
      } else {
        errorMessage.value = '该视频暂无AI摘要，请稍后再试'
      }
    } else {
      errorMessage.value = response.message || '检查摘要状态失败'
    }
  } catch (error) {
    console.error('检查摘要失败:', error)
    errorMessage.value = '检查摘要状态失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 开始流式获取摘要
const startStreamSummary = () => {
  isGenerating.value = true
  summaryContent.value = ''
  errorMessage.value = ''
  
  closeEventSource()
  
  eventSource.value = aiSummaryApi.streamSummary(props.videoId, {
    onStart: (data) => {
      console.log('开始生成摘要:', data)
    },
    onData: (data) => {
      summaryContent.value += data
      scrollToBottom()
    },
    onMeta: (meta) => {
      console.log('元数据:', meta)
    },
    onDone: (data) => {
      console.log('摘要生成完成:', data)
      isGenerating.value = false
    },
    onError: (error) => {
      console.error('生成摘要错误:', error)
      errorMessage.value = error
      isGenerating.value = false
    }
  })
}

// 关闭SSE连接
const closeEventSource = () => {
  if (eventSource.value) {
    eventSource.value.abort()
    eventSource.value = null
  }
}

// 滚动到内容底部
const scrollToBottom = () => {
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight
    }
  })
}

// 关闭面板
const closePanel = () => {
  emit('update:visible', false)
  closeEventSource()
}

// 重新生成
const regenerate = () => {
  startStreamSummary()
}

// 复制摘要内容
const copySummary = () => {
  if (!summaryContent.value) return
  
  navigator.clipboard.writeText(summaryContent.value).then(() => {
    ElMessage.success('摘要已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 格式化摘要内容
const formatSummary = (content) => {
  if (!content) return ''
  
  let formatted = content
  
  // 高亮标题（【xxx】格式）
  formatted = formatted.replace(/【([^】]+)】/g, '<h4 class="summary-title">$1</h4>')
  
  // 高亮Markdown标题（### xxx格式）
  formatted = formatted.replace(/###\s*([^\n]+)/g, '<h4 class="summary-title">$1</h4>')
  
  // 高亮数字列表（1. xxx格式）
  formatted = formatted.replace(/(\d+)\.\s*([^\n]+)/g, '<div class="summary-item"><span class="item-number">$1.</span>$2</div>')
  
  // 最后将换行符转换为<br>标签
  formatted = formatted.replace(/\n/g, '<br>')
  
  return formatted
}
</script>

<template>
  <div class="ai-assistant-panel-wrapper">
    <!-- 遮罩层 -->
    <transition name="fade">
      <div 
        v-if="visible" 
        class="panel-overlay"
        @click="closePanel"
      ></div>
    </transition>
    
    <!-- 侧边面板 -->
    <transition name="slide-right">
      <div v-if="visible" class="ai-assistant-panel">
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-left">
            <el-icon class="ai-icon"><MagicStick /></el-icon>
            <div class="header-titles">
              <span class="title">AI视频助手</span>
              <span class="subtitle" v-if="videoTitle">{{ videoTitle }}</span>
            </div>
          </div>
          <el-button
            link
            class="close-btn"
            @click="closePanel"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <!-- 内容区域 -->
        <div class="panel-body">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-state">
            <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
            <p>正在检查视频摘要...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="errorMessage" class="error-state">
            <el-icon :size="48" class="error-icon">
              <CircleClose />
            </el-icon>
            <p>{{ errorMessage }}</p>
            <el-button type="primary" @click="checkSummaryAndLoad">重试</el-button>
          </div>

          <!-- 生成中状态 -->
          <div v-else-if="isGenerating && !summaryContent" class="generating-state">
            <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
            <p>AI正在分析视频内容...</p>
            <p class="sub-text">这可能需要几秒钟时间</p>
          </div>

          <!-- 摘要内容 -->
          <div v-else class="summary-content-wrapper">
            <div ref="contentRef" class="summary-content">
              <div class="summary-text-wrapper">
                <div class="summary-text" v-html="formatSummary(summaryContent)"></div>
                <span v-if="isGenerating" class="cursor">|</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="panel-footer" v-if="!isLoading && !errorMessage && summaryContent">
          <div class="footer-actions">
            <el-button
              v-if="!isGenerating"
              type="primary"
              size="small"
              :icon="DocumentCopy"
              @click="copySummary"
            >
              复制
            </el-button>
            <el-button
              v-if="!isGenerating"
              size="small"
              :icon="RefreshRight"
              @click="regenerate"
            >
              重新生成
            </el-button>
          </div>
          <div v-if="isGenerating" class="generating-hint">
            <el-icon class="typing-icon"><Loading /></el-icon>
            <span>正在生成...</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.ai-assistant-panel-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2000;
}

/* 遮罩层 */
.panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}

/* 侧边面板 */
.ai-assistant-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 420px;
  height: 100%;
  background-color: #fff;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

/* 头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.ai-icon {
  font-size: 24px;
  color: #00a1d6;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.subtitle {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}

.close-btn {
  font-size: 20px;
  color: #999;
  flex-shrink: 0;
}

.close-btn:hover {
  color: #666;
}

/* 内容区域 */
.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 加载状态 */
.loading-state,
.generating-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  flex: 1;
}

.loading-icon {
  color: #00a1d6;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.generating-state p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.sub-text {
  font-size: 12px;
  color: #999;
}

/* 错误状态 */
.error-state {
  color: #f56c6c;
}

.error-icon {
  color: #f56c6c;
}

.error-state p {
  color: #666;
  margin: 0;
}

/* 摘要内容 */
.summary-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.summary-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.summary-text-wrapper {
  display: flex;
  align-items: flex-start;
}

.summary-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.summary-text :deep(.summary-title) {
  font-size: 16px;
  font-weight: 600;
  color: #00a1d6;
  margin: 16px 0 8px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.summary-text :deep(.summary-title:first-child) {
  margin-top: 0;
}

.summary-text :deep(.summary-item) {
  margin: 8px 0;
  padding-left: 8px;
  line-height: 1.6;
}

.summary-text :deep(.item-number) {
  color: #00a1d6;
  font-weight: 600;
  margin-right: 8px;
}

.summary-text :deep(br) {
  display: block;
  content: "";
  margin-top: 8px;
}

/* 光标 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #00a1d6;
  animation: blink 1s infinite;
  vertical-align: text-bottom;
  margin-left: 2px;
  flex-shrink: 0;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 底部操作栏 */
.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background-color: #fff;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.generating-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #00a1d6;
  font-size: 13px;
}

.typing-icon {
  animation: rotate 1s linear infinite;
}

/* 滚动条样式 */
.summary-content::-webkit-scrollbar {
  width: 6px;
}

.summary-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.summary-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.summary-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
