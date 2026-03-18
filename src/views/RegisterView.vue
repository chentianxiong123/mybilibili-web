<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '../api/index.js'

const router = useRouter()

// 注册表单
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 表单验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d_]{6,20}$/, message: '密码必须包含大小写字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, trigger: 'blur' }
  ],
  agreeTerms: [
    { required: true, message: '请阅读并同意用户协议和隐私政策', trigger: 'change' }
  ]
}

// 表单引用
const registerFormRef = ref()
const loading = ref(false)

// 注册处理
const handleRegister = () => {
  registerFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 准备注册数据
      const userData = {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password
      }
      // 调用注册API
      userApi.register(userData)
        .then(response => {
          if (response.code === 200) {
            ElMessage.success('注册成功')
            // 注册成功后跳转到登录页
            router.push('/login')
          } else {
            ElMessage.error(response.message || '注册失败')
          }
        })
        .catch(error => {
          ElMessage.error('注册失败，请检查输入信息')
          console.error('注册错误:', error)
        })
        .finally(() => {
          loading.value = false
        })
    } else {
      return false
    }
  })
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <!-- 注册表单 -->
      <div class="register-form">
        <div class="register-logo">
          <el-icon><VideoPlay /></el-icon>
          <span>哔哩哔哩</span>
        </div>
        <h2 class="register-title">注册</h2>
        
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          label-width="0px"
          class="form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名（3-20个字符）"
              prefix-icon="el-icon-user"
              clearable
            ></el-input>
          </el-form-item>
          
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              type="email"
              placeholder="请输入邮箱"
              prefix-icon="el-icon-message"
              clearable
            ></el-input>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码（包含大小写字母和数字）"
              prefix-icon="el-icon-lock"
              show-password
            ></el-input>
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              prefix-icon="el-icon-lock"
              show-password
            ></el-input>
          </el-form-item>
          
          <el-form-item prop="agreeTerms">
            <el-checkbox v-model="registerForm.agreeTerms">
              我已阅读并同意
              <a href="#" class="link">《用户协议》</a>
              和
              <a href="#" class="link">《隐私政策》</a>
            </el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleRegister" class="register-btn" block :loading="loading">
              注册
            </el-button>
          </el-form-item>
        </el-form>
        
        <div class="login-link">
          <span>已有账号？</span>
          <el-button type="text" @click="goToLogin">立即登录</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-form-wrapper {
  width: 100%;
  max-width: 450px;
}

.register-form {
  background-color: #fff;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.register-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #00a1d6;
  margin-bottom: 20px;
}

.register-logo el-icon {
  font-size: 32px;
  margin-right: 10px;
}

.register-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
}

.form {
  width: 100%;
}

.form .el-form-item {
  margin-bottom: 20px;
}

.link {
  color: #00a1d6;
  text-decoration: none;
}

.register-btn {
  height: 40px;
  border-radius: 20px;
  font-size: 16px;
}

.login-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #999;
  margin-top: 20px;
}

.login-link el-button {
  color: #00a1d6;
  padding: 0;
}
</style>