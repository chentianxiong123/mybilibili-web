<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import { messageApi } from '../../../api/message.js'

const settings = ref({
  // 消息提醒总开关
  messageReminder: true,
  
  // 回复我的消息提醒
  replyReminder: 'following', // all, following, none
  
  // @我的消息提醒
  atReminder: 'all', // all, following, none
  
  // 收到的赞消息提醒
  likeReminder: false
})

const loading = ref(false)

const fetchSettings = async () => {
  try {
    const res = await messageApi.getMessageSettings()
    if (res.code === 200 && res.data) {
      settings.value = { ...settings.value, ...res.data }
    }
  } catch (error) {
    console.error('获取消息设置失败:', error)
  }
}

const saveSettings = async () => {
  loading.value = true
  try {
    const res = await messageApi.updateMessageSettings(settings.value)
    if (res.code === 200) {
      ElMessage.success('设置已保存')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="message-settings">
    <div class="settings-header">
      <span class="header-title">消息设置</span>
    </div>
    
    <div class="settings-content">
      <!-- 消息提醒总开关 -->
      <div class="setting-section">
        <div class="section-title">
          消息提醒
          <span class="section-desc">（关闭后，消息将不再进行提醒）</span>
        </div>
        <div class="section-content">
          <el-radio-group v-model="settings.messageReminder">
            <el-radio :label="true">开启</el-radio>
            <el-radio :label="false">关闭</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 回复我的消息提醒 -->
      <div class="setting-section">
        <div class="section-title">
          回复我的消息提醒
          <span class="section-desc">（接收谁的评论消息提醒）</span>
        </div>
        <div class="section-content">
          <el-radio-group v-model="settings.replyReminder">
            <el-radio label="all">所有人</el-radio>
            <el-radio label="following">关注的人</el-radio>
            <el-radio label="none">不接收任何消息提醒</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- @我的消息提醒 -->
      <div class="setting-section">
        <div class="section-title">
          @我的消息提醒
          <span class="section-desc">（接收谁的@消息提醒）</span>
        </div>
        <div class="section-content">
          <el-radio-group v-model="settings.atReminder">
            <el-radio label="all">所有人</el-radio>
            <el-radio label="following">关注的人</el-radio>
            <el-radio label="none">不接收任何消息提醒</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 收到的赞消息提醒 -->
      <div class="setting-section">
        <div class="section-title">收到的赞消息提醒</div>
        <div class="section-content">
          <el-radio-group v-model="settings.likeReminder">
            <el-radio :label="true">开启</el-radio>
            <el-radio :label="false">关闭</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 保存按钮 -->
      <div class="settings-footer">
        <el-button 
          type="primary" 
          :loading="loading"
          @click="saveSettings"
        >
          保存设置
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-settings {
  width: 680px;
  background-color: #fff;
  border-right: 1px solid #e3e5e7;
  height: 100%;
  overflow-y: auto;
}

.settings-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e3e5e7;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #18191c;
}

.settings-content {
  padding: 20px;
}

.setting-section {
  padding: 20px 0;
  border-bottom: 1px solid #f1f2f3;
}

.setting-section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #18191c;
  margin-bottom: 16px;
}

.section-desc {
  font-size: 13px;
  color: #9499a0;
  font-weight: normal;
}

.section-content {
  padding-left: 8px;
}

.section-content :deep(.el-radio-group) {
  display: flex;
  gap: 32px;
}

.section-content :deep(.el-radio) {
  margin-right: 0;
  height: auto;
  line-height: 1.5;
}

.section-content :deep(.el-radio__label) {
  font-size: 14px;
  color: #18191c;
  padding-left: 8px;
}

.section-content :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #00a1d6;
}

.section-content :deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: #00a1d6;
  background-color: #00a1d6;
}

.section-content :deep(.el-radio__inner:hover) {
  border-color: #00a1d6;
}

.settings-footer {
  padding: 20px 0;
  display: flex;
  justify-content: flex-start;
}

.settings-footer :deep(.el-button--primary) {
  background-color: #00a1d6;
  border-color: #00a1d6;
}

.settings-footer :deep(.el-button--primary:hover) {
  background-color: #00b5e5;
  border-color: #00b5e5;
}
</style>
