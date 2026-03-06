<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { userApi } from './api/index.js'

// 导入布局组件
import LayoutHome from './layouts/LayoutHome.vue'
import LayoutSimple from './layouts/LayoutSimple.vue'
import LayoutNone from './layouts/LayoutNone.vue'

const router = useRouter()
const route = useRoute()

// 布局映射
const layouts = {
  home: LayoutHome,
  simple: LayoutSimple,
  none: LayoutNone
}

// 当前布局组件
const currentLayout = computed(() => {
  const layoutName = route.meta.layout || 'home'
  return layouts[layoutName] || LayoutHome
})

// 登录弹窗状态（全局）
const showLoginDialog = ref(false)
const dialogMode = ref('login')
const loading = ref(false)

// 登录表单数据
const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false
})

// 注册表单数据
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 处理登录
const handleLogin = () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  
  loading.value = true
  userApi.login(loginForm.value.username, loginForm.value.password)
    .then(response => {
      if (response.code === 200) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        showLoginDialog.value = false
        ElMessage.success('登录成功')
        
        // 清空表单
        loginForm.value = {
          username: '',
          password: '',
          rememberMe: false
        }
        
        // 刷新页面以更新布局中的用户信息
        window.location.reload()
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
}

// 处理注册
const handleRegister = () => {
  if (!registerForm.value.username || !registerForm.value.email || !registerForm.value.password || !registerForm.value.confirmPassword) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  if (!registerForm.value.agreeTerms) {
    ElMessage.warning('请阅读并同意用户协议和隐私政策')
    return
  }
  
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  
  if (registerForm.value.password.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.value.email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  
  loading.value = true
  const userData = {
    username: registerForm.value.username,
    email: registerForm.value.email,
    password: registerForm.value.password
  }
  
  userApi.register(userData)
    .then(response => {
      if (response.code === 200) {
        ElMessage.success('注册成功')
        switchToLogin()
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
}

// 切换到注册模式
const switchToRegister = () => {
  dialogMode.value = 'register'
  loginForm.value = {
    username: '',
    password: '',
    rememberMe: false
  }
}

// 切换到登录模式
const switchToLogin = () => {
  dialogMode.value = 'login'
  registerForm.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  }
}

// 关闭弹窗
const handleCloseDialog = () => {
  showLoginDialog.value = false
  loginForm.value = {
    username: '',
    password: '',
    rememberMe: false
  }
  registerForm.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  }
}

// 提供给子组件使用
provide('showLoginDialog', showLoginDialog)
</script>

<template>
  <div class="app-container">
    <!-- 动态布局 -->
    <component :is="currentLayout">
      <router-view />
    </component>
    
    <!-- 登录/注册弹窗（全局） -->
    <el-dialog
      v-model="showLoginDialog"
      :title="''"
      width="400px"
      :close-on-click-modal="false"
      class="login-dialog"
      @close="handleCloseDialog"
    >
      <!-- 登录表单 -->
      <div class="login-form" v-if="dialogMode === 'login'">
        <h2 class="login-title">登录</h2>
        
        <el-form :model="loginForm" label-position="top">
          <el-form-item label="">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名/邮箱/手机号"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          <el-form-item label="">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
        </el-form>
        
        <div class="form-actions">
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <el-button type="text" class="forget-password">忘记密码？</el-button>
        </div>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="handleLogin" 
            size="large"
            :loading="loading"
            class="action-btn-primary"
          >
            登录
          </el-button>
          <div class="switch-mode">
            <span>还没有账号？</span>
            <el-button type="text" @click="switchToRegister()" class="switch-btn">立即注册</el-button>
          </div>
        </div>
      </div>
      
      <!-- 注册表单 -->
      <div class="register-form" v-else>
        <h2 class="login-title">注册</h2>
        
        <el-form :model="registerForm" label-position="top">
          <el-form-item label="">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名（3-20个字符）"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          <el-form-item label="">
            <el-input
              v-model="registerForm.email"
              type="email"
              placeholder="请输入邮箱"
              size="large"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>
          <el-form-item label="">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码（包含大小写字母和数字）"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item label="">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item label="">
            <el-checkbox v-model="registerForm.agreeTerms">
              我已阅读并同意
              <a href="#" class="link">《用户协议》</a>
              和
              <a href="#" class="link">《隐私政策》</a>
            </el-checkbox>
          </el-form-item>
        </el-form>
        
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="handleRegister" 
            size="large"
            :loading="loading"
            class="action-btn-primary"
          >
            注册
          </el-button>
          <div class="switch-mode">
            <span>已有账号？</span>
            <el-button type="text" @click="switchToLogin()" class="switch-btn">立即登录</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #e8e9ea;
  color: #333;
}

.app-container {
  min-height: 100vh;
}

/* 登录/注册弹窗样式 */
.login-dialog {
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
}

.login-dialog .el-dialog__header {
  display: none;
}

.login-dialog .el-dialog__title {
  display: none;
}

.login-dialog .el-dialog__body {
  padding: 0;
  background: transparent;
}

.login-dialog .el-dialog__footer {
  display: none;
}

.login-form,
.register-form {
  padding: 20px;
  background-color: transparent;
  border-radius: 0;
  margin: 0;
  box-shadow: none;
}

.login-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0 0 15px 0;
  text-align: center;
}

.login-form .el-form-item,
.register-form .el-form-item {
  margin-bottom: 15px;
}

.login-form .el-input__wrapper,
.register-form .el-input__wrapper {
  border-radius: 4px;
  padding: 6px 10px;
  height: 40px;
}

.login-form .el-input__inner,
.register-form .el-input__inner {
  font-size: 14px;
  height: 28px;
  line-height: 28px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 12px;
}

.forget-password {
  color: #00a1d6;
  padding: 0;
  font-size: 12px;
}

.link {
  color: #00a1d6;
  text-decoration: none;
  font-size: 12px;
}

.action-buttons {
  margin-top: 15px;
}

.action-btn-primary {
  width: 100%;
  height: 36px;
  border-radius: 4px;
  font-size: 14px;
  background-color: #409eff;
  border-color: #409eff;
  margin-bottom: 10px;
}

.action-btn-primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.switch-mode {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.switch-btn {
  color: #409eff;
  padding: 0;
  font-size: 12px;
}
</style>
