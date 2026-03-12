<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

const props = defineProps({
  videoId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['upload-success'])

const dialogVisible = ref(false)
const uploading = ref(false)
const fileContent = ref('')
const language = ref('zh-CN')
const languageName = ref('简体中文')

const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' }
]

const handleLanguageChange = (value) => {
  const option = languageOptions.find(opt => opt.value === value)
  if (option) {
    languageName.value = option.label
  }
}

const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    fileContent.value = e.target.result
    ElMessage.success('文件读取成功')
  }
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  reader.readAsText(file.raw)
}

const handleUpload = async () => {
  if (!fileContent.value.trim()) {
    ElMessage.warning('请选择字幕文件')
    return
  }

  uploading.value = true
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const { subtitleApi } = await import('../api/subtitle.js')

    const response = await subtitleApi.uploadSrt(
      props.videoId,
      fileContent.value,
      language.value,
      languageName.value,
      user.id
    )

    if (response.code === 200) {
      ElMessage.success('字幕上传成功')
      dialogVisible.value = false
      fileContent.value = ''
      emit('upload-success', response.data)
    } else {
      ElMessage.error(response.message || '上传失败')
    }
  } catch (error) {
    console.error('上传字幕失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}

const openDialog = () => {
  dialogVisible.value = true
}

defineExpose({
  openDialog
})
</script>

<template>
  <div class="subtitle-uploader">
    <el-button
      type="primary"
      size="small"
      @click="openDialog"
    >
      <el-icon><Upload /></el-icon>
      上传字幕
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      title="上传字幕"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="字幕语言">
          <el-select v-model="language" placeholder="选择语言" @change="handleLanguageChange">
            <el-option
              v-for="option in languageOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="字幕文件">
          <el-upload
            accept=".srt,.vtt"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 SRT、VTT 格式的字幕文件
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="文件预览" v-if="fileContent">
          <el-input
            v-model="fileContent"
            type="textarea"
            :rows="6"
            readonly
            placeholder="字幕内容预览"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpload" :loading="uploading">
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.subtitle-uploader {
  display: inline-block;
}
</style>
