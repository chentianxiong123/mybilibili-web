<script setup>
import { ref, onMounted } from 'vue'
import { FolderAdd, MoreFilled, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { interactionApi } from '../../api/index.js'

// 收藏夹列表
const favoriteFolders = ref([])

// 加载状态
const loading = ref(false)

// 分页信息
const pagination = ref({
  currentPage: 1,
  pageSize: 12,
  total: 0
})

// 新建收藏夹对话框
const createDialogVisible = ref(false)
const newFolderName = ref('')
const creating = ref(false)

// 编辑收藏夹对话框
const editDialogVisible = ref(false)
const editingFolder = ref(null)
const editingFolderName = ref('')
const updating = ref(false)

// 当前选中的收藏夹
const selectedFolder = ref(null)

// 收藏夹内的视频列表
const folderVideos = ref([])
const videosLoading = ref(false)
const videoPagination = ref({
  currentPage: 1,
  pageSize: 12,
  total: 0
})

// 是否显示视频列表
const showVideoList = ref(false)

// 加载收藏夹列表
const loadFavoriteFolders = async () => {
  loading.value = true
  try {
    const response = await interactionApi.getFavoriteFolders()
    favoriteFolders.value = response.data || []
    pagination.value.total = favoriteFolders.value.length
  } catch (error) {
    console.error('加载收藏夹失败:', error)
    ElMessage.error('加载收藏夹失败')
  } finally {
    loading.value = false
  }
}

// 创建收藏夹
const createFolder = async () => {
  if (!newFolderName.value.trim()) {
    ElMessage.warning('请输入收藏夹名称')
    return
  }
  
  creating.value = true
  try {
    await interactionApi.createFavoriteFolder({ name: newFolderName.value })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    newFolderName.value = ''
    loadFavoriteFolders()
  } catch (error) {
    console.error('创建收藏夹失败:', error)
    ElMessage.error('创建收藏夹失败')
  } finally {
    creating.value = false
  }
}

// 打开编辑对话框
const openEditDialog = (folder) => {
  editingFolder.value = folder
  editingFolderName.value = folder.name
  editDialogVisible.value = true
}

// 更新收藏夹
const updateFolder = async () => {
  if (!editingFolderName.value.trim()) {
    ElMessage.warning('请输入收藏夹名称')
    return
  }
  
  updating.value = true
  try {
    await interactionApi.updateFavoriteFolder(editingFolder.value.id, editingFolderName.value)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    loadFavoriteFolders()
  } catch (error) {
    console.error('更新收藏夹失败:', error)
    ElMessage.error('更新收藏夹失败')
  } finally {
    updating.value = false
  }
}

// 删除收藏夹
const deleteFolder = async (folder) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除收藏夹"${folder.name}"吗？删除后无法恢复。`,
      '删除收藏夹',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await interactionApi.deleteFavoriteFolder(folder.id)
    ElMessage.success('删除成功')
    loadFavoriteFolders()
    
    // 如果当前正在查看这个收藏夹的视频，关闭视频列表
    if (selectedFolder.value && selectedFolder.value.id === folder.id) {
      showVideoList.value = false
      selectedFolder.value = null
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除收藏夹失败:', error)
      ElMessage.error('删除收藏夹失败')
    }
  }
}

// 查看收藏夹内的视频
const viewFolderVideos = async (folder) => {
  selectedFolder.value = folder
  showVideoList.value = true
  videoPagination.value.currentPage = 1
  await loadFolderVideos()
}

// 加载收藏夹内的视频
const loadFolderVideos = async () => {
  if (!selectedFolder.value) return
  
  videosLoading.value = true
  try {
    const response = await interactionApi.getFavoriteFolderVideos(
      selectedFolder.value.id,
      videoPagination.value.currentPage,
      videoPagination.value.pageSize
    )
    folderVideos.value = response.data.videos || []
    videoPagination.value.total = response.data.total || 0
  } catch (error) {
    console.error('加载视频列表失败:', error)
    ElMessage.error('加载视频列表失败')
  } finally {
    videosLoading.value = false
  }
}

// 从收藏夹移除视频
const removeVideo = async (video) => {
  try {
    await ElMessageBox.confirm(
      `确定要从收藏夹移除视频"${video.title}"吗？`,
      '移除视频',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await interactionApi.removeVideoFromFavoriteFolder(selectedFolder.value.id, video.id)
    ElMessage.success('移除成功')
    loadFolderVideos()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除视频失败:', error)
      ElMessage.error('移除视频失败')
    }
  }
}

// 返回收藏夹列表
const backToFolders = () => {
  showVideoList.value = false
  selectedFolder.value = null
  folderVideos.value = []
}

// 处理分页变化
const handleVideoPageChange = (page) => {
  videoPagination.value.currentPage = page
  loadFolderVideos()
}

// 格式化数字
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

// 格式化时长
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

onMounted(() => {
  loadFavoriteFolders()
})
</script>

<template>
  <div class="favorite-page">
    <!-- 收藏夹列表 -->
    <div v-if="!showVideoList" class="folders-section">
      <!-- 头部 -->
      <div class="section-header">
        <h3>我的收藏夹</h3>
        <el-button type="primary" @click="createDialogVisible = true">
          <el-icon><FolderAdd /></el-icon>
          新建收藏夹
        </el-button>
      </div>
      
      <!-- 收藏夹网格 -->
      <div v-loading="loading" class="folders-grid">
        <div
          v-for="folder in favoriteFolders"
          :key="folder.id"
          class="folder-card"
          @click="viewFolderVideos(folder)"
        >
          <div class="folder-cover">
            <img v-if="folder.cover" :src="folder.cover" alt="封面" />
            <div v-else class="folder-cover-placeholder">
              <el-icon :size="48"><VideoPlay /></el-icon>
            </div>
            <div class="folder-count">{{ folder.videoCount || 0 }} 个视频</div>
          </div>
          <div class="folder-info">
            <h4 class="folder-name">{{ folder.name }}</h4>
            <div class="folder-actions" @click.stop>
              <el-dropdown trigger="hover" placement="bottom-end">
                <el-button link class="more-btn">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openEditDialog(folder)">
                      编辑信息
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteFolder(folder)">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!loading && favoriteFolders.length === 0" class="empty-state">
        <el-icon :size="64"><FolderAdd /></el-icon>
        <p>还没有收藏夹，点击上方按钮创建一个吧</p>
      </div>
    </div>
    
    <!-- 视频列表 -->
    <div v-else class="videos-section">
      <!-- 头部 -->
      <div class="section-header">
        <el-button @click="backToFolders">
          返回收藏夹
        </el-button>
        <h3>{{ selectedFolder?.name }}</h3>
      </div>
      
      <!-- 视频网格 -->
      <div v-loading="videosLoading" class="videos-grid">
        <div
          v-for="video in folderVideos"
          :key="video.id"
          class="video-card"
        >
          <div class="video-cover">
            <img :src="video.cover" alt="封面" />
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="video-actions">
              <el-button link @click="removeVideo(video)">
                <el-icon><Delete /></el-icon>
                移除
              </el-button>
            </div>
          </div>
          <div class="video-info">
            <h4 class="video-title">{{ video.title }}</h4>
            <div class="video-meta">
              <span>{{ video.author }}</span>
              <span>{{ formatNumber(video.playCount) }} 播放</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="videoPagination.total > videoPagination.pageSize" class="pagination">
        <el-pagination
          v-model:current-page="videoPagination.currentPage"
          :page-size="videoPagination.pageSize"
          :total="videoPagination.total"
          layout="prev, pager, next"
          @current-change="handleVideoPageChange"
        />
      </div>
      
      <!-- 空状态 -->
      <div v-if="!videosLoading && folderVideos.length === 0" class="empty-state">
        <el-icon :size="64"><VideoPlay /></el-icon>
        <p>收藏夹里还没有视频</p>
      </div>
    </div>
    
    <!-- 新建收藏夹对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建收藏夹"
      width="400px"
    >
      <el-input
        v-model="newFolderName"
        placeholder="请输入收藏夹名称"
        maxlength="20"
        show-word-limit
      />
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createFolder">
          创建
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 编辑收藏夹对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑收藏夹"
      width="400px"
    >
      <el-input
        v-model="editingFolderName"
        placeholder="请输入收藏夹名称"
        maxlength="20"
        show-word-limit
      />
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="updating" @click="updateFolder">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.favorite-page {
  padding: 0;
  width: 100%;
  min-height: 400px;
}

/* 收藏夹列表 */
.folders-section,
.videos-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 收藏夹网格 */
.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.folder-card {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  border: 1px solid #f0f0f0;
}

.folder-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.folder-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background-color: #f5f7fa;
  overflow: hidden;
}

.folder-cover img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.folder-cover-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.folder-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.folder-info {
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.folder-name {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.folder-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.folder-card:hover .folder-actions {
  opacity: 1;
}

.folder-actions .more-btn {
  padding: 4px 8px;
}

.folder-actions .more-btn:hover {
  background-color: #f0f0f0;
  border-radius: 4px;
}

/* 视频网格 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.video-card {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  border: 1px solid #f0f0f0;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background-color: #f5f7fa;
  overflow: hidden;
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
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
}

.video-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.video-card:hover .video-actions {
  opacity: 1;
}

.video-info {
  padding: 12px;
}

.video-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  height: 2.8em;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #c0c4cc;
}

.empty-state p {
  margin: 20px 0 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .folders-grid,
  .videos-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
