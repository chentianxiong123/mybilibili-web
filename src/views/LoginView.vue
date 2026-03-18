<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '../api/index.js'

const router = useRouter()

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 表单引用
const loginFormRef = ref()
const loading = ref(false)

// 登录处理
const handleLogin = () => {
  loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      // 调用登录API
        userApi.login(loginForm.username, loginForm.password)
          .then(response => {
            if (response.code === 200) {
              // 登录成功，保存用户信息和token
              localStorage.setItem('user', JSON.stringify(response.data.user))
              localStorage.setItem('token', response.data.token)
              ElMessage.success('登录成功')
              // 登录成功后跳转到首页
              router.push('/')
            } else {
              ElMessage.error(response.message || '登录失败')
            }
          })
        .catch(error => {
          ElMessage.error('登录失败，请检查用户名和密码')
          console.error('登录错误:', error)
        })
        .finally(() => {
          loading.value = false
        })
    } else {
      return false
    }
  })
}

// 跳转到注册页
const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <!-- 登录表单 -->
      <div class="login-form">
        <div class="login-logo">
          <el-icon><VideoPlay /></el-icon>
          <span>哔哩哔哩</span>
        </div>
        <h2 class="login-title">登录</h2>
        
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-width="0px"
          class="form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名/邮箱/手机号"
              prefix-icon="el-icon-user"
              clearable
            ></el-input>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="el-icon-lock"
              show-password
            ></el-input>
          </el-form-item>
          
          <div class="form-actions">
            <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
            <el-button type="text" class="forget-password">忘记密码？</el-button>
          </div>
          
          <el-form-item>
            <el-button type="primary" @click="handleLogin" class="login-btn" block :loading="loading">
              登录
            </el-button>
          </el-form-item>
          
          <div class="other-login">
            <span>其他登录方式</span>
            <div class="login-icons">
              <el-button type="text" class="login-icon">
                <el-icon><Wechat /></el-icon>
              </el-button>
              <el-button type="text" class="login-icon">
                <el-icon><Weibo /></el-icon>
              </el-button>
              <el-button type="text" class="login-icon">
                <el-icon><Message /></el-icon>
              </el-button>
            </div>
          </div>
        </el-form>
        
        <div class="register-link">
          <span>还没有账号？</span>
          <el-button type="text" @click="goToRegister">立即注册</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
}

.login-form {
  background-color: #fff;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #00a1d6;
  margin-bottom: 20px;
}

.login-logo el-icon {
  font-size: 32px;
  margin-right: 10px;
}

.login-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
}

.form {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.forget-password {
  color: #00a1d6;
}

.login-btn {
  height: 40px;
  border-radius: 20px;
  font-size: 16px;
}

.other-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  padding: 20px 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
}

.other-login span {
  font-size: 14px;
  color: #999;
  margin-bottom: 15px;
}

.login-icons {
  display: flex;
  gap: 20px;
}

.login-icon {
  font-size: 24px;
  color: #00a1d6;
}

.register-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #999;
}

.register-link el-button {
  color: #00a1d6;
  padding: 0;
}
</style>