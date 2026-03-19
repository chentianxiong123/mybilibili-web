<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Artplayer from 'artplayer'
import ArtplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import { View, ChatDotRound, ArrowDown, Star, Share, Comment, Edit, MoreFilled, Promotion, CircleCheck, CircleClose, CirclePlus, Message, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { videoApi, commentApi, interactionApi, userApi } from '../api/index.js'
import { manuscriptApi } from '../api/manuscript.js'
import { recommendApi } from '../api/recommend.js'
import { watchHistoryApi } from '../api/watchHistory.js'
import SubtitleDisplay from '../components/SubtitleDisplay.vue'
import SubtitleUploader from '../components/SubtitleUploader.vue'
import UserFloatCard from '../components/UserFloatCard.vue'
import AiAssistantPanel from '../components/AiAssistantPanel.vue'
import { subtitleApi } from '../api/subtitle.js'

const route = useRoute()
const router = useRouter()

// 定义props - 从路由接收manuscriptId和p参数
const props = defineProps({
  manuscriptId: {
    type: String,
    required: true
  },
  p: {
    type: Number,
    default: 1
  }
})

// 当前稿件ID和分P - 从路由参数获取，确保响应式更新
const currentManuscriptId = ref(parseInt(route.params.id))
const currentP = ref(parseInt(route.query.p) || 1)

// 兼容旧代码 - videoId用于某些API调用
const videoId = ref(null)

// 稿件信息
const manuscriptInfo = ref({
  id: null,
  title: '',
  description: '',
  coverUrl: '',
  tags: [],
  videos: []
})

// 当前播放的视频分P索引
const currentVideoIndex = ref(0)

const videoInfo = ref({
  title: '',
  coverUrl: '',
  playUrl: '',
  playUrlHd: '',
  playUrlSd: '',
  playUrlLd: '',
  uploader: {
    name: '',
    avatar: '',
    bio: ''
  },
  viewCount: 0,
  likeCount: 0,
  dislikeCount: 0,
  coinCount: 0,
  collectCount: 0,
  shareCount: 0,
  commentCount: 0,
  duration: '00:00',
  uploadTime: '',
  description: '',
  watchingCount: 0,
  danmuLoadedCount: 0,
  tags: []
})

// 视频简介折叠状态
const isDescriptionCollapsed = ref(true)

// 弹幕列表
const danmuList = ref([])
// 弹幕加载状态
const loadingDanmus = ref(false)

// 弹幕列表折叠状态
const isDanmuListCollapsed = ref(false)



// 视频分P列表折叠状态
const isVideoPartsCollapsed = ref(false)

// 字幕相关
const subtitleList = ref([])
const currentSubtitle = ref(null)
const currentSubtitleContent = ref([])
const subtitleEnabled = ref(true)
const currentVideoTime = ref(0)
const subtitleUploaderRef = ref(null)
const subtitleDisplayRef = ref(null)
const subtitleSettingsVisible = ref(false)

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

// 更新字幕设置
const updateSubtitleSettings = (settings) => {
  subtitleSettings.value = { ...subtitleSettings.value, ...settings }
  if (subtitleDisplayRef.value) {
    subtitleDisplayRef.value.updateSettings(subtitleSettings.value)
  }
}

// 重置字幕位置
const resetSubtitlePosition = () => {
  if (subtitleDisplayRef.value) {
    subtitleDisplayRef.value.resetPosition()
  }
}

// 加载字幕列表
const loadSubtitles = async () => {
  try {
    console.log('[字幕] 开始加载字幕列表, videoId:', videoId.value)
    const response = await subtitleApi.getSubtitles(videoId.value)
    console.log('[字幕] 字幕列表响应:', response)
    if (response.code === 200) {
      subtitleList.value = response.data || []
      console.log('[字幕] 字幕列表:', subtitleList.value)
      // 如果有默认字幕，自动加载
      const defaultSub = subtitleList.value.find(sub => sub.isDefault)
      if (defaultSub) {
        console.log('[字幕] 加载默认字幕:', defaultSub.language)
        await loadSubtitleContent(defaultSub.language)
      } else if (subtitleList.value.length > 0) {
        console.log('[字幕] 加载第一个字幕:', subtitleList.value[0].language)
        await loadSubtitleContent(subtitleList.value[0].language)
      } else {
        console.log('[字幕] 没有可用字幕')
      }
    }
  } catch (error) {
    console.error('[字幕] 加载字幕列表失败:', error)
  }
}

// 加载指定语言字幕内容
const loadSubtitleContent = async (language) => {
  try {
    console.log('[字幕] 开始加载字幕内容, language:', language)
    const response = await subtitleApi.getSubtitle(videoId.value, language)
    console.log('[字幕] 字幕内容响应:', response)
    if (response.code === 200 && response.data) {
      currentSubtitle.value = response.data
      currentSubtitleContent.value = response.data.content || []
      console.log('[字幕] 字幕内容已加载, 条数:', currentSubtitleContent.value.length)
      console.log('[字幕] 第一条:', currentSubtitleContent.value[0])
      console.log('[字幕] 第二条:', currentSubtitleContent.value[1])
    } else {
      console.log('[字幕] 字幕内容为空')
    }
  } catch (error) {
    console.error('[字幕] 加载字幕内容失败:', error)
  }
}

// 切换字幕语言
const switchSubtitle = (language) => {
  loadSubtitleContent(language)
}

// 切换字幕显示/隐藏
const toggleSubtitle = () => {
  subtitleEnabled.value = !subtitleEnabled.value
}

// 打开字幕上传对话框
const openSubtitleUploader = () => {
  if (subtitleUploaderRef.value) {
    subtitleUploaderRef.value.openDialog()
  }
}

// 字幕上传成功回调
const handleSubtitleUploadSuccess = (subtitle) => {
  subtitleList.value.push(subtitle)
  loadSubtitleContent(subtitle.language)
}

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 处理内容中的@用户名，转换为超链接
const formatContentWithAtLinks = (content) => {
  if (!content) return ''
  // 匹配@用户名格式，支持中文、英文、数字和下划线
  const atRegex = /@([\u4e00-\u9fa5a-zA-Z0-9_]+)/g
  return content.replace(atRegex, '<a href="javascript:void(0)" class="user-link" onclick="window.open(\'/profile/\' + this.textContent.substring(1) + \'/home\', \'_blank\')">@$1</a>')
}

// 跳转到弹幕时间
const jumpToDanmuTime = (time) => {
  if (art) {
    art.currentTime = time
    console.log('跳转到时间:', time)
  }
}

// 切换弹幕列表折叠状态
const toggleDanmuList = () => {
  isDanmuListCollapsed.value = !isDanmuListCollapsed.value
}

// 切换视频分P列表折叠状态
const toggleVideoParts = () => {
  isVideoPartsCollapsed.value = !isVideoPartsCollapsed.value
}

// 切换视频简介折叠状态
const toggleDescription = () => {
  isDescriptionCollapsed.value = !isDescriptionCollapsed.value
}

// 处理发消息
const handleSendMessage = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  // 不能给自己发消息
  if (currentUser.value && currentUser.value.id === videoInfo.value.uploader.id) {
    ElMessage.warning('不能给自己发送消息')
    return
  }

  // 跳转到消息页面，带上对方用户ID
  router.push(`/message/private?userId=${videoInfo.value.uploader.id}`)
}

// 相关视频
const relatedVideos = ref([])
const loadingRelatedVideos = ref(false)

// 浏览历史记录相关
const watchProgress = ref(0)
const videoDuration = ref(0)
const hasRecordedHistory = ref(false)

// 加载相关视频
const loadRelatedVideos = async () => {
  if (!videoId.value) return
  
  loadingRelatedVideos.value = true
  try {
    const response = await recommendApi.getRelatedVideos(videoId.value, 8)
    if (response.code === 200) {
      relatedVideos.value = (response.data || []).map(video => ({
        id: video.videoId,
        manuscriptId: video.manuscriptId,
        title: video.title,
        cover: video.coverUrl,
        author: video.userName,
        authorId: video.userId,
        viewCount: video.viewCount || 0,
        commentCount: video.commentCount || 0,
        duration: video.duration || '00:00'
      }))
    }
  } catch (error) {
    console.error('加载相关视频失败:', error)
  } finally {
    loadingRelatedVideos.value = false
  }
}

// 记录浏览历史（退出视频时记录，包含最终进度和观看比例）
const recordWatchHistory = async () => {
  if (!videoId.value || hasRecordedHistory.value) return
  
  try {
    // 计算观看比例
    const progress = Math.floor(watchProgress.value || 0)
    const duration = Math.floor(videoDuration.value || 0)
    const watchRatio = duration > 0 ? (progress / duration) : 0
    
    await watchHistoryApi.recordWatchHistory(
      videoId.value,
      progress,
      currentManuscriptId.value,
      duration
    )
    hasRecordedHistory.value = true
    console.log('浏览历史记录成功', { progress, duration, watchRatio: (watchRatio * 100).toFixed(1) + '%' })
  } catch (error) {
    console.error('记录浏览历史失败:', error)
  }
}

// 处理视频时间更新，仅用于更新进度变量
const handleVideoTimeUpdate = () => {
  if (art) {
    watchProgress.value = art.currentTime || 0
    videoDuration.value = art.duration || 0
  }
}

// 评论列表
const comments = ref([])
// 评论加载状态
const loadingComments = ref(false)

// 回复输入框内容
const replyInputs = ref({})

// 回复目标信息
const replyTargets = ref({})

// 回复展开状态
const replyExpanded = ref({})

// 回复分页信息
const replyPage = ref({})

// 回复加载状态
const loadingReplies = ref({})

// 评论排序方式
const commentSort = ref('hot')

// 新评论输入
const newComment = ref('')

// 评论输入框引用
const commentInputWrapper = ref(null)

// 评论输入框折叠状态
const isCommentInputCollapsed = ref(true)

// 显示表情选择器
const showEmojiPicker = ref(false)

// 当前用户头像
const currentUserAvatar = ref(() => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return user?.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'
})

// 切换评论输入框折叠状态
const toggleCommentInput = () => {
  isCommentInputCollapsed.value = !isCommentInputCollapsed.value
}

// 处理点击外部区域折叠
const handleClickOutside = (event) => {
  if (commentInputWrapper.value && !commentInputWrapper.value.contains(event.target)) {
    isCommentInputCollapsed.value = true
    showEmojiPicker.value = false
  }
}

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

// 选择表情
const selectEmoji = (emoji) => {
  newComment.value += emoji
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  
  try {
    const response = await commentApi.postComment(videoId.value, newComment.value)
    console.log('评论API响应:', response)
    if (response.code === 200) {
      // 将新评论添加到列表开头
      comments.value.unshift({
        id: response.data.id,
        userId: response.data.userId,
        author: response.data.userName,
        avatar: response.data.userAvatar || currentUserAvatar.value,
        content: response.data.content,
        time: formatDate(response.data.createTime || new Date()),
        likeCount: response.data.likeCount || 0,
        isLiked: response.data.liked || false
      })
      videoInfo.value.commentCount++
      newComment.value = ''
      isCommentInputCollapsed.value = true
      showEmojiPicker.value = false
      ElMessage.success('评论发表成功')
    } else {
      ElMessage.error(response.message || '评论发表失败')
    }
  } catch (error) {
    console.error('评论发表失败:', error)
    ElMessage.error('评论发表失败，请稍后重试')
  }
}

