<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userApi } from '../../api/index.js'

const router = useRouter()

// 当前用户信息
const currentUser = ref(null)

// 表单数据
const formData = ref({
  nickname: '',
  username: '',
  signature: '',
  gender: 'secret', // male, female, secret
  birthday: ''
})

// 是否正在保存
const saving = ref(false)

// 原始数据（用于检测是否修改）
const originalData = ref({})

// 是否有修改
const hasChanges = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})

// 加载用户信息
onMounted(() => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      currentUser.value = JSON.parse(userData)
      // 填充表单数据
      formData.value.nickname = currentUser.value.nickname || ''
      formData.value.username = currentUser.value.username || ''
      formData.value.signature = currentUser.value.signature || ''
      
      // 处理性别：后端返回的是数字(0/1/2)，前端需要转换为字符串
      const userGender = currentUser.value.gender
      if (typeof userGender === 'number') {
        formData.value.gender = genderMapReverse[userGender] || 'secret'
      } else {
        formData.value.gender = userGender || 'secret'
      }
      
      // 处理生日：后端返回的是 birthdate，前端使用 birthday
      formData.value.birthday = currentUser.value.birthday || currentUser.value.birthdate || ''
      
      // 保存原始数据
      originalData.value = { ...formData.value }
      
      console.log('用户信息:', currentUser.value)
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
})

// 性别映射：字符串转数字
const genderMap = {
  'male': 1,
  'female': 2,
  'secret': 0
}

// 性别映射：数字转字符串
const genderMapReverse = {
  1: 'male',
  2: 'female',
  0: 'secret'
}

// 保存修改
const saveChanges = async () => {
  if (!hasChanges.value) {
    ElMessage.warning('您未做任何修改')
    return
  }

  saving.value = true

  try {
    // 构建请求数据
    const requestData = {
      nickname: formData.value.nickname,
      signature: formData.value.signature
    }

    // 性别转换为数字
    if (formData.value.gender) {
      requestData.gender = genderMap[formData.value.gender]
    }

    // 生日字段名转换为 birthdate
    if (formData.value.birthday) {
      requestData.birthdate = formData.value.birthday
    }

    // 调用后端 API 保存用户信息
    const response = await userApi.updateUser(currentUser.value.id, requestData)

    if (response.code === 200) {
      // 更新 localStorage 中的用户信息
      if (currentUser.value) {
        // 将后端返回的数字 gender 转换为字符串
        const updatedGender = genderMapReverse[response.data.gender] || 'secret'
        currentUser.value = {
          ...currentUser.value,
          nickname: formData.value.nickname,
          signature: formData.value.signature,
          gender: updatedGender,
          birthday: formData.value.birthday
        }
        localStorage.setItem('user', JSON.stringify(currentUser.value))
      }

      // 更新原始数据
      originalData.value = { ...formData.value }

      ElMessage.success('保存成功')
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="info-page">
    <div class="info-container">
      <!-- 表单区域 -->
      <div class="form-section">
        <!-- 昵称 -->
        <div class="form-item">
          <label class="form-label">昵称：</label>
          <div class="form-content">
            <el-input 
              v-model="formData.nickname" 
              placeholder="请输入昵称"
              class="input-field"
            />
            <span class="form-tip">注：修改一次昵称需要消耗 6 个硬币</span>
          </div>
        </div>
        
        <!-- 用户名 -->
        <div class="form-item">
          <label class="form-label">用户名：</label>
          <div class="form-content">
            <span class="username-text">{{ formData.username || '未设置' }}</span>
          </div>
        </div>
        
        <!-- 我的签名 -->
        <div class="form-item">
          <label class="form-label">我的签名：</label>
          <div class="form-content">
            <el-input
              v-model="formData.signature"
              type="textarea"
              :rows="3"
              placeholder="设置您的签名 - (° -°) つ口"
              class="textarea-field"
            />
          </div>
        </div>
        
        <!-- 性别 -->
        <div class="form-item">
          <label class="form-label">性别：</label>
          <div class="form-content">
            <div class="gender-buttons">
              <el-button 
                :type="formData.gender === 'male' ? 'primary' : ''"
                @click="formData.gender = 'male'"
              >
                男
              </el-button>
              <el-button 
                :type="formData.gender === 'female' ? 'primary' : ''"
                @click="formData.gender = 'female'"
              >
                女
              </el-button>
              <el-button 
                :type="formData.gender === 'secret' ? 'primary' : ''"
                @click="formData.gender = 'secret'"
              >
                保密
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 出生日期 -->
        <div class="form-item">
          <label class="form-label">出生日期：</label>
          <div class="form-content">
            <el-date-picker
              v-model="formData.birthday"
              type="date"
              placeholder="选择日期"
              :prefix-icon="Calendar"
              value-format="YYYY-MM-DD"
              class="date-picker"
            />
          </div>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="save-section">
        <el-button 
          type="primary" 
          class="save-btn"
          :loading="saving"
          :disabled="!hasChanges"
          @click="saveChanges"
        >
          保存
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-page {
  padding: 0;
  width: 100%;
  height: 100%;
}

.info-container {
  width: 100%;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section {
  max-width: 800px;
}

.form-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
  gap: 20px;
}

.form-label {
  width: 100px;
  font-size: 14px;
  color: #333;
  line-height: 40px;
  flex-shrink: 0;
}

.form-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-field {
  width: 300px;
}

.username-text {
  font-size: 14px;
  color: #333;
  line-height: 40px;
}

.textarea-field {
  width: 100%;
  max-width: 600px;
}

.form-tip {
  font-size: 13px;
  color: #999;
  margin-top: 5px;
}

.gender-buttons {
  display: flex;
  gap: 10px;
}

.gender-buttons .el-button {
  min-width: 80px;
}

.date-picker {
  width: 200px;
}

.save-section {
  display: flex;
  justify-content: center;
  padding-top: 40px;
  border-top: 1px solid #f0f0f0;
  margin-top: 40px;
}

.save-btn {
  width: 200px;
  height: 40px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-container {
    padding: 20px;
  }
  
  .form-item {
    flex-direction: column;
    gap: 10px;
  }
  
  .form-label {
    width: 100%;
    line-height: normal;
  }
  
  .input-field {
    width: 100%;
  }
  
  .textarea-field {
    max-width: 100%;
  }
  
  .date-picker {
    width: 100%;
  }
}
</style>
