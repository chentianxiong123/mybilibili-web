import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { 
        title: '首页 - 哔哩哔哩',
        layout: 'home'
      }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: { 
        title: '搜索 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/category/:id',
      name: 'category',
      component: () => import('../views/CategoryView.vue'),
      meta: { 
        title: '分类 - 哔哩哔哩',
        layout: 'home'
      }
    },
    {
      path: '/manuscript/:id',
      name: 'manuscript',
      component: () => import('../views/VideoView.vue'),
      props: (route) => ({
        manuscriptId: route.params.id,
        p: parseInt(route.query.p) || 1
      }),
      meta: { 
        title: '视频播放 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/user/:id',
      name: 'user',
      component: () => import('../views/UserView.vue'),
      meta: { 
        title: '用户主页 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/UserProfileView.vue'),
      meta: { 
        title: '个人主页 - 哔哩哔哩',
        layout: 'simple'
      },
      children: [
        { path: '', redirect: '/profile/home' },
        { path: 'home', name: 'profile-home', component: () => import('../views/UserProfileView.vue'), meta: { title: '个人主页 - 哔哩哔哩', layout: 'simple' } },
        { path: 'dynamic', name: 'profile-dynamic', component: () => import('../views/UserProfileView.vue'), meta: { title: '动态 - 哔哩哔哩', layout: 'simple' } },
        { path: 'submissions', name: 'profile-submissions', component: () => import('../views/UserProfileView.vue'), meta: { title: '投稿 - 哔哩哔哩', layout: 'simple' } },
        { path: 'collections', name: 'profile-collections', component: () => import('../views/UserProfileView.vue'), meta: { title: '合集和列表 - 哔哩哔哩', layout: 'simple' } },
        { path: 'favorites', name: 'profile-favorites', component: () => import('../views/UserProfileView.vue'), meta: { title: '收藏 - 哔哩哔哩', layout: 'simple' } },
        { path: 'create-center', name: 'profile-create-center', component: () => import('../views/UserProfileView.vue'), meta: { title: '创作中心 - 哔哩哔哩', layout: 'simple' } },
        { path: 'settings', name: 'profile-settings', component: () => import('../views/UserProfileView.vue'), meta: { title: '设置 - 哔哩哔哩', layout: 'simple' } },
        { path: 'following', name: 'profile-following', component: () => import('../views/UserProfileView.vue'), meta: { title: '关注 - 哔哩哔哩', layout: 'simple' } },
        { path: 'followers', name: 'profile-followers', component: () => import('../views/UserProfileView.vue'), meta: { title: '粉丝 - 哔哩哔哩', layout: 'simple' } }
      ]
    },
    {
      path: '/profile/:id',
      name: 'user-profile',
      component: () => import('../views/UserProfileView.vue'),
      meta: { 
        title: '用户主页 - 哔哩哔哩',
        layout: 'simple'
      },
      children: [
        { path: '', redirect: '/profile/:id/home' },
        { path: 'home', name: 'user-profile-home', component: () => import('../views/UserProfileView.vue'), meta: { title: '用户主页 - 哔哩哔哩', layout: 'simple' } },
        { path: 'dynamic', name: 'user-profile-dynamic', component: () => import('../views/UserProfileView.vue'), meta: { title: '动态 - 哔哩哔哩', layout: 'simple' } },
        { path: 'submissions', name: 'user-profile-submissions', component: () => import('../views/UserProfileView.vue'), meta: { title: '投稿 - 哔哩哔哩', layout: 'simple' } },
        { path: 'collections', name: 'user-profile-collections', component: () => import('../views/UserProfileView.vue'), meta: { title: '合集和列表 - 哔哩哔哩', layout: 'simple' } },
        { path: 'favorites', name: 'user-profile-favorites', component: () => import('../views/UserProfileView.vue'), meta: { title: '收藏 - 哔哩哔哩', layout: 'simple' } },
        { path: 'following', name: 'user-profile-following', component: () => import('../views/UserProfileView.vue'), meta: { title: '关注 - 哔哩哔哩', layout: 'simple' } },
        { path: 'followers', name: 'user-profile-followers', component: () => import('../views/UserProfileView.vue'), meta: { title: '粉丝 - 哔哩哔哩', layout: 'simple' } },
        { path: 'search', name: 'user-profile-search', component: () => import('../views/UserProfileView.vue'), meta: { title: '搜索 - 哔哩哔哩', layout: 'simple' } },
        { path: 'settings', name: 'user-profile-settings', component: () => import('../views/UserProfileView.vue'), meta: { title: '设置 - 哔哩哔哩', layout: 'simple' } }
      ]
    },

    {
      path: '/create-center',
      name: 'create-center',
      component: () => import('../views/CreateCenterView.vue'),
      meta: { 
        title: '创作中心 - 哔哩哔哩',
        layout: 'none'
      },
      children: [
        { path: '', redirect: '/create-center/home' },
        { path: 'home', name: 'create-center-home', meta: { title: '创作中心首页 - 哔哩哔哩', layout: 'none' } },
        { path: 'upload', name: 'create-center-upload', meta: { title: '投稿 - 哔哩哔哩', layout: 'none' } },
        { path: 'content', name: 'create-center-content', meta: { title: '内容管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'content-articles', name: 'create-center-content-articles', meta: { title: '稿件管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'content-appeal', name: 'create-center-content-appeal', meta: { title: '申述管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'content-subtitle', name: 'create-center-content-subtitle', meta: { title: '字幕管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'data', name: 'create-center-data', meta: { title: '数据中心 - 哔哩哔哩', layout: 'none' } },
        { path: 'fans', name: 'create-center-fans', meta: { title: '粉丝管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'interaction', name: 'create-center-interaction', meta: { title: '互动管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'interaction-comment', name: 'create-center-interaction-comment', meta: { title: '评论管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'interaction-danmu', name: 'create-center-interaction-danmu', meta: { title: '弹幕管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'revenue', name: 'create-center-revenue', meta: { title: '收益管理 - 哔哩哔哩', layout: 'none' } },
        { path: 'settings', name: 'create-center-settings', meta: { title: '创作设置 - 哔哩哔哩', layout: 'none' } }
      ]
    },

    {
      path: '/dynamic',
      name: 'dynamic',
      component: () => import('../views/DynamicView.vue'),
      meta: { 
        title: '动态 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/dynamic/:id',
      name: 'dynamic-detail',
      component: () => import('../views/DynamicDetailView.vue'),
      meta: { 
        title: '动态详情 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue'),
      meta: { 
        title: '历史记录 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/collections',
      name: 'collections',
      component: () => import('../views/CollectionListView.vue'),
      meta: { 
        title: '我的合集 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/collection/:id',
      name: 'collection-detail',
      component: () => import('../views/CollectionDetailView.vue'),
      meta: { 
        title: '合集详情 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/collection/:id/edit',
      name: 'collection-edit',
      component: () => import('../views/CollectionEditView.vue'),
      meta: { 
        title: '编辑合集 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/collection/create',
      name: 'collection-create',
      component: () => import('../views/CollectionEditView.vue'),
      meta: { 
        title: '创建合集 - 哔哩哔哩',
        layout: 'simple'
      }
    },
    {
      path: '/personal-center',
      name: 'personal-center',
      component: () => import('../views/PersonalCenterView.vue'),
      meta: { 
        title: '个人中心 - 哔哩哔哩',
        layout: 'simple'
      },
      children: [
        { path: '', redirect: '/personal-center/home' },
        { path: 'home', name: 'personal-center-home', component: () => import('../views/personal/HomeView.vue'), meta: { title: '个人中心首页 - 哔哩哔哩', layout: 'simple' } },
        { path: 'info', name: 'personal-center-info', component: () => import('../views/personal/InfoView.vue'), meta: { title: '我的信息 - 哔哩哔哩', layout: 'simple' } },
        { path: 'avatar', name: 'personal-center-avatar', component: () => import('../views/AvatarView.vue'), meta: { title: '我的头像 - 哔哩哔哩', layout: 'simple' } },
        { path: 'favorites', name: 'personal-center-favorites', component: () => import('../views/personal/FavoriteView.vue'), meta: { title: '我的收藏夹 - 哔哩哔哩', layout: 'simple' } },
        { path: 'medals', name: 'personal-center-medals', meta: { title: '成就勋章 - 哔哩哔哩', layout: 'simple' } },
        { path: 'security', name: 'personal-center-security', meta: { title: '账号安全 - 哔哩哔哩', layout: 'simple' } },
        { path: 'coins', name: 'personal-center-coins', meta: { title: '我的硬币 - 哔哩哔哩', layout: 'simple' } },
        { path: 'records', name: 'personal-center-records', meta: { title: '我的记录 - 哔哩哔哩', layout: 'simple' } },
        { path: 'verify', name: 'personal-center-verify', meta: { title: '实名认证 - 哔哩哔哩', layout: 'simple' } },
        { path: 'invite', name: 'personal-center-invite', meta: { title: '邀请注册 - 哔哩哔哩', layout: 'simple' } },
        { path: 'space', name: 'personal-center-space', meta: { title: '个人空间 - 哔哩哔哩', layout: 'simple' } },
        { path: 'creator', name: 'personal-center-creator', meta: { title: '创作中心 - 哔哩哔哩', layout: 'simple' } },
        { path: 'live', name: 'personal-center-live', meta: { title: '直播中心 - 哔哩哔哩', layout: 'simple' } }
      ]
    },
    {
      path: '/message',
      name: 'message',
      component: () => import('../views/message/MessageView.vue'),
      meta: { 
        title: '消息中心 - 哔哩哔哩',
        layout: 'simple',
        requiresAuth: true
      },
      children: [
        { path: '', redirect: '/message/private' },
        { 
          path: 'private', 
          name: 'message-private',
          meta: { title: '我的消息 - 哔哩哔哩', layout: 'simple' } 
        },
        { 
          path: 'reply', 
          name: 'message-reply',
          meta: { title: '回复我的 - 哔哩哔哩', layout: 'simple' } 
        },
        { 
          path: 'at', 
          name: 'message-at',
          meta: { title: '@我的 - 哔哩哔哩', layout: 'simple' } 
        },
        { 
          path: 'like', 
          name: 'message-like',
          meta: { title: '收到的赞 - 哔哩哔哩', layout: 'simple' } 
        },
        { 
          path: 'system', 
          name: 'message-system',
          meta: { title: '系统通知 - 哔哩哔哩', layout: 'simple' } 
        },
        { 
          path: 'settings', 
          name: 'message-settings',
          meta: { title: '消息设置 - 哔哩哔哩', layout: 'simple' } 
        }
      ]
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫，设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router
