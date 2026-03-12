<template>
  <div class="comment-system">
    <!-- 评论列表区 -->
    <div class="comment-list-section">
      <div class="comment-list-header">
        <span class="comment-count">{{ totalCommentAndReplyCount }} 条评论</span>
        <div class="sort-options">
          <span
            :class="{ active: sortType === 'hot' }"
            @click="sortType = 'hot'"
          >最热</span>
          <span
            :class="{ active: sortType === 'time' }"
            @click="sortType = 'time'"
          >最新</span>
        </div>
      </div>

      <!-- 评论输入区 -->
      <div class="comment-input-section" ref="commentInputWrapper">
        <div class="comment-input-header">
          <img :src="currentUserAvatar" alt="" class="user-avatar">
          <div class="input-wrapper" :class="{ 'collapsed': isInputCollapsed && !newComment }">
            <textarea
              v-model="newComment"
              class="comment-textarea"
              :placeholder="placeholder"
              @focus="isInputCollapsed = false"
              @keydown="handleKeydown"
            ></textarea>
            <div class="input-actions" v-show="!isInputCollapsed || newComment">
              <div ref="emojiBtnRef" class="emoji-btn" @click="toggleEmojiPicker">
                <el-icon><ChatDotRound /></el-icon>
                <span>表情</span>
              </div>
              <EmojiPopover
                v-model:visible="showEmojiPicker"
                :trigger-ref="emojiBtnRef"
                @select="selectEmoji"
              />
              <div class="submit-btn" :class="{ 'active': newComment.trim() }" @click="submitComment">
                发表评论
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="comment-list" v-loading="loading">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <!-- 评论内容 -->
          <div class="comment-main">
            <img :src="comment.userAvatar || defaultAvatar" alt="" class="comment-avatar" @click="goToUser(comment.userId)">
            <div class="comment-content">
              <div class="comment-user" @click="goToUser(comment.userId)">{{ comment.userName }}</div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-meta">
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                <span class="comment-actions">
                  <span class="action-btn" :class="{ liked: comment.liked }" @click="likeComment(comment)">
                    <el-icon><Star /></el-icon>
                  </span>
                  <span class="action-btn" :class="{ disliked: comment.disliked }" @click="dislikeComment(comment)">
                    <el-icon><ArrowDown /></el-icon>
                  </span>
                  <span class="action-btn" @click="showReplyInput(comment)">
                    <el-icon><ChatDotRound /></el-icon>
                    回复
                  </span>
                </span>
              </div>

              <!-- 回复输入框 -->
              <div v-if="replyTarget?.commentId === comment.id && !replyTarget?.replyId" class="reply-input-wrapper">
                <textarea
                  v-model="replyContent"
                  class="reply-textarea"
                  :placeholder="`回复 ${comment.userName}:`"
                  @keydown="handleReplyKeydown"
                ></textarea>
                <div class="reply-actions">
                  <span class="cancel-btn" @click="cancelReply">取消</span>
                  <span class="submit-btn" :class="{ 'active': replyContent.trim() }" @click="submitReply(comment)">
                    发表回复
                  </span>
                </div>
              </div>

              <!-- 回复列表 -->
              <div v-if="comment.replies && comment.replies.length > 0" class="reply-list">
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="reply-item"
                >
                  <img :src="reply.userAvatar || defaultAvatar" alt="" class="reply-avatar" @click="goToUser(reply.userId)">
                  <div class="reply-content">
                    <div class="reply-user">
                      <span @click="goToUser(reply.userId)">{{ reply.userName }}</span>
                      <span v-if="reply.replyToUserName" class="reply-to">
                        回复 <span @click="goToUser(reply.replyToUserId)">{{ reply.replyToUserName }}</span>
                      </span>
                    </div>
                    <div class="reply-text">{{ reply.content }}</div>
                    <div class="reply-meta">
                      <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                      <span class="reply-actions">
                        <span class="action-btn" :class="{ liked: reply.liked }" @click="likeReply(reply)">
                          <el-icon><Star /></el-icon>
                        </span>
                        <span class="action-btn" :class="{ disliked: reply.disliked }" @click="dislikeReply(reply)">
                          <el-icon><ArrowDown /></el-icon>
                        </span>
                        <span class="action-btn" @click="showReplyToReply(comment, reply)">
                          回复
                        </span>
                      </span>
                    </div>

                    <!-- 回复的回复输入框 -->
                    <div v-if="replyTarget?.replyId === reply.id" class="reply-input-wrapper nested">
                      <textarea
                        v-model="replyContent"
                        class="reply-textarea"
                        :placeholder="`回复 ${reply.userName}:`"
                        @keydown="handleReplyKeydown"
                      ></textarea>
                      <div class="reply-actions">
                        <span class="cancel-btn" @click="cancelReply">取消</span>
                        <span class="submit-btn" :class="{ 'active': replyContent.trim() }" @click="submitReplyToReply(comment, reply)">
                          发表回复
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 加载更多回复 -->
                <div v-if="comment.replyCount > 3" class="load-more-replies" @click="loadMoreReplies(comment)">
                  展开 {{ comment.replyCount - 3 }} 条回复
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多评论 -->
        <div v-if="hasMoreComments" class="load-more-comments" @click="loadMoreComments">
          加载更多评论
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && comments.length === 0" class="empty-comments">
          <el-icon :size="48"><ChatDotRound /></el-icon>
          <p>暂无评论，快来发表第一条评论吧~</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, ChatDotRound, ArrowDown } from '@element-plus/icons-vue'