// 点赞评论
const likeComment = async (commentId) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (!comment) return
  
  try {
    // 检查是否已经点赞
    if (comment.isLiked) {
      // 取消点赞
      const response = await commentApi.unlikeComment(commentId)
      if (response.code === 200) {
        comment.likeCount = Math.max(0, comment.likeCount - 1)
        comment.isLiked = false
        ElMessage.success('取消点赞成功')
      } else {
        ElMessage.error(response.message || '取消点赞失败')
      }
    } else {
      // 点赞
      const response = await commentApi.likeComment(commentId)
      if (response.code === 200) {
        comment.likeCount++
        comment.isLiked = true
        ElMessage.success('点赞成功')
      } else {
        ElMessage.error(response.message || '点赞失败')
      }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 点踩评论 - 暂时不实现，后端没有点踩接口
const dislikeComment = (commentId) => {
  console.log('点踩功能暂未实现')
  ElMessage.info('点踩功能暂未实现')
}

// 点赞回复
const likeReply = async (replyId) => {
  try {
    const response = await commentApi.likeReply(replyId)
    if (response.code === 200) {
      // 找到对应的回复并更新点赞数
      for (const comment of comments.value) {
        if (comment.replies) {
          const reply = comment.replies.find(r => r.id === replyId)
          if (reply) {
            reply.likeCount++
            reply.isLiked = true
            ElMessage.success('点赞成功')
            return
          }
        }
      }
    } else {
      ElMessage.error(response.message || '点赞失败')
    }
  } catch (error) {
    console.error('点赞回复失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 点踩回复
const dislikeReply = (replyId) => {
  try {
    // 找到对应的回复并更新点踩数
    for (const comment of comments.value) {
      if (comment.replies) {
        const reply = comment.replies.find(r => r.id === replyId)
        if (reply) {
          reply.dislikeCount = (reply.dislikeCount || 0) + 1
          ElMessage.success('点踩成功')
          return
        }
      }
    }
  } catch (error) {
    console.error('点踩回复失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 加载回复
const loadReplies = async (commentId, page = 1) => {
  try {
    loadingReplies.value[commentId] = true
    const response = await commentApi.getRepliesByCommentId(commentId, page, 7)
    if (response.code === 200) {
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        const formattedReplies = response.data.map(reply => ({
          id: reply.id,
          userId: reply.userId || reply.user?.id,
          author: reply.userName || reply.author || '未知用户',
          avatar: reply.userAvatar || reply.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff',
          content: reply.content,
          time: reply.time || formatDate(reply.createTime),
          likeCount: reply.likeCount || 0,
          dislikeCount: reply.dislikeCount || 0,
          isLiked: reply.liked || false,
          targetAuthor: reply.replyToUserName || reply.targetAuthor || reply.replyTo || reply.toUserName || null
        }))
        // 每次加载都替换回复列表，而不是追加，这样分页才能正确工作
        comment.replies = formattedReplies
        replyPage.value[commentId] = page
      }
    }
  } catch (error) {
    console.error('获取回复失败:', error)
    ElMessage.error('获取回复失败，请稍后重试')
  } finally {
    loadingReplies.value[commentId] = false
  }
}

// 切换回复展开状态
const toggleReplyExpanded = (commentId) => {
  replyExpanded.value[commentId] = !replyExpanded.value[commentId]
  if (replyExpanded.value[commentId]) {
    loadReplies(commentId, 1)
  }
}

// 回复评论
const replyComment = (commentId) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.showReplyInput = !comment.showReplyInput
    // 清空该评论的回复输入框
    replyInputs.value[commentId] = ''
    // 清空回复目标
    replyTargets.value[commentId] = null
    console.log('切换回复输入框:', commentId)
  }
}

// 回复其他回复
const replyToReply = (commentId, replyId, targetAuthor) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.showReplyInput = true
    // 清空该评论的回复输入框
    replyInputs.value[commentId] = ''
    // 设置回复目标
    replyTargets.value[commentId] = {
      replyId,
      targetAuthor
    }
    console.log('回复回复:', commentId, replyId, targetAuthor)
  }
}

// 提交回复
const submitReply = async (commentId) => {
  const replyContent = replyInputs.value[commentId]
  if (!replyContent || !replyContent.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  
  try {
    const targetAuthor = replyTargets.value[commentId] ? replyTargets.value[commentId].targetAuthor : null
    // 查找目标用户的ID
    let replyToUserId = null
    if (targetAuthor) {
      // 查找评论的作者
      const comment = comments.value.find(c => c.id === commentId)
      if (comment && comment.author === targetAuthor) {
        replyToUserId = comment.userId
      } else if (comment && comment.replies) {
        // 查找回复的作者
        const reply = comment.replies.find(r => r.author === targetAuthor)
        if (reply) {
          replyToUserId = reply.userId
        }
      }
    }
    
    console.log('回复目标作者:', targetAuthor)
    console.log('回复目标用户ID:', replyToUserId)
    
    const response = await commentApi.replyComment(commentId, replyContent, replyToUserId)
    if (response.code === 200) {
      // 清空输入框并隐藏
      replyInputs.value[commentId] = ''
      replyTargets.value[commentId] = null
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        comment.showReplyInput = false
        // 如果评论没有回复列表，初始化一个
        if (!comment.replies) {
          comment.replies = []
        }
        // 将新回复添加到列表
        const newReply = {
          id: response.data.id,
          userId: response.data.userId,
          author: response.data.userName || '未知用户',
          avatar: response.data.userAvatar || currentUserAvatar.value,
          content: response.data.content,
          time: formatDate(response.data.createTime),
          likeCount: response.data.likeCount || 0,
          dislikeCount: 0,
          isLiked: response.data.liked || false,
          targetAuthor: response.data.replyToUserName || targetAuthor
        }
        // 检查是否是作者的回复
        const isAuthorReply = newReply.userId === comment.userId
        if (isAuthorReply) {
          // 作者回复放在最前面
          comment.replies.unshift(newReply)
        } else {
          // 其他回复放在后面
          comment.replies.push(newReply)
        }
        console.log('回复添加成功:', newReply)
      }
      ElMessage.success('回复成功')
    } else {
      ElMessage.error(response.message || '回复失败')
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败，请稍后重试')
  }
}

// 视频播放器引用
const playerRef = ref(null)
let art = null

// 关注相关状态
const isFollowing = ref(false)
const followerCount = ref(0)
const loadingFollow = ref(false)

// 当前用户信息
const currentUser = ref(JSON.parse(localStorage.getItem('user') || 'null'))

// 浮动用户卡片相关
const showUserFloatCard = ref(false)
const authorAvatarRef = ref(null)
const authorNameRef = ref(null)
const floatCardTimer = ref(null)
const authorBridgeRef = ref(null)

// 处理鼠标进入作者区域（头像+桥接区域）
const handleAuthorMouseEnter = () => {
  if (floatCardTimer.value) {
    clearTimeout(floatCardTimer.value)
    floatCardTimer.value = null
  }
  showUserFloatCard.value = true
}

// 处理鼠标离开作者区域
const handleAuthorMouseLeave = () => {
  floatCardTimer.value = setTimeout(() => {
    showUserFloatCard.value = false
  }, 300)
}

// 处理作者浮动卡片鼠标进入
const handleAuthorCardMouseEnter = () => {
  if (floatCardTimer.value) {
    clearTimeout(floatCardTimer.value)
    floatCardTimer.value = null
  }
}

// 处理作者浮动卡片鼠标离开
const handleAuthorCardMouseLeave = () => {
  floatCardTimer.value = setTimeout(() => {
    showUserFloatCard.value = false
  }, 300)
}

// 处理浮动卡片关注状态变化
const handleFollowChange = ({ userId, isFollowing: newFollowStatus }) => {
  if (videoInfo.value.uploader.id === userId) {
    isFollowing.value = newFollowStatus
    if (newFollowStatus) {
      followerCount.value++
    } else {
      followerCount.value = Math.max(0, followerCount.value - 1)
    }
  }
}

// 评论区浮动卡片相关
const showCommentUserCard = ref(false)
const commentAvatarRef = ref(null)
const currentCommentUser = ref({
  id: null,
  name: '',
  avatar: '',
  bio: '',
  following: false,
  followerCount: 0,
  followingCount: 0,
  likeCount: 0,
  level: 5
})
const commentCardTimer = ref(null)

// 处理评论头像鼠标进入
const handleCommentAvatarMouseEnter = (event, comment) => {
  if (commentCardTimer.value) {
    clearTimeout(commentCardTimer.value)
    commentCardTimer.value = null
  }
  // 保存当前触发元素
  commentAvatarRef.value = event.target
  // 设置当前评论用户信息
  currentCommentUser.value = {
    id: comment.userId,
    name: comment.author,
    avatar: comment.avatar,
    bio: '',
    signature: '',
    following: false,
    followerCount: 0,
    followingCount: 0,
    likeCount: 0,
    level: 5
  }
  showCommentUserCard.value = true
}

// 处理评论头像鼠标离开
const handleCommentAvatarMouseLeave = () => {
  commentCardTimer.value = setTimeout(() => {
    showCommentUserCard.value = false
  }, 300)
}

// 处理评论区浮动卡片鼠标进入
const handleCommentCardMouseEnter = () => {
  if (commentCardTimer.value) {
    clearTimeout(commentCardTimer.value)
    commentCardTimer.value = null
  }
}

// 处理评论区浮动卡片鼠标离开
const handleCommentCardMouseLeave = () => {
  commentCardTimer.value = setTimeout(() => {
    showCommentUserCard.value = false
  }, 300)
}

// 跳转到视频详情页
const goToVideo = (video) => {
  if (typeof video === 'object' && video.manuscriptId) {
    window.location.href = `/manuscript/${video.manuscriptId}`
  } else if (typeof video === 'object' && video.id) {
    window.location.href = `/video/${video.id}`
  } else {
    window.location.href = `/video/${video}`
  }
}

// 切换分P视频
const switchVideoPart = (index) => {
  if (index === currentVideoIndex.value || !manuscriptInfo.value.videos[index]) return
  
  // 使用浏览器刷新方式切换分P，确保播放器完全重新初始化
  const newUrl = `/manuscript/${currentManuscriptId.value}?p=${index + 1}`
  window.location.href = newUrl
}

// 加载互动状态
const loadInteractionStatus = async () => {
  console.log('=== 开始获取互动状态 ===')
  console.log('当前 videoId:', videoId.value)
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    console.log('token:', token ? '存在' : '不存在')
    console.log('当前用户信息:', user)
    
    if (token && videoId.value) {
      console.log('正在调用 getInteractionStatus API...')
      const statusResponse = await interactionApi.getInteractionStatus(videoId.value)
      console.log('API 完整响应:', statusResponse)
      
      if (statusResponse.code === 200) {
        console.log('API 返回的数据:', statusResponse.data)
        
        interactionStatus.value = {
          liked: statusResponse.data.isLiked || statusResponse.data.liked || false,
          favorited: statusResponse.data.isCollected || statusResponse.data.collected || false
        }
        console.log('设置后的 interactionStatus:', interactionStatus.value)
      } else {
        console.error('API 返回错误代码:', statusResponse.code)
        console.error('错误消息:', statusResponse.message)
      }
    } else {
      console.log('未登录或videoId为空，跳过获取互动状态')
    }
  } catch (error) {
    console.error('=== 获取互动状态异常 ===')
    console.error('错误对象:', error)
    console.error('错误消息:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
  }
  console.log('=== 互动状态获取结束 ===')
}

// 加载评论
const loadComments = async () => {
  if (!videoId.value) return
  
  try {
    loadingComments.value = true
    const commentResponse = await commentApi.getCommentsByVideoId(videoId.value, 1, 20)
    if (commentResponse.code === 200) {
      const commentData = commentResponse.data
      // 更新评论列表
      comments.value = commentData.map(comment => ({
        id: comment.id,
        userId: comment.userId || comment.user?.id,
        author: comment.userName || comment.author || comment.user?.name || '未知用户',
        avatar: comment.userAvatar || comment.avatar || comment.user?.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff',
        content: comment.content,
        time: comment.time || formatDate(comment.createTime),
        likeCount: comment.likeCount || 0,
        dislikeCount: comment.dislikeCount || 0,
        isLiked: comment.liked || false,
        showReplyInput: false,
        replies: (comment.replies || []).map(reply => ({
          id: reply.id,
          userId: reply.userId || reply.user?.id,
          author: reply.userName || reply.author || '未知用户',
          avatar: reply.userAvatar || reply.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff',
          content: reply.content,
          time: reply.time || formatDate(reply.createTime),
          likeCount: reply.likeCount || 0,
          dislikeCount: reply.dislikeCount || 0,
          isLiked: reply.liked || false,
          targetAuthor: reply.replyToUserName || reply.targetAuthor || reply.replyTo || reply.toUserName || null
        }))
      }))
      console.log('评论数据:', commentData)
      console.log('处理后的评论列表:', comments.value)
      console.log('评论获取成功:', comments.value)
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  } finally {
    loadingComments.value = false
  }
}

// 加载弹幕
const loadDanmakus = async () => {
  try {
    loadingDanmus.value = true
    const currentVideo = manuscriptInfo.value.videos[currentVideoIndex.value]
    if (!currentVideo) return

    const danmakuResponse = await interactionApi.getDanmakus(currentVideo.id)
    if (danmakuResponse.code === 200) {
      const danmakuData = danmakuResponse.data
      // 更新弹幕列表
      danmuList.value = danmakuData.map(danmaku => ({
        text: danmaku.content,
        time: parseFloat(danmaku.time) || 0,
        color: danmaku.color || '#ffffff',
        sendTime: formatDate(danmaku.createTime)
      }))
      // 更新弹幕数量
      videoInfo.value.danmuLoadedCount = danmuList.value.length

      // 更新播放器弹幕
      if (art) {
        art.plugins.artplayerPluginDanmuku.config({
          danmuku: danmuList.value
        })
      }
    }
  } catch (error) {
    console.error('获取弹幕失败:', error)
  } finally {
    loadingDanmus.value = false
  }
}

// 发送弹幕
const sendDanmaku = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  if (!danmuInput.value.trim()) {
    ElMessage.warning('弹幕内容不能为空')
    return
  }

  const currentVideo = manuscriptInfo.value.videos[currentVideoIndex.value]
  if (!currentVideo) return

  try {
    const currentTime = art ? art.currentTime : 0
    const response = await interactionApi.sendDanmaku(
      currentVideo.id,
      danmuInput.value.trim(),
      currentTime.toString(),
      danmuColor.value,
      0
    )

    if (response.code === 200) {
      // 创建新弹幕对象
      const newDanmu = {
        text: danmuInput.value.trim(),
        time: currentTime,
        color: danmuColor.value,
        sendTime: formatDate(new Date())
      }

      // 添加到弹幕列表
      danmuList.value.push(newDanmu)
      videoInfo.value.danmuLoadedCount = danmuList.value.length

      // 发送到播放器
      if (art) {
        art.plugins.artplayerPluginDanmuku.emit({
          text: newDanmu.text,
          time: newDanmu.time,
          color: newDanmu.color,
          mode: 0
        })
      }

      // 清空输入
      danmuInput.value = ''
      showDanmuInput.value = false
      ElMessage.success('发送成功')
    } else {
      ElMessage.error(response.message || '发送失败')
    }
  } catch (error) {
    console.error('发送弹幕失败:', error)
    ElMessage.error('发送失败，请稍后重试')
  }
}

// 跳转到作者主页
const goToAuthor = (authorId) => {
  window.open(`/profile/${authorId}/home`, '_blank')
}

// 互动状态
const interactionStatus = ref({
  liked: false,
  favorited: false
})

// 处理点赞
const handleLike = async () => {
  if (interactionStatus.value.liked) {
    // 取消点赞
    try {
      const response = await interactionApi.likeVideo(videoId.value, false)
      if (response.code === 200) {
        videoInfo.value.likeCount = Math.max(0, videoInfo.value.likeCount - 1)
        interactionStatus.value.liked = false
        ElMessage.success('取消点赞成功')
      }
    } catch (error) {
      console.error('取消点赞失败:', error)
      ElMessage.error('操作失败，请稍后重试')
    }
  } else {
    // 点赞
    try {
      const response = await interactionApi.likeVideo(videoId.value, true)
      if (response.code === 200) {
        videoInfo.value.likeCount++
        interactionStatus.value.liked = true
        ElMessage.success('点赞成功')
      }
    } catch (error) {
      console.error('点赞失败:', error)
      ElMessage.error('操作失败，请稍后重试')
    }
  }
}

// 处理投币
const handleCoin = async () => {
  try {
    const response = await interactionApi.coinVideo(videoId.value, 1) // 投1个币
    if (response.code === 200) {
      videoInfo.value.coinCount++
      ElMessage.success('投币成功')
    }
  } catch (error) {
    console.error('投币失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 收藏夹弹窗状态
const showFavoriteDialog = ref(false)
// 收藏夹列表
const favoriteFolders = ref([])
// 新建收藏夹输入
const newFolderName = ref('')
// 显示新建收藏夹输入框
const showNewFolderInput = ref(false)
// 选中的收藏夹
const selectedFolders = ref([])

// 获取收藏夹列表
const loadFavoriteFolders = async () => {
  try {
    // 获取收藏夹列表
    const foldersResponse = await interactionApi.getFavoriteFolders()
    if (foldersResponse.code === 200) {
      favoriteFolders.value = foldersResponse.data
      
      // 获取视频的收藏状态
      console.log('获取视频收藏状态，videoId:', videoId.value)
      const videoFoldersResponse = await interactionApi.getVideoFavoriteFolders(videoId.value)
      console.log('视频收藏状态响应:', videoFoldersResponse)
      if (videoFoldersResponse.code === 200) {
        // 设置选中的收藏夹
        selectedFolders.value = videoFoldersResponse.data.map(folder => folder.id)
        console.log('选中的收藏夹:', selectedFolders.value)
        console.log('收藏夹列表:', favoriteFolders.value)
        // 检查每个收藏夹的选中状态
        favoriteFolders.value.forEach(folder => {
          console.log(`收藏夹 ${folder.name} (ID: ${folder.id}) 是否选中: ${selectedFolders.value.includes(folder.id)}`)
        })
      }
    } else if (foldersResponse.code === 401) {
      ElMessage.warning('请先登录')
      showFavoriteDialog.value = false
    }
  } catch (error) {
    console.error('获取收藏夹失败:', error)
    ElMessage.error('获取收藏夹失败，请稍后重试')
  }
}

// 处理收藏
const handleFavorite = async () => {
  // 检查登录状态
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }
  
  // 显示收藏夹弹窗
  await loadFavoriteFolders()
  showFavoriteDialog.value = true
}

// 切换收藏夹选中状态
const toggleFolderSelection = (folderId) => {
  const index = selectedFolders.value.indexOf(folderId)
  if (index > -1) {
    selectedFolders.value.splice(index, 1)
  } else {
    selectedFolders.value.push(folderId)
  }
}

// 检查收藏夹是否被选中
const isFolderSelected = (folderId) => {
  return selectedFolders.value.includes(folderId)
}

// 显示新建收藏夹输入框
const showNewFolderForm = () => {
  showNewFolderInput.value = true
}

// 新建收藏夹
const createNewFolder = async () => {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入收藏夹名称')
    return
  }
  
  try {
    const response = await interactionApi.createFavoriteFolder({ name: newFolderName.value })
    if (response.code === 200) {
      // 重新加载收藏夹列表
      await loadFavoriteFolders()
      // 清空输入
      newFolderName.value = ''
      showNewFolderInput.value = false
      ElMessage.success('新建收藏夹成功')
    }
  } catch (error) {
    console.error('新建收藏夹失败:', error)
    ElMessage.error('新建收藏夹失败，请稍后重试')
  }
}

// 确认收藏
const confirmFavorite = async () => {
  try {
    // 调用API更新视频收藏夹
    const response = await interactionApi.updateVideoFavoriteFolders(videoId.value, selectedFolders.value)
    if (response.code === 200) {
      // 获取视频的收藏状态
      const statusResponse = await interactionApi.getInteractionStatus(videoId.value)
      if (statusResponse.code === 200) {
        // 更新收藏状态（兼容 isCollected 和 collected 字段名）
        interactionStatus.value.favorited = statusResponse.data.isCollected || statusResponse.data.collected || false
      }
      // 重新获取视频信息以更新收藏数
      const videoResponse = await videoApi.getVideoById(videoId.value)
      if (videoResponse.code === 200) {
        videoInfo.value.collectCount = videoResponse.data.collectCount || 0
      }
      showFavoriteDialog.value = false
      ElMessage.success('收藏更新成功')
    }
  } catch (error) {
    console.error('收藏失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 处理分享
const handleShare = async () => {
  try {
    const response = await interactionApi.shareVideo(videoId.value)
    if (response.code === 200) {
      videoInfo.value.shareCount++
      navigator.clipboard.writeText(window.location.href)
      ElMessage.success('分享链接已复制到剪贴板')
    }
  } catch (error) {
    console.error('分享失败:', error)
    // 即使分享失败，也复制链接
    navigator.clipboard.writeText(window.location.href)
    ElMessage.success('分享链接已复制到剪贴板')
  }
}

// AI助手弹窗状态
const showAiAssistantDialog = ref(false)

// 处理AI小助手
const handleAIAssistant = () => {
  console.log('打开AI小助手')
  showAiAssistantDialog.value = true
}

// 处理记笔记
const handleTakeNotes = () => {
  console.log('打开记笔记')
}

// 处理稍后再看
const handleWatchLater = () => {
  console.log('添加到稍后再看')
}

// 处理稿件举报
const handleReport = () => {
  console.log('打开稿件举报')
}

// 处理关注/取消关注
const handleFollow = async () => {
  // 检查是否登录
  const token = localStorage.getItem('token')
  if (!token) {
    // 未登录，显示登录弹窗
    ElMessage.warning('请先登录')
    return
  }

  // 检查是否是自己
  if (currentUser.value && currentUser.value.id === videoInfo.value.uploader.id) {
    // 不能关注自己
    ElMessage.warning('无法关注自己')
    return
  }

  // 防止重复点击
  if (loadingFollow.value) {
    console.log('正在处理中，请勿重复点击')
    return
  }

  // 如果是取消关注，先弹出确认框
  if (isFollowing.value) {
    try {
      await ElMessageBox.confirm(
        `确定不再关注 ${videoInfo.value.uploader.name} 吗？`,
        '取消关注',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      // 用户取消操作
      return
    }
  }

  try {
    loadingFollow.value = true
    console.log('【前端调试】当前关注状态:', isFollowing.value)
    console.log('【前端调试】准备调用关注API，目标用户ID:', videoInfo.value.uploader.id)
    // 调用关注/取消关注API - 后端会自动切换状态
    const response = await userApi.follow(videoInfo.value.uploader.id, true)
    console.log('【前端调试】关注API响应:', response)
    if (response.code === 200) {
      // 根据后端返回的data判断是关注还是取消关注
      const operationResult = response.data || response.message
      const isNowFollowing = operationResult === '关注成功'
      console.log('【前端调试】后端返回data:', response.data)
      console.log('【前端调试】后端返回message:', response.message)
      console.log('【前端调试】操作结果:', operationResult)
      console.log('【前端调试】解析后的状态 - isNowFollowing:', isNowFollowing, '当前isFollowing:', isFollowing.value)
      // 更新关注状态
      isFollowing.value = isNowFollowing
      if (isNowFollowing) {
        followerCount.value++
        ElMessage.success('关注成功')
      } else {
        followerCount.value--
        ElMessage.success('取消关注成功')
      }
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

onMounted(async () => {
  // 检查token是否存在
  const token = localStorage.getItem('token')
  console.log('【前端调试】localStorage中的token:', token ? '存在' : '不存在')
  console.log('【前端调试】localStorage中的user:', localStorage.getItem('user'))
  console.log('【前端调试】当前路由参数:', route.params)
  console.log('【前端调试】当前路由查询:', route.query)
  
  // 从路由参数重新获取 manuscriptId（确保正确）
  const manuscriptIdFromRoute = parseInt(route.params.id)
  const pFromRoute = parseInt(route.query.p) || 1
  console.log('【前端调试】从路由获取的 manuscriptId:', manuscriptIdFromRoute, 'p:', pFromRoute)
  
  if (!manuscriptIdFromRoute || isNaN(manuscriptIdFromRoute)) {
    console.error('【前端调试】manuscriptId 无效:', route.params.id)
    ElMessage.error('稿件ID无效')
    return
  }
  
  // 更新本地状态
  currentManuscriptId.value = manuscriptIdFromRoute
  currentP.value = pFromRoute
  
  try {
    // 使用新的API获取视频数据
    console.log('【前端调试】开始获取视频详情，manuscriptId:', currentManuscriptId.value, 'p:', currentP.value)
    console.log('【前端调试】请求将携带Authorization header:', token ? '是' : '否')
    const videoResponse = await videoApi.getVideoByManuscriptId(currentManuscriptId.value, { p: currentP.value })
    console.log('【前端调试】视频详情响应:', videoResponse)
    
    if (videoResponse.code === 200) {
      const data = videoResponse.data
      
      // 从API返回的数据中提取videoId - 这是关键！
      videoId.value = data.id
      console.log('【前端调试】设置 videoId:', videoId.value)
      
      // 更新当前视频索引
      currentVideoIndex.value = data.currentVideoIndex || 0
      
      // 更新稿件信息
      manuscriptInfo.value = {
        id: currentManuscriptId.value,
        title: data.title,
        description: data.description || '',
        coverUrl: data.coverUrl,
        tags: data.tags || [],
        videos: data.manuscriptVideos || []
      }
      
      // 更新视频信息
      videoInfo.value = {
        title: data.title,
        coverUrl: data.coverUrl,
        playUrl: data.playUrl || '',
        playUrlHd: data.playUrlHd || '',
        playUrlSd: data.playUrlSd || '',
        playUrlLd: data.playUrlLd || '',
        uploader: {
          name: data.uploader?.name || '',
          avatar: data.uploader?.avatar || '',
          id: data.uploader?.id || '',
          bio: data.uploader?.signature || data.uploader?.bio || ''
        },
        viewCount: data.viewCount || 0,
        likeCount: data.likeCount || 0,
        dislikeCount: 0,
        coinCount: data.coinCount || 0,
        collectCount: data.collectCount || 0,
        shareCount: data.shareCount || 0,
        commentCount: data.commentCount || 0,
        duration: data.duration || '00:00',
        uploadTime: data.uploadTime,
        description: data.description || '',
        watchingCount: 0,
        danmuLoadedCount: 0,
        tags: data.tags || []
      }
      
      // 初始化粉丝数 - 使用后端实时计算的粉丝数
      followerCount.value = data.uploader?.followerCount || 0
      console.log('【前端调试】后端返回的uploader:', data.uploader)
      console.log('【前端调试】后端返回的following:', data.uploader?.following)
      console.log('【前端调试】后端返回的followerCount:', data.uploader?.followerCount)
      console.log('【前端调试】后端返回的signature:', data.uploader?.signature)
      console.log('【前端调试】后端返回的bio:', data.uploader?.bio)
      
      // 使用后端返回的关注状态（如果用户已登录）
      if (data.uploader?.following != null) {
        isFollowing.value = data.uploader.following
        console.log('【前端调试】设置关注状态为:', isFollowing.value)
      } else {
        console.log('【前端调试】following为null或undefined，保持默认值false')
      }
      console.log('视频信息获取成功:', videoInfo.value)
      
      // 在设置 videoId 后，再调用依赖 videoId 的函数
      // 获取视频互动状态
      await loadInteractionStatus()

      // 获取视频评论
      await loadComments()

      // 获取视频弹幕
      await loadDanmakus()

      // 加载相关视频推荐
      await loadRelatedVideos()
      
      // 不在打开时记录，只在退出时记录浏览历史
    } else {
      console.error('【前端调试】API 返回错误:', videoResponse)
      ElMessage.error(videoResponse.message || '获取视频信息失败')
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
    ElMessage.error('获取视频信息失败')
  }
  
  const defaultUrl = videoInfo.value.playUrl || videoInfo.value.playUrlHd || 'https://media.w3.org/2010/05/sintel/trailer.mp4'
  
  const qualityOptions = []
  
  if (videoInfo.value.playUrlHd) {
    qualityOptions.push({
      default: true,
      name: '1080P 高清',
      html: '1080P 高清',
      url: videoInfo.value.playUrlHd
    })
  }
  
  if (videoInfo.value.playUrlSd) {
    qualityOptions.push({
      default: !videoInfo.value.playUrlHd,
      name: '720P 标清',
      html: '720P 标清',
      url: videoInfo.value.playUrlSd
    })
  }
  
  if (videoInfo.value.playUrlLd) {
    qualityOptions.push({
      default: !videoInfo.value.playUrlHd && !videoInfo.value.playUrlSd,
      name: '480P 流畅',
      html: '480P 流畅',
      url: videoInfo.value.playUrlLd
    })
  }
  
  if (qualityOptions.length === 0) {
    qualityOptions.push({
      default: true,
      name: '默认',
      html: '默认',
      url: defaultUrl
    })
  }
  
  // 字幕数据已从MongoDB加载，不需要再构建SRT选项
  // 使用 SubtitleDisplay 组件显示字幕

  // 构建播放器配置
  const playerConfig = {
    container: playerRef.value,
    url: defaultUrl,
    poster: videoInfo.value.coverUrl || 'https://media.w3.org/2010/05/sintel/poster.png',
    volume: 0.7,
    isLive: false,
    muted: false,
    autoplay: false,
    pip: true,
    autoSize: true,
    autoMini: true,
    screenshot: false,
    setting: true,
    loop: false,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    quality: qualityOptions,
    theme: '#23ade5',
    lang: 'zh-cn',
    plugins: [
      ArtplayerPluginDanmuku({
        danmuku: danmuList.value,
        speed: 5,
        opacity: 1,
        color: '#ffffff',
        fontSize: 25,
        synchronousPlayback: true,
        maxlength: 50,
        margin: [10, 10, 10, 10],
        // 启用弹幕发射器
        emitter: true,
        // 弹幕发送前的过滤器
        beforeEmit: async (danmu) => {
          const token = localStorage.getItem('token')
          if (!token) {
            ElMessage.warning('请先登录')
            return false
          }

          const currentVideo = manuscriptInfo.value.videos[currentVideoIndex.value]
          if (!currentVideo) return false

          try {
            const response = await interactionApi.sendDanmaku(
              currentVideo.id,
              danmu.text,
              danmu.time.toString(),
              danmu.color || '#ffffff',
              danmu.mode || 0
            )

            if (response.code === 200) {
              // 添加到弹幕列表
              danmuList.value.push({
                text: danmu.text,
                time: danmu.time,
                color: danmu.color || '#ffffff',
                sendTime: formatDate(new Date())
              })
              videoInfo.value.danmuLoadedCount = danmuList.value.length
              ElMessage.success('发送成功')
              return true
            } else {
              ElMessage.error(response.message || '发送失败')
              return false
            }
          } catch (error) {
            console.error('发送弹幕失败:', error)
            ElMessage.error('发送失败，请稍后重试')
            return false
          }
        }
      })
    ]
  }

  // 添加字幕控制按钮（使用自定义字幕组件）
  playerConfig.controls = [
    {
      position: 'right',
      html: '<span class="art-icon">字幕</span>',
      tooltip: '字幕设置',
      click: function() {
        // 切换设置面板显示
        subtitleSettingsVisible.value = !subtitleSettingsVisible.value
      },
      mounted: function() {
        this.innerHTML = `<span class="art-icon">字幕</span>`
      }
    }
  ]

  // 添加自定义字幕图层
  playerConfig.layers = [
    {
      name: 'subtitle-layer',
      html: '<div class="art-subtitle-layer"></div>',
      style: {
        position: 'absolute',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        'z-index': 100,
        'pointer-events': 'auto',
        'max-width': '80%',
        'text-align': 'center'
      }
    }
  ]

  art = new Artplayer(playerConfig)

  // 将字幕组件挂载到 Artplayer 的自定义图层中
  art.on('ready', () => {
    const subtitleLayer = art.query('.art-subtitle-layer')
    if (subtitleLayer && subtitleDisplayRef.value) {
      subtitleLayer.appendChild(subtitleDisplayRef.value.$el)
    }
  })

  // 监听播放时间更新 - 使用 setInterval 作为备选方案
  let timeUpdateInterval = null
  let lastLoggedSecond = -1

  const updateCurrentTime = () => {
    if (art && art.currentTime !== undefined) {
      const time = art.currentTime
      currentVideoTime.value = time
      // 每秒输出一次时间，用于调试
      const currentSecond = Math.floor(time)
      if (currentSecond !== lastLoggedSecond) {
        console.log('[字幕] 时间更新, 当前时间:', time.toFixed(2))
        lastLoggedSecond = currentSecond
      }
      // 处理浏览历史记录
      handleVideoTimeUpdate()
    }
  }

  // 尝试使用 timeupdate 事件
  art.on('timeupdate', () => {
    updateCurrentTime()
  })

  // 同时启动 setInterval 作为备选
  timeUpdateInterval = setInterval(updateCurrentTime, 100)
  
  // 监听播放事件
  art.on('play', () => {
    console.log('[字幕] 视频开始播放')
    if (!timeUpdateInterval) {
      timeUpdateInterval = setInterval(updateCurrentTime, 100)
    }
  })
  
  // 监听暂停事件
  art.on('pause', () => {
    console.log('[字幕] 视频暂停, 当前时间:', art.currentTime)
  })

  // 监听全屏事件 - 进入全屏时重置字幕位置
  art.on('fullscreen', (isFullscreen) => {
    if (isFullscreen) {
      console.log('[字幕] 进入全屏, 重置字幕位置')
      resetSubtitlePosition()
    }
  })

  // 监听网页全屏事件
  art.on('fullscreenWeb', (isFullscreen) => {
    if (isFullscreen) {
      console.log('[字幕] 进入网页全屏, 重置字幕位置')
      resetSubtitlePosition()
    }
  })

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval)
    }
  })

  // 加载字幕
  await loadSubtitles()

  // 添加点击外部区域的事件监听
  document.addEventListener('click', handleClickOutside)
  
  // 添加页面关闭/刷新事件监听，记录浏览历史
  window.addEventListener('beforeunload', () => {
    recordWatchHistory()
  })

  console.log('视频播放器初始化完成')
})

onUnmounted(() => {
  // 记录浏览历史（离开页面时）
  recordWatchHistory()
  
  // 移除点击外部区域的事件监听
  document.removeEventListener('click', handleClickOutside)
  
  // 销毁视频播放器
  if (art) {
    art.destroy()
  }
})

// 监听路由参数变化，处理浏览器前进/后退
watch(() => route.query.p, (newP) => {
  const p = parseInt(newP) || 1
  if (p !== currentP.value && manuscriptInfo.value.videos.length > 0) {
    // 切换到对应的分P（注意：p是1-based，index是0-based）
    const index = p - 1
    if (index >= 0 && index < manuscriptInfo.value.videos.length) {
      // 只更新数据和播放器，不修改URL（因为URL已经变了）
      currentP.value = p
      currentVideoIndex.value = index
      
      const video = manuscriptInfo.value.videos[index]
      
      // 更新videoId用于其他API调用
      videoId.value = video.id
      
      // 更新视频信息（保留稿件标题，只更新播放地址和时长）
      videoInfo.value.playUrl = video.playUrl || ''
      videoInfo.value.playUrlHd = video.playUrlHd || ''
      videoInfo.value.playUrlSd = video.playUrlSd || ''
      videoInfo.value.playUrlLd = video.playUrlLd || ''
      videoInfo.value.duration = video.duration || '00:00'

      // 更新播放器
      if (art) {
        const qualityOptions = []

        if (video.playUrlHd) {
          qualityOptions.push({
            default: true,
            name: '1080P 高清',
            html: '1080P 高清',
            url: video.playUrlHd
          })
        }
        
        if (video.playUrlSd) {
          qualityOptions.push({
            default: !video.playUrlHd,
            name: '720P 标清',
            html: '720P 标清',
            url: video.playUrlSd
          })
        }
        
        if (video.playUrlLd) {
          qualityOptions.push({
            default: !video.playUrlHd && !video.playUrlSd,
            name: '480P 流畅',
            html: '480P 流畅',
            url: video.playUrlLd
          })
        }
        
        if (qualityOptions.length === 0 && video.playUrl) {
          qualityOptions.push({
            default: true,
            name: '默认',
            html: '默认',
            url: video.playUrl
          })
        }
        
        // 切换视频源
        art.switchUrl(qualityOptions[0]?.url || video.playUrl)
        
        // 更新画质选项
        if (qualityOptions.length > 0) {
          art.quality = qualityOptions
        }
        
        // 重置播放时间
        art.currentTime = 0
      }
      
      // 重新加载弹幕、字幕和互动状态
      loadDanmakus()
      loadInteractionStatus()
      loadComments()
      loadSubtitles()
    }
  }
})
</script>

<template>
  <div class="video-container">
    <div class="main-content">
      <!-- 顶部区域：视频标题和作者信息 -->
      <div class="top-section">
        <!-- 左侧：视频标题和统计信息 -->
        <div class="video-header">
          <h1 class="video-title">{{ videoInfo.title }}</h1>
          <div class="video-stats">
            <span>{{ (videoInfo.viewCount || 0).toLocaleString() }}次播放</span>
            <span>{{ (videoInfo.commentCount || 0) }}条评论</span>
            <span>{{ formatDate(videoInfo.uploadTime) }}</span>
          </div>
        </div>
        
        <!-- 右侧：作者信息 -->
        <div class="author-card"
          @mouseenter="handleAuthorMouseEnter"
          @mouseleave="handleAuthorMouseLeave"
        >
          <img 
            ref="authorAvatarRef"
            :src="videoInfo.uploader.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'" 
            alt="作者头像" 
            class="author-avatar" 
            @click="goToAuthor(videoInfo.uploader.id)"
          >
          <!-- 桥接区域：连接头像和浮动卡片 -->
          <div ref="authorBridgeRef" class="float-card-bridge"></div>
          <div class="author-meta">
            <div class="author-info-top">
              <span class="author-name" @click="goToAuthor(videoInfo.uploader.id)">{{ videoInfo.uploader.name }}</span>
              <el-button 
                text 
                size="small" 
                class="message-btn"
                @click="handleSendMessage"
                :disabled="currentUser && currentUser.id === videoInfo.uploader.id"
              >
                <el-icon><Message /></el-icon>
                <span>发消息</span>
              </el-button>
            </div>
            <span class="author-bio" :title="videoInfo.uploader.bio">{{ videoInfo.uploader.bio || '该用户暂无简介' }}</span>
            <el-button 
              :type="isFollowing ? 'default' : 'primary'" 
              class="follow-btn"
              @click="handleFollow"
              :loading="loadingFollow"
              :disabled="loadingFollow || (currentUser && currentUser.id === videoInfo.uploader.id)"
            >
              {{ isFollowing ? '已关注' : '+ 关注' }} {{ (followerCount || 0).toLocaleString() }}
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 中间区域：视频播放器和弹幕列表 -->
      <div class="player-danmu-container">
        <!-- 左侧内容 -->
        <div class="left-section">
          <!-- 视频播放器 -->
          <div class="video-player-wrapper">
            <div ref="playerRef" class="video-player"></div>
            <!-- 字幕显示组件 -->
            <SubtitleDisplay
              ref="subtitleDisplayRef"
              :subtitles="currentSubtitleContent"
              :current-time="currentVideoTime"
              :enabled="subtitleEnabled"
            />
          <!-- 字幕设置面板 -->
            <div v-if="subtitleSettingsVisible" class="subtitle-settings-panel">
              <div class="settings-header">
                <span>字幕设置</span>
                <el-button link size="small" @click="subtitleSettingsVisible = false">
                  <el-icon><CircleClose /></el-icon>
                </el-button>
              </div>
              <div class="settings-content">
                <div class="setting-item">
                  <span class="setting-label">字幕开关</span>
                  <el-switch v-model="subtitleEnabled" />
                </div>
                <div class="setting-item">
                  <span class="setting-label">字体大小</span>
                  <el-slider v-model="subtitleSettings.fontSize" :min="12" :max="40" :step="1" @change="updateSubtitleSettings({ fontSize: $event })" />
                  <span class="setting-value">{{ subtitleSettings.fontSize }}px</span>
                </div>
                <div class="setting-item">
                  <span class="setting-label">字体颜色</span>
                  <el-color-picker v-model="subtitleSettings.color" @change="updateSubtitleSettings({ color: $event })" />
                </div>
                <div class="setting-item">
                  <span class="setting-label">背景透明度</span>
                  <el-slider v-model="subtitleSettings.backgroundOpacity" :min="0" :max="1" :step="0.1" @change="updateSubtitleSettings({ backgroundColor: `rgba(0, 0, 0, ${$event})` })" />
                </div>
                <div class="setting-item">
                  <span class="setting-label">圆角大小</span>
                  <el-slider v-model="subtitleSettings.borderRadius" :min="0" :max="20" :step="1" @change="updateSubtitleSettings({ borderRadius: $event })" />
                </div>
                <div class="setting-actions">
                  <el-button size="small" @click="resetSubtitlePosition">重置位置</el-button>
                  <el-button size="small" type="primary" @click="subtitleSettingsVisible = false">完成</el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 字幕控制栏已移除，通过播放器内按钮控制 -->

          <!-- 视频状态栏 -->
          <div class="video-status-bar-simple">
            <div class="status-info">
              <span class="status-item">
                <el-icon><View /></el-icon>
                {{ (videoInfo.watchingCount || 0).toLocaleString() }}人正在看
              </span>
              <span class="status-item">
                <el-icon><ChatDotRound /></el-icon>
                已装载{{ (videoInfo.danmuLoadedCount || 0).toLocaleString() }}条弹幕
              </span>
            </div>
          </div>
          
          <!-- 互动按钮栏 -->
          <div class="interaction-bar">
            <div class="left-actions">
              <el-button 
                class="action-btn" 
                :class="{ 'is-active': interactionStatus.liked }"
                @click="handleLike"
              >
                <el-icon><CircleCheck /></el-icon>
                <span>{{ (videoInfo.likeCount || 0).toLocaleString() }}</span>
              </el-button>
              <el-button class="action-btn" @click="handleCoin">
                <el-icon><CirclePlus /></el-icon>
                <span>{{ (videoInfo.coinCount || 0).toLocaleString() }}</span>
              </el-button>
              <el-button 
                class="action-btn" 
                :class="{ 'is-active': interactionStatus.favorited }"
                @click="handleFavorite"
              >
                <el-icon><Star /></el-icon>
                <span>{{ (videoInfo.collectCount || 0).toLocaleString() }}</span>
              </el-button>
              <el-button class="action-btn" @click="handleShare">
                <el-icon><Share /></el-icon>
                <span>{{ (videoInfo.shareCount || 0).toLocaleString() }}</span>
              </el-button>
            </div>
            <div class="right-actions">
              <el-button class="action-btn ai-assistant-btn" @click="handleAIAssistant">
                <el-icon><Comment /></el-icon>
                <span>AI小助手</span>
              </el-button>
              <el-button class="action-btn" @click="handleTakeNotes">
                <el-icon><Edit /></el-icon>
                <span>记笔记</span>
              </el-button>
              <el-dropdown trigger="click">
                <el-button class="action-btn more-btn">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleWatchLater">
                      <el-icon><View /></el-icon>
                      稍后再看
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleReport">
                      <el-icon><ChatDotRound /></el-icon>
                      稿件举报
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
          
          <!-- 视频简介 -->
          <div class="video-description">
            <div class="description-content" :class="{ 'is-collapsed': isDescriptionCollapsed }">
              {{ videoInfo.description || '该视频暂无简介' }}
            </div>
            <div class="description-toggle" @click="toggleDescription">
              <span>{{ isDescriptionCollapsed ? '展开' : '收起' }}</span>
              <el-icon :class="{ 'is-rotated': !isDescriptionCollapsed }">
                <ArrowDown />
              </el-icon>
            </div>
          </div>
          
          <!-- 视频标签栏 -->
          <div class="video-tags" v-if="videoInfo.tags && videoInfo.tags.length > 0">
            <div class="tags-list">
              <el-tag v-for="tag in videoInfo.tags" :key="tag.id || tag" size="small" class="tag-item">
                {{ tag.name || tag }}
              </el-tag>
            </div>
          </div>
          
          <!-- 评论区 -->
          <div class="comment-section">
            <div class="comment-header">
              <h3>评论 ({{ (videoInfo.commentCount || 0).toLocaleString() }})</h3>
              <div class="comment-sort">
                <span 
                  class="sort-item" 
                  :class="{ 'is-active': commentSort === 'hot' }"
                  @click="commentSort = 'hot'"
                >最热</span>
                <span 
                  class="sort-item" 
                  :class="{ 'is-active': commentSort === 'new' }"
                  @click="commentSort = 'new'"
                >最新</span>
              </div>
            </div>
            
            <!-- 评论输入框 -->
            <div class="comment-input-wrapper" ref="commentInputWrapper">
              <img :src="currentUserAvatar()" alt="用户头像" class="comment-input-avatar">
              
              <!-- 折叠状态的输入框 -->
              <div 
                class="comment-input-collapsed" 
                @click.stop="toggleCommentInput"
                v-if="isCommentInputCollapsed"
              >
                <span class="placeholder-text">发一条友善的评论吧...</span>
              </div>
              
              <!-- 展开状态的输入框 -->
              <div class="comment-input-expanded" v-else @click.stop>
                <el-input
                  v-model="newComment"
                  type="textarea"
                  :rows="4"
                  placeholder="发一条友善的评论吧..."
                  maxlength="500"
                  show-word-limit
                  resize="none"
                />
                
                <!-- 表情选择器 -->
                <div class="emoji-picker" v-if="showEmojiPicker" @click.stop>
                  <div 
                    v-for="emoji in emojiList" 
                    :key="emoji" 
                    class="emoji-item"
                    @click="selectEmoji(emoji)"
                  >
                    {{ emoji }}
                  </div>
                </div>
                
                <div class="comment-input-actions">
                  <el-button 
                    text 
                    size="small" 
                    class="emoji-btn"
                    @click="showEmojiPicker = !showEmojiPicker"
                  >
                    😊 表情
                  </el-button>
                  <el-button type="primary" size="small" @click="submitComment">发表评论</el-button>
                </div>
              </div>
            </div>
            
            <!-- 评论列表 -->
            <div class="comment-list">
              <!-- 加载状态 -->
              <div v-if="loadingComments" class="loading-comments">
                <el-skeleton :rows="5" animated />
              </div>
              <!-- 评论为空 -->
              <div v-else-if="comments.length === 0" class="no-comments">
                <p>暂无评论，快来抢沙发吧！</p>
              </div>
              <!-- 评论列表 -->
              <div v-else>
                <div v-for="comment in comments" :key="comment.id" class="comment-item">
                  <img 
                    :src="comment.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'" 
                    alt="用户头像" 
                    class="comment-avatar" 
                    @click="goToAuthor(comment.userId)"
                    @mouseenter="(e) => handleCommentAvatarMouseEnter(e, comment)"
                    @mouseleave="handleCommentAvatarMouseLeave"
                  >
                  <div class="comment-content">
                    <div class="comment-info">
                      <span class="comment-author" @click="goToAuthor(comment.userId)">{{ comment.author }}</span>
                    </div>
                    <div class="comment-text" v-html="formatContentWithAtLinks(comment.content)"></div>
                    <div class="comment-actions">
                      <span class="comment-time">{{ comment.time }}</span>
                      <el-button text size="small" @click="likeComment(comment.id)">
                        <el-icon><CircleCheck /></el-icon>
                        {{ comment.likeCount }}
                      </el-button>
                      <el-button text size="small" @click="dislikeComment(comment.id)">
                        <el-icon><CircleClose /></el-icon>
                        {{ comment.dislikeCount }}
                      </el-button>
                      <el-button text size="small" @click.stop="replyComment(comment.id)">回复</el-button>
                    </div>
                    
                    <!-- 回复列表 -->
                    <div class="replies-list" v-if="comment.replies && comment.replies.length > 0">
                      <!-- 显示视频作者的回复 -->
                      <div v-for="reply in comment.replies.filter(r => videoInfo.uploader.id && r.userId === videoInfo.uploader.id)" :key="reply.id" class="reply-item">
                        <img :src="reply.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'" alt="用户头像" class="reply-avatar" @click="goToAuthor(reply.userId)">
                        <div class="reply-content">
                          <div class="reply-text" v-html="formatContentWithAtLinks(reply.author + ': ' + reply.content)"></div>
                          <div class="reply-actions">
                            <span class="reply-time">{{ reply.time }}</span>
                            <el-button text size="small" @click="likeReply(reply.id)">
                              <el-icon><CircleCheck /></el-icon>
                              {{ reply.likeCount }}
                            </el-button>
                            <el-button text size="small" @click="dislikeReply(reply.id)">
                              <el-icon><CircleClose /></el-icon>
                              {{ reply.dislikeCount || 0 }}
                            </el-button>
                            <el-button text size="small" @click.stop="replyToReply(comment.id, reply.id, reply.author)">回复</el-button>
                          </div>
                        </div>
                      </div>
                      
                      <!-- 其他回复（全部折叠） -->
                      <div v-if="comment.replies.filter(r => !videoInfo.uploader.id || r.userId !== videoInfo.uploader.id).length > 0">
                        <!-- 折叠状态 -->
                        <div class="reply-collapse" v-if="!replyExpanded[comment.id]">
                          <el-button text size="small" @click="toggleReplyExpanded(comment.id)">
                            显示全部 {{ comment.replies.filter(r => !videoInfo.uploader.id || r.userId !== videoInfo.uploader.id).length }} 条回复
                          </el-button>
                        </div>
                        
                        <!-- 展开状态 -->
                        <div v-if="replyExpanded[comment.id]">
                          <div v-for="reply in comment.replies.filter(r => !videoInfo.uploader.id || r.userId !== videoInfo.uploader.id)" :key="reply.id" class="reply-item">
                            <img :src="reply.avatar || 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff'" alt="用户头像" class="reply-avatar" @click="goToAuthor(reply.userId)">
                            <div class="reply-content">
                              <div class="reply-text" v-html="formatContentWithAtLinks(reply.author + ': ' + reply.content)"></div>
                              <div class="reply-actions">
                                <span class="reply-time">{{ reply.time }}</span>
                                <el-button text size="small" @click="likeReply(reply.id)">
                                  <el-icon><CircleCheck /></el-icon>
                                  {{ reply.likeCount }}
                                </el-button>
                                <el-button text size="small" @click="dislikeReply(reply.id)">
                                  <el-icon><CircleClose /></el-icon>
                                  {{ reply.dislikeCount || 0 }}
                                </el-button>
                                <el-button text size="small" @click.stop="replyToReply(comment.id, reply.id, reply.author)">回复</el-button>
                              </div>
                            </div>
                          </div>
                          
                          <!-- 数字分页 -->
                          <div class="reply-pagination">
                            <span class="page-info">共{{ Math.ceil((comment.replies.filter(r => !videoInfo.uploader.id || r.userId !== videoInfo.uploader.id).length) / 7) }}页</span>
                            <span 
                              v-for="page in Math.ceil((comment.replies.filter(r => !videoInfo.uploader.id || r.userId !== videoInfo.uploader.id).length) / 7)" 
                              :key="page"
                              class="page-number"
                              :class="{ 'active': replyPage[comment.id] === page }"
                              @click="loadReplies(comment.id, page)"
                            >
                              {{ page }}
                            </span>
                            <span class="page-control" @click="loadReplies(comment.id, (replyPage[comment.id] || 1) + 1)" v-if="(replyPage[comment.id] || 1) < Math.ceil((comment.replies.filter(r => !videoInfo.uploader.id || r.userId !== videoInfo.uploader.id).length) / 7)">
                              下一页
                            </span>
                            <span class="page-control" @click="replyExpanded[comment.id] = false">
                              收起
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    

                    
                    <!-- 回复输入框 -->
                    <div class="reply-input-wrapper" v-if="comment.showReplyInput" @click.stop>
                      <img :src="currentUserAvatar()" alt="用户头像" class="reply-input-avatar">
                      <div class="reply-input-content">
                        <div v-if="replyTargets[comment.id]" class="reply-target-info">
                          回复 @{{ replyTargets[comment.id].targetAuthor }}
                        </div>
                        <el-input
                          v-model="replyInputs[comment.id]"
                          type="textarea"
                          :rows="3"
                          :placeholder="replyTargets[comment.id] ? `回复 @${replyTargets[comment.id].targetAuthor}...` : '回复评论...'"
                          maxlength="500"
                          show-word-limit
                          resize="none"
                        />
                        <div class="reply-input-actions">
                          <el-button 
                            text 
                            size="small" 
                            class="emoji-btn"
                            @click="showEmojiPicker = !showEmojiPicker"
                          >
                            😊 表情
                          </el-button>
                          <el-button type="primary" size="small" @click="submitReply(comment.id)">发表回复</el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧内容 -->
        <div class="right-section">
          <!-- 右侧弹幕列表 -->
          <div class="side-danmu-list">
            <div class="danmu-list-header" @click="toggleDanmuList">
              <h3>弹幕列表</h3>
              <el-icon class="collapse-icon" :class="{ 'is-collapsed': isDanmuListCollapsed }">
                <ArrowDown />
              </el-icon>
            </div>
            <div class="danmu-items" :class="{ 'is-hidden': isDanmuListCollapsed }">
              <!-- 加载状态 -->
              <div v-if="loadingDanmus" class="loading-danmus">
                <el-skeleton :rows="5" animated />
              </div>
              <!-- 弹幕为空 -->
              <div v-else-if="danmuList.length === 0" class="no-danmus">
                <p>暂无弹幕，快来发第一条弹幕吧！</p>
              </div>
              <!-- 弹幕列表 -->
              <div v-else class="danmu-list-content">
                <!-- 表头 -->
                <div class="danmu-header">
                  <span class="header-time">时间</span>
                  <span class="header-content">弹幕内容</span>
                  <span class="header-send-time">发送时间</span>
                </div>
                <!-- 弹幕列表 -->
                <div v-for="(danmu, index) in danmuList" :key="index" class="danmu-item" @click="jumpToDanmuTime(danmu.time)">
                  <span class="danmu-time">{{ formatTime(danmu.time) }}</span>
                  <span class="danmu-text">{{ danmu.text }}</span>
                  <span class="danmu-send-time">{{ danmu.sendTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 视频分P列表 -->
          <div v-if="manuscriptInfo.videos && manuscriptInfo.videos.length > 1" class="video-parts-section">
            <div class="video-parts-header" @click="toggleVideoParts">
              <h3>视频分P</h3>
              <span class="video-parts-count">共{{ manuscriptInfo.videos.length }}P</span>
              <el-icon class="collapse-icon" :class="{ 'is-collapsed': isVideoPartsCollapsed }">
                <ArrowDown />
              </el-icon>
            </div>
            <div class="video-parts-list" :class="{ 'is-hidden': isVideoPartsCollapsed }">
              <div
                v-for="(part, index) in manuscriptInfo.videos"
                :key="part.id"
                :class="['video-part-item', { active: currentVideoIndex === index }]"
                @click="switchVideoPart(index)"
              >
                <span class="part-index">P{{ index + 1 }}</span>
                <span class="part-title">{{ part.title }}</span>
                <span class="part-duration">{{ part.duration }}</span>
              </div>
            </div>
          </div>

          <!-- 推荐视频 -->
          <div class="related-videos">
            <h3>推荐视频</h3>
            <!-- 加载状态 -->
            <div v-if="loadingRelatedVideos" class="loading-related">
              <el-skeleton :rows="4" animated />
            </div>
            <!-- 相关视频列表 -->
            <div v-else>
              <div v-for="video in relatedVideos" :key="video.id" class="related-video-item">
                <div class="video-cover">
                  <a :href="video.manuscriptId ? '/manuscript/' + video.manuscriptId : '/video/' + video.id" class="video-cover-link">
                    <img :src="video.cover || 'https://via.placeholder.com/320x180?text=视频封面'" alt="视频封面">
                  </a>
                  <span class="video-duration">{{ video.duration }}</span>
                </div>
                <div class="video-info">
                  <h4 class="video-title">
                    <span class="video-title-text" @click="goToVideo(video)">{{ video.title }}</span>
                  </h4>
                  <div class="video-meta">
                    <span class="video-author" @click="goToAuthor(video.authorId)">{{ video.author }}</span>
                    <div class="video-stats">
                      <span class="video-view">{{ (video.viewCount || 0).toLocaleString() }}次播放</span>
                      <span class="video-comment">{{ video.commentCount || 0 }}条评论</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 空状态 -->
            <div v-if="!loadingRelatedVideos && relatedVideos.length === 0" class="no-related">
              <p>暂无相关视频推荐</p>
            </div>
          </div>
        </div>
      </div>
        

        

    </div>
  </div>
  
  <!-- 收藏夹弹窗 -->
  <el-dialog
    v-model="showFavoriteDialog"
    title="添加到收藏夹"
    width="400px"
    :close-on-click-modal="false"
  >
    <div class="favorite-folders">
      <div 
        v-for="folder in favoriteFolders" 
        :key="folder.id"
        class="folder-item"
      >
        <el-checkbox 
          :checked="selectedFolders.includes(folder.id)"
          @change="toggleFolderSelection(folder.id)"
        >
          {{ folder.name }}
        </el-checkbox>
        <span class="folder-count">{{ folder.videoCount || 0 }}/1000</span>
      </div>
      
      <!-- 新建收藏夹 -->
      <div class="new-folder-section">
        <div v-if="!showNewFolderInput" class="new-folder-btn" @click="showNewFolderForm">
          <el-icon><CirclePlus /></el-icon>
          新建收藏夹
        </div>
        <div v-else class="new-folder-input">
          <el-input
            v-model="newFolderName"
            placeholder="最多可输入20个字"
            maxlength="20"
            size="small"
          />
          <el-button type="primary" size="small" @click="createNewFolder" style="margin-left: 8px;">
            新建
          </el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="showFavoriteDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmFavorite">确定</el-button>
    </template>
  </el-dialog>
  
  <!-- 浮动用户卡片 - 作者头像 -->
  <UserFloatCard
    v-model:visible="showUserFloatCard"
    :trigger-ref="authorAvatarRef"
    :bridge-ref="authorBridgeRef"
    :user-info="{
      id: videoInfo.uploader.id,
      name: videoInfo.uploader.name,
      avatar: videoInfo.uploader.avatar,
      bio: videoInfo.uploader.bio,
      signature: videoInfo.uploader.bio,
      following: isFollowing,
      followerCount: followerCount,
      followingCount: 0,
      likeCount: 0,
      level: 5
    }"
    placement="bottom"
    @follow-change="handleFollowChange"
    @mouseenter="handleAuthorCardMouseEnter"
    @mouseleave="handleAuthorCardMouseLeave"
  />
  
  <!-- 浮动用户卡片 - 评论区头像 -->
  <UserFloatCard
    v-model:visible="showCommentUserCard"
    :trigger-ref="commentAvatarRef"
    :user-info="currentCommentUser"
    :auto-placement="true"
    @follow-change="handleFollowChange"
    @mouseenter="handleCommentCardMouseEnter"
    @mouseleave="handleCommentCardMouseLeave"
  />

  <!-- AI助手侧边面板 -->
  <AiAssistantPanel
    v-model:visible="showAiAssistantDialog"
    :video-id="videoId"
    :video-title="videoInfo.title"
  />
</template>

<style scoped>
.video-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  padding-top: 60px;
  background-color: #fff;
  min-height: 100vh;
}

/* 浮动卡片桥接区域 - 连接头像和浮动卡片，防止鼠标断开 */
.float-card-bridge {
  position: fixed;
  background: transparent;
  z-index: 2999;
  pointer-events: auto;
}

/* 收藏夹弹窗样式 */
.favorite-folders {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 0;
}

.folder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.folder-count {
  color: #999;
  font-size: 12px;
}

.new-folder-section {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.new-folder-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  color: #23ade5;
  font-size: 14px;
}

.new-folder-btn:hover {
  color: #1a91d0;
}

.new-folder-input {
  display: flex;
  align-items: center;
  margin-top: 10px;
}


/* 主内容区域 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 顶部区域：视频标题和作者信息 */
.top-section {
  display: flex;
  gap: 40px;
  align-items: flex-start;
  width: 100%;
}

/* 左侧：视频标题和统计信息 */
.video-header {
  flex: 1;
  background-color: #fff;
  padding: 10px 0;
  margin-top: 20px;
}

.video-header .video-title {
  font-size: 28px;
  font-weight: normal;
  color: #333;
  margin-bottom: 5px;
  line-height: 1.4;
}

.video-header .video-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

/* 右侧：作者信息 */
.author-card {
  width: 350px;
  flex-shrink: 0;
  background-color: #fff;
  padding: 10px 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

/* 中间区域：视频播放器和弹幕列表 */
.player-danmu-container {
  display: flex;
  gap: 40px;
  width: 100%;
  align-items: flex-start;
}

/* 左侧内容 */
.left-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 字幕设置面板 */
.subtitle-settings-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 280px;
  background: rgba(28, 28, 28, 0.95);
  border-radius: 8px;
  padding: 16px;
  z-index: 200;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.subtitle-settings-panel .settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.subtitle-settings-panel .settings-header span {
  font-size: 16px;
  font-weight: 500;
}

.subtitle-settings-panel .setting-item {
  margin-bottom: 16px;
}

.subtitle-settings-panel .setting-label {
  display: block;
  font-size: 13px;
  color: #ccc;
  margin-bottom: 8px;
}

.subtitle-settings-panel .setting-value {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.subtitle-settings-panel .setting-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 视频播放器 */
.video-player {
  flex: 1;
  aspect-ratio: 16/9;
  background-color: #000;
  min-height: 450px;
}

/* 右侧弹幕列表 */
.side-danmu-list {
  width: 350px;
  flex-shrink: 0;
  background-color: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.side-danmu-list .danmu-list-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background-color: #f9f9f9;
}

.side-danmu-list .danmu-list-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.side-danmu-list .danmu-items {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.side-danmu-list .danmu-items.is-hidden {
  display: none;
}

/* 视频分P列表 */
.video-parts-section {
  width: 350px;
  flex-shrink: 0;
  background-color: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: 16px;
}

.video-parts-section .video-parts-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background-color: #f9f9f9;
}

.video-parts-section .video-parts-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.video-parts-section .video-parts-count {
  font-size: 12px;
  color: #999;
  margin-right: auto;
  margin-left: 8px;
}

.video-parts-section .video-parts-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.video-parts-section .video-parts-list.is-hidden {
  display: none;
}

.video-parts-section .video-part-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 10px;
}

.video-parts-section .video-part-item:hover {
  background-color: #f5f5f5;
}

.video-parts-section .video-part-item.active {
  background-color: #e3f2fd;
  color: #00a1d6;
}

.video-parts-section .video-part-item .part-index {
  font-size: 12px;
  color: #999;
  min-width: 30px;
}

.video-parts-section .video-part-item.active .part-index {
  color: #00a1d6;
}

.video-parts-section .video-part-item .part-title {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-parts-section .video-part-item.active .part-title {
  color: #00a1d6;
}

.video-parts-section .video-part-item .part-duration {
  font-size: 12px;
  color: #999;
}

/* 视频状态栏（简单版） */
.video-status-bar-simple {
  background-color: #fff;
  padding: 20px 0;
}

.video-status-bar-simple .status-info {
  display: flex;
  gap: 20px;
  padding-left: 10px;
}

.video-status-bar-simple .status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.video-status-bar-simple .status-item .el-icon {
  font-size: 16px;
}

/* 互动按钮栏 */
.interaction-bar {
  background-color: #fff;
  padding: 8px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

/* 视频简介 */
.video-description {
  background-color: #fff;
  padding: 20px 0;
}

.video-description .description-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.video-description .description-content.is-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-description .description-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #00a1d6;
  transition: all 0.3s ease;
}

.video-description .description-toggle:hover {
  color: #0091c6;
}

.video-description .description-toggle .el-icon {
  transition: transform 0.3s ease;
  font-size: 14px;
}

.video-description .description-toggle .el-icon.is-rotated {
  transform: rotate(180deg);
}

/* 视频标签栏 */
.video-tags {
  background-color: #fff;
  padding: 10px 0 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.video-tags .tags-header {
  margin-bottom: 10px;
}

.video-tags .tags-header h4 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.video-tags .tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.video-tags .tag-item {
  background-color: #f5f5f5;
  border-color: #f5f5f5;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-tags .tag-item:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #00a1d6;
}

.interaction-bar .left-actions {
  display: flex;
  gap: 15px;
}

.interaction-bar .right-actions {
  display: flex;
  gap: 10px;
}

.interaction-bar .action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 16px;
  border: none;
  background-color: #fff;
  color: #666;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.3s ease;
  min-width: 80px;
  min-height: 32px;
}

.interaction-bar .action-btn:hover {
  background-color: #f5f5f5;
  color: #00aeec;
}

.interaction-bar .action-btn.is-active {
  color: #00aeec;
  font-weight: 500;
}

.interaction-bar .action-btn.is-active:hover {
  background-color: #e6f7ff;
}

.interaction-bar .action-btn .el-icon {
  font-size: 18px;
}

.interaction-bar .action-btn span {
  font-size: 14px;
}

.interaction-bar .ai-assistant-btn {
  gap: 8px;
}

.interaction-bar .more-btn {
  padding: 6px 12px;
  min-width: 40px;
}

/* 评论区 */
.comment-section {
  background-color: #fff;
  padding: 20px 0;
  margin-top: 20px;
}

/* 评论头部 */
.comment-section .comment-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.comment-section .comment-header h3 {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

/* 排序选项 */
.comment-section .comment-sort {
  display: flex;
  gap: 20px;
}

.comment-section .sort-item {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.comment-section .sort-item:hover {
  color: #00a1d6;
}

/* 回复分页样式 */
.reply-pagination {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
}

.reply-pagination .page-info {
  margin-right: 5px;
}

.reply-pagination .page-number {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reply-pagination .page-number:hover {
  background-color: #f0f0f0;
  color: #00a1d6;
}

.reply-pagination .page-number.active {
  background-color: #00a1d6;
  color: #fff;
}

.reply-pagination .page-control {
  cursor: pointer;
  color: #00a1d6;
  transition: color 0.3s ease;
}

.reply-pagination .page-control:hover {
  color: #0091c6;
  text-decoration: underline;
}

.comment-section .sort-item.is-active {
  font-weight: 600;
  color: #333;
}

/* 评论输入框包装器 */
.comment-section .comment-input-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 30px;
}

.comment-section .comment-input-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

/* 折叠状态的输入框 */
.comment-section .comment-input-collapsed {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
}

.comment-section .comment-input-collapsed:hover {
  border-color: #00a1d6;
  background-color: #f5f5f5;
}

.comment-section .comment-input-collapsed .placeholder-text {
  color: #999;
  font-size: 14px;
}

/* 展开状态的输入框 */
.comment-section .comment-input-expanded {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  background-color: #fff;
}

/* 评论输入工具栏 */
.comment-section .comment-input-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-section .emoji-btn {
  color: #666;
  font-size: 14px;
  padding: 4px 8px;
}

.comment-section .emoji-btn:hover {
  color: #00a1d6;
  background-color: #f5f5f5;
}

/* 表情选择器 */
.comment-section .emoji-picker {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #fff;
  max-height: 200px;
  overflow-y: auto;
}

.comment-section .emoji-picker::-webkit-scrollbar {
  width: 6px;
}

.comment-section .emoji-picker::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.comment-section .emoji-picker::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.comment-section .emoji-item {
  font-size: 24px;
  cursor: pointer;
  text-align: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  user-select: none;
}

.comment-section .emoji-item:hover {
  background-color: #f5f5f5;
  transform: scale(1.2);
}

.comment-section .comment-input-expanded :deep(.el-textarea__inner) {
  border: none;
  border-radius: 0;
  resize: none;
  font-size: 14px;
  padding: 0;
}

.comment-section .comment-input-expanded :deep(.el-textarea__inner):focus {
  border: none;
  box-shadow: none;
}

.comment-section .comment-input-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

/* 评论列表 */
.comment-section .comment-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-section .comment-item {
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-section .comment-item:last-child {
  border-bottom: none;
}

.comment-section .comment-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-section .comment-content {
  flex: 1;
  min-width: 0;
}

/* 评论信息 */
.comment-section .comment-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.comment-section .comment-author {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-section .comment-time {
  font-size: 12px;
  color: #999;
}

/* 评论内容 */
.comment-section .comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10px;
  word-wrap: break-word;
}

/* 评论操作按钮 */
.comment-section .comment-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.comment-section .comment-actions .comment-time {
  font-size: 12px;
  color: #999;
  margin-right: 10px;
}

.comment-section .comment-actions .el-button {
  color: #999;
  font-size: 13px;
}

.comment-section .comment-actions .el-button:hover {
  color: #00a1d6;
}

.comment-section .comment-actions .el-icon {
  margin-right: 4px;
}

/* 回复列表 */
.comment-section .replies-list {
  margin-top: 15px;
  padding-left: 60px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 调整回复项与评论内容左边对齐 */
.comment-section .reply-item {
  margin-left: -60px;
  padding-left: 60px;
}

.comment-section .reply-item {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}

.comment-section .reply-item:last-child {
  border-bottom: none;
}

.comment-section .reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 2px;
}

.comment-section .reply-content {
  flex: 1;
  min-width: 0;
}

.comment-section .reply-author {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.comment-section .reply-time {
  font-size: 12px;
  color: #999;
  margin-right: 10px;
}

.comment-section .reply-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  word-wrap: break-word;
}

.comment-section .reply-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: nowrap;
}

.comment-section .reply-target {
  color: #00a1d6;
  margin-right: 5px;
}

.comment-section .user-link {
  color: #00a1d6;
  text-decoration: none;
}

.comment-section .user-link:hover {
  text-decoration: underline;
}

.comment-section .reply-collapse {
  margin-top: 10px;
  padding-left: 0;
  margin-left: -60px;
  text-align: left;
}

.comment-section .reply-load-more {
  margin-top: 15px;
  padding-left: 60px;
  margin-left: -60px;
  text-align: left;
}

.comment-section .reply-collapse .el-button,
.comment-section .reply-load-more .el-button {
  color: #00a1d6;
  font-size: 13px;
}

.comment-section .reply-collapse .el-button:hover,
.comment-section .reply-load-more .el-button:hover {
  color: #0091c6;
}

.comment-section .reply-actions .el-button {
  color: #999;
  font-size: 12px;
}

.comment-section .reply-actions .el-button:hover {
  color: #00a1d6;
}

/* 回复输入框 */
.comment-section .reply-input-wrapper {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 8px;
}

.comment-section .reply-input-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-section .reply-input-content {
  flex: 1;
  min-width: 0;
}

.comment-section .reply-input-content :deep(.el-textarea__inner) {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  padding: 12px;
}

.comment-section .reply-input-content :deep(.el-textarea__inner):focus {
  border-color: #00a1d6;
}

.comment-section .reply-input-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.comment-section .reply-input-actions .emoji-btn {
  color: #666;
  font-size: 13px;
}

.comment-section .reply-input-actions .emoji-btn:hover {
  color: #00a1d6;
}

/* 加载状态 */
.comment-section .loading-comments {
  padding: 20px 0;
}

/* 无评论状态 */
.comment-section .no-comments {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* 弹幕加载状态 */
.danmu-list .loading-danmus {
  padding: 20px 0;
}

/* 无弹幕状态 */
.danmu-list .no-danmus {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* 右侧内容 */
.right-section {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 作者卡片 */
.author-card {
  background-color: #fff;
  padding: 20px 0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.author-card .author-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.author-card .author-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  margin-top: 0;
  padding-top: 0;
}

.author-card .author-info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.author-card .author-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.author-card .message-btn {
  color: #666;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  background-color: transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.author-card .message-btn:hover {
  color: #00a1d6;
}

.author-card .message-btn .el-icon {
  font-size: 14px;
}

.author-card .author-bio {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* 关注按钮 */
.follow-btn {
  background-color: #00a1d6;
  border-color: #00a1d6;
  color: #fff;
  border-radius: 4px;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background-color: #0091c6;
  border-color: #0091c6;
}

/* 弹幕列表 */
.danmu-list {
  background-color: #fff;
  padding: 20px 0;
}

/* 弹幕列表头部 */
.danmu-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: 5px 0;
  transition: background-color 0.3s ease;
}

.danmu-list-header:hover {
  background-color: #f5f5f5;
}

.danmu-list-header h3 {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

/* 折叠图标 */
.collapse-icon {
  transition: transform 0.3s ease;
  font-size: 16px;
  color: #666;
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

/* 弹幕列表内容 */
.danmu-items {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 400px;
  overflow-y: auto;
  transition: all 0.3s ease;
}

/* 弹幕发送区域 */
.danmu-send-section {
  padding: 12px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #f0f0f0;
}

.danmu-send-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background-color: #00a1d6;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.danmu-send-trigger:hover {
  background-color: #0091c6;
}

.danmu-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.danmu-color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.color-option {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.2);
}

.danmu-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.danmu-input-row .el-input {
  flex: 1;
}

.danmu-list-content {
  flex: 1;
  overflow-y: auto;
}

/* 滚动条样式 */
.danmu-items::-webkit-scrollbar {
  width: 6px;
}

.danmu-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.danmu-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.danmu-items::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 表头样式 */
.danmu-header {
  display: flex;
  gap: 10px;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 0;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  position: sticky;
  top: 0;
  z-index: 10;
}

.danmu-header .header-time {
  min-width: 50px;
  text-align: left;
}

.danmu-header .header-content {
  flex: 1;
  text-align: left;
}

.danmu-header .header-send-time {
  min-width: 140px;
  text-align: right;
}

.danmu-items.is-hidden {
  display: none;
}

.danmu-item {
  display: flex;
  gap: 10px;
  font-size: 14px;
  padding: 8px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.danmu-item:hover {
  background-color: #f0f0f0;
}

.danmu-item:active {
  background-color: #e0e0e0;
  transform: scale(0.98);
}

.danmu-time {
  color: #999;
  min-width: 50px;
  font-weight: 500;
  text-align: left;
}

.danmu-text {
  color: #333;
  flex: 1;
  text-align: left;
}

.danmu-send-time {
  color: #999;
  min-width: 140px;
  font-size: 12px;
  text-align: right;
}

/* 推荐视频 */
.related-videos {
  background-color: #fff;
  padding: 20px 0;
}

.related-videos h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #333;
}

.loading-related {
  padding: 20px 0;
}

.no-related {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.related-video-item {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.related-video-item:last-child {
  margin-bottom: 0;
}

.related-video-item .video-cover {
  position: relative;
  width: 160px;
  height: 90px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 6px;
}

.related-video-item .video-cover-link {
  text-decoration: none;
  color: inherit;
  display: inline-block;
}

.related-video-item .video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.related-video-item .video-cover:hover img {
  transform: scale(1.05);
  transition: transform 0.3s;
}

.related-video-item .video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.related-video-item .video-info h4 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  pointer-events: none;
}

.related-video-item .video-title-text {
  cursor: pointer;
  transition: color 0.3s;
  pointer-events: auto;
}

.related-video-item .video-title-text:hover {
  color: #00aeec;
}

.related-video-item .video-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.related-video-item .video-author {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}

.related-video-item .video-author:hover {
  color: #00aeec;
}

.related-video-item .video-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.related-video-item .video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .right-section {
    width: 300px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }
  
  .right-section {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .video-container {
    padding: 10px;
  }
}

/* 字幕相关样式 */
.video-player-wrapper {
  position: relative;
  width: 100%;
}

.subtitle-control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-top: 10px;
  border-top: 1px solid #e0e0e0;
}

.subtitle-controls {
  display: flex;
  align-items: center;
}

.no-subtitle-tip {
  color: #999;
  font-size: 14px;
}

/* 分P列表样式 */
.video-part-list {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 16px;
  overflow: hidden;
}

.part-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.part-list-header h3 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.part-count {
  font-size: 12px;
  color: #999;
}

.part-items {
  max-height: 300px;
  overflow-y: auto;
}

.part-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.part-item:last-child {
  border-bottom: none;
}

.part-item:hover {
  background-color: #f5f5f5;
}

.part-item.is-active {
  background-color: #e6f7ff;
  border-left: 3px solid #00a1d6;
}

.part-index {
  min-width: 40px;
  font-size: 13px;
  color: #999;
  font-weight: 500;
}

.part-item.is-active .part-index {
  color: #00a1d6;
}

.part-title {
  flex: 1;
  font-size: 14px;
  color: #333;
  margin: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.part-item.is-active .part-title {
  color: #00a1d6;
  font-weight: 500;
}

.part-duration {
  font-size: 12px;
  color: #999;
  min-width: 50px;
  text-align: right;
}

/* 滚动条样式 */
.part-items::-webkit-scrollbar {
  width: 6px;
}

.part-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.part-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.part-items::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>