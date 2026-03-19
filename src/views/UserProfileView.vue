<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Bell, Clock, Edit, Upload, Message, Setting, Search, Star, Lock, View, Check, More, Grid, Plus, VideoPlay, ArrowRight, ArrowLeft, ArrowDown, List, MoreFilled, Top, Delete, Share, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userApi, videoApi, interactionApi } from '../api/index.js'
import { collectionApi } from '../api/collection.js'
import { dynamicApi } from '../api/dynamic.js'
import { getUserProfileBackground } from '../api/banner.js'
import { userPrivacyApi } from '../api/userPrivacy.js'
import api from '../api/index.js'
import CommentSystem from '../components/CommentSystem.vue'

const route = useRoute()
const router = useRouter()

// 个人信息数据
const userInfo = ref({
  username: '加载中...',
  avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
  signature: '加载中...',
  announcement: '',
  cover: 'https://picsum.photos/id/1025/1920/200',
  uid: '',
  birthday: '',
  gender: 0, // 0-保密, 1-男, 2-女
  stats: {
    following: 0,
    followers: 0,
    likes: 0,
    views: 0
  }
})

// 当前用户ID，从路由参数或本地存储获取
const userId = ref(route.params.id || JSON.parse(localStorage.getItem('user'))?.id)

// 获取当前登录用户ID
const currentUserId = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.id
})

// 判断是否是自己的空间
const isOwnSpace = computed(() => {
  return currentUserId.value && userId.value && String(currentUserId.value) === String(userId.value)
})

// 跳转到我的头像页面
const goToAvatar = () => {
  if (isOwnSpace.value) {
    router.push('/personal-center/avatar')
  }
}

