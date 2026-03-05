# MyBilibili Web Frontend

基于 Vue 3 的类 B 站视频平台用户端前端。

## 技术栈

- **Vue 3.4** - 前端框架
- **Vite 4.5** - 构建工具
- **Vue Router 4** - 路由管理
- **Pinia 2** - 状态管理
- **Element Plus 2.7** - UI 组件库
- **Axios** - HTTP 请求
- **Artplayer 5** - 视频播放器
- **ECharts 5** - 图表库
- **Sass** - CSS 预处理器

## 功能模块

### 首页
- 视频推荐列表
- 分类导航
- 轮播图展示

### 视频播放
- 视频播放 (支持 HLS)
- 弹幕系统
- 字幕显示
- 评论互动
- 点赞/投币/收藏

### 用户系统
- 注册/登录
- 个人中心
- 个人主页
- 头像上传
- 用户资料编辑

### 社交功能
- 关注系统
- 动态发布
- 消息通知
- 私信聊天

### 创作中心
- 视频上传
- 稿件管理
- 数据统计
- 收藏夹管理

### 搜索
- 视频搜索
- 热门搜索

## 项目结构

```
mybilibili-web/
├── src/
│   ├── api/           # API 接口
│   ├── components/    # 公共组件
│   ├── layouts/       # 布局组件
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia 状态
│   ├── views/         # 页面组件
│   ├── App.vue        # 根组件
│   └── main.js        # 入口文件
├── public/            # 静态资源
├── dist/              # 构建输出
└── package.json       # 项目配置
```

## 快速开始

### 环境要求

- Node.js 16.0+
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览构建

```bash
npm run preview
```

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomeView | 首页 |
| `/video/:id` | VideoView | 视频播放页 |
| `/login` | LoginView | 登录页 |
| `/register` | RegisterView | 注册页 |
| `/user/:id` | UserView | 用户主页 |
| `/profile` | UserProfileView | 个人资料 |
| `/personal` | PersonalCenterView | 个人中心 |
| `/search` | SearchView | 搜索页 |
| `/upload` | UploadView | 视频上传 |
| `/create` | CreateCenterView | 创作中心 |
| `/dynamic` | DynamicView | 动态页 |
| `/message` | MessageView | 消息中心 |
| `/history` | HistoryView | 历史记录 |
| `/favorite` | FavoriteView | 我的收藏 |
| `/collection` | CollectionListView | 收藏夹列表 |

## 相关项目

- [mybilibili](https://gitee.com/dllm7tou/mybilibili) - Java 后端服务
- [mybilibili-admin-web](https://gitee.com/dllm7tou/mybilibili-admin-web) - 管理后台前端

## License

MIT