import { commentApi } from '../api/index.js'
import EmojiPopover from './EmojiPopover.vue'

const props = defineProps({
  // 评论目标类型：'VIDEO' | 'DYNAMIC'
  targetType: {
    type: String,
    required: true,
    validator: (value) => ['VIDEO', 'DYNAMIC'].includes(value)
  },
  // 评论目标ID：manuscriptId 或 dynamicId
  targetId: {
    type: Number,
    required: true
  },
  // 输入框占位符
  placeholder: {
    type: String,
    default: '发一条友善的评论吧~'
  },
  // 外部传入的总评论数
  totalCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:totalCount'])

const router = useRouter()

// 当前用户信息
const currentUser = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const currentUserAvatar = computed(() => {
  return currentUser.value?.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
})

const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'

// 评论列表数据
const comments = ref([])
const loading = ref(false)
const totalComments = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const hasMoreComments = ref(false)
const sortType = ref('hot') // 'hot' | 'time'

// 评论输入
const newComment = ref('')
const isInputCollapsed = ref(true)
const commentInputWrapper = ref(null)
const showEmojiPicker = ref(false)
const emojiBtnRef = ref(null)

// 回复相关
const replyTarget = ref(null) // { commentId, replyId, replyToUserId, replyToUserName }
const replyContent = ref('')

// 计算评论和回复的总数
const totalCommentAndReplyCount = computed(() => {
  let count = comments.value.length
  comments.value.forEach(comment => {
    if (comment.replies) {
      count += comment.replies.length
    }
  })
  return count
})

// 监听总数变化，通知父组件
watch(totalCommentAndReplyCount, (newVal) => {
  emit('update:totalCount', newVal)
})

// 获取评论列表
const fetchComments = async (page = 1) => {
  loading.value = true
  try {
    const res = await commentApi.getComments(
      props.targetType,
      props.targetId,
      page,
      pageSize.value
    )
    if (res.code === 200) {
      if (page === 1) {
        comments.value = res.data || []
      } else {
        comments.value.push(...(res.data || []))
      }
      hasMoreComments.value = (res.data || []).length === pageSize.value
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    ElMessage.error('获取评论失败')
  } finally {
    loading.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const res = await commentApi.postComment(
      props.targetType,
      props.targetId,
      newComment.value
    )
    if (res.code === 200) {
      // 将新评论添加到列表开头
      comments.value.unshift({
        ...res.data,
        replies: []
      })
      totalComments.value++
      newComment.value = ''
      isInputCollapsed.value = true
      showEmojiPicker.value = false
      ElMessage.success('评论发表成功')
    } else {
      ElMessage.error(res.message || '评论发表失败')
    }
  } catch (error) {
    console.error('评论发表失败:', error)
    ElMessage.error('评论发表失败，请稍后重试')
  }
}

// 显示回复输入框
const showReplyInput = (comment) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }
  replyTarget.value = { commentId: comment.id }
  replyContent.value = ''
}

// 显示回复的回复输入框
const showReplyToReply = (comment, reply) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }
  replyTarget.value = {
    commentId: comment.id,
    replyId: reply.id,
    replyToUserId: reply.userId,
    replyToUserName: reply.userName
  }
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyTarget.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = async (comment) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }

  try {
    const res = await commentApi.replyComment(
      comment.id,
      replyContent.value,
      null // 回复评论本身，不是回复某个用户
    )
    if (res.code === 200) {
      // 添加回复到列表
      if (!comment.replies) {
        comment.replies = []
      }
      comment.replies.push(res.data)
      comment.replyCount = (comment.replyCount || 0) + 1
      cancelReply()
      ElMessage.success('回复成功')
    } else {
      ElMessage.error(res.message || '回复失败')
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败，请稍后重试')
  }
}