// 加载用户主页背景图
const loadUserProfileBackground = async () => {
  try {
    const res = await getUserProfileBackground()
    if (res.code === 200 && res.data) {
      userInfo.value.cover = res.data.imageUrl
    }
  } catch (error) {
    console.error('获取用户主页背景图失败:', error)
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const response = await userApi.getUserById(userId.value)
    if (response.code === 200) {
      const data = response.data
      userInfo.value = {
        username: data.nickname || data.username,
        avatar: data.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        signature: data.signature || '该用户暂无简介',
        announcement: data.announcement || '',
        cover: 'https://picsum.photos/id/1025/1920/200',
        uid: data.id || '',
        birthday: data.birthdate || '',
        gender: data.gender || 0,
        stats: {
          following: data.followingCount || 0,
          followers: data.followerCount || 0,
          likes: data.totalLikeCount || 0,
          views: data.totalViewCount || 0
        }
      }
      // 加载背景图
      await loadUserProfileBackground()
      // 检查关注状态
      await checkFollowStatus()
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 保存个人签名
const saveSignature = async () => {
  try {
    const response = await userApi.updateUser(userId.value, { signature: userInfo.value.signature })
    if (response.code === 200) {
      console.log('个人签名保存成功')
    }
  } catch (error) {
    console.error('保存个人签名失败:', error)
  }
}

// 保存公告
const saveAnnouncement = async () => {
  try {
    const response = await userApi.updateUser(userId.value, { announcement: userInfo.value.announcement })
    if (response.code === 200) {
      console.log('公告保存成功')
    }
  } catch (error) {
    console.error('保存公告失败:', error)
  }
}

// 根据路由路径获取当前活跃标签
const activeTab = computed(() => {
  const path = route.path
  if (path.endsWith('/home')) return '主页'
  if (path.endsWith('/dynamic')) return '动态'
  if (path.endsWith('/submissions')) return '投稿'
  if (path.endsWith('/collections')) return '合集和列表'
  if (path.endsWith('/favorites')) return '收藏'
  if (path.endsWith('/settings')) return '设置'
  if (path.endsWith('/following')) return '关注'
  if (path.endsWith('/followers')) return '粉丝'
  if (path.endsWith('/search')) return '搜索'
  return '主页'
})

// 处理标签点击
const handleTabClick = (tab) => {
  let path = ''
  switch (tab) {
    case '主页':
      path = `/profile/${userId.value}/home`
      break
    case '动态':
      path = `/profile/${userId.value}/dynamic`
      break
    case '投稿':
      path = `/profile/${userId.value}/submissions`
      break
    case '合集和列表':
      path = `/profile/${userId.value}/collections`
      break
    case '收藏':
      path = `/profile/${userId.value}/favorites`
      break
    case '设置':
      path = `/profile/${userId.value}/settings`
      break
    case '关注':
      path = `/profile/${userId.value}/following`
      break
    case '粉丝':
      path = `/profile/${userId.value}/followers`
      break
    case '搜索':
      path = `/profile/${userId.value}/search`
      break
    default:
      path = `/profile/${userId.value}/home`
  }
  router.push(path)
}

// 关注状态
const isFollowing = ref(false)
const followLoading = ref(false)

// 检查是否已关注
const checkFollowStatus = async () => {
  if (!currentUserId.value || !userId.value || isOwnSpace.value) return
  
  try {
    const response = await userApi.checkFollow(userId.value)
    if (response.code === 200) {
      isFollowing.value = response.data === true
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
  }
}

// 处理关注/取消关注
const handleFollow = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  // 不能关注自己
  if (isOwnSpace.value) {
    ElMessage.warning('不能关注自己')
    return
  }

  if (followLoading.value) return

  try {
    followLoading.value = true
    const response = await userApi.follow(userId.value, !isFollowing.value)
    if (response.code === 200) {
      const isNowFollowing = !isFollowing.value
      isFollowing.value = isNowFollowing
      // 更新粉丝数
      if (isNowFollowing) {
        userInfo.value.stats.followers++
      } else {
        userInfo.value.stats.followers = Math.max(0, userInfo.value.stats.followers - 1)
      }
      ElMessage.success(isNowFollowing ? '关注成功' : '取消关注成功')
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    followLoading.value = false
  }
}

// 处理发消息
const handleSendMessage = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    return
  }

  // 不能给自己发消息
  if (isOwnSpace.value) {
    ElMessage.warning('不能给自己发送消息')
    return
  }

  // 跳转到消息页面，带上对方用户ID
  router.push(`/message/private?userId=${userId.value}`)
}

// 监听标签变化，加载对应数据
watch(activeTab, (newTab) => {
  if (newTab === '动态' && dynamics.value.length === 0) {
    loadUserDynamics()
  }
})

// 加载状态
const loading = ref({
  userInfo: false,
  videos: false,
  dynamics: false,
  collections: false,
  favorites: false
})

// 视频排序选项
const videoSortOption = ref('最新发布')
const sortOptions = ['最新发布', '最多播放', '最多收藏']

// 排序选项映射到API参数
const sortOptionMap = {
  '最新发布': 'latest',
  '最多播放': 'views',
  '最多收藏': 'collects'
}

// 处理排序变化
const handleSortChange = (option) => {
  console.log('【调试】handleSortChange 被调用，选项:', option)
  videoSortOption.value = option
  console.log('【调试】videoSortOption 已更新为:', videoSortOption.value)
  // 重新加载视频列表
  loadUserVideos()
}

// 处理投稿页面排序变化
const handleSubmissionsSortChange = (option) => {
  console.log('【调试】handleSubmissionsSortChange 被调用，选项:', option)
  submissions.value.activeSort = option
  // 同步更新主页的排序选项
  videoSortOption.value = option
  console.log('【调试】投稿页和主页排序已更新为:', option)
  // 重新加载视频列表
  loadUserVideos()
}

// 视频数据
const representativeVideos = ref([])
const allVideos = ref([])

// 代表作视图切换：'fan' 粉丝看到1条, 'visitor' 访客看到3条
const representativeViewMode = ref('fan')

// 动态数据
const dynamics = ref([])

// 评论展开状态管理
const expandedComments = ref(new Set())

// 展开状态管理
const expandedDynamics = ref(new Set())

// 切换展开状态
const toggleExpand = (dynamicId) => {
  if (expandedDynamics.value.has(dynamicId)) {
    expandedDynamics.value.delete(dynamicId)
  } else {
    expandedDynamics.value.add(dynamicId)
  }
}

// 处理置顶
const handleStickDynamic = async (dynamicId) => {
  try {
    const dynamic = dynamics.value.find(d => d.id === dynamicId)
    if (dynamic) {
      dynamic.isTop = !dynamic.isTop
      // 重新排序：置顶的排在前面
      dynamics.value.sort((a, b) => {
        if (a.isTop === b.isTop) {
          return new Date(b.createTime) - new Date(a.createTime)
        }
        return a.isTop ? -1 : 1
      })
      ElMessage.success(dynamic.isTop ? '置顶成功' : '取消置顶成功')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 处理删除
const handleDeleteDynamic = async (dynamicId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条动态吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    dynamics.value = dynamics.value.filter(d => d.id !== dynamicId)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 处理点赞
const handleLikeDynamic = async (dynamic) => {
  try {
    if (dynamic.stats.isLiked) {
      // 取消点赞
      const res = await dynamicApi.unlikeDynamic(dynamic.id)
      if (res.code === 200) {
        // 使用后端返回的真实数据
        dynamic.stats.isLiked = res.data?.isLiked ?? false
        dynamic.stats.likeCount = res.data?.likeCount ?? 0
        ElMessage.success('取消点赞成功')
      } else {
        ElMessage.error(res.message || '取消点赞失败')
      }
    } else {
      // 点赞
      const res = await dynamicApi.likeDynamic(dynamic.id)
      if (res.code === 200) {
        // 使用后端返回的真实数据
        dynamic.stats.isLiked = res.data?.isLiked ?? true
        dynamic.stats.likeCount = res.data?.likeCount ?? 0
        ElMessage.success('点赞成功')
      } else {
        ElMessage.error(res.message || '点赞失败')
      }
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 切换评论展开状态
const toggleComments = (dynamic) => {
  const dynamicId = dynamic.id
  if (expandedComments.value.has(dynamicId)) {
    expandedComments.value.delete(dynamicId)
  } else {
    expandedComments.value.add(dynamicId)
  }
}

// 格式化时间
const formatDynamicTime = (timeStr) => {
  const date = new Date(timeStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}月${day}日`
}

// 收藏数据
const favorites = ref({
  activeCategory: '默认收藏夹',
  myCollectionsExpanded: true,
  myCollections: [],
  myFavorites: [],
  videos: [],
  sortOptions: ['最新收藏', '最早收藏'],
  activeSort: '最新收藏',
  searchKeyword: ''
})

// 新建收藏夹对话框
const createFavoriteDialogVisible = ref(false)
const newFavoriteName = ref('')
const newFavoriteDescription = ref('')
const newFavoriteIsPublic = ref(true)
const newFavoriteCover = ref('')
const creatingFavorite = ref(false)

// 合集数据
const collections = ref({
  viewType: 'horizontal', // horizontal-水平列表, grid-宫格
  items: [],
  loading: false
})

// 新建合集对话框
const createCollectionDialogVisible = ref(false)
const createCollectionForm = ref({
  name: '',
  description: '',
  cover: null,
  coverUrl: '',
  isPublic: true
})
const creatingCollection = ref(false)

// 编辑合集对话框
const editCollectionDialogVisible = ref(false)
const editCollectionForm = ref({
  id: null,
  name: '',
  description: '',
  cover: null,
  coverUrl: '',
  isPublic: true
})
const updatingCollection = ref(false)

// 添加视频到合集对话框
const addVideoDialogVisible = ref(false)
const addVideoSearchKeyword = ref('')
const addVideoSortBy = ref('newest') // newest-最新发布, oldest-最早发布
const userVideos = ref([])
const selectedVideos = ref([])
const addVideoLoading = ref(false)
const currentCollectionId = ref(null) // 当前正在添加视频的合集ID

// 新建合集选择视频对话框
const createCollectionVideoDialogVisible = ref(false)
const createCollectionSelectedVideos = ref([])

// 合集详情数据（用于在当前页面内展示）
const collectionDetail = ref({
  visible: false,
  collectionId: null,
  collection: null,
  manuscripts: [],
  loading: false,
  pagination: {
    currentPage: 1,
    pageSize: 20,
    total: 0
  },
  sortBy: 'default' // default-默认, newest-最新, oldest-最早
})

// 投稿数据
const submissions = ref({
  categories: [
    { name: '视频', count: 0 },
    { name: '动态', count: 0 }
  ],
  videos: [],
  activeCategory: '视频',
  activeSort: '最新发布',
  sortOptions: ['最新发布', '最多播放', '最多收藏'],
  viewType: 'grid',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  }
})

// 视频搜索相关数据
const videoSearch = ref({
  keyword: '',
  activeCategory: '视频',
  activeSort: '最新发布',
  sortOptions: ['最新发布', '最多播放', '最多收藏'],
  searchResults: [],
  totalCount: 0,
  loading: false,
  viewType: 'grid'
})

// 搜索分类
const searchCategories = ref([
  { name: '视频', count: 0 },
  { name: '动态', count: 0 }
])

// 关注/粉丝列表数据
const followList = ref({
  activeSidebar: 'following', // 'following' | 'followers'
  filterType: 'all', // 'all' | 'recent' | 'frequent'
  searchKeyword: '',
  followingList: [],
  followersList: [],
  loading: false
})

// 隐私设置数据
const privacySettings = ref({
  publicCollection: true,
  publicBirthdayTags: false,
  publicCoinVideos: false,
  publicLikeVideos: false,
  publicFollowingList: false,
  publicFollowersList: false
})

// 用户标签
const userTags = ref([])
const newTagInput = ref('')

// 加载隐私设置
const loadPrivacySettings = async () => {
  if (!isOwnSpace.value) return
  try {
    const res = await userPrivacyApi.getPrivacySettings()
    if (res.code === 200) {
      privacySettings.value = {
        publicCollection: res.data.publicCollection ?? true,
        publicBirthdayTags: res.data.publicBirthdayTags ?? false,
        publicCoinVideos: res.data.publicCoinVideos ?? false,
        publicLikeVideos: res.data.publicLikeVideos ?? false,
        publicFollowingList: res.data.publicFollowingList ?? false,
        publicFollowersList: res.data.publicFollowersList ?? false
      }
      userTags.value = res.data.tags || []
    }
  } catch (error) {
    console.error('加载隐私设置失败:', error)
  }
}

// 处理隐私设置变更
const handlePrivacyChange = async (key, value) => {
  try {
    const data = { [key]: value }
    const res = await userPrivacyApi.updatePrivacySettings(data)
    if (res.code === 200) {
      ElMessage.success('设置已保存')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存隐私设置失败:', error)
    ElMessage.error('保存失败')
  }
}

// 添加标签
const handleAddTag = async () => {
  const tagName = newTagInput.value.trim()
  if (!tagName) return
  if (userTags.value.includes(tagName)) {
    ElMessage.warning('标签已存在')
    return
  }
  if (userTags.value.length >= 10) {
    ElMessage.warning('最多只能添加10个标签')
    return
  }
  try {
    const res = await userPrivacyApi.addUserTag(tagName)
    if (res.code === 200) {
      userTags.value.push(tagName)
      newTagInput.value = ''
      ElMessage.success('添加成功')
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error) {
    console.error('添加标签失败:', error)
    ElMessage.error('添加失败')
  }
}

// 删除标签
const handleRemoveTag = async (tag) => {
  try {
    const res = await userPrivacyApi.removeUserTag(tag)
    if (res.code === 200) {
      userTags.value = userTags.value.filter(t => t !== tag)
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除标签失败:', error)
    ElMessage.error('删除失败')
  }
}

// 切换关注/粉丝侧边栏
const handleSidebarClick = (type) => {
  followList.value.activeSidebar = type
  if (type === 'following') {
    router.push(`/profile/${userId.value}/following`)
  } else {
    router.push(`/profile/${userId.value}/followers`)
  }
}

// 处理关注/粉丝筛选变化
const handleFollowFilterChange = (filterType) => {
  followList.value.filterType = filterType
  // TODO: 根据筛选类型重新加载数据
}

// 处理关注/粉丝搜索
const handleFollowSearch = () => {
  // TODO: 实现搜索功能
  console.log('搜索关键词:', followList.value.searchKeyword)
}

// 关注/取消关注用户
const handleFollowUser = async (targetUserId, isFollowing) => {
  try {
    const response = await userApi.follow(targetUserId, !isFollowing)
    if (response.code === 200) {
      // 更新本地状态
      const targetUser = followList.value.followersList.find(u => u.id === targetUserId)
      if (targetUser) {
        targetUser.isFollowing = !isFollowing
      }
      // 同时更新关注列表中的状态
      const followingUser = followList.value.followingList.find(u => u.id === targetUserId)
      if (followingUser) {
        followingUser.isFollowing = !isFollowing
      }
      ElMessage.success(isFollowing ? '已取消关注' : '关注成功')
      // 刷新用户统计信息
      await loadUserInfo()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 加载关注列表
const loadFollowingList = async () => {
  followList.value.loading = true
  try {
    const response = await userApi.getFollowingList(userId.value)
    if (response.code === 200) {
      followList.value.followingList = response.data.map(user => ({
        id: user.id,
        nickname: user.nickname || user.username,
        avatar: user.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        signature: user.signature || '这个人没有填简介啊~~~',
        isFollowing: true
      }))
    } else {
      followList.value.followingList = []
      ElMessage.error(response.message || '获取关注列表失败')
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
    followList.value.followingList = []
    ElMessage.error('获取关注列表失败')
  } finally {
    followList.value.loading = false
  }
}

// 加载粉丝列表
const loadFollowersList = async () => {
  followList.value.loading = true
  try {
    const response = await userApi.getFollowerList(userId.value)
    if (response.code === 200) {
      // 获取当前登录用户的关注列表，用于判断粉丝是否被关注
      let currentUserFollowingIds = []
      if (currentUserId.value) {
        try {
          const followingResponse = await userApi.getFollowingList(currentUserId.value)
          if (followingResponse.code === 200) {
            currentUserFollowingIds = followingResponse.data.map(u => u.id)
          }
        } catch (e) {
          console.error('获取当前用户关注列表失败:', e)
        }
      }

      followList.value.followersList = response.data.map(user => ({
        id: user.id,
        nickname: user.nickname || user.username,
        avatar: user.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
        signature: user.signature || '这个人没有填简介啊~~~',
        isFollowing: currentUserFollowingIds.includes(user.id)
      }))
    } else {
      followList.value.followersList = []
      ElMessage.error(response.message || '获取粉丝列表失败')
    }
  } catch (error) {
    console.error('获取粉丝列表失败:', error)
    followList.value.followersList = []
    ElMessage.error('获取粉丝列表失败')
  } finally {
    followList.value.loading = false
  }
}

// 处理视频搜索
const handleVideoSearch = async () => {
  if (!videoSearch.value.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  videoSearch.value.loading = true
  try {
    // 调用搜索API
    const response = await videoApi.searchUserVideos(userId.value, videoSearch.value.keyword, sortOptionMap[videoSearch.value.activeSort])
    if (response.code === 200) {
      videoSearch.value.searchResults = response.data.map(video => ({
        ...video,
        date: formatDate(video.uploadTime)
      }))
      videoSearch.value.totalCount = response.data.length
    }
  } catch (error) {
    console.error('搜索视频失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    videoSearch.value.loading = false
  }
}

// 处理搜索排序变化
const handleSearchSortChange = (option) => {
  videoSearch.value.activeSort = option
  // 重新搜索
  if (videoSearch.value.keyword.trim()) {
    handleVideoSearch()
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 加载用户视频列表
const loadUserVideos = async () => {
  if (!userId.value) return
  
  loading.value.videos = true
  try {
    // 获取当前排序参数
    const sortParam = sortOptionMap[videoSortOption.value] || 'latest'
    console.log('【调试】当前排序选项:', videoSortOption.value)
    console.log('【调试】映射后的排序参数:', sortParam)
    console.log('【调试】用户ID:', userId.value)
    
    const response = await videoApi.getVideosByUserId(userId.value, sortParam)
    console.log('【调试】API响应:', response)
    
    if (response.code === 200) {
      // 处理视频数据，添加date字段
      const videos = response.data.map(video => {
        return {
          ...video,
          date: formatDate(video.uploadTime)
        }
      })
      
      console.log('【调试】获取到的视频数量:', videos.length)
      console.log('【调试】视频列表（前3个）:', videos.slice(0, 3).map(v => ({
        id: v.id,
        title: v.title,
        viewCount: v.viewCount,
        collectCount: v.collectCount,
        uploadTime: v.uploadTime
      })))
      
      allVideos.value = videos
      // 取前3个作为代表作
      representativeVideos.value = videos.slice(0, 3)
      // 更新投稿视频计数
      submissions.value.categories[0].count = videos.length
      submissions.value.videos = videos
      submissions.value.pagination.totalItems = videos.length
    }
  } catch (error) {
    console.error('【调试】获取用户视频失败:', error)
  } finally {
    loading.value.videos = false
  }
}

// 加载用户动态
const loadUserDynamics = async () => {
  if (!userId.value) return

  loading.value.dynamics = true
  try {
    const res = await dynamicApi.getUserDynamics(userId.value, 1, 20)
    if (res.code === 200) {
      // 后端返回的是 DynamicVO，直接映射到前端格式
      dynamics.value = (res.data || []).map(item => ({
        id: item.id,
        type: item.dynamicType === 2 ? 'video' : (item.dynamicType === 1 ? 'original' : 'original'),
        user: item.user ? {
          id: item.user.id,
          name: item.user.nickname || item.user.username,
          avatar: item.user.avatar
        } : {
          id: userId.value,
          name: userInfo.value.username,
          avatar: userInfo.value.avatar
        },
        createTime: item.createdAt,
        content: item.content,
        isTop: false,
        images: item.imageUrls || [],
        video: item.refVideoId ? {
          id: item.refVideoId,
          title: '引用视频',
          cover: '',
          duration: '',
          views: 0
        } : null,
        stats: {
          shareCount: item.shareCount || 0,
          commentCount: item.commentCount || 0,
          likeCount: item.likeCount || 0,
          isLiked: item.isLiked || false
        }
      }))
    }
  } catch (error) {
    console.error('加载用户动态失败:', error)
  } finally {
    loading.value.dynamics = false
  }
}

// 加载用户收藏
const loadUserFavorites = async () => {
  if (!userId.value) return
  
  loading.value.favorites = true
  try {
    const response = await api.get(`/video/user/${userId.value}/collections`)
    if (response.code === 200) {
      favorites.value.videos = response.data
    }
  } catch (error) {
    console.error('获取用户收藏失败:', error)
  } finally {
    loading.value.favorites = false
  }
}

// 加载收藏夹视频列表
const loadFavoriteFolderVideos = async (folderId) => {
  loading.value.favorites = true
  try {
    const response = await interactionApi.getFavoriteFolderVideos(folderId)
    if (response.code === 200) {
      // 处理视频数据，添加date字段
      const videos = response.data.map(video => {
        return {
          ...video,
          date: formatDate(video.createdAt || video.collectTime)
        }
      })
      favorites.value.videos = videos
    }
  } catch (error) {
    console.error('获取收藏夹视频失败:', error)
  } finally {
    loading.value.favorites = false
  }
}

// 获取收藏夹封面
const getFavoriteFolderCover = (videos) => {
  if (!videos || videos.length === 0) {
    return 'https://picsum.photos/id/1025/400/225' // 默认封面
  }
  // 返回最新收藏的视频封面
  return videos[0].coverUrl || videos[0].cover || 'https://picsum.photos/id/1025/400/225'
}

// 加载收藏夹列表
const loadFavoriteFolders = async () => {
  try {
    const response = await interactionApi.getFavoriteFolders()
    if (response.code === 200) {
      // 获取用户创建的收藏夹
      const userFolders = (response.data || []).map(folder => ({
        id: folder.id,
        name: folder.name,
        count: folder.videoCount || 0,
        icon: '📁'
      }))
      
      // 检查是否存在默认收藏夹
      const hasDefaultFolder = userFolders.some(folder => folder.name === '默认收藏夹')
      
      // 如果不存在默认收藏夹，添加一个
      if (!hasDefaultFolder) {
        userFolders.unshift({
          id: 0,
          name: '默认收藏夹',
          count: 0,
          icon: '📁'
        })
      } else {
        // 如果存在默认收藏夹，将其移到最前面
        const defaultFolderIndex = userFolders.findIndex(folder => folder.name === '默认收藏夹')
        if (defaultFolderIndex > 0) {
          const defaultFolder = userFolders.splice(defaultFolderIndex, 1)[0]
          userFolders.unshift(defaultFolder)
        }
      }
      
      favorites.value.myCollections = userFolders
      // 清空 myFavorites，因为默认收藏夹已经包含在 myCollections 中
      favorites.value.myFavorites = []
      
      // 根据当前选中的收藏夹加载视频列表
      const activeFolder = userFolders.find(folder => folder.name === favorites.value.activeCategory)
      if (activeFolder) {
        await loadFavoriteFolderVideos(activeFolder.id)
      }
    }
  } catch (error) {
    console.error('加载收藏夹列表失败:', error)
  }
}

// 打开新建收藏夹对话框
const openCreateFavoriteDialog = () => {
  console.log('openCreateFavoriteDialog 函数被调用')
  newFavoriteName.value = ''
  newFavoriteDescription.value = ''
  newFavoriteIsPublic.value = true
  newFavoriteCover.value = ''
  console.log('设置 createFavoriteDialogVisible 为 true')
  createFavoriteDialogVisible.value = true
  console.log('createFavoriteDialogVisible 的值:', createFavoriteDialogVisible.value)
}

// 处理封面上传
const handleCoverUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 这里可以添加文件上传逻辑，目前只是简单处理
    const reader = new FileReader()
    reader.onload = (e) => {
      newFavoriteCover.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 创建收藏夹
const createFavoriteFolder = async () => {
  console.log('createFavoriteFolder 函数被调用')
  if (!newFavoriteName.value.trim()) {
    console.log('收藏夹名称为空')
    ElMessage.warning('请输入收藏夹名称')
    return
  }
  
  console.log('收藏夹名称:', newFavoriteName.value)
  creatingFavorite.value = true
  try {
    console.log('开始调用 interactionApi.createFavoriteFolder')
    const response = await interactionApi.createFavoriteFolder({
      name: newFavoriteName.value
    })
    console.log('interactionApi.createFavoriteFolder 调用成功:', response)
    if (response.code === 200) {
      console.log('创建成功')
      ElMessage.success('创建成功')
      createFavoriteDialogVisible.value = false
      newFavoriteName.value = ''
      newFavoriteDescription.value = ''
      newFavoriteIsPublic.value = true
      newFavoriteCover.value = ''
      // 重新加载收藏夹列表
      console.log('开始调用 loadFavoriteFolders')
      await loadFavoriteFolders()
      console.log('loadFavoriteFolders 调用成功')
    } else {
      console.log('创建失败，response.code:', response.code)
      ElMessage.error('创建失败')
    }
  } catch (error) {
    console.error('创建收藏夹失败:', error)
    ElMessage.error('创建收藏夹失败')
  } finally {
    console.log('finally 块执行')
    creatingFavorite.value = false
  }
}

// 编辑收藏夹对话框
const editFavoriteDialogVisible = ref(false)
const editingFavorite = ref(null)
const editingFavoriteName = ref('')
const updatingFavorite = ref(false)

// 打开编辑收藏夹对话框
const openEditFavoriteDialog = (favorite) => {
  editingFavorite.value = favorite
  editingFavoriteName.value = favorite.name
  editFavoriteDialogVisible.value = true
}

// 更新收藏夹
const updateFavoriteFolder = async () => {
  if (!editingFavoriteName.value.trim()) {
    ElMessage.warning('请输入收藏夹名称')
    return
  }

  updatingFavorite.value = true
  try {
    const response = await interactionApi.updateFavoriteFolder(editingFavorite.value.id, editingFavoriteName.value)
    if (response.code === 200) {
      ElMessage.success('更新成功')
      editFavoriteDialogVisible.value = false
      await loadFavoriteFolders()
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新收藏夹失败:', error)
    ElMessage.error('更新收藏夹失败')
  } finally {
    updatingFavorite.value = false
  }
}

// 删除收藏夹
const deleteFavoriteFolder = async (favorite) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除收藏夹"${favorite.name}"吗？删除后无法恢复。`,
      '删除收藏夹',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await interactionApi.deleteFavoriteFolder(favorite.id)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      await loadFavoriteFolders()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除收藏夹失败:', error)
      ElMessage.error('删除收藏夹失败')
    }
  }
}

// 加载用户的合集列表
const loadUserCollections = async () => {
  if (!userId.value) return

  collections.value.loading = true
  try {
    console.log('开始获取合集列表，用户ID:', userId.value)
    const response = await collectionApi.getUserCollections(userId.value, 1, 100)
    console.log('获取合集列表响应:', response)
    if (response.code === 200) {
      const list = response.data || []
      console.log('合集列表:', list)
      // 为每个合集加载视频
      for (const collection of list) {
        console.log('处理合集:', collection.id, collection.title)
        try {
          const videoResponse = await collectionApi.getCollectionManuscripts(collection.id, 1, 10)
          console.log('合集', collection.id, '的稿件响应:', videoResponse)
          if (videoResponse.code === 200) {
            collection.videos = (videoResponse.data || []).map(video => ({
              ...video,
              date: formatDate(video.uploadTime)
            }))
            console.log('合集', collection.id, '的视频列表:', collection.videos)
          }
        } catch (e) {
          console.error('获取合集', collection.id, '的稿件失败:', e)
          collection.videos = []
        }
      }
      collections.value.items = list
      console.log('最终合集数据:', collections.value.items)
    }
  } catch (error) {
    console.error('获取合集列表失败:', error)
  } finally {
    collections.value.loading = false
  }
}

// 打开新建合集对话框
const openCreateCollectionDialog = () => {
  createCollectionForm.value = {
    name: '',
    description: '',
    cover: null,
    coverUrl: '',
    isPublic: true
  }
  createCollectionSelectedVideos.value = []
  createCollectionDialogVisible.value = true
}

// 打开编辑合集对话框
const openEditCollectionDialog = () => {
  if (!collectionDetail.value.collection) return
  
  editCollectionForm.value = {
    id: collectionDetail.value.collectionId,
    name: collectionDetail.value.collection.title || '',
    description: collectionDetail.value.collection.description || '',
    cover: null,
    coverUrl: collectionDetail.value.collection.coverUrl || '',
    isPublic: collectionDetail.value.collection.status === 1
  }
  editCollectionDialogVisible.value = true
}

// 处理编辑合集封面上传
const handleEditCollectionCoverChange = (file) => {
  const isJPG = file.raw.type === 'image/jpeg'
  const isPNG = file.raw.type === 'image/png'
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('封面图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!')
    return false
  }

  editCollectionForm.value.cover = file.raw
  editCollectionForm.value.coverUrl = URL.createObjectURL(file.raw)
  return false
}

// 更新合集
const handleUpdateCollection = async () => {
  if (!editCollectionForm.value.name.trim()) {
    ElMessage.warning('请输入合集名称')
    return
  }

  updatingCollection.value = true
  try {
    const response = await collectionApi.updateCollection(editCollectionForm.value.id, {
      name: editCollectionForm.value.name,
      description: editCollectionForm.value.description,
      cover: editCollectionForm.value.cover,
      isPublic: editCollectionForm.value.isPublic
    })

    if (response.code === 200) {
      ElMessage.success('更新成功')
      editCollectionDialogVisible.value = false
      // 刷新合集详情和列表
      loadCollectionDetailData()
      loadUserCollections()
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新合集失败:', error)
    ElMessage.error('更新失败')
  } finally {
    updatingCollection.value = false
  }
}

// 处理合集封面上传
const handleCollectionCoverChange = (file) => {
  const isJPG = file.raw.type === 'image/jpeg'
  const isPNG = file.raw.type === 'image/png'
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('封面图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!')
    return false
  }

  createCollectionForm.value.cover = file.raw
  createCollectionForm.value.coverUrl = URL.createObjectURL(file.raw)
  return false
}

// 创建合集
const handleCreateCollection = async () => {
  if (!createCollectionForm.value.name.trim()) {
    ElMessage.warning('请输入合集名称')
    return
  }

  creatingCollection.value = true
  try {
    const response = await collectionApi.createCollection({
      name: createCollectionForm.value.name,
      description: createCollectionForm.value.description,
      cover: createCollectionForm.value.cover,
      isPublic: createCollectionForm.value.isPublic
    })

    if (response.code === 200 && response.data?.id) {
      const newCollectionId = response.data.id

      // 如果有选中的视频，添加到合集
      if (createCollectionSelectedVideos.value.length > 0) {
        const addPromises = createCollectionSelectedVideos.value.map((videoId, index) => {
          return collectionApi.addManuscriptToCollection(newCollectionId, videoId, index)
        })
        await Promise.all(addPromises)
      }

      ElMessage.success('创建成功')
      createCollectionDialogVisible.value = false
      loadUserCollections()
    } else {
      ElMessage.error(response.message || '创建失败')
    }
  } catch (error) {
    console.error('创建合集失败:', error)
    ElMessage.error('创建合集失败')
  } finally {
    creatingCollection.value = false
  }
}

// 打开添加视频对话框
const openAddVideoDialog = async (collectionId) => {
  currentCollectionId.value = collectionId
  addVideoSearchKeyword.value = ''
  addVideoSortBy.value = 'newest'
  selectedVideos.value = []
  addVideoDialogVisible.value = true
  await loadUserVideosForSelection()
}

// 加载用户视频供选择
const loadUserVideosForSelection = async () => {
  addVideoLoading.value = true
  try {
    // 获取当前合集已有的稿件ID列表
    const collectionResponse = await collectionApi.getCollectionManuscripts(currentCollectionId.value, 1, 100)
    if (collectionResponse.code === 200) {
      const manuscripts = collectionResponse.data || []
      // 从稿件中获取对应的 videoId（通过 manuscriptId 关联）
      // 注意：这里需要后端返回 videoId，或者前端自己维护映射关系
      // 暂时先用 manuscriptId 作为 selectedVideos
      selectedVideos.value = manuscripts.map(m => m.id)
      console.log('当前合集中的稿件IDs:', selectedVideos.value)
    }

    // 获取用户所有视频（稿件）
    const response = await videoApi.getVideosByUserId(currentUserId.value, 'latest')
    if (response.code === 200) {
      userVideos.value = (response.data || [])
        .map(video => ({
          ...video,
          date: formatDate(video.uploadTime)
        }))
      console.log('用户所有视频:', userVideos.value)
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    addVideoLoading.value = false
  }
}

// 搜索视频
const handleSearchVideos = () => {
  if (!addVideoSearchKeyword.value.trim()) {
    loadUserVideosForSelection()
    return
  }

  const keyword = addVideoSearchKeyword.value.toLowerCase()
  loadUserVideosForSelection().then(() => {
    userVideos.value = userVideos.value.filter(v =>
      v.title.toLowerCase().includes(keyword)
    )
  })
}

// 处理排序变化
const handleVideoSortChange = (sortType) => {
  addVideoSortBy.value = sortType
  if (sortType === 'newest') {
    userVideos.value.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
  } else if (sortType === 'oldest') {
    userVideos.value.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime))
  }
}

// 添加选中的视频到合集
const handleAddVideosToCollection = async () => {
  console.log('开始更新合集视频，当前合集ID:', currentCollectionId.value)
  console.log('选中的视频IDs:', selectedVideos.value)

  try {
    // 获取当前合集中已有的稿件
    const collectionResponse = await collectionApi.getCollectionManuscripts(currentCollectionId.value, 1, 100)
    let existingManuscriptIds = []
    if (collectionResponse.code === 200) {
      existingManuscriptIds = (collectionResponse.data || []).map(m => m.id)
    }
    console.log('当前合集中已有的稿件IDs:', existingManuscriptIds)

    // 计算需要添加和移除的稿件
    const toAdd = selectedVideos.value.filter(id => !existingManuscriptIds.includes(id))
    const toRemove = existingManuscriptIds.filter(id => !selectedVideos.value.includes(id))

    console.log('需要添加的稿件:', toAdd)
    console.log('需要移除的稿件:', toRemove)

    // 执行添加操作
    const addPromises = toAdd.map((manuscriptId, index) => {
      return collectionApi.addManuscriptToCollection(
        currentCollectionId.value,
        manuscriptId,
        existingManuscriptIds.length + index
      )
    })

    // 执行移除操作
    const removePromises = toRemove.map(manuscriptId => {
      return collectionApi.removeManuscriptFromCollection(
        currentCollectionId.value,
        manuscriptId
      )
    })

    // 等待所有操作完成
    await Promise.all([...addPromises, ...removePromises])

    console.log('更新合集视频成功')
    ElMessage.success('更新成功')
    addVideoDialogVisible.value = false
    loadUserCollections()
  } catch (error) {
    console.error('更新合集视频失败:', error)
    ElMessage.error('更新失败: ' + (error.response?.data?.message || error.message))
  }
}

// 在当前页面内显示合集详情
const goToCollectionDetail = (collectionId) => {
  collectionDetail.value.collectionId = collectionId
  collectionDetail.value.visible = true
  loadCollectionDetailData()
}

// 返回合集列表
const backToCollectionsList = () => {
  collectionDetail.value.visible = false
  collectionDetail.value.collectionId = null
  collectionDetail.value.collection = null
  collectionDetail.value.manuscripts = []
}

// 加载合集详情数据
const loadCollectionDetailData = async () => {
  if (!collectionDetail.value.collectionId) return

  collectionDetail.value.loading = true
  try {
    // 加载合集信息
    const collectionResponse = await collectionApi.getCollectionById(collectionDetail.value.collectionId)
    if (collectionResponse.code === 200) {
      collectionDetail.value.collection = collectionResponse.data
    }

    // 加载稿件列表
    const manuscriptsResponse = await collectionApi.getCollectionManuscripts(
      collectionDetail.value.collectionId,
      collectionDetail.value.pagination.currentPage,
      collectionDetail.value.pagination.pageSize
    )
    if (manuscriptsResponse.code === 200) {
      // API返回的是数组，不是分页对象
      const manuscripts = manuscriptsResponse.data || []
      collectionDetail.value.manuscripts = manuscripts
      collectionDetail.value.pagination.total = manuscripts.length
    }
  } catch (error) {
    console.error('获取合集详情失败:', error)
    ElMessage.error('获取合集详情失败')
  } finally {
    collectionDetail.value.loading = false
  }
}

// 处理合集详情分页变化
const handleCollectionDetailPageChange = (page) => {
  collectionDetail.value.pagination.currentPage = page
  loadCollectionDetailData()
}

// 处理合集详情每页数量变化
const handleCollectionDetailSizeChange = (size) => {
  collectionDetail.value.pagination.pageSize = size
  collectionDetail.value.pagination.currentPage = 1
  loadCollectionDetailData()
}

// 处理合集详情排序变化
const handleCollectionDetailSortChange = (value) => {
  collectionDetail.value.sortBy = value
  // 根据排序方式重新排序稿件
  if (value === 'newest') {
    // 按上传时间降序（最新的在前面）
    collectionDetail.value.manuscripts.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
  } else if (value === 'oldest') {
    // 按上传时间升序（最早的在前面）
    collectionDetail.value.manuscripts.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime))
  } else {
    // 默认排序，重新加载
    loadCollectionDetailData()
  }
}

// 播放稿件
const playManuscript = (manuscript) => {
  if (manuscript.id) {
    router.push(`/manuscript/${manuscript.id}`)
  }
}

// 播放合集全部视频
const playCollectionAll = () => {
  if (collectionDetail.value.manuscripts.length > 0) {
    router.push(`/manuscript/${collectionDetail.value.manuscripts[0].id}`)
  } else {
    ElMessage.info('该合集暂无视频')
  }
}

// 从合集列表播放全部视频
const playCollectionAllFromList = (collection) => {
  if (collection.videos && collection.videos.length > 0) {
    router.push(`/manuscript/${collection.videos[0].id}`)
  } else {
    ElMessage.info('该合集暂无视频')
  }
}

// 播放TA的视频（主页视频列表）
const playAllVideos = () => {
  if (allVideos.value.length > 0) {
    router.push(`/manuscript/${allVideos.value[0].id}`)
  } else {
    ElMessage.info('暂无视频')
  }
}

// 播放投稿视频
const playAllSubmissions = () => {
  if (submissions.value.videos.length > 0) {
    router.push(`/manuscript/${submissions.value.videos[0].id}`)
  } else {
    ElMessage.info('暂无投稿视频')
  }
}

// 跳转到投稿页面
const goToSubmissions = () => {
  router.push(`/profile/${userId.value}/submissions`)
}

// 播放搜索视频
const playAllSearchVideos = () => {
  if (videoSearch.value.searchResults.length > 0) {
    router.push(`/manuscript/${videoSearch.value.searchResults[0].id}`)
  } else {
    ElMessage.info('暂无视频')
  }
}

// 播放收藏视频
const playAllFavorites = () => {
  if (favorites.value.videos.length > 0) {
    router.push(`/manuscript/${favorites.value.videos[0].id}`)
  } else {
    ElMessage.info('暂无收藏视频')
  }
}

// 打开添加视频到合集对话框
const openAddVideoToCollectionDialog = () => {
  // 复用现有的添加视频对话框逻辑
  openAddVideoDialog(collectionDetail.value.collectionId)
}

// 处理合集操作命令
const handleCollectionCommand = (command) => {
  if (command === 'delete') {
    ElMessageBox.confirm('确定要删除这个视频列表吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      deleteCollection(collectionDetail.value.collectionId)
    }).catch(() => {})
  }
}

// 删除合集
const deleteCollection = async (collectionId) => {
  try {
    const response = await collectionApi.deleteCollection(collectionId)
    if (response.code === 200) {
      ElMessage.success('删除成功')
      backToCollectionsList()
      loadUserCollections()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除合集失败:', error)
    ElMessage.error('删除失败')
  }
}

// 处理视频操作命令
const handleVideoCommand = (command, manuscript) => {
  if (command === 'remove') {
    ElMessageBox.confirm('确定要从列表中移除这个视频吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      removeVideoFromCollection(manuscript.id)
    }).catch(() => {})
  }
}

// 从合集中移除视频
const removeVideoFromCollection = async (manuscriptId) => {
  try {
    const response = await collectionApi.removeManuscripts(
      collectionDetail.value.collectionId,
      [manuscriptId]
    )
    if (response.code === 200) {
      ElMessage.success('移除成功')
      loadCollectionDetailData()
    } else {
      ElMessage.error(response.message || '移除失败')
    }
  } catch (error) {
    console.error('移除视频失败:', error)
    ElMessage.error('移除失败')
  }
}

// 格式化数字（如：1.8万）
const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 获取默认封面
const getDefaultCover = () => {
  return 'https://picsum.photos/id/1025/400/225'
}

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 打开新建合集选择视频对话框
const openCreateCollectionVideoDialog = async () => {
  if (!createCollectionForm.value.name.trim()) {
    ElMessage.warning('请先输入合集名称')
    return
  }
  createCollectionSelectedVideos.value = []
  addVideoSearchKeyword.value = ''
  addVideoSortBy.value = 'newest'
  await loadUserVideosForCreateCollection()
  createCollectionVideoDialogVisible.value = true
}

// 加载用户视频供新建合集选择
const loadUserVideosForCreateCollection = async () => {
  addVideoLoading.value = true
  try {
    const response = await videoApi.getVideosByUserId(currentUserId.value, 'latest')
    if (response.code === 200) {
      userVideos.value = (response.data || []).map(video => ({
        ...video,
        date: formatDate(video.uploadTime)
      }))
    }
  } catch (error) {
    console.error('获取用户视频失败:', error)
  } finally {
    addVideoLoading.value = false
  }
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  console.log('路由参数变化，新的用户ID:', newId)
  userId.value = newId || JSON.parse(localStorage.getItem('user'))?.id
  if (userId.value) {
    loadUserInfo()
    loadUserVideos()
    loadUserCollections()
    // 注意：loadFavoriteFolders 内部会调用 loadFavoriteFolderVideos 加载当前选中收藏夹的视频
    loadFavoriteFolders()
    loadFollowingList()
    loadFollowersList()
    // 加载隐私设置
    loadPrivacySettings()
  }
}, { immediate: true })

// 在组件挂载时加载数据
onMounted(() => {
  // 如果watch已经触发，这里不再重复加载
  if (!userId.value) {
    loadUserInfo()
    loadUserVideos()
    // 只有当前是动态标签页时才加载动态
    if (activeTab.value === '动态') {
      loadUserDynamics()
    }
    loadUserCollections()
    // 注意：loadFavoriteFolders 内部会调用 loadFavoriteFolderVideos 加载当前选中收藏夹的视频
    loadFavoriteFolders()
    loadFollowingList()
    loadFollowersList()
  }
  // 加载隐私设置
  loadPrivacySettings()

  // 根据当前路由设置关注/粉丝侧边栏状态
  const path = route.path
  if (path.endsWith('/following')) {
    followList.value.activeSidebar = 'following'
  } else if (path.endsWith('/followers')) {
    followList.value.activeSidebar = 'followers'
  }
})
</script>

<template>
  <div class="user-profile-page">
    <!-- 背景框容器 -->
    <div class="profile-header">
      <!-- 封面图片 -->
      <div class="cover-image" :style="{ backgroundImage: `url(${userInfo.cover})` }">
        <!-- 个人信息 -->
        <div class="profile-info">
          <div class="avatar-container" :class="{ 'clickable': isOwnSpace }" @click="goToAvatar" :title="isOwnSpace ? '点击修改头像' : ''">
            <img :src="userInfo.avatar" alt="头像" class="user-avatar">
            <div v-if="isOwnSpace" class="avatar-overlay">
              <el-icon :size="20"><Edit /></el-icon>
            </div>
          </div>
          <div class="user-details">
            <h1 class="username">
              {{ userInfo.username }}
              <span v-if="userInfo.gender === 1" class="gender-icon male" title="男">♂</span>
              <span v-else-if="userInfo.gender === 2" class="gender-icon female" title="女">♀</span>
            </h1>
            <textarea
              class="bio-input"
              v-model="userInfo.signature"
              placeholder="点击编辑个人签名"
              @blur="saveSignature"
            ></textarea>
          </div>
        </div>
        
        <!-- 右侧操作按钮 -->
        <button 
          class="action-btn follow-btn profile-btn" 
          v-if="!isOwnSpace" 
          @click="handleFollow"
          :class="{ 'following': isFollowing }"
          :disabled="followLoading"
        >
          <el-icon v-if="isFollowing"><Check /></el-icon>
          <span>{{ isFollowing ? '已关注' : '+ 关注' }}</span>
        </button>
        <button class="action-btn message-btn profile-btn" v-if="!isOwnSpace" @click="handleSendMessage">发消息</button>
      </div>
    </div>
    
    <!-- 选择栏和统计数据 -->
    <div class="profile-tabs-container">
      <div class="profile-tabs-wrapper">
        <!-- 左侧选择栏 -->
        <div class="profile-tabs">
          <div 
            v-for="tab in ['主页', '动态', '投稿', '合集和列表', '收藏', '设置']" 
            :key="tab"
            :class="['tab-item', { active: activeTab === tab }]"
            @click="handleTabClick(tab)"
          >
            {{ tab }}
          </div>
          
          <!-- 视频搜索栏 -->
          <div class="search-bar-wrapper">
            <div class="search-input-wrapper">
              <el-icon class="search-icon"><Search /></el-icon>
              <input 
                type="text" 
                placeholder="搜索视频" 
                class="search-input"
                v-model="videoSearch.keyword"
                @keyup.enter="handleVideoSearch"
              >
            </div>
          </div>
        </div>
        
        <!-- 右侧统计数据 -->
        <div class="stats-container">
          <div class="stat-item" @click="router.push(`/profile/${userId.value}/following`)" v-if="userId.value">
            <div class="stat-label">关注数</div>
            <div class="stat-value">{{ userInfo.stats.following }}</div>
          </div>
          <div class="stat-item" @click="router.push(`/profile/${userId.value}/followers`)" v-if="userId.value">
            <div class="stat-label">粉丝数</div>
            <div class="stat-value">{{ userInfo.stats.followers }}</div>
          </div>
          <div class="stat-item non-interactive">
            <div class="stat-label">获赞数</div>
            <div class="stat-value">{{ userInfo.stats.likes }}</div>
          </div>
          <div class="stat-item non-interactive">
            <div class="stat-label">播放数</div>
            <div class="stat-value">{{ userInfo.stats.views }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="profile-content">
      <!-- 左侧内容区域 -->
      <div class="main-content">
        <!-- 动态列表 -->
        <div v-if="activeTab === '动态'" class="dynamic-section">
          <div v-if="loading.dynamics" class="loading-state">
            <p>加载中...</p>
          </div>
          <div v-else-if="dynamics.length === 0" class="empty-state">
            <p>暂无动态</p>
          </div>
          <div v-else class="dynamic-list">
            <!-- 动态列表 -->
            <div v-for="dynamic in dynamics" :key="dynamic.id" :class="['dynamic-card', { 'is-top': dynamic.isTop }]">
              <!-- 置顶标记 -->
              <div v-if="dynamic.isTop" class="top-badge">
                <el-icon><Top /></el-icon>
                <span>置顶</span>
              </div>
              
              <!-- 头部 -->
              <div class="dynamic-header-new">
                <img :src="dynamic.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" :alt="dynamic.user?.name" class="user-avatar">
                <div class="user-info">
                  <div class="user-name">{{ dynamic.user?.name || '未知用户' }}</div>
                  <div class="dynamic-time">{{ formatDynamicTime(dynamic.createTime) }}</div>
                </div>
                <!-- 更多菜单 -->
                <el-dropdown trigger="click" @command="(cmd) => cmd === 'stick' ? handleStickDynamic(dynamic.id) : handleDeleteDynamic(dynamic.id)">
                  <button class="more-btn" @click.stop>
                    <el-icon><MoreFilled /></el-icon>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="'stick'">
                        <el-icon><Top /></el-icon>
                        <span>{{ dynamic.isTop ? '取消置顶' : '置顶' }}</span>
                      </el-dropdown-item>
                      <el-dropdown-item :command="'delete'" divided>
                        <el-icon><Delete /></el-icon>
                        <span>删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              
              <!-- 动态类型标签 -->
              <div v-if="dynamic.type === 'share'" class="dynamic-type-label">
                转发动态
              </div>
              
              <!-- 动态内容 -->
              <div class="dynamic-content-new">
                <!-- 转发动态 -->
                <div v-if="dynamic.type === 'share' && dynamic.shareSource" class="share-card">
                  <div class="share-source">
                    <img :src="dynamic.shareSource?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'" class="source-avatar">
                    <span class="source-name">{{ dynamic.shareSource?.name || '未知来源' }}</span>
                  </div>
                  <div class="share-content-wrapper">
                    <div class="share-text" :class="{ 'is-collapsed': !expandedDynamics.has(dynamic.id) && dynamic.shareSource?.hasMore }">
                      {{ dynamic.shareSource?.content || '' }}
                    </div>
                    <button v-if="dynamic.shareSource?.hasMore" class="expand-btn" @click="toggleExpand(dynamic.id)">
                      {{ expandedDynamics.has(dynamic.id) ? '收起' : '展开' }}
                    </button>
                  </div>
                  <div v-if="dynamic.shareSource?.images && dynamic.shareSource.images.length" class="share-images">
                    <img v-for="(img, idx) in dynamic.shareSource.images" :key="idx" :src="img" class="share-image">
                  </div>
                </div>
                
                <!-- 视频动态 -->
                <div v-else-if="dynamic.type === 'video' && dynamic.video" class="video-dynamic-new">
                  <div class="video-card">
                    <div class="video-cover-wrapper">
                      <img :src="dynamic.video?.cover" class="video-cover">
                      <div class="video-duration">{{ dynamic.video?.duration }}</div>
                      <div class="video-play-icon">
                        <el-icon><VideoPlay /></el-icon>
                      </div>
                    </div>
                    <div class="video-info-new">
                      <div class="video-title-new">{{ dynamic.video?.title }}</div>
                      <div class="video-views-new">{{ dynamic.video?.views }} 播放</div>
                    </div>
                  </div>
                </div>
                
                <!-- 原创内容 -->
                <div v-else class="original-content">
                  <div class="original-text">{{ dynamic.content }}</div>
                  <div v-if="dynamic.images && dynamic.images.length" class="original-images">
                    <img v-for="(img, idx) in dynamic.images" :key="idx" :src="img" class="original-image">
                  </div>
                </div>
              </div>
              
              <!-- 操作栏 -->
              <div class="dynamic-actions-new">
                <button class="action-btn-new" @click="ElMessage.info('转发功能开发中')">
                  <el-icon><Share /></el-icon>
                  <span>{{ dynamic.stats?.shareCount || '转发' }}</span>
                </button>
                <button class="action-btn-new" :class="{ 'is-active': expandedComments.has(dynamic.id) }" @click="toggleComments(dynamic)">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ dynamic.stats?.commentCount > 0 ? dynamic.stats.commentCount : '评论' }}</span>
                </button>
                <button class="action-btn-new" :class="{ 'is-liked': dynamic.stats?.isLiked }" @click="handleLikeDynamic(dynamic)">
                  <el-icon><Star /></el-icon>
                  <span>{{ dynamic.stats?.likeCount > 0 ? dynamic.stats.likeCount : '点赞' }}</span>
                </button>
              </div>

              <!-- 评论展开区域 -->
              <div v-if="expandedComments.has(dynamic.id)" class="comment-section">
                <CommentSystem
                  :target-type="'DYNAMIC'"
                  :target-id="dynamic.id"
                  placeholder="发一条友善的评论吧~"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 主页内容 -->
        <div v-else-if="activeTab === '主页'">
          <!-- 代表作 -->
          <div class="content-section">
            <div v-if="loading.videos" class="loading-state">
              <p>加载中...</p>
            </div>
            <div v-else-if="representativeVideos.length === 0" class="empty-state">
              <p>暂无代表作</p>
            </div>
            <div v-else>
              <!-- 视图切换按钮 -->
              <div class="representative-view-toggle">
                <button
                  :class="['view-toggle-btn', { active: representativeViewMode === 'fan' }]"
                  @click="representativeViewMode = 'fan'"
                >
                  我的粉丝会看到
                </button>
                <button
                  :class="['view-toggle-btn', { active: representativeViewMode === 'visitor' }]"
                  @click="representativeViewMode = 'visitor'"
                >
                  新访客会看到
                </button>
              </div>
              <!-- 代表作列表 -->
              <div class="rep-video-list" :class="{ 'is-visitor': representativeViewMode === 'visitor' }">
                <div
                  v-for="video in representativeVideos.slice(0, representativeViewMode === 'fan' ? 1 : 3)"
                  :key="video.id"
                  class="rep-video-card"
                >
                  <div class="rep-video-left">
                    <img class="rep-video-img" :src="video.coverUrl" :alt="video.title">
                    <span class="rep-video-time">{{ video.duration }}</span>
                  </div>
                  <div class="rep-video-right">
                    <p class="rep-video-title">{{ video.title }}</p>
                    <div class="rep-video-stats">
                      <span class="rep-stat-item">
                        <el-icon><View /></el-icon>
                        {{ video.viewCount }}
                      </span>
                      <span class="rep-stat-item">
                        <el-icon><ChatDotRound /></el-icon>
                        {{ video.commentCount || 0 }}
                      </span>
                      <span class="rep-stat-item">{{ video.date }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TA的视频 -->
          <div class="content-section">
            <div class="section-controls-wrapper">
              <div class="left-controls">
                <div class="section-header">
                  <h3 class="section-title">TA的视频</h3>
                  <div class="section-count">{{ allVideos.length }}</div>
                </div>
                <div class="sort-options">
                  <button
                    v-for="option in sortOptions"
                    :key="option"
                    :class="['sort-btn', { active: videoSortOption === option }]"
                    @click="handleSortChange(option)"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
              <div class="action-buttons">
                <button class="action-btn play-all-btn" @click="playAllVideos">播放全部</button>
                <button class="action-btn more-btn" @click="goToSubmissions">更多</button>
              </div>
            </div>
            <div v-if="loading.videos" class="loading-state">
              <p>加载中...</p>
            </div>
            <div v-else-if="allVideos.length === 0" class="empty-state">
              <p>暂无视频</p>
            </div>
            <div v-else class="videos-grid">
              <div v-for="video in allVideos" :key="video.id" class="video-item">
                <div class="video-cover">
                  <img :src="video.coverUrl" :alt="video.title">
                  <div class="video-duration">{{ video.duration }}</div>
                </div>
                <div class="video-title">{{ video.title }}</div>
                <div class="video-meta">
                  <span class="video-views">{{ video.viewCount }}</span>
                  <span class="video-date">{{ video.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        
        <!-- 合集和列表页面 -->
        <div v-else-if="activeTab === '合集和列表'" class="collections-section">
          <!-- 合集详情视图 -->
          <div v-if="collectionDetail.visible" class="collection-detail-view">
            <!-- 返回按钮和标题 -->
            <div class="collection-detail-header">
              <div class="header-left">
                <el-button text :icon="ArrowLeft" @click="backToCollectionsList">
                  返回
                </el-button>
                <span class="header-title">我的合集和视频列表</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="collection-name">{{ collectionDetail.collection?.title || '加载中...' }}</span>
              </div>
              <div class="header-right" v-if="isOwnSpace">
                <el-button text :icon="Edit" @click="openEditCollectionDialog">
                  编辑
                </el-button>
              </div>
            </div>

            <!-- 合集信息区 -->
            <div class="collection-info-section" v-if="collectionDetail.collection">
              <div class="info-container">
                <!-- 封面 -->
                <div class="collection-cover-large">
                  <img
                    :src="collectionDetail.collection.coverUrl || getDefaultCover()"
                    :alt="collectionDetail.collection.title"
                  />
                  <div class="cover-overlay" @click="playCollectionAll">
                    <el-button type="primary" size="large" :icon="VideoPlay">
                      播放全部
                    </el-button>
                  </div>
                  <div class="video-count-badge">
                    <el-icon><VideoPlay /></el-icon>
                    <span>{{ collectionDetail.pagination.total }} 个视频</span>
                  </div>
                </div>

                <!-- 信息 -->
                <div class="collection-meta-detail">
                  <h1 class="collection-title-large">{{ collectionDetail.collection.title }}</h1>
                  <p class="collection-desc-large">{{ collectionDetail.collection.description || '暂无描述' }}</p>

                  <!-- 统计信息 -->
                  <div class="stats-info">
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ collectionDetail.collection.viewCount || 0 }} 次观看
                    </span>
                    <span class="stat-item">
                      <el-icon><Clock /></el-icon>
                      更新于 {{ formatDate(collectionDetail.collection.updatedAt) }}
                    </span>
                    <span v-if="!collectionDetail.collection.isPublic" class="private-tag">私密合集</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 视频网格区 -->
            <div class="collection-videos-section">
              <!-- 头部操作栏 -->
              <div class="videos-header">
                <div class="sort-options">
                  <span 
                    class="sort-item" 
                    :class="{ active: collectionDetail.sortBy === 'default' }"
                    @click="handleCollectionDetailSortChange('default')"
                  >
                    默认排序
                  </span>
                  <span 
                    class="sort-item" 
                    :class="{ active: collectionDetail.sortBy === 'newest' }"
                    @click="handleCollectionDetailSortChange('newest')"
                  >
                    升序排序
                  </span>
                </div>
                <div class="header-actions" v-if="isOwnSpace">
                  <el-button type="primary" :icon="Edit" @click="openEditCollectionDialog">
                    编辑
                  </el-button>
                  <el-dropdown trigger="click" @command="handleCollectionCommand">
                    <el-button :icon="MoreFilled" circle />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="delete">删除视频列表</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <!-- 加载状态 -->
              <div v-if="collectionDetail.loading" class="loading-state">
                <el-skeleton :rows="3" animated />
              </div>

              <!-- 空状态 -->
              <div v-else-if="collectionDetail.manuscripts.length === 0 && !isOwnSpace" class="empty-state">
                <el-empty description="暂无视频" />
              </div>

              <!-- 视频网格 -->
              <div v-else class="videos-grid">
                <!-- 添加视频卡片 -->
                <div v-if="isOwnSpace" class="video-card add-video-card" @click="openAddVideoToCollectionDialog">
                  <div class="add-video-content">
                    <el-icon :size="40"><Plus /></el-icon>
                    <span>添加视频</span>
                  </div>
                </div>

                <!-- 视频卡片 -->
                <div
                  v-for="(manuscript, index) in collectionDetail.manuscripts"
                  :key="manuscript.id"
                  class="collection-video-card"
                >
                  <!-- 封面区域 -->
                  <div class="collection-video-cover" @click="playManuscript(manuscript)">
                    <img
                      :src="manuscript.coverUrl || getDefaultCover()"
                      :alt="manuscript.title"
                      class="collection-video-cover-img"
                    />
                    <!-- 序号 -->
                    <div class="collection-video-index">{{ index + 1 }}</div>
                    <!-- 时长 -->
                    <div class="collection-video-duration">{{ manuscript.duration || '00:00' }}</div>
                    <!-- 更多操作 -->
                    <div class="collection-video-actions" v-if="isOwnSpace" @click.stop>
                      <el-dropdown trigger="click" @command="(cmd) => handleVideoCommand(cmd, manuscript)">
                        <el-button :icon="MoreFilled" circle size="small" />
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="remove">从列表中移除</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>

                  <!-- 信息区域 -->
                  <div class="collection-video-info">
                    <h3 class="collection-video-title" :title="manuscript.title">{{ manuscript.title }}</h3>
                    <div class="collection-video-meta">
                      <span class="collection-meta-item">
                        <el-icon><VideoPlay /></el-icon>
                        {{ formatNumber(manuscript.viewCount) }}
                      </span>
                      <span class="collection-meta-item">{{ formatDate(manuscript.uploadTime) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 合集列表视图 -->
          <template v-else>
            <!-- 顶部标题和新建按钮 -->
            <div class="collections-header">
              <div class="collections-header-left">
                <h2 class="collections-title">我的合集和视频列表</h2>
                <el-button
                  v-if="isOwnSpace"
                  type="primary"
                  :icon="Plus"
                  class="new-collection-btn"
                  @click="openCreateCollectionDialog"
                >
                  新建
                </el-button>
              </div>
              <!-- 视图切换按钮 -->
              <div class="view-toggle">
                <button
                  class="view-toggle-btn grid-view-btn"
                  :class="{ active: collections.viewType === 'grid' }"
                  @click="collections.viewType = 'grid'"
                >
                  <el-icon><Grid /></el-icon>
                </button>
                <button
                  class="view-toggle-btn list-view-btn"
                  :class="{ active: collections.viewType === 'horizontal' }"
                  @click="collections.viewType = 'horizontal'"
                >
                  <el-icon><List /></el-icon>
                </button>
              </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="collections.loading" class="loading-state">
              <el-skeleton :rows="3" animated />
            </div>

            <!-- 空状态 -->
            <div v-else-if="collections.items.length === 0" class="empty-state">
              <el-empty description="暂无合集">
                <el-button
                  v-if="isOwnSpace"
                  type="primary"
                  @click="openCreateCollectionDialog"
                >
                  创建合集
                </el-button>
              </el-empty>
            </div>

            <!-- 宫格视图 -->
            <div v-else-if="collections.viewType === 'grid'" class="collections-grid">
              <!-- 新建合集卡片 -->
              <div
                v-if="isOwnSpace"
                class="collection-item new-collection"
                @click="openCreateCollectionDialog"
              >
                <div class="new-collection-content">
                  <el-icon :size="32"><Plus /></el-icon>
                  <span>新建合集</span>
                </div>
              </div>

              <!-- 合集项 -->
              <div
                v-for="collection in collections.items"
                :key="collection.id"
                class="collection-item"
                @click="goToCollectionDetail(collection.id)"
              >
                <div class="collection-cover">
                  <img :src="collection.coverUrl || getDefaultCover()" :alt="collection.title" class="collection-cover-img">
                  <div class="collection-video-count">
                    <el-icon><VideoPlay /></el-icon>
                    <span>{{ collection.manuscriptCount || 0 }}</span>
                  </div>
                </div>
                <div class="collection-info">
                  <div class="collection-title">{{ collection.title }}</div>
                  <div class="collection-date">{{ collection.manuscriptCount || 0 }}个视频</div>
                </div>
              </div>
            </div>

            <!-- 水平列表视图 -->
            <div v-else-if="collections.viewType === 'horizontal'" class="collections-horizontal">
              <!-- 合集项 -->
              <div
                v-for="collection in collections.items"
                :key="collection.id"
                class="collection-horizontal-item"
              >
                <div class="collection-horizontal-header">
                  <h3 class="collection-horizontal-title">
                    {{ collection.title }}
                    <span class="collection-video-count-badge">{{ collection.manuscriptCount || 0 }}</span>
                  </h3>
                  <div class="collection-horizontal-actions">
                    <el-button
                      v-if="collection.videos && collection.videos.length > 0"
                      class="action-btn play-all-btn"
                      :icon="VideoPlay"
                      @click="playCollectionAllFromList(collection)"
                    >
                      播放全部
                    </el-button>
                    <el-button
                      class="action-btn more-btn"
                      @click="goToCollectionDetail(collection.id)"
                    >
                      更多
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                  </div>
                </div>

                <!-- 水平视频列表 -->
                <div class="collection-videos-horizontal">
                  <!-- 添加视频按钮 -->
                  <div
                    v-if="isOwnSpace"
                    class="add-video-card"
                    @click="openAddVideoDialog(collection.id)"
                  >
                    <div class="add-video-content">
                      <el-icon :size="24"><Plus /></el-icon>
                      <span>添加视频</span>
                    </div>
                  </div>

                  <!-- 视频项 -->
                  <div
                    v-for="video in collection.videos"
                    :key="video.id"
                    class="video-horizontal-item"
                    @click="router.push(`/manuscript/${video.id}`)"
                  >
                    <div class="video-horizontal-cover">
                      <img :src="video.coverUrl || getDefaultCover()" :alt="video.title" class="video-cover-img">
                      <div class="video-duration">{{ video.duration }}</div>
                    </div>
                    <div class="video-horizontal-info">
                      <div class="video-title" :title="video.title">{{ video.title }}</div>
                      <div class="video-horizontal-meta">
                        <span class="video-views">
                          <el-icon><View /></el-icon>
                          {{ video.viewCount || 0 }}
                        </span>
                        <span class="video-date">{{ video.date }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
        
        <!-- 投稿页面 -->
        <div v-else-if="activeTab === '投稿'" class="submissions-section">
          <!-- 顶部容器，与封面图片同宽 -->
          <div class="submissions-top">
            <!-- 左侧分类导航 -->
            <div class="submissions-sidebar">
              <div 
                v-for="category in submissions.categories" 
                :key="category.name"
                :class="['category-item', { active: submissions.activeCategory === category.name }]"
                @click="submissions.activeCategory = category.name"
              >
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }}</span>
              </div>
            </div>
            
            <!-- 右侧内容区域 -->
            <div class="submissions-content">
              <!-- 标题和排序 -->
              <div class="submissions-header">
                <div class="header-content">
                  <div class="submissions-title">
                    <h3>{{ submissions.activeCategory === '视频' ? '我的视频' : '我的动态' }}</h3>
                  </div>
                  <!-- 排序选项 -->
                  <div class="sort-options" v-if="submissions.activeCategory === '视频'">
                    <div
                      v-for="option in submissions.sortOptions"
                      :key="option"
                      :class="['sort-item', { active: submissions.activeSort === option }]"
                      @click="handleSubmissionsSortChange(option)"
                    >
                      {{ option }}
                    </div>
                  </div>
                </div>
                <!-- 操作按钮 -->
                <div class="action-buttons" v-if="submissions.activeCategory === '视频'">
                  <button class="action-btn play-all-btn" @click="playAllSubmissions">播放全部</button>
                  <button 
                    class="action-btn view-toggle-btn grid-view-btn"
                    :class="{ active: submissions.viewType === 'grid' }"
                    @click="submissions.viewType = 'grid'"
                  >
                    <span class="view-icon">🔲</span>
                  </button>
                  <button 
                    class="action-btn view-toggle-btn list-view-btn"
                    :class="{ active: submissions.viewType === 'list' }"
                    @click="submissions.viewType = 'list'"
                  >
                    <span class="view-icon">📋</span>
                  </button>
                </div>
              </div>
              
              <!-- 视频列表 -->
              <div v-if="submissions.activeCategory === '视频'">
                <div v-if="loading.videos" class="loading-state">
                  <p>加载中...</p>
                </div>
                <div v-else-if="submissions.videos.length === 0" class="empty-state">
                  <p>暂无投稿</p>
                </div>
                <div v-else>
                <!-- 宫格视图 -->
                <div v-if="submissions.viewType === 'grid'" class="videos-grid">
                  <div v-for="video in submissions.videos" :key="video.id" class="video-item">
                    <div class="video-cover">
                      <img :src="video.coverUrl" :alt="video.title" class="video-cover-img">
                      <div class="video-duration">{{ video.duration }}</div>
                    </div>
                    <div class="video-title">{{ video.title }}</div>
                    <div class="video-meta">
                      <span class="video-views">{{ video.viewCount }}</span>
                      <span class="video-date">{{ video.date }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- 列表视图 -->
                <div v-else-if="submissions.viewType === 'list'" class="videos-list">
                  <div v-for="video in submissions.videos" :key="video.id" class="video-list-item">
                    <div class="video-list-cover">
                      <img :src="video.coverUrl" :alt="video.title" class="video-cover-img">
                      <div class="video-duration">{{ video.duration }}</div>
                    </div>
                    <div class="video-list-info">
                      <div class="video-title">{{ video.title }}</div>
                      <!-- 视频简介 -->
                      <div class="video-description" v-if="video.description">
                        {{ video.description }}
                      </div>
                      <div class="video-description" v-else>
                        <!-- 空白占位 -->
                      </div>
                      <!-- 元信息显示在简介下方 -->
                      <div class="video-list-meta">
                        <span class="video-views">{{ video.viewCount }}</span>
                        <span class="video-date">{{ video.date }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 分页控件 -->
                <div class="pagination">
                  <div class="pagination-buttons">
                    <button 
                      v-for="page in submissions.pagination.totalPages" 
                      :key="page"
                      :class="['page-btn', { active: submissions.pagination.currentPage === page }]"
                      @click="submissions.pagination.currentPage = page"
                    >
                      {{ page }}
                    </button>
                    <button 
                      class="page-btn"
                      :disabled="submissions.pagination.currentPage === submissions.pagination.totalPages"
                    >
                      下一页
                    </button>
                  </div>
                  <div class="pagination-info">
                    共 {{ submissions.pagination.totalPages }} 页，跳至
                    <input type="text" class="page-input" :value="submissions.pagination.currentPage" />
                    页
                  </div>
                </div>
                </div>
              </div>
              
              <!-- 动态内容 -->
              <div v-else class="dynamic-content">
                <div class="empty-state">
                  <p>暂无动态</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 收藏页面 -->
        <div v-else-if="activeTab === '收藏'" class="favorites-section">
          <div class="favorites-container">
            <!-- 左侧分类导航 -->
            <div class="favorites-sidebar">
              <!-- 我的创建 -->
              <div class="sidebar-section">
                <div class="section-header">
                  <div class="section-title">我的创建</div>
                  <div class="section-action" @click="favorites.myCollectionsExpanded = !favorites.myCollectionsExpanded">{{ favorites.myCollectionsExpanded ? '▼' : '▲' }}</div>
                </div>
                
                <!-- 新建收藏夹按钮 -->
                <div v-if="favorites.myCollectionsExpanded" class="new-collection-btn" @click="openCreateFavoriteDialog">
                  <div class="new-collection-icon">+</div>
                  <div class="new-collection-text">新建收藏夹</div>
                </div>
                
                <!-- 收藏夹列表 -->
                <div v-if="favorites.myCollectionsExpanded" class="collection-list">
                  <div
                    v-for="collection in favorites.myCollections"
                    :key="collection.name"
                    :class="['collection-item', { active: favorites.activeCategory === collection.name }]"
                    @click="() => {
                      favorites.activeCategory = collection.name;
                      loadFavoriteFolderVideos(collection.id);
                    }"
                  >
                    <div class="collection-content">
                      <span class="collection-icon">{{ collection.icon }}</span>
                      <span class="collection-name">{{ collection.name }}</span>
                    </div>
                    <div class="collection-actions" @click.stop>
                      <el-dropdown trigger="hover" placement="bottom-end">
                        <el-button link class="more-btn">
                          <el-icon><MoreFilled /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item @click="openEditFavoriteDialog(collection)">
                              编辑信息
                            </el-dropdown-item>
                            <el-dropdown-item divided @click="deleteFavoriteFolder(collection)">
                              删除
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                    <span class="collection-count">{{ collection.count }}</span>
                  </div>
                  
                  <!-- 我的收藏内容 -->
                  <div
                    v-for="favorite in favorites.myFavorites"
                    :key="favorite.name"
                    :class="['favorite-item', { active: favorites.activeCategory === favorite.name }]"
                    @click="favorites.activeCategory = favorite.name"
                  >
                    <div class="favorite-content">
                      <span class="favorite-icon">{{ favorite.icon }}</span>
                      <span class="favorite-name">{{ favorite.name }}</span>
                    </div>
                    <div class="favorite-actions" @click.stop>
                      <el-dropdown trigger="hover" placement="bottom-end">
                        <el-button link class="more-btn">
                          <el-icon><MoreFilled /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item @click="openEditFavoriteDialog(favorite)">
                              编辑信息
                            </el-dropdown-item>
                            <el-dropdown-item divided @click="deleteFavoriteFolder(favorite)">
                              删除
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                    <span class="favorite-count">{{ favorite.count }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧内容区域 -->
            <div class="favorites-content">
              <!-- 收藏夹头部信息 -->
              <div class="favorite-header">
                <!-- 左侧小封面 -->
                <div class="favorite-header-cover">
                  <img :src="getFavoriteFolderCover(favorites.videos)" :alt="favorites.activeCategory" class="favorite-header-img">
                </div>
                <!-- 右侧信息 -->
                <div class="favorite-header-info">
                  <div class="favorite-header-title">{{ favorites.activeCategory }}</div>
                  <div class="favorite-header-meta">
                    <span class="meta-item">创建者：{{ userInfo.username }}</span>
                    <span class="meta-item">{{ (favorites.myCollections.find(c => c.name === favorites.activeCategory) || favorites.myFavorites.find(c => c.name === favorites.activeCategory))?.count || 0 }}个内容</span>
                    <span class="meta-item">公开</span>
                  </div>
                  <div class="favorite-header-actions">
                    <button class="action-btn play-all-btn" @click="playAllFavorites">
                      <span class="play-icon">▶</span>
                      播放全部视频
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 排序和筛选选项 -->
              <div class="sort-filter">
                <div class="batch-operations">批量操作</div>
                <div class="sort-options">
                  <span>最近收藏</span>
                  <select v-model="favorites.activeSort" class="sort-select">
                    <option v-for="option in favorites.sortOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>
                <div class="search-box">
                  <input 
                    type="text" 
                    v-model="favorites.searchKeyword" 
                    placeholder="输入关键词" 
                    class="search-input"
                  >
                  <button class="search-btn">
                    <el-icon><Search /></el-icon>
                  </button>
                </div>
              </div>
              
              <!-- 收藏的视频列表 -->
              <div v-if="loading.favorites" class="loading-state">
                <p>加载中...</p>
              </div>
              <div v-else-if="favorites.videos.length === 0" class="empty-state">
                <p>暂无收藏</p>
              </div>
              <div v-else class="videos-grid">
                <div v-for="video in favorites.videos" :key="video.id" class="video-item">
                  <div class="video-cover">
                    <img :src="video.coverUrl || video.cover" :alt="video.title" class="video-cover-img">
                    <div class="video-duration">{{ video.duration }}</div>
                  </div>
                  <div class="video-title">{{ video.title }}</div>
                  <div class="video-meta">
                    <span class="video-views">{{ video.viewCount }}</span>
                    <span class="video-date">{{ video.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 搜索页面 -->
        <div v-else-if="activeTab === '搜索'" class="search-section">
          <!-- 顶部容器，与投稿页面同宽 -->
          <div class="search-top">
            <!-- 左侧分类导航 -->
            <div class="search-sidebar">
              <div 
                v-for="category in searchCategories" 
                :key="category.name"
                :class="['category-item', { active: videoSearch.activeCategory === category.name }]"
                @click="videoSearch.activeCategory = category.name"
              >
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.count }}</span>
              </div>
            </div>
            
            <!-- 右侧内容区域 -->
            <div class="search-content">
              <!-- 标题和排序 -->
              <div class="search-header">
                <div class="header-content">
                  <div class="search-title">
                    <h3>{{ videoSearch.activeCategory === '视频' ? '我的视频' : '我的动态' }}</h3>
                  </div>
                  <!-- 排序选项 -->
                  <div class="sort-options" v-if="videoSearch.activeCategory === '视频'">
                    <div
                      v-for="option in videoSearch.sortOptions"
                      :key="option"
                      :class="['sort-item', { active: videoSearch.activeSort === option }]"
                      @click="handleSearchSortChange(option)"
                    >
                      {{ option }}
                    </div>
                  </div>
                </div>
                <!-- 操作按钮 -->
                <div class="action-buttons" v-if="videoSearch.activeCategory === '视频'">
                  <button class="action-btn play-all-btn" @click="playAllSearchVideos">播放全部</button>
                  <button 
                    class="action-btn view-toggle-btn grid-view-btn"
                    :class="{ active: videoSearch.viewType === 'grid' }"
                    @click="videoSearch.viewType = 'grid'"
                  >
                    <span class="view-icon">🔲</span>
                  </button>
                  <button 
                    class="action-btn view-toggle-btn list-view-btn"
                    :class="{ active: videoSearch.viewType === 'list' }"
                    @click="videoSearch.viewType = 'list'"
                  >
                    <span class="view-icon">📋</span>
                  </button>
                </div>
              </div>
              
              <!-- 搜索结果统计 -->
              <div class="search-result-info" v-if="videoSearch.keyword && videoSearch.activeCategory === '视频'">
                共找到关于"<span class="keyword">{{ videoSearch.keyword }}</span>"的 {{ videoSearch.totalCount }} 个视频
              </div>
              
              <!-- 视频列表 -->
              <div v-if="videoSearch.activeCategory === '视频'">
                <div v-if="videoSearch.loading" class="loading-state">
                  <p>搜索中...</p>
                </div>
                <div v-else-if="videoSearch.searchResults.length === 0 && videoSearch.keyword" class="empty-state">
                  <p>未找到相关视频</p>
                </div>
                <div v-else-if="videoSearch.searchResults.length > 0">
                  <!-- 宫格视图 -->
                  <div v-if="videoSearch.viewType === 'grid'" class="videos-grid">
                    <div v-for="video in videoSearch.searchResults" :key="video.id" class="video-item">
                      <div class="video-cover">
                        <img :src="video.coverUrl" :alt="video.title" class="video-cover-img">
                        <div class="video-duration">{{ video.duration }}</div>
                        <!-- 仅自己可见标签 -->
                        <div class="video-visibility" v-if="video.status === 'private'">
                          <el-icon><Lock /></el-icon>
                          仅自己可见
                        </div>
                      </div>
                      <div class="video-title">{{ video.title }}</div>
                      <div class="video-meta">
                        <span class="video-views">{{ video.viewCount || 0 }}</span>
                        <span class="video-date">{{ video.date }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 列表视图 -->
                  <div v-else-if="videoSearch.viewType === 'list'" class="videos-list">
                    <div v-for="video in videoSearch.searchResults" :key="video.id" class="video-list-item">
                      <div class="video-list-cover">
                        <img :src="video.coverUrl" :alt="video.title" class="video-cover-img">
                        <div class="video-duration">{{ video.duration }}</div>
                      </div>
                      <div class="video-list-info">
                        <div class="video-title">{{ video.title }}</div>
                        <div class="video-description" v-if="video.description">
                          {{ video.description }}
                        </div>
                        <div class="video-description" v-else></div>
                        <div class="video-list-meta">
                          <span class="video-views">{{ video.viewCount || 0 }}</span>
                          <span class="video-date">{{ video.date }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <p>请输入关键词搜索视频</p>
                </div>
              </div>
              
              <!-- 动态搜索内容 -->
              <div v-else class="dynamic-search-content">
                <div class="empty-state">
                  <p>动态搜索功能开发中...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关注列表页面 -->
        <div v-else-if="activeTab === '关注'" class="follow-list-section">
          <div class="follow-list-container">
            <!-- 左侧边栏 -->
            <div class="follow-sidebar">
              <div 
                :class="['sidebar-item', { active: followList.activeSidebar === 'following' }]"
                @click="handleSidebarClick('following')"
              >
                <div class="sidebar-icon">👤</div>
                <div class="sidebar-info">
                  <div class="sidebar-label">我的关注</div>
                </div>
                <div class="sidebar-count">{{ followList.followingList.length }}</div>
              </div>
              <div 
                :class="['sidebar-item', { active: followList.activeSidebar === 'followers' }]"
                @click="handleSidebarClick('followers')"
              >
                <div class="sidebar-icon">👥</div>
                <div class="sidebar-info">
                  <div class="sidebar-label">我的粉丝</div>
                </div>
                <div class="sidebar-count">{{ followList.followersList.length }}</div>
              </div>
            </div>
            
            <!-- 右侧内容区 -->
            <div class="follow-content">
              <!-- 顶部标题和筛选 -->
              <div class="follow-header">
                <div class="follow-title">
                  <h3>全部关注</h3>
                  <span class="follow-count">{{ followList.followingList.length }}</span>
                </div>
                <div class="follow-filters">
                  <div 
                    :class="['filter-item', { active: followList.filterType === 'frequent' }]"
                    @click="handleFollowFilterChange('frequent')"
                  >
                    最常访问
                  </div>
                  <div 
                    :class="['filter-item', { active: followList.filterType === 'recent' }]"
                    @click="handleFollowFilterChange('recent')"
                  >
                    最近关注
                  </div>
                  <div class="follow-search">
                    <el-icon class="search-icon"><Search /></el-icon>
                    <input 
                      type="text" 
                      placeholder="搜索" 
                      class="search-input"
                      v-model="followList.searchKeyword"
                      @keyup.enter="handleFollowSearch"
                    >
                  </div>
                  <div class="view-toggle">
                    <button class="view-btn">
                      <el-icon><Grid /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- 用户列表 -->
              <div v-if="followList.loading" class="loading-state">
                <p>加载中...</p>
              </div>
              <div v-else-if="followList.followingList.length === 0" class="empty-state">
                <p>暂无关注用户</p>
              </div>
              <div v-else class="user-list">
                <div v-for="user in followList.followingList" :key="user.id" class="user-list-item">
                  <div class="user-avatar-wrapper">
                    <img :src="user.avatar" :alt="user.nickname" class="user-list-avatar">
                  </div>
                  <div class="user-info">
                    <div class="user-nickname">{{ user.nickname }}</div>
                    <div class="user-signature">{{ user.signature }}</div>
                  </div>
                  <div class="user-actions">
                    <button class="follow-btn following" @click="handleFollowUser(user.id, true)">
                      <el-icon><Check /></el-icon>
                      <span>已关注</span>
                    </button>
                    <button class="more-btn">
                      <el-icon><More /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 粉丝列表页面 -->
        <div v-else-if="activeTab === '粉丝'" class="follow-list-section">
          <div class="follow-list-container">
            <!-- 左侧边栏 -->
            <div class="follow-sidebar">
              <div 
                :class="['sidebar-item', { active: followList.activeSidebar === 'following' }]"
                @click="handleSidebarClick('following')"
              >
                <div class="sidebar-icon">👤</div>
                <div class="sidebar-info">
                  <div class="sidebar-label">我的关注</div>
                </div>
                <div class="sidebar-count">{{ followList.followingList.length }}</div>
              </div>
              <div 
                :class="['sidebar-item', { active: followList.activeSidebar === 'followers' }]"
                @click="handleSidebarClick('followers')"
              >
                <div class="sidebar-icon">👥</div>
                <div class="sidebar-info">
                  <div class="sidebar-label">我的粉丝</div>
                </div>
                <div class="sidebar-count">{{ followList.followersList.length }}</div>
              </div>
            </div>
            
            <!-- 右侧内容区 -->
            <div class="follow-content">
              <!-- 顶部标题和筛选 -->
              <div class="follow-header">
                <div class="follow-title">
                  <h3>全部粉丝</h3>
                  <span class="follow-count">{{ followList.followersList.length }}</span>
                </div>
                <div class="follow-filters">
                  <div class="follow-search">
                    <el-icon class="search-icon"><Search /></el-icon>
                    <input 
                      type="text" 
                      placeholder="搜索" 
                      class="search-input"
                      v-model="followList.searchKeyword"
                      @keyup.enter="handleFollowSearch"
                    >
                  </div>
                </div>
              </div>
              
              <!-- 用户列表 -->
              <div v-if="followList.loading" class="loading-state">
                <p>加载中...</p>
              </div>
              <div v-else-if="followList.followersList.length === 0" class="empty-state">
                <p>暂无粉丝</p>
              </div>
              <div v-else class="user-list">
                <div v-for="user in followList.followersList" :key="user.id" class="user-list-item">
                  <div class="user-avatar-wrapper">
                    <img :src="user.avatar" :alt="user.nickname" class="user-list-avatar">
                  </div>
                  <div class="user-info">
                    <div class="user-nickname">{{ user.nickname }}</div>
                    <div class="user-signature">{{ user.signature }}</div>
                  </div>
                  <div class="user-actions">
                    <button 
                      :class="['follow-btn', user.isFollowing ? 'following' : 'not-following']"
                      @click="handleFollowUser(user.id, user.isFollowing)"
                    >
                      <el-icon v-if="user.isFollowing"><Check /></el-icon>
                      <span>{{ user.isFollowing ? '已关注' : '关注' }}</span>
                    </button>
                    <button class="more-btn">
                      <el-icon><More /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 设置页面 -->
        <div v-else-if="activeTab === '设置'" class="settings-section">
          <div class="settings-container">
            <!-- 隐私设置 -->
            <div class="settings-group">
              <h3 class="settings-group-title">隐私设置</h3>
              <div class="settings-list">
                <div class="setting-item">
                  <span class="setting-label">公开我的收藏</span>
                  <div class="setting-control">
                    <el-switch
                      v-model="privacySettings.publicCollection"
                      :active-value="true"
                      :inactive-value="false"
                      active-text="公开"
                      inactive-text="隐藏"
                      @change="handlePrivacyChange('publicCollection', $event)"
                    />
                  </div>
                </div>
                <div class="setting-item">
                  <span class="setting-label">公开我的生日、个人标签</span>
                  <div class="setting-control">
                    <el-switch
                      v-model="privacySettings.publicBirthdayTags"
                      :active-value="true"
                      :inactive-value="false"
                      active-text="公开"
                      inactive-text="隐藏"
                      @change="handlePrivacyChange('publicBirthdayTags', $event)"
                    />
                  </div>
                </div>
                <div class="setting-item">
                  <span class="setting-label">公开最近投币的视频</span>
                  <div class="setting-control">
                    <el-switch
                      v-model="privacySettings.publicCoinVideos"
                      :active-value="true"
                      :inactive-value="false"
                      active-text="公开"
                      inactive-text="隐藏"
                      @change="handlePrivacyChange('publicCoinVideos', $event)"
                    />
                  </div>
                </div>
                <div class="setting-item">
                  <span class="setting-label">公开最近点赞的视频</span>
                  <div class="setting-control">
                    <el-switch
                      v-model="privacySettings.publicLikeVideos"
                      :active-value="true"
                      :inactive-value="false"
                      active-text="公开"
                      inactive-text="隐藏"
                      @change="handlePrivacyChange('publicLikeVideos', $event)"
                    />
                  </div>
                </div>
                <div class="setting-item">
                  <span class="setting-label">公开我的关注列表</span>
                  <div class="setting-control">
                    <el-switch
                      v-model="privacySettings.publicFollowingList"
                      :active-value="true"
                      :inactive-value="false"
                      active-text="公开"
                      inactive-text="隐藏"
                      @change="handlePrivacyChange('publicFollowingList', $event)"
                    />
                  </div>
                </div>
                <div class="setting-item">
                  <span class="setting-label">公开我的粉丝列表</span>
                  <div class="setting-control">
                    <el-switch
                      v-model="privacySettings.publicFollowersList"
                      :active-value="true"
                      :inactive-value="false"
                      active-text="公开"
                      inactive-text="隐藏"
                      @change="handlePrivacyChange('publicFollowersList', $event)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 我的个人标签 -->
            <div class="settings-group">
              <h3 class="settings-group-title">我的个人标签</h3>
              <div class="tags-section">
                <div class="tags-list">
                  <el-tag
                    v-for="tag in userTags"
                    :key="tag"
                    closable
                    class="user-tag"
                    @close="handleRemoveTag(tag)"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="tag-input-wrapper">
                  <el-input
                    v-model="newTagInput"
                    placeholder="输入标签名称"
                    maxlength="10"
                    show-word-limit
                    class="tag-input"
                    @keyup.enter="handleAddTag"
                  />
                  <el-button type="primary" @click="handleAddTag" :disabled="!newTagInput.trim()">
                    新增
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 其他标签内容占位符 -->
        <div v-else class="content-placeholder">
          <h2>{{ activeTab }}内容区域</h2>
          <p>此区域将显示{{ activeTab }}相关内容</p>
        </div>
      </div>

      <!-- 右侧内容区域 - 投稿、合集和列表、收藏、关注、粉丝页面不显示 -->
      <div v-if="activeTab !== '投稿' && activeTab !== '合集和列表' && activeTab !== '收藏' && activeTab !== '关注' && activeTab !== '粉丝'" class="side-content">
        <!-- 公告 -->
        <div class="content-section" v-if="activeTab === '主页'">
          <h3 class="section-title">公告</h3>
          <textarea 
            class="announcement-input" 
            v-model="userInfo.announcement" 
            placeholder="点击编辑公告"
            @blur="saveAnnouncement"
          ></textarea>
        </div>

        <!-- 个人资料 - 动态页面显示 -->
        <div class="content-section" v-if="activeTab === '动态' || activeTab === '主页'">
          <h3 class="section-title">个人资料</h3>
          <div class="profile-details">
            <div class="detail-row">
              <div class="detail-item">
                <span class="detail-label">UID</span>
                <span class="detail-value">{{ userInfo.uid }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">生日</span>
                <span class="detail-value">{{ userInfo.birthday }}</span>
              </div>
            </div>
          </div>
          <!-- 标签区域 -->
          <div class="profile-tags">
            <span class="profile-tag">意义一</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 新建收藏夹对话框 -->
    <el-dialog
      v-model="createFavoriteDialogVisible"
      title="收藏夹信息"
      width="400px"
    >
      <!-- 收藏夹封面 -->
      <div class="favorite-cover-section">
        <div class="cover-label">收藏夹封面</div>
        <div class="cover-upload-area">
          <div class="cover-placeholder" @click="$refs.coverInput.click()">
            <el-icon class="cover-icon"><Star /></el-icon>
          </div>
          <input
            ref="coverInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleCoverUpload"
          />
        </div>
      </div>
      
      <!-- 收藏夹名称 -->
      <div class="favorite-name-section">
        <div class="name-label">*收藏夹名称</div>
        <el-input
          v-model="newFavoriteName"
          placeholder="收藏夹名称"
          maxlength="20"
          show-word-limit
        />
      </div>
      
      <!-- 简介 -->
      <div class="favorite-description-section">
        <div class="description-label">简介:</div>
        <el-input
          v-model="newFavoriteDescription"
          type="textarea"
          placeholder="可填写简介"
          maxlength="200"
          show-word-limit
          :rows="4"
        />
      </div>
      
      <!-- 公开收藏夹 -->
      <div class="favorite-public-section">
        <el-checkbox v-model="newFavoriteIsPublic">公开收藏夹</el-checkbox>
      </div>
      
      <template #footer>
        <el-button @click="createFavoriteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingFavorite" @click="createFavoriteFolder">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑收藏夹对话框 -->
    <el-dialog
      v-model="editFavoriteDialogVisible"
      title="编辑收藏夹"
      width="400px"
    >
      <!-- 收藏夹名称 -->
      <div class="favorite-name-section">
        <div class="name-label">*收藏夹名称</div>
        <el-input
          v-model="editingFavoriteName"
          placeholder="收藏夹名称"
          maxlength="20"
          show-word-limit
        />
      </div>

      <template #footer>
        <el-button @click="editFavoriteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="updatingFavorite" @click="updateFavoriteFolder">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑合集对话框 -->
    <el-dialog
      v-model="editCollectionDialogVisible"
      title="编辑视频列表"
      width="500px"
      destroy-on-close
    >
      <el-form label-position="top">
        <!-- 视频列表标题 -->
        <el-form-item label="视频列表标题" required>
          <el-input
            v-model="editCollectionForm.name"
            placeholder="请输入视频列表标题"
            maxlength="10"
            show-word-limit
          />
        </el-form-item>

        <!-- 视频列表简介 -->
        <el-form-item label="视频列表简介">
          <el-input
            v-model="editCollectionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入视频列表简介（选填）"
            maxlength="256"
            show-word-limit
          />
        </el-form-item>

        <!-- 合集封面 -->
        <el-form-item label="合集封面">
          <el-upload
            class="collection-cover-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleEditCollectionCoverChange"
            accept="image/jpeg,image/png"
          >
            <div v-if="editCollectionForm.coverUrl" class="cover-preview">
              <img :src="editCollectionForm.coverUrl" />
            </div>
            <div v-else class="cover-placeholder">
              <el-icon :size="32"><Plus /></el-icon>
              <span>点击上传封面</span>
              <span class="cover-hint">支持 JPG、PNG 格式，最大 2MB</span>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 是否公开 -->
        <el-form-item>
          <el-checkbox v-model="editCollectionForm.isPublic">
            公开合集
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editCollectionDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="updatingCollection"
          @click="handleUpdateCollection"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建合集对话框 -->
    <el-dialog
      v-model="createCollectionDialogVisible"
      title="新建合集"
      width="500px"
      destroy-on-close
    >
      <el-form label-position="top">
        <!-- 封面上传 -->
        <el-form-item label="合集封面">
          <el-upload
            class="collection-cover-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleCollectionCoverChange"
            accept="image/jpeg,image/png"
          >
            <div v-if="createCollectionForm.coverUrl" class="cover-preview">
              <img :src="createCollectionForm.coverUrl" />
            </div>
            <div v-else class="cover-placeholder">
              <el-icon :size="32"><Plus /></el-icon>
              <span>点击上传封面</span>
              <span class="cover-hint">支持 JPG、PNG 格式，最大 2MB</span>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 合集名称 -->
        <el-form-item label="合集名称" required>
          <el-input
            v-model="createCollectionForm.name"
            placeholder="请输入合集名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <!-- 合集描述 -->
        <el-form-item label="合集描述">
          <el-input
            v-model="createCollectionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入合集描述（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 是否公开 -->
        <el-form-item>
          <el-checkbox v-model="createCollectionForm.isPublic">
            公开合集
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createCollectionDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="creatingCollection"
          @click="openCreateCollectionVideoDialog"
        >
          下一步：选择视频
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建合集 - 选择视频对话框 -->
    <el-dialog
      v-model="createCollectionVideoDialogVisible"
      title="选择视频"
      width="700px"
      destroy-on-close
    >
      <!-- 提示信息 -->
      <div class="video-selection-header">
        <span class="selection-title">你还可以添加 <strong>1000</strong> 个视频</span>
      </div>

      <!-- 搜索栏 -->
      <div class="video-search-bar">
        <el-input
          v-model="addVideoSearchKeyword"
          placeholder="搜索我上传的视频"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearchVideos"
          @clear="handleSearchVideos"
        />
        <el-button type="primary" @click="handleSearchVideos">搜索</el-button>
      </div>

      <!-- 表头 -->
      <div class="video-list-header">
        <span class="header-left">我的视频列表</span>
        <el-dropdown @command="handleVideoSortChange">
          <span class="header-right">
            {{ addVideoSortBy === 'newest' ? '最新发布' : '最早发布' }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="newest">最新发布</el-dropdown-item>
              <el-dropdown-item command="oldest">最早发布</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 视频列表 -->
      <div v-if="addVideoLoading" class="dialog-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="userVideos.length === 0" class="dialog-empty">
        <el-empty description="暂无视频" />
      </div>

      <div v-else class="video-selection-list">
        <el-checkbox-group v-model="createCollectionSelectedVideos">
          <div
            v-for="video in userVideos"
            :key="video.id"
            class="video-selection-item"
          >
            <el-checkbox :value="video.id">
              <div class="checkbox-content">
                <img
                  :src="video.coverUrl || getDefaultCover()"
                  :alt="video.title"
                  class="checkbox-cover"
                />
                <div class="checkbox-info">
                  <span class="checkbox-title" :title="video.title">{{ video.title }}</span>
                  <div class="checkbox-meta">
                    <span class="meta-views">
                      <el-icon><View /></el-icon>
                      {{ video.viewCount || 0 }}
                    </span>
                    <span class="meta-date">{{ video.date }}</span>
                  </div>
                </div>
              </div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>

      <template #footer>
        <el-button @click="createCollectionVideoDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="creatingCollection"
          @click="handleCreateCollection"
        >
          确定 ({{ createCollectionSelectedVideos.length }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加视频到合集对话框 -->
    <el-dialog
      v-model="addVideoDialogVisible"
      title="管理合集视频"
      width="700px"
      destroy-on-close
    >
      <!-- 提示信息 -->
      <div class="video-selection-header">
        <span class="selection-title">勾选视频添加到合集，取消勾选从合集移除</span>
      </div>

      <!-- 搜索栏 -->
      <div class="video-search-bar">
        <el-input
          v-model="addVideoSearchKeyword"
          placeholder="搜索我上传的视频"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearchVideos"
          @clear="handleSearchVideos"
        />
        <el-button type="primary" @click="handleSearchVideos">搜索</el-button>
      </div>

      <!-- 表头 -->
      <div class="video-list-header">
        <span class="header-left">我的视频列表</span>
        <el-dropdown @command="handleVideoSortChange">
          <span class="header-right">
            {{ addVideoSortBy === 'newest' ? '最新发布' : '最早发布' }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="newest">最新发布</el-dropdown-item>
              <el-dropdown-item command="oldest">最早发布</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 视频列表 -->
      <div v-if="addVideoLoading" class="dialog-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="userVideos.length === 0" class="dialog-empty">
        <el-empty description="暂无视频" />
      </div>

      <div v-else class="video-selection-list">
        <el-checkbox-group v-model="selectedVideos">
          <div
            v-for="video in userVideos"
            :key="video.id"
            class="video-selection-item"
          >
            <el-checkbox :value="video.manuscriptId">
              <div class="checkbox-content">
                <img
                  :src="video.coverUrl || getDefaultCover()"
                  :alt="video.title"
                  class="checkbox-cover"
                />
                <div class="checkbox-info">
                  <span class="checkbox-title" :title="video.title">{{ video.title }}</span>
                  <div class="checkbox-meta">
                    <span class="meta-views">
                      <el-icon><View /></el-icon>
                      {{ video.viewCount || 0 }}
                    </span>
                    <span class="meta-date">{{ video.date }}</span>
                  </div>
                </div>
              </div>
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>

      <template #footer>
        <el-button @click="addVideoDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleAddVideosToCollection"
        >
          更新
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<style scoped>
/* 个人主页整体样式 */
.user-profile-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 背景框容器 */
.profile-header {
  position: relative;
  width: 100%;
  max-width: 1200px;
  height: 200px;
  background-color: #f0f0f0;
  overflow: hidden;
  margin: 0 auto;
  margin-bottom: 0;
}

/* 封面图片 */
.cover-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

/* 个人信息 */
.profile-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  color: #fff;
}

/* 顶部个人资料操作按钮 */
.profile-btn {
  position: absolute;
  bottom: 10px;
  background-color: transparent;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.5);
  z-index: 20;
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 关注按钮 */
.profile-btn.follow-btn {
  right: 120px;
  background-color: transparent;
  color: #ffffff !important;
}

.profile-btn.follow-btn:hover {
  background-color: rgba(0, 174, 236, 0.9);
  border-color: #00aeec;
  color: #ffffff !important;
}

/* 已关注状态 */
.profile-btn.follow-btn.following {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
}

.profile-btn.follow-btn.following:hover {
  background-color: rgba(255, 100, 100, 0.8);
  border-color: rgba(255, 100, 100, 0.9);
}

.profile-btn.follow-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 发消息按钮 */
.profile-btn.message-btn {
  right: 20px;
  background-color: transparent;
  color: #ffffff !important;
}

.profile-btn.message-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.8);
  color: #ffffff !important;
}

/* 头像容器 */
.avatar-container {
  margin-right: 20px;
  z-index: 10;
  border: 4px solid #fff;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  width: 88px;
  height: 88px;
}

.avatar-container.clickable {
  cursor: pointer;
}

.avatar-container.clickable:hover .user-avatar {
  filter: brightness(0.8);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.avatar-container.clickable:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay .el-icon {
  color: #fff;
}

/* 用户头像 */
.user-avatar {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  margin: 0 auto;
}

/* 用户详情 */
.user-details {
  flex: 1;
}

/* 用户名 */
.username {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 性别符号 */
.gender-icon {
  font-size: 18px;
  font-weight: normal;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.gender-icon.male {
  color: #4fc3f7;
}

.gender-icon.female {
  color: #ff8a80;
}

/* 个人签名 */
.bio-input {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
  width: 100%;
  min-height: 40px;
  max-height: 80px;
  border: 1px solid transparent;
  background-color: transparent;
  color: #fff;
  resize: none;
  padding: 4px 0;
  font-family: inherit;
}

.bio-input:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.bio-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* 公告输入框 */
.announcement-input {
  width: 100%;
  min-height: 100px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  font-size: 14px;
  color: #333;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.announcement-input:focus {
  outline: none;
  border-color: #00aeec;
}

.announcement-input::placeholder {
  color: #999;
}

/* 选择栏容器 */
.profile-tabs-container {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 20px;
}

/* 选择栏包装器 */
.profile-tabs-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  background-color: #fff;
}

/* 选择栏 */
.profile-tabs {
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: #fff;
}

/* 标签项 */
.tab-item {
  padding: 8px 16px;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #fff;
}

.tab-item:hover {
  color: #00aeec;
  background-color: rgba(0, 174, 236, 0.1);
}

.tab-item.active {
  color: #00aeec;
  background-color: rgba(0, 174, 236, 0.1);
  font-weight: 500;
  border-bottom: 2px solid #00aeec;
}

/* 搜索栏包装器 */
.search-bar-wrapper {
  margin-left: 30px;
}

/* 搜索输入包装器 */
.search-input-wrapper {
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 20px;
  padding: 0 15px;
  height: 36px;
  width: 200px;
  transition: all 0.3s ease;
}

.search-input-wrapper:hover {
  background-color: #e0e2e5;
}

/* 搜索图标 */
.search-icon {
  color: #9499a0;
  font-size: 16px;
  margin-right: 8px;
}

/* 搜索输入框 */
.search-input {
  flex: 1;
  border: none;
  outline: none;
  background-color: transparent;
  font-size: 14px;
  color: #333;
}

/* 统计数据容器 */
.stats-container {
  display: flex;
  gap: 30px;
}

/* 统计项 */
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-item:hover .stat-label {
  color: #00aeec;
}

.stat-item:hover .stat-value {
  color: #00aeec;
}

/* 非交互式统计项样式 */
.stat-item.non-interactive {
  cursor: default;
}

.stat-item.non-interactive:hover .stat-label {
  color: #9499a0;
}

.stat-item.non-interactive:hover .stat-value {
  color: #333;
}

/* 统计标签 */
.stat-label {
  font-size: 12px;
  color: #9499a0;
  transition: color 0.3s ease;
}

/* 统计数值 */
.stat-value {
  font-size: 16px;
  font-weight: 400;
  color: #333;
  transition: color 0.3s ease;
}

/* 主内容区域 */
.profile-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0 40px;
  box-sizing: border-box;
  display: flex;
  gap: 20px;
  width: 100%;
}

/* 左侧主内容 */
.main-content {
  flex: 1;
  min-width: 0;
}

/* 右侧边栏 */
.side-content {
  width: 300px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 公告样式 */
.announcement-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-item {
  font-size: 14px;
  color: #333;
  margin: 0;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.announcement-item:last-child {
  border-bottom: none;
}

/* 个人资料样式 */
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 40px;
}

.detail-row .detail-item {
  flex: 1;
}

.detail-row .detail-label {
  color: #999;
  font-weight: normal;
  min-width: auto;
  margin-right: 8px;
}

.detail-row .detail-value {
  color: #666;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
}

.detail-label {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.detail-value {
  color: #333;
  flex: 1;
  word-break: break-word;
}

/* 标签样式 */
.profile-tags {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.profile-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background-color: #e3f2fd;
  color: #2196f3;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-tag::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232196f3'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.profile-tag:hover {
  background-color: #bbdefb;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .profile-content {
    padding: 0 20px 40px;
  }
  
  .side-content {
    width: 250px;
    min-width: 250px;
  }
}

@media (max-width: 992px) {
  .profile-content {
    flex-direction: column;
  }
  
  .side-content {
    width: 100%;
    min-width: auto;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .side-content .content-section {
    flex: 1;
    min-width: 300px;
  }
}

@media (max-width: 768px) {
  .side-content {
    flex-direction: column;
  }
  
  .side-content .content-section {
    min-width: auto;
  }
}



/* 内容占位符 */
.content-placeholder {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: #666;
}

/* 合集和列表页面样式 */
.collections-section {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border-radius: 8px;
}

/* 顶部标题 */
.collections-header {
  margin-bottom: 20px;
}

.collections-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 合集网格布局 */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
}

/* 合集项样式 */
.collection-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.collection-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 新建合集按钮样式 */
.new-collection {
  border: 1px dashed #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  gap: 10px;
}

.new-collection-icon {
  font-size: 32px;
  color: #999;
}

.new-collection-text {
  font-size: 14px;
  color: #999;
}

/* 合集封面样式 */
.collection-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.collection-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.collection-item:hover .collection-cover-img {
  transform: scale(1.05);
}

/* 合集视频数量样式 */
.collection-video-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.collection-video-count::before {
  content: "📺";
  font-size: 12px;
}

/* 合集信息样式 */
.collection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collection-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-date {
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 576px) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 收藏夹创建对话框样式 */
.favorite-cover-section {
  margin-bottom: 20px;
}

.cover-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.cover-upload-area {
  position: relative;
}

.cover-placeholder {
  width: 100px;
  height: 100px;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cover-placeholder:hover {
  background-color: #e0e0e0;
}

.cover-icon {
  font-size: 40px;
  color: #999;
}

.favorite-name-section {
  margin-bottom: 20px;
}

.name-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.favorite-description-section {
  margin-bottom: 20px;
}

.description-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.favorite-public-section {
  margin-bottom: 20px;
}

/* 视图切换按钮样式 */
.view-toggle {
  display: flex;
  gap: 10px;
  align-items: center;
}

.view-toggle-btn {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
}

.view-toggle-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
}

.view-toggle-btn.active {
  background-color: #00aeec;
  color: #fff;
  border-color: #00aeec;
}

/* 水平列表视图样式 */
.collections-horizontal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 水平列表项样式 */
.collection-horizontal-item {
  background-color: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  gap: 16px;
}

/* 水平列表头部样式 */
.collection-horizontal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.collection-horizontal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.collection-horizontal-title .collection-video-count {
  font-size: 14px;
  color: #999;
  font-weight: normal;
}

/* 水平列表操作按钮 */
.collection-horizontal-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 水平视频列表样式 */
.collection-videos-horizontal {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 8px;
}

/* 滚动条样式 */
.collection-videos-horizontal::-webkit-scrollbar {
  height: 4px;
}

.collection-videos-horizontal::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.collection-videos-horizontal::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.collection-videos-horizontal::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 添加视频按钮样式 */
.add-video-btn {
  width: 180px;
  height: 100px;
  border: 1px dashed #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.add-video-btn:hover {
  border-color: #00aeec;
  background-color: rgba(0, 174, 236, 0.05);
}

.add-video-icon {
  font-size: 24px;
  color: #999;
}

.add-video-text {
  font-size: 14px;
  color: #999;
}

/* 水平视频项样式 */
.video-horizontal-item {
  width: 180px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-horizontal-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 水平视频封面样式 */
.video-horizontal-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
  margin-bottom: 8px;
}

/* 水平视频信息样式 */
.video-horizontal-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 水平视频元信息样式 */
.video-horizontal-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #9499a0;
  align-items: center;
}

.video-horizontal-meta .video-views {
  margin-right: 0;
}

/* 顶部标题和视图切换的布局 */
.collections-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 更多按钮样式 */
.more-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  color: #666;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.more-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
}

@media (max-width: 992px) {
  .collections-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .collections-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 576px) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ==================== 动态页面新样式 ==================== */

/* 动态列表容器 */
.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 动态卡片 */
.dynamic-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.dynamic-card.is-top {
  border: 1px solid #00aeec;
}

/* 置顶标记 */
.top-badge {
  position: absolute;
  top: 12px;
  right: 48px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #00aeec;
  background: rgba(0, 174, 236, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.top-badge .el-icon {
  font-size: 12px;
}

/* 动态头部 */
.dynamic-header-new {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.dynamic-header-new .user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.dynamic-header-new .user-info {
  flex: 1;
}

.dynamic-header-new .user-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.dynamic-header-new .dynamic-time {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.dynamic-header-new .more-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dynamic-header-new .more-btn:hover {
  background: #f5f5f5;
  color: #666;
}

/* 动态类型标签 */
.dynamic-type-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
  margin-left: 60px;
}

/* 动态内容区域 */
.dynamic-content-new {
  margin-left: 60px;
}

/* 转发卡片 */
.share-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.share-source {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.source-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}

.source-name {
  font-size: 14px;
  color: #00aeec;
  font-weight: 500;
}

.share-content-wrapper {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.share-text {
  white-space: pre-line;
}

.share-text.is-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-btn {
  color: #00aeec;
  font-size: 13px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  margin-top: 8px;
}

.expand-btn:hover {
  color: #0095d9;
}

/* 转发图片 */
.share-images {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.share-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

/* 视频动态新样式 */
.video-dynamic-new {
  margin-top: 8px;
}

.video-card {
  display: flex;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.video-cover-wrapper {
  position: relative;
  width: 160px;
  height: 90px;
  flex-shrink: 0;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
}

.video-play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.video-info-new {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.video-title-new {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.video-views-new {
  font-size: 13px;
  color: #999;
}

/* 原创内容 */
.original-content {
  margin-top: 8px;
}

.original-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  white-space: pre-line;
}

.original-images {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.original-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

/* 操作栏新样式 */
.dynamic-actions-new {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  margin-top: 16px;
  margin-left: 60px;
  border-top: 1px solid #f0f0f0;
}

.action-btn-new {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 24px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.action-btn-new:hover {
  background: #f5f5f5;
  color: #00aeec;
}

.action-btn-new.is-liked {
  color: #00aeec;
}

.action-btn-new .el-icon {
  font-size: 16px;
}

/* 动态页面响应式设计 */
@media (max-width: 768px) {
  .dynamic-content-new {
    margin-left: 0;
  }
  
  .dynamic-type-label {
    margin-left: 0;
  }
  
  .dynamic-actions-new {
    margin-left: 0;
  }
  
  .share-image,
  .original-image {
    width: calc(33.333% - 6px);
    height: auto;
    aspect-ratio: 1;
  }
  
  .video-card {
    flex-direction: column;
  }
  
  .video-cover-wrapper {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
  }
}

/* ==================== 旧动态页面样式（保留兼容） ==================== */
.dynamic-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 置顶标记 */
.sticky-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #9499a0;
  font-size: 14px;
  position: absolute;
  top: -25px;
  left: 20px;
  transform: translateX(-50%);
  margin-bottom: 0;
  padding-left: 0;
  background-color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sticky-icon {
  font-size: 12px;
}

/* 动态项 */
.dynamic-item {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 动态头部 */
.dynamic-header {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.dynamic-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.dynamic-user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dynamic-username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.dynamic-time {
  font-size: 12px;
  color: #9499a0;
}

/* 动态内容 */
.dynamic-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 视频动态 */
.video-dynamic {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.video-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.video-preview {
  position: relative;
  width: 100%;
  max-width: 500px;
  border-radius: 4px;
  overflow: hidden;
}

.video-cover-img {
  width: 100%;
  height: auto;
  display: block;
}

/* 动态交互 */
.dynamic-actions {
  display: flex;
  gap: 40px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
  color: #9499a0;
  transition: all 0.3s ease;
}

.action-item:hover {
  color: #00aeec;
}

.action-icon {
  font-size: 16px;
}

.action-count {
  font-size: 14px;
}

/* 编辑资料按钮 */
.edit-profile-btn-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.edit-profile-btn {
  padding: 4px 12px;
  border: 1px solid #dcdcdc;
  background-color: #fff;
  color: #666;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-profile-btn:hover {
  background-color: #f5f5f5;
  border-color: #c0c0c0;
}

/* 投稿页面样式 */
.submissions-section {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  width: 100%;
  border-radius: 0;
}

/* 顶部容器，与封面图片同宽 */
.submissions-top {
  display: flex;
  gap: 0;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 左侧分类导航 */
.submissions-sidebar {
  width: 120px;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 20px;
  border-right: 1px solid #f0f0f0;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
  border-radius: 4px;
  margin-right: 10px;
}

.category-item:hover {
  color: #00aeec;
  background-color: rgba(0, 174, 236, 0.1);
}

.category-item.active {
  color: #fff;
  font-weight: 500;
  background-color: #00aeec;
  border-right: none;
  padding-right: 12px;
}

.category-count {
  font-size: 12px;
  color: #9499a0;
  transition: color 0.3s ease;
}

/* 选中状态下的分类数量颜色 */
.category-item.active .category-count {
  color: #fff;
}

/* 右侧内容区域 */
.submissions-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 标题和排序 */
.submissions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.submissions-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 视频列表 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

/* 视频项 */
.video-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.video-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-date {
  font-size: 12px;
  color: #9499a0;
}

/* 操作按钮 */
.grid-icon {
  font-size: 16px;
}

/* 收藏页面样式 */
.favorites-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 收藏夹头部 */
.favorite-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
}

.favorite-header-cover {
  width: 160px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f0f0f0;
}

.favorite-header-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.favorite-header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.favorite-header-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #9499a0;
  margin-bottom: 12px;
}

.meta-item {
  position: relative;
}

.meta-item:not(:last-child)::after {
  content: '·';
  position: absolute;
  right: -10px;
}

.favorite-header-actions {
  display: flex;
  gap: 10px;
}

.favorite-header-actions .play-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #00aeec;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.favorite-header-actions .play-all-btn:hover {
  background-color: #0095d9;
}

.play-icon {
  font-size: 12px;
}

.favorites-container {
  display: flex;
  gap: 20px;
}

/* 左侧分类导航 */
.favorites-sidebar {
  width: 220px;
  background-color: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

/* 右侧内容区域 */
.favorites-content {
  flex: 1;
}

/* 侧边栏分组 */
.sidebar-section {
  margin-bottom: 20px;
}

/* 分组标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.section-action {
  cursor: pointer;
  color: #9499a0;
  font-size: 12px;
}

/* 新建收藏夹按钮 */
.new-collection-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-top: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border: 1px dashed #e0e0e0;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.new-collection-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
  background-color: rgba(0, 174, 236, 0.05);
}

.new-collection-icon {
  font-size: 16px;
  color: #9499a0;
}

.new-collection-text {
  font-size: 14px;
}

/* 收藏夹列表 */
.collection-list {
  margin-bottom: 20px;
}

.collection-item, .favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-direction: row;
}

.collection-content, .favorite-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow: hidden;
  justify-content: flex-start;
  flex-direction: row;
}

.collection-count, .favorite-count {
  font-size: 12px;
  color: #9499a0;
  white-space: nowrap;
  flex-shrink: 0;
}



.collection-name, .favorite-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
}

.collection-item:hover, .favorite-item:hover {
  background-color: rgba(0, 174, 236, 0.1);
  color: #00aeec;
}

.collection-item.active, .favorite-item.active {
  background-color: #00aeec;
  color: #fff;
}

.collection-icon, .favorite-icon {
  font-size: 16px;
  min-width: 16px;
  text-align: center;
}

.collection-name, .favorite-name {
  font-size: 14px;
}

.collection-count, .favorite-count {
  font-size: 12px;
  color: #9499a0;
}

.collection-item.active .collection-count, .favorite-item.active .favorite-count {
  color: rgba(255, 255, 255, 0.8);
}

/* 收藏夹操作按钮 */
.favorite-actions,
.collection-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-right: 4px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.favorite-item:hover .favorite-actions,
.collection-item:hover .collection-actions {
  opacity: 1;
}

.favorite-actions .more-btn,
.collection-actions .more-btn {
  padding: 2px 4px;
  color: #666;
  font-size: 16px;
}

.favorite-actions .more-btn:hover,
.collection-actions .more-btn:hover {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.favorite-item.active .favorite-actions .more-btn,
.collection-item.active .collection-actions .more-btn {
  color: #fff;
}

.favorite-item.active .favorite-actions .more-btn:hover,
.collection-item.active .collection-actions .more-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* 分类标题和统计 */
.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.category-header .category-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.category-header .category-stats {
  font-size: 16px;
  font-weight: 600;
  color: #666;
}

/* 顶部操作按钮 */
.top-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

/* 排序和筛选选项 */
.sort-filter {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.batch-operations {
  cursor: pointer;
}

.batch-operations:hover {
  color: #00aeec;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-select {
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  position: relative;
  width: 200px;
}

.search-box .search-input {
  width: 100%;
  padding: 6px 32px 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  font-size: 14px;
  box-sizing: border-box;
}

.search-box .search-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  background-color: transparent;
  color: #9499a0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-box .search-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}

/* 收藏的视频列表 */
.favorites-content .videos-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
  order: 2;
}

.page-input {
  width: 50px;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.pagination-buttons {
  display: flex;
  gap: 5px;
  order: 1;
  align-items: center;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  color: #666;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 32px;
  text-align: center;
}

.page-btn:hover:not(:disabled) {
  color: #00aeec;
  border-color: #00aeec;
}

.page-btn.active {
  background-color: #00aeec;
  color: #fff;
  border-color: #00aeec;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 下一页按钮特殊样式 */
.pagination-buttons .page-btn:last-child {
  margin-left: 5px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .videos-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .submissions-section {
    flex-direction: column;
  }
  
  .submissions-sidebar {
    width: 100%;
    min-width: auto;
    flex-direction: row;
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 15px;
  }
  
  .category-item.active {
    border-right: none;
    border-bottom: none;
    padding-right: 12px;
    padding-bottom: 8px;
    background-color: #00aeec;
    color: #fff;
  }
  
  .videos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .videos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .submissions-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .submissions-controls {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 576px) {
  .videos-grid {
    grid-template-columns: 1fr;
  }
  
  .submissions-sidebar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .category-item.active {
    border-right: none;
    border-bottom: none;
    padding-right: 12px;
    padding-bottom: 8px;
    background-color: #00aeec;
    color: #fff;
  }
}

.content-placeholder h2 {
  margin-bottom: 10px;
  color: #333;
}

/* 内容区域通用样式 */
.content-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

/* 代表作视图切换按钮 */
.representative-view-toggle {
  display: flex;
  gap: 48px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e3e5e7;
}

.view-toggle-btn {
  padding: 12px 8px;
  font-size: 14px;
  color: #61666d;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
}

.view-toggle-btn:hover {
  color: #00aeec;
}

.view-toggle-btn.active {
  color: #00aeec;
  border-bottom-color: #00aeec;
  font-weight: 500;
}

/* 代表作区域固定高度 - 确保切换时容器高度一致 */
.content-section:has(.representative-view-toggle),
.content-section:has(.rep-video-list),
.content-section:has(.empty-state) {
  min-height: 220px;
}

/* 代表作列表 - 粉丝模式：左侧封面右侧信息 */
.rep-video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rep-video-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  min-height: 135px;
}

.rep-video-left {
  position: relative;
  width: 240px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.rep-video-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rep-video-time {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.rep-video-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
}

.rep-video-title {
  font-size: 15px;
  font-weight: 500;
  color: #18191c;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rep-video-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #9499a0;
  align-items: center;
}

.rep-stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rep-stat-item .el-icon {
  font-size: 14px;
}

/* 代表作列表 - 访客模式：三列网格 */
.rep-video-list.is-visitor {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.rep-video-list.is-visitor .rep-video-card {
  flex-direction: column;
  gap: 12px;
  min-height: auto;
}

.rep-video-list.is-visitor .rep-video-left {
  width: 100%;
}

.rep-video-list.is-visitor .rep-video-right {
  padding-top: 0;
  gap: 8px;
}

.rep-video-list.is-visitor .rep-video-title {
  font-size: 14px;
}

.rep-video-list.is-visitor .rep-video-stats {
  font-size: 12px;
  gap: 12px;
}

/* 视频网格样式 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

/* 视频项样式 */
.video-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.video-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.video-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #9499a0;
  flex-wrap: wrap;
  white-space: nowrap;
}

/* 控制区域样式 */
.section-controls-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.section-count {
  font-size: 14px;
  color: #9499a0;
}

.sort-options {
  display: flex;
  gap: 10px;
  align-items: center;
}

.sort-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  color: #666;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
}

.sort-btn.active {
  background-color: #00aeec;
  color: #fff;
  border-color: #00aeec;
}

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  color: #666;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
}

.play-all-btn {
  background-color: #00aeec;
  color: #fff;
  border-color: #00aeec;
}

.play-all-btn:hover {
  background-color: #0095d9;
  border-color: #0095d9;
  color: #fff;
}

/* 加载状态和空状态 */
.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  color: #9499a0;
  font-size: 14px;
}

.section-count {
  font-size: 16px;
  font-weight: 600;
  color: #666;
}

/* 视频区域控制包装器 */
.section-controls-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

/* 左侧控制区域 */
.left-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.section-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 0;
}

/* 代表作样式 */
.representative-videos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.representative-video-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 排序选项样式 */
.sort-options {
  display: flex;
  gap: 20px;
  align-items: center;
}

.sort-item {
  padding: 8px 16px;
  font-size: 16px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: transparent;
  border: none;
  outline: none;
}

.sort-item:hover {
  color: #00aeec;
  background-color: rgba(0, 174, 236, 0.1);
}

.sort-item.active {
  color: #00aeec;
  background-color: rgba(0, 174, 236, 0.1);
  font-weight: 500;
  border-bottom: 2px solid #00aeec;
}

.action-buttons {
  display: flex !important;
  gap: 10px !important;
  flex-direction: row !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

.action-btn {
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s ease;
  display: inline-block !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  white-space: nowrap !important;
  width: auto !important;
  height: auto !important;
}

.action-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.play-all-btn {
  background-color: #fff;
  color: #666;
  border-color: #e0e0e0;
}

.play-all-btn:hover {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
  color: #333;
}

/* 视图切换按钮样式 */
.view-toggle-btn {
  padding: 6px 10px;
  border: none;
  background-color: transparent;
  color: #666;
  border-radius: 4px;
}

.view-toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}

/* 视图切换按钮激活状态 */
.view-toggle-btn.active {
  background-color: rgba(0, 174, 236, 0.1);
  color: #00aeec;
}

/* 图标样式 */
.view-icon {
  font-size: 16px;
}

/* 列表视图样式 */
.videos-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.video-list-item {
  display: flex;
  gap: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}

.video-list-item:last-child {
  border-bottom: none;
}

.video-list-cover {
  position: relative;
  width: 160px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.video-list-cover .video-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-list-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.video-list-info .video-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  margin: 0;
  min-height: 21px; /* 16px * 1.5 * 1 */
}

/* 视频简介样式 */
.video-description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
  min-height: 42px; /* 14px * 1.5 * 2 */
}

/* 元信息显示在简介下方 */
.video-list-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #999;
  align-items: center;
  margin-top: 0;
}

.video-list-meta .video-views {
  margin-right: 0;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.video-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 视频封面样式 */
.video-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  overflow: hidden;
  border-radius: 4px;
  background-color: #f0f0f0;
}

.video-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-cover:hover img {
  transform: scale(1.05);
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
  min-height: 39.2px; /* 14px * 1.4 * 2 */
}

/* 视频元信息样式 */
.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.video-meta .video-views {
  margin-right: 10px;
}

.video-date {
  font-size: 12px;
  color: #999;
}

.video-views {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .videos-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .representative-videos {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .videos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .representative-videos {
    grid-template-columns: 1fr;
  }
  
  .videos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .section-controls-wrapper {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .left-controls {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .action-buttons {
    width: auto;
    justify-content: flex-start;
    flex-direction: row !important;
  }
}

@media (max-width: 576px) {
  .videos-grid {
    grid-template-columns: 1fr;
  }
  
  .sort-options {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .sort-btn {
    flex: 1;
    min-width: 80px;
  }
}

/* 搜索页面样式 - 与投稿页面一致 */
.search-section {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0;
  width: 100%;
  border-radius: 0;
}

/* 顶部容器，与封面图片同宽 */
.search-top {
  display: flex;
  gap: 0;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 左侧分类导航 */
.search-sidebar {
  width: 120px;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 20px;
  border-right: 1px solid #f0f0f0;
}

/* 右侧内容区域 */
.search-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 搜索结果统计 */
.search-result-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  padding: 5px 0;
}

.search-result-info .keyword {
  color: #00aeec;
  font-weight: 500;
}

/* 视频可见性标签 */
.video-visibility {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-visibility .el-icon {
  font-size: 12px;
}

/* 动态搜索内容 */
.dynamic-search-content {
  padding: 40px 0;
}

/* 搜索页面响应式设计 */
@media (max-width: 992px) {
  .search-section {
    flex-direction: column;
  }
  
  .search-sidebar {
    width: 100%;
    min-width: auto;
    flex-direction: row;
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 15px;
  }
  
  .search-content {
    padding-top: 15px;
  }
}

/* ==================== 关注/粉丝列表样式 ==================== */

/* 关注/粉丝列表页面整体布局 */
.follow-list-section {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.follow-list-container {
  display: flex;
  min-height: 600px;
}

/* 左侧边栏 */
.follow-sidebar {
  width: 200px;
  min-width: 200px;
  background-color: #f5f7fa;
  padding: 20px 0;
  border-right: 1px solid #e0e0e0;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.sidebar-item:hover {
  background-color: rgba(0, 174, 236, 0.1);
}

.sidebar-item.active {
  background-color: #00aeec;
  color: #fff;
}

.sidebar-item.active .sidebar-count {
  color: rgba(255, 255, 255, 0.9);
}

.sidebar-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.sidebar-info {
  flex: 1;
}

.sidebar-label {
  font-size: 14px;
  font-weight: 500;
}

.sidebar-count {
  font-size: 13px;
  color: #999;
  margin-left: 8px;
}

/* 右侧内容区 */
.follow-content {
  flex: 1;
  padding: 20px;
  background-color: #fff;
}

/* 顶部标题和筛选区 */
.follow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.follow-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.follow-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.follow-count {
  font-size: 14px;
  color: #999;
}

.follow-filters {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-item {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.filter-item:hover {
  color: #00aeec;
}

.filter-item.active {
  color: #00aeec;
  border-bottom-color: #00aeec;
}

/* 搜索框 */
.follow-search {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 16px;
  padding: 0 12px;
  height: 32px;
  width: 140px;
}

.follow-search .search-icon {
  color: #999;
  font-size: 14px;
  margin-right: 8px;
}

.follow-search .search-input {
  flex: 1;
  border: none;
  outline: none;
  background-color: transparent;
  font-size: 13px;
  color: #333;
}

.follow-search .search-input::placeholder {
  color: #999;
}

/* 视图切换按钮 */
.view-toggle {
  display: flex;
  gap: 8px;
}

.view-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s ease;
}

.view-btn:hover {
  border-color: #00aeec;
  color: #00aeec;
}

/* 用户列表 */
.user-list {
  display: flex;
  flex-direction: column;
}

.user-list-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.3s ease;
}

.user-list-item:hover {
  background-color: #fafafa;
}

.user-list-item:last-child {
  border-bottom: none;
}

/* 用户头像 */
.user-avatar-wrapper {
  margin-right: 16px;
}

.user-list-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #f0f0f0;
}

/* 用户信息 */
.user-info {
  flex: 1;
  min-width: 0;
}

.user-nickname {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.user-nickname:hover {
  color: #00aeec;
}

.user-signature {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 用户操作按钮 */
.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.follow-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.follow-btn.following {
  background-color: #fff;
  color: #666;
  border-color: #e0e0e0;
}

.follow-btn.following:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.follow-btn.not-following {
  background-color: #00aeec;
  color: #fff;
  border-color: #00aeec;
}

.follow-btn.not-following:hover {
  background-color: #0095d9;
  border-color: #0095d9;
}

.follow-btn .el-icon {
  font-size: 14px;
}

.more-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s ease;
}

.more-btn:hover {
  border-color: #00aeec;
  color: #00aeec;
}

/* 关注/粉丝列表响应式设计 */
@media (max-width: 992px) {
  .follow-list-container {
    flex-direction: column;
  }
  
  .follow-sidebar {
    width: 100%;
    min-width: auto;
    display: flex;
    padding: 10px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .sidebar-item {
    flex: 1;
    justify-content: center;
  }
  
  .follow-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .follow-filters {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 576px) {
  .user-list-item {
    padding: 12px 0;
  }
  
  .user-list-avatar {
    width: 48px;
    height: 48px;
  }
  
  .follow-search {
    width: 120px;
  }
}

/* ==================== 合集功能样式 ==================== */

/* 合集区域 */
.collections-section {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  border-radius: 8px;
}

/* 合集头部 */
.collections-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.collections-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collections-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.new-collection-btn {
  font-size: 14px;
}

/* 视图切换按钮 */
.view-toggle {
  display: flex;
  gap: 8px;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
}

.view-toggle-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
}

.view-toggle-btn.active {
  background-color: #00aeec;
  color: #fff;
  border-color: #00aeec;
}

/* 宫格视图 */
.collections-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
}

.collection-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.collection-item:hover {
  transform: translateY(-4px);
}

.collection-item.new-collection {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

.collection-item.new-collection:hover {
  border-color: #00aeec;
  background-color: rgba(0, 174, 236, 0.05);
}

.new-collection-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.collection-item.new-collection:hover .new-collection-content {
  color: #00aeec;
}

.collection-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.collection-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-video-count {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  border-radius: 12px;
}

.collection-info {
  margin-top: 8px;
}

.collection-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-date {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 水平列表视图 */
.collections-horizontal {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.collection-horizontal-item {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 24px;
}

.collection-horizontal-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.collection-horizontal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.collection-horizontal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collection-video-count-badge {
  font-size: 14px;
  color: #999;
  font-weight: normal;
}

.collection-horizontal-actions {
  display: flex;
  gap: 12px;
}

.collection-horizontal-actions .action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collection-horizontal-actions .play-all-btn {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  color: #666;
}

.collection-horizontal-actions .play-all-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
}

.collection-horizontal-actions .more-btn {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  color: #666;
}

.collection-horizontal-actions .more-btn:hover {
  color: #00aeec;
  border-color: #00aeec;
}

/* 水平视频列表 */
.collection-videos-horizontal {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.collection-videos-horizontal::-webkit-scrollbar {
  height: 4px;
}

.collection-videos-horizontal::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.collection-videos-horizontal::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

/* 添加视频卡片 */
.add-video-card {
  width: 180px;
  height: 100px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.add-video-card:hover {
  border-color: #00aeec;
  background-color: rgba(0, 174, 236, 0.05);
}

.add-video-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.add-video-card:hover .add-video-content {
  color: #00aeec;
}

/* 视频项 */
.video-horizontal-item {
  width: 180px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.video-horizontal-item:hover {
  transform: translateY(-2px);
}

.video-horizontal-cover {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.video-horizontal-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-horizontal-info {
  margin-top: 8px;
}

.video-horizontal-info .video-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.video-horizontal-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.video-horizontal-meta .video-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 新建合集对话框样式 */
.collection-cover-uploader {
  width: 100%;
}

.collection-cover-uploader .cover-preview {
  width: 100%;
  height: 160px;
  border-radius: 8px;
  overflow: hidden;
}

.collection-cover-uploader .cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-cover-uploader .cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 160px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  color: #909399;
  cursor: pointer;
  transition: all 0.3s ease;
}

.collection-cover-uploader .cover-placeholder:hover {
  border-color: #00aeec;
  color: #00aeec;
}

/* 合集详情视图样式 */
.collection-detail-view {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.collection-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.collection-detail-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #666;
}

.collection-detail-header .header-title {
  color: #333;
  font-weight: 500;
}

.collection-detail-header .collection-name {
  color: #333;
  font-weight: 600;
}

/* 合集信息区 */
.collection-info-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.collection-info-section .info-container {
  display: flex;
  gap: 20px;
}

.collection-cover-large {
  position: relative;
  width: 280px;
  height: 158px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
  cursor: pointer;
}

.collection-cover-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-cover-large .cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.collection-cover-large:hover .cover-overlay {
  opacity: 1;
}

.collection-cover-large .video-count-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 13px;
  border-radius: 4px;
}

/* 合集元信息 */
.collection-meta-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.collection-title-large {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
}

.collection-desc-large {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.collection-meta-detail .stats-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #9499a0;
}

.collection-meta-detail .stats-info .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collection-meta-detail .private-tag {
  padding: 2px 8px;
  background-color: #f0f0f0;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
}

.collection-meta-detail .action-buttons {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 10px;
}

/* 稿件列表区 */
/* 视频网格区 */
.collection-videos-section {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.collection-videos-section .videos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.collection-videos-section .sort-options {
  display: flex;
  gap: 24px;
}

.collection-videos-section .sort-item {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  padding-bottom: 4px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.collection-videos-section .sort-item:hover {
  color: #00aeec;
}

.collection-videos-section .sort-item.active {
  color: #00aeec;
  border-bottom-color: #00aeec;
}

.collection-videos-section .header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 视频网格 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

/* 合集详情页视频卡片 - 使用独立类名避免冲突 */
.collection-video-card {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.collection-video-card:hover {
  transform: translateY(-4px);
}

/* 封面区域 - 使用 aspect-ratio */
.collection-video-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  cursor: pointer;
  background-color: #f0f0f0;
  border-radius: 8px 8px 0 0;
}

.collection-video-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.collection-video-card:hover .collection-video-cover-img {
  transform: scale(1.05);
}

/* 序号 */
.collection-video-index {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  z-index: 10;
}

/* 时长 */
.collection-video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  border-radius: 2px;
  z-index: 1;
}

/* 操作按钮 */
.collection-video-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
}

.collection-video-card:hover .collection-video-actions {
  opacity: 1;
}

/* 信息区域 */
.collection-video-info {
  padding: 10px;
  flex: 1;
  min-height: 0;
}

.collection-video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-video-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #9499a0;
  flex-wrap: wrap;
}

.collection-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 添加视频卡片 */
.video-card.add-video-card {
  aspect-ratio: 16 / 10;
  border: 2px dashed #dcdcdc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-card.add-video-card:hover {
  border-color: #00aeec;
  background-color: #f0f9ff;
}

.add-video-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
}

.add-video-content .el-icon {
  color: #ccc;
}

.add-video-content span {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .collection-info-section .info-container {
    flex-direction: column;
  }

  .collection-cover-large {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .collection-meta-detail .action-buttons {
    margin-top: 12px;
  }
}

@media (max-width: 768px) {
  .manuscripts-section .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .manuscript-item {
    flex-wrap: wrap;
  }

  .manuscript-item .item-play {
    opacity: 1;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .collection-detail-header .header-left {
    flex-wrap: wrap;
  }
}

.collection-cover-uploader .cover-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 视频选择对话框样式 */
.video-selection-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.selection-title {
  font-size: 14px;
  color: #666;
}

.selection-title strong {
  color: #00aeec;
  font-size: 16px;
}

.video-search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.video-search-bar .el-input {
  flex: 1;
}

.video-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.header-left {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.header-right {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dialog-loading {
  padding: 40px 0;
}

.dialog-empty {
  padding: 40px 0;
}

.video-selection-list {
  max-height: 400px;
  overflow-y: auto;
}

.video-selection-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.video-selection-item:last-child {
  border-bottom: none;
}

.video-selection-item .el-checkbox {
  width: 100%;
}

.video-selection-item .el-checkbox__label {
  flex: 1;
  padding-left: 12px;
}

.checkbox-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.checkbox-cover {
  width: 120px;
  height: 68px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.checkbox-info {
  flex: 1;
  min-width: 0;
}

.checkbox-title {
  font-size: 14px;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.checkbox-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.meta-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .collections-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 992px) {
  .collections-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .collection-horizontal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 576px) {
  .collections-grid {
    grid-template-columns: 1fr;
  }
}

/* 评论展开区域样式 */
.comment-section {
  margin-top: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.comment-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.comment-count {
  font-size: 14px;
  color: #909399;
}

.comment-sort {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.sort-item {
  cursor: pointer;
  transition: color 0.3s;
}

.sort-item:hover,
.sort-item.active {
  color: #409eff;
}

.sort-divider {
  color: #dcdfe6;
}

.comment-input-wrapper {
  margin-bottom: 16px;
}

.comment-input-box {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.comment-submit-wrapper {
  display: flex;
  justify-content: flex-end;
}

.comment-list-expanded {
  min-height: 100px;
}

.comment-item-expanded {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item-expanded:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-author-name {
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
  margin-bottom: 4px;
}

.comment-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 8px;
  word-break: break-all;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.comment-like-btn-small {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: none;
  background: transparent;
  color: #909399;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.comment-like-btn-small:hover {
  color: #409eff;
}

.comment-like-btn-small.is-liked {
  color: #409eff;
}

.empty-comment {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

.load-more-comments {
  text-align: center;
  padding: 16px 0;
}

.action-btn-new.is-active {
  color: #409eff;
}

/* ==================== 设置页面样式 ==================== */
.settings-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  min-height: 500px;
}

.settings-container {
  max-width: 800px;
}

.settings-group {
  margin-bottom: 32px;
}

.settings-group-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.setting-label {
  font-size: 14px;
  color: #333;
}

.setting-control {
  display: flex;
  align-items: center;
}

.setting-control .el-switch {
  margin-right: 12px;
}

.setting-status {
  font-size: 14px;
  color: #999;
  min-width: 40px;
  text-align: right;
}

/* 标签管理样式 */
.tags-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.user-tag {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 4px;
}

.tag-input-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.tag-input {
  width: 200px;
}

.tag-input .el-input__inner {
  border-radius: 4px;
}
</style>