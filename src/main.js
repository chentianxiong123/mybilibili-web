import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import mitt from 'mitt'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const emitter = mitt()

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.config.globalProperties.emitter = emitter

app.mount('#app')
