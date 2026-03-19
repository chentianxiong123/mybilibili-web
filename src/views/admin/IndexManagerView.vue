<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, DataLine, Plus } from '@element-plus/icons-vue'

// 索引状态
const indexStatus = ref({
  indexedCount: 0,
  indexName: 'videos',
  status: 'unknown'
})

// 加载状态
const loading = ref(false)
const actionLoading = ref(false)

// 获取索引状态
const fetchIndexStatus = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/search/admin/index/status')
    const result = await response.json()
    if (result.code === 200) {
      indexStatus.value = result.data
    } else {
      ElMessage.error(result.message || '获取索引状态失败')
    }
  } catch (error) {
    console.error('获取索引状态失败:', error)
    ElMessage.error('获取索引状态失败')
  } finally {
    loading.value = false
  }
}

// 批量索引
const handleBulkIndex = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要批量索引所有已上架视频吗？这可能需要一些时间。',
      '批量索引',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    actionLoading.value = true
    const response = await fetch('/api/search/admin/index/bulk', {
      method: 'POST'
    })
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success(result.message)
      // 5秒后刷新状态
      setTimeout(fetchIndexStatus, 5000)
    } else {
      ElMessage.error(result.message || '启动批量索引失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量索引失败:', error)
      ElMessage.error('批量索引失败')
    }
  } finally {
    actionLoading.value = false
  }
}

// 重建索引
const handleRebuildIndex = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重建索引吗？这将清空所有索引数据并重新导入，可能需要较长时间。',
      '重建索引',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    actionLoading.value = true
    const response = await fetch('/api/search/admin/index/rebuild', {
      method: 'POST'
    })
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success(result.message)
      // 5秒后刷新状态
      setTimeout(fetchIndexStatus, 5000)
    } else {
      ElMessage.error(result.message || '启动重建索引失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重建索引失败:', error)
      ElMessage.error('重建索引失败')
    }
  } finally {
    actionLoading.value = false
  }
}

// 增量索引
const handleIncrementalIndex = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要执行增量索引吗？这将索引最近60分钟内上架的视频。',
      '增量索引',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    actionLoading.value = true
    const response = await fetch('/api/search/admin/index/incremental?minutes=60', {
      method: 'POST'
    })
    const result = await response.json()
    if (result.code === 200) {
      ElMessage.success(result.message)
      // 3秒后刷新状态
      setTimeout(fetchIndexStatus, 3000)
    } else {
      ElMessage.error(result.message || '启动增量索引失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('增量索引失败:', error)
      ElMessage.error('增量索引失败')
    }
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  fetchIndexStatus()
})
</script>

<template>
  <div class="index-manager">
    <div class="page-header">
      <h1 class="page-title">
        <el-icon><DataLine /></el-icon>
        ES索引管理
      </h1>
      <p class="page-desc">管理Elasticsearch视频搜索索引</p>
    </div>

    <!-- 状态卡片 -->
    <el-row :gutter="20" class="status-cards">
      <el-col :span="8">
        <el-card class="status-card" v-loading="loading">
          <div class="status-item">
            <div class="status-label">索引名称</div>
            <div class="status-value">{{ indexStatus.indexName }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="status-card" v-loading="loading">
          <div class="status-item">
            <div class="status-label">已索引视频数</div>
            <div class="status-value highlight">{{ indexStatus.indexedCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="status-card" v-loading="loading">
          <div class="status-item">
            <div class="status-label">索引状态</div>
            <div class="status-value">
              <el-tag :type="indexStatus.status === 'active' ? 'success' : 'danger'">
                {{ indexStatus.status === 'active' ? '正常' : '异常' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作区域 -->
    <el-card class="action-card">
      <template #header>
        <div class="card-header">
          <span>索引操作</span>
          <el-button type="primary" :icon="Refresh" @click="fetchIndexStatus" :loading="loading">
            刷新状态
          </el-button>
        </div>
      </template>

      <div class="action-list">
        <div class="action-item">
          <div class="action-info">
            <h3>批量索引</h3>
            <p>导入所有已上架视频到Elasticsearch索引中</p>
          </div>
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleBulkIndex"
            :loading="actionLoading"
          >
            执行批量索引
          </el-button>
        </div>

        <el-divider />

        <div class="action-item">
          <div class="action-info">
            <h3>增量索引</h3>
            <p>只索引最近60分钟内上架的视频</p>
          </div>
          <el-button
            type="info"
            :icon="Plus"
            @click="handleIncrementalIndex"
            :loading="actionLoading"
          >
            执行增量索引
          </el-button>
        </div>

        <el-divider />

        <div class="action-item">
          <div class="action-info">
            <h3>重建索引</h3>
            <p>清空所有索引数据并重新导入所有已上架视频（慎用）</p>
          </div>
          <el-button
            type="danger"
            :icon="Refresh"
            @click="handleRebuildIndex"
            :loading="actionLoading"
          >
            执行重建索引
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 说明区域 -->
    <el-card class="info-card">
      <template #header>
        <span>使用说明</span>
      </template>
      <div class="info-content">
        <h4>索引同步机制</h4>
        <ul>
          <li><strong>自动同步</strong>：视频审核通过并上架后，会自动同步到ES索引</li>
          <li><strong>定时任务</strong>：每天凌晨2点会自动执行批量索引，同步可能遗漏的数据</li>
          <li><strong>手动同步</strong>：可以通过本页面手动触发索引操作</li>
        </ul>

        <h4>操作说明</h4>
        <ul>
          <li><strong>批量索引</strong>：首次使用或数据不一致时，执行此操作导入所有已上架视频</li>
          <li><strong>增量索引</strong>：只索引最近上架的视频，速度较快</li>
          <li><strong>重建索引</strong>：清空所有索引后重新导入，用于修复索引数据异常</li>
        </ul>

        <h4>注意事项</h4>
        <ul>
          <li>索引操作可能需要一些时间，请耐心等待</li>
          <li>重建索引会暂时影响搜索功能，建议在低峰期执行</li>
          <li>如果索引数量与数据库不一致，可以执行批量索引进行同步</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.index-manager {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.page-desc {
  color: #666;
  margin: 0;
}

.status-cards {
  margin-bottom: 24px;
}

.status-card {
  text-align: center;
}

.status-item {
  padding: 16px;
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.status-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.status-value.highlight {
  color: #00aeec;
  font-size: 28px;
}

.action-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-list {
  padding: 8px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.action-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #333;
}

.action-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.info-card {
  background-color: #f5f7fa;
}

.info-content h4 {
  margin: 16px 0 8px;
  font-size: 16px;
  color: #333;
}

.info-content h4:first-child {
  margin-top: 0;
}

.info-content ul {
  margin: 0;
  padding-left: 20px;
}

.info-content li {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.info-content strong {
  color: #333;
}
</style>