// 提交回复的回复
const submitReplyToReply = async (comment, reply) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }

  try {
    const res = await commentApi.replyComment(
      comment.id,
      replyContent.value,
      replyTarget.value.replyToUserId
    )
    if (res.code === 200) {
      // 添加回复到列表
      if (!comment.replies) {
        comment.replies = []
      }
      comment.replies.push(res.data)
      comment.replyCount = (comment.replyCount || 0) + 1
      cancelReply()
      ElMessage.success('回复成功')
    } else {
      ElMessage.error(res.message || '回复失败')
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败，请稍后重试')
  }
}

// 点赞评论
const likeComment = async (comment) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (comment.liked) {
      const res = await commentApi.unlikeComment(comment.id)
      if (res.code === 200) {
        comment.likeCount = Math.max(0, comment.likeCount - 1)
        comment.liked = false
      }
    } else {
      const res = await commentApi.likeComment(comment.id)
      if (res.code === 200) {
        comment.likeCount = (comment.likeCount || 0) + 1
        comment.liked = true
        // 取消倒赞状态
        if (comment.disliked) {
          comment.disliked = false
          comment.dislikeCount = Math.max(0, (comment.dislikeCount || 0) - 1)
        }
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 倒赞评论
const dislikeComment = async (comment) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (comment.disliked) {
      const res = await commentApi.unlikeComment(comment.id)
      if (res.code === 200) {
        comment.dislikeCount = Math.max(0, (comment.dislikeCount || 0) - 1)
        comment.disliked = false
      }
    } else {
      const res = await commentApi.likeComment(comment.id)
      if (res.code === 200) {
        comment.dislikeCount = (comment.dislikeCount || 0) + 1
        comment.disliked = true
        // 取消点赞状态
        if (comment.liked) {
          comment.liked = false
          comment.likeCount = Math.max(0, comment.likeCount - 1)
        }
      }
    }
  } catch (error) {
    console.error('倒赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 点赞回复
const likeReply = async (reply) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (reply.liked) {
      const res = await commentApi.unlikeReply(reply.id)
      if (res.code === 200) {
        reply.likeCount = Math.max(0, reply.likeCount - 1)
        reply.liked = false
      }
    } else {
      const res = await commentApi.likeReply(reply.id)
      if (res.code === 200) {
        reply.likeCount = (reply.likeCount || 0) + 1
        reply.liked = true
        // 取消倒赞状态
        if (reply.disliked) {
          reply.disliked = false
          reply.dislikeCount = Math.max(0, (reply.dislikeCount || 0) - 1)
        }
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 倒赞回复
const dislikeReply = async (reply) => {
  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (reply.disliked) {
      const res = await commentApi.unlikeReply(reply.id)
      if (res.code === 200) {
        reply.dislikeCount = Math.max(0, (reply.dislikeCount || 0) - 1)
        reply.disliked = false
      }
    } else {
      const res = await commentApi.likeReply(reply.id)
      if (res.code === 200) {
        reply.dislikeCount = (reply.dislikeCount || 0) + 1
        reply.disliked = true
        // 取消点赞状态
        if (reply.liked) {
          reply.liked = false
          reply.likeCount = Math.max(0, reply.likeCount - 1)
        }
      }
    }
  } catch (error) {
    console.error('倒赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 加载更多回复
const loadMoreReplies = async (comment) => {
  try {
    const res = await commentApi.getRepliesByCommentId(
      comment.id,
      1,
      comment.replyCount
    )
    if (res.code === 200) {
      comment.replies = res.data || []
    }
  } catch (error) {
    console.error('获取回复失败:', error)
    ElMessage.error('获取回复失败')
  }
}

// 加载更多评论
const loadMoreComments = () => {
  currentPage.value++
  fetchComments(currentPage.value)
}

// 表情选择
const selectEmoji = (emoji) => {
  newComment.value += emoji
}

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}

// 键盘事件
const handleKeydown = (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    submitComment()
  }
}

const handleReplyKeydown = (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    if (replyTarget.value?.replyId) {
      // 找到对应的 comment 和 reply
      const comment = comments.value.find(c => c.id === replyTarget.value.commentId)
      const reply = comment?.replies?.find(r => r.id === replyTarget.value.replyId)
      if (comment && reply) {
        submitReplyToReply(comment, reply)
      }
    } else {
      const comment = comments.value.find(c => c.id === replyTarget.value?.commentId)
      if (comment) {
        submitReply(comment)
      }
    }
  }
}

// 点击外部折叠输入框
const handleClickOutside = (event) => {
  if (commentInputWrapper.value && !commentInputWrapper.value.contains(event.target)) {
    if (!newComment.value) {
      isInputCollapsed.value = true
    }
  }
}

// 跳转到用户主页
const goToUser = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`)
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  }
  // 小于24小时
  if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  }
  // 小于7天
  if (diff < 604800000) {
    return Math.floor(diff / 86400000) + '天前'
  }
  // 显示具体日期
  return date.toLocaleDateString('zh-CN')
}

// 监听目标变化，重新加载评论
const loadComments = () => {
  currentPage.value = 1
  fetchComments(1)
}

// 暴露方法给父组件
defineExpose({
  loadComments
})

onMounted(() => {
  fetchComments()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.comment-system {
  width: 100%;
}

/* 评论列表区 */
.comment-list-section {
  margin-top: 0;
}

.comment-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.comment-count {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.sort-options {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.sort-options span {
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.sort-options span:hover,
.sort-options span.active {
  color: #00aeec;
}

/* 评论输入区 */
.comment-input-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.comment-input-header {
  display: flex;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.input-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s;
}

.input-wrapper.collapsed {
  padding: 8px 12px;
}

.comment-textarea {
  width: 100%;
  min-height: 60px;
  border: none;
  outline: none;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  background: transparent;
}

.input-wrapper.collapsed .comment-textarea {
  min-height: 24px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.emoji-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  cursor: pointer;
  font-size: 13px;
}

.emoji-btn:hover {
  color: #00aeec;
}

.submit-btn {
  padding: 6px 16px;
  background: #ccc;
  color: #fff;
  border-radius: 4px;
  font-size: 13px;
  cursor: not-allowed;
  transition: all 0.3s;
}

.submit-btn.active {
  background: #00aeec;
  cursor: pointer;
}

.submit-btn.active:hover {
  background: #0099d4;
}

/* 评论项 */
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
}

.comment-content {
  flex: 1;
}

.comment-user {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  cursor: pointer;
}

.comment-user:hover {
  color: #00aeec;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
}

.comment-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.comment-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.3s;
}

.action-btn:hover {
  color: #00aeec;
}

.action-btn.liked {
  color: #00aeec;
}

.action-btn.disliked {
  color: #ff2442;
}

/* 回复输入框 */
.reply-input-wrapper {
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.reply-input-wrapper.nested {
  margin-top: 8px;
}

.reply-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  resize: vertical;
  font-size: 13px;
  background: #fff;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.cancel-btn {
  padding: 4px 12px;
  color: #666;
  cursor: pointer;
  font-size: 13px;
}

.cancel-btn:hover {
  color: #333;
}

/* 回复列表 */
.reply-list {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.reply-item {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
}

.reply-content {
  flex: 1;
}

.reply-user {
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
}

.reply-user span {
  cursor: pointer;
}

.reply-user span:hover {
  color: #00aeec;
}

.reply-to {
  color: #999;
  margin-left: 4px;
}

.reply-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
}

.reply-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.reply-actions {
  display: flex;
  gap: 8px;
}

/* 加载更多 */
.load-more-replies,
.load-more-comments {
  text-align: center;
  padding: 8px;
  color: #00aeec;
  font-size: 13px;
  cursor: pointer;
}

.load-more-replies:hover,
.load-more-comments:hover {
  color: #0099d4;
}

/* 空状态 */
.empty-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
  color: #999;
}

.empty-comments p {
  margin-top: 12px;
  font-size: 14px;
}

/* 评论主体布局 */
.comment-main {
  display: flex;
  gap: 12px;
  width: 100%;
}
</style>