<template>
  <div class="create-center-container">
    <!-- 顶部导航栏 -->
    <header class="create-center-header">
      <div class="header-left">
        <el-button class="center-title-btn" @click="goToCreateCenterHome">
          Bilibili创作中心
        </el-button>
        <el-button class="main-site-btn" @click="goToMainSite">
          <el-icon><House /></el-icon>
          <span>主站</span>
        </el-button>
      </div>
      <div class="header-right">
        <el-avatar 
          class="user-avatar" 
          :size="40" 
          :src="currentUser?.avatar || 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg@50w_50h_1c_1s_!web-avatar-nav.avif'"
          @click="goToUserProfile"
          style="cursor: pointer;"
        ></el-avatar>
        <div class="up-day-box">
          成为UP主的第123天
        </div>
      </div>
    </header>

    <!-- 主体内容区域 -->
    <div class="create-center-main">
      <!-- 侧边导航栏 -->
      <aside class="sidebar">
        <!-- 独立的投稿按钮 -->
        <el-button type="primary" class="upload-btn-large" @click="goToUpload">
          <el-icon><Upload /></el-icon>
          <span>投稿</span>
        </el-button>
        
        <!-- 侧边导航菜单 -->
        <el-menu
          ref="menuRef"
          default-active="home"
          class="sidebar-menu"
          :unique-opened="false"
          @select="handleMenuSelect"
        >
          <el-menu-item index="home">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-sub-menu index="content">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>内容管理</span>
            </template>
            <el-menu-item index="content-articles">
              <el-icon><Menu /></el-icon>
              <span>稿件管理</span>
            </el-menu-item>
            <el-menu-item index="content-appeal">
              <el-icon><Message /></el-icon>
              <span>申述管理</span>
            </el-menu-item>
            <el-menu-item index="content-subtitle">
              <el-icon><Document /></el-icon>
              <span>字幕管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="data">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据中心</span>
          </el-menu-item>
          <el-menu-item index="fans">
            <el-icon><UserFilled /></el-icon>
            <span>粉丝管理</span>
          </el-menu-item>
          <el-sub-menu index="interaction">
            <template #title>
              <el-icon><ChatDotRound /></el-icon>
              <span>互动管理</span>
            </template>
            <el-menu-item index="interaction-comment">
              <el-icon><Comment /></el-icon>
              <span>评论管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item index="revenue">
            <el-icon><Coin /></el-icon>
            <span>收益管理</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><Setting /></el-icon>
            <span>创作设置</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 主内容区域 -->
      <main class="content-area">
        <!-- 首页内容 -->
        <div v-if="currentActive === 'home'" class="content-section">
          <div class="content-body">
            <p>视频数据</p>
            
            <!-- Loading状态 -->
            <div v-if="homeLoading" class="loading-container" v-loading="homeLoading" element-loading-text="加载中..."></div>
            
            <!-- 错误提示 -->
            <el-alert v-else-if="homeError" :title="homeError" type="error" show-icon :closable="false" style="margin-bottom: 20px;" />
            
            <template v-else>
            <!-- 第一行统计数据：粉丝总数、播放量、评论、弹幕 -->
            <div class="dashboard-stats">
              <div class="stat-card">
                <div class="stat-number">{{ statsData.followerCount }}</div>
                <div class="stat-label">粉丝总数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ statsData.totalViewCount }}</div>
                <div class="stat-label">总播放量</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ statsData.totalCommentCount }}</div>
                <div class="stat-label">总评论数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ statsData.totalDanmuCount }}</div>
                <div class="stat-label">总弹幕数</div>
              </div>
            </div>
            
            <!-- 第二行统计数据：点赞、分享、收藏、投币 -->
            <div class="dashboard-stats">
              <div class="stat-card">
                <div class="stat-number">{{ statsData.totalLikeCount }}</div>
                <div class="stat-label">总点赞数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ statsData.totalShareCount }}</div>
                <div class="stat-label">总分享数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ statsData.totalFavoriteCount }}</div>
                <div class="stat-label">总收藏数</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ statsData.totalCoinCount }}</div>
                <div class="stat-label">总投币数</div>
              </div>
            </div>
            </template>
            
            <!-- 评论/弹幕选择栏 -->
            <div class="comment-danmu-section">
              <div class="section-header">
                <div class="tab-buttons">
                  <el-button 
                    type="primary" 
                    :plain="activeCommentTab !== 'comment'"
                    @click="activeCommentTab = 'comment'"
                    size="small"
                  >
                    评论
                  </el-button>
                  <el-button 
                    type="primary" 
                    :plain="activeCommentTab !== 'danmu'"
                    @click="activeCommentTab = 'danmu'"
                    size="small"
                  >
                    弹幕
                  </el-button>
                </div>
              </div>
              
              <!-- 评论列表 -->
              <div v-if="activeCommentTab === 'comment'" class="interaction-list">
                <div v-for="comment in latestComments.slice(0, 5)" :key="comment.id" class="interaction-item">
                  <div class="user-info">
                    <el-avatar :size="32" :src="comment.avatar"></el-avatar>
                    <span class="username">{{ comment.username }}</span>
                  </div>
                  <div class="interaction-content">
                    {{ comment.content }}
                  </div>
                  <div class="interaction-time">{{ comment.time }}</div>
                </div>
              </div>
              
              <!-- 弹幕列表 -->
              <div v-else-if="activeCommentTab === 'danmu'" class="interaction-list">
                <div class="developing-tip">
                  <el-empty description="弹幕功能开发中，敬请期待..." :image-size="100" />
                </div>
              </div>
            </div>
            
            <!-- 观看排行和互动排行选择栏 -->
            <div class="ranking-section">
              <div class="section-header">
                <div class="tab-buttons">
                  <el-button 
                    type="primary" 
                    :plain="activeRankingTab !== 'view'"
                    @click="activeRankingTab = 'view'"
                    size="small"
                  >
                    观看排行
                  </el-button>
                  <el-button 
                    type="primary" 
                    :plain="activeRankingTab !== 'interaction'"
                    @click="activeRankingTab = 'interaction'"
                    size="small"
                  >
                    互动排行
                  </el-button>
                </div>
              </div>
              
              <!-- 观看排行列表 -->
              <div v-if="activeRankingTab === 'view'" class="ranking-list-horizontal">
                <div v-for="(user, index) in viewRanking" :key="user.id" class="ranking-item-horizontal">
                  <div class="user-info">
                    <el-avatar :size="32" :src="user.avatar" :class="getRankingClass(index)"></el-avatar>
                    <span class="username" :class="getRankingClass(index)">{{ user.username }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 互动排行列表 -->
              <div v-else-if="activeRankingTab === 'interaction'" class="ranking-list-horizontal">
                <div v-for="(user, index) in interactionRanking" :key="user.id" class="ranking-item-horizontal">
                  <div class="user-info">
                    <el-avatar :size="32" :src="user.avatar" :class="getRankingClass(index)"></el-avatar>
                    <span class="username" :class="getRankingClass(index)">{{ user.username }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 稿件管理内容 -->
        <div v-else-if="currentActive === 'content-articles'" class="content-section">
          <!-- 移除标题 -->
          <div class="content-body">
            <!-- 主要选择栏 -->
            <div class="content-tabs">
              <el-tabs v-model="mainTab" type="card">
                <el-tab-pane label="视频管理" name="video"></el-tab-pane>
                <el-tab-pane label="合集管理" name="collection"></el-tab-pane>
              </el-tabs>
            </div>
            
            <!-- 视频管理次级选择栏 -->
            <div v-if="mainTab === 'video'" class="video-filters">
              <!-- 第一行：全部稿件、草稿 -->
              <div class="filter-row">
                <el-radio-group v-model="articleFilter" size="small">
                  <el-radio-button value="all">全部稿件</el-radio-button>
                  <el-radio-button value="draft">草稿</el-radio-button>
                </el-radio-group>
              </div>
              <!-- 第二行：进行中、已通过、未通过（仅全部稿件时显示） -->
              <div v-if="articleFilter === 'all'" class="filter-row">
                <el-radio-group v-model="statusFilter" size="small">
                  <el-radio-button value="processing">进行中</el-radio-button>
                  <el-radio-button value="approved">已通过 ({{ approvedCount }})</el-radio-button>
                  <el-radio-button value="rejected">未通过 ({{ rejectedCount }})</el-radio-button>
                </el-radio-group>
              </div>
            </div>
            
            <!-- 视频稿件列表 -->
            <div v-if="mainTab === 'video'" class="article-list" v-loading="articlesLoading">
              <el-table :data="articles" stripe style="width: 100%">
                <el-table-column prop="id" label="稿件ID" width="120"></el-table-column>
                <el-table-column prop="title" label="标题" min-width="300"></el-table-column>
                <el-table-column prop="status" label="状态" width="120">
                  <template #default="scope">
                    <el-tag 
                      :type="getArticleStatusType(scope.row.status)" 
                      size="small"
                    >
                      {{ getArticleStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="viewCount" label="播放量" width="100"></el-table-column>
                <el-table-column prop="commentCount" label="评论数" width="100"></el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="180"></el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                  <template #default="scope">
                    <el-button type="primary" size="small" @click="editArticle(scope.row.id)">编辑</el-button>
                    <el-button type="danger" size="small" @click="deleteArticle(scope.row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <!-- 分页导航栏 -->
            <div v-if="mainTab === 'video'" class="pagination">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="totalArticles"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              ></el-pagination>
            </div>
            
            <!-- 合集管理内容 -->
            <div v-if="mainTab === 'collection'" class="collection-management">
              <!-- 面包屑导航 -->
              <el-breadcrumb separator="/" class="collection-breadcrumb">
                <el-breadcrumb-item>合集管理</el-breadcrumb-item>
                <el-breadcrumb-item>编辑合集</el-breadcrumb-item>
              </el-breadcrumb>
              
              <!-- 合集基本信息表单 -->
              <div class="collection-form-container">
                <h3 class="form-title">合集基本信息</h3>
                
                <el-form class="collection-form" :model="collectionForm" label-position="top">
                  <!-- 合集标题 -->
                  <el-row :gutter="20">
                    <el-col :span="16">
                      <el-form-item label="合集标题" required>
                        <el-input 
                          v-model="collectionForm.title" 
                          placeholder="标题影响观众对合集的第一印象，特点鲜明的名字更能打动人哦！"
                          maxlength="50"
                          show-word-limit
                        ></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="合集封面" required>
                        <div class="cover-upload-section">
                          <el-upload
                            action="#"
                            :on-change="handleCollectionCoverUpload"
                            :auto-upload="false"
                            accept="image/*"
                            :show-file-list="false"
                          >
                            <div class="cover-preview" v-if="collectionForm.coverUrl">
                              <img :src="collectionForm.coverUrl" alt="合集封面">
                            </div>
                            <div class="cover-placeholder" v-else>
                              <el-icon><Picture /></el-icon>
                              <span>上传封面</span>
                            </div>
                          </el-upload>
                        </div>
                      </el-form-item>
                    </el-col>
                  </el-row>
                  
                  <!-- 合集简介 -->
                  <el-form-item label="合集简介">
                    <el-input
                      v-model="collectionForm.description"
                      type="textarea"
                      placeholder="输入合集简介"
                      maxlength="500"
                      show-word-limit
                      rows="4"
                    ></el-input>
                  </el-form-item>
                  
                  <!-- 提交按钮 -->
                  <el-form-item class="form-actions">
                    <el-button type="primary" size="large" @click="submitCollection">立即提交</el-button>
                    <el-button size="large" @click="cancelCollection">取消</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </div>

        <!-- 申述管理内容 -->
        <div v-else-if="currentActive === 'content-appeal'" class="content-section">
          <!-- 移除标题 -->
          <div class="content-body">
            <!-- 申诉状态标签页 -->
            <div class="appeal-tabs">
              <el-radio-group v-model="activeAppealTab" class="appeal-radio-group">
                <el-radio-button value="全部">全部({{ appealCount.all }})</el-radio-button>
                <el-radio-button value="进行中">进行中({{ appealCount.processing }})</el-radio-button>
                <el-radio-button value="已完成">已完成({{ appealCount.completed }})</el-radio-button>
              </el-radio-group>
            </div>
            
            <!-- 申诉列表 -->
            <div class="appeal-list">
              <div 
                v-for="item in filteredAppeals" 
                :key="item.id" 
                class="appeal-card"
              >
                <div class="appeal-card-header">
                  <div class="appeal-title">{{ item.title }}</div>
                  <div class="appeal-status">稿件状态：{{ item.submissionStatus }}</div>
                  <img :src="item.cover" :alt="item.title" class="appeal-cover">
                </div>
                <div class="appeal-card-body">
                  <div class="appeal-info">
                    <div class="info-item">申诉时间：{{ item.applyTime }}</div>
                    <div class="info-item">申诉编号：{{ item.applyNumber }}</div>
                    <div class="info-item">受理状态：{{ item.handleStatus }}</div>
                  </div>
                  <div class="appeal-actions">
                    <el-button type="primary" size="small" plain>申诉详情</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 字幕管理内容 -->
        <div v-else-if="currentActive === 'content-subtitle'" class="content-section">
          <!-- 移除标题 -->
          <div class="content-body">
            <p>这里是字幕管理页面，您可以查看和管理您的稿件字幕。</p>
          </div>
        </div>

        <!-- 数据中心内容 -->
        <div v-else-if="currentActive === 'data'" class="content-section">
          <!-- 移除标题 -->
          <div class="content-body">
            <!-- 顶部导航栏 -->
            <div class="data-center-tabs">
              <el-tabs v-model="activeDataTab" type="card">
                <el-tab-pane label="数据概览" name="overview"></el-tab-pane>
                <el-tab-pane label="账号诊断" name="diagnosis"></el-tab-pane>
                <el-tab-pane label="稿件分析" name="article"></el-tab-pane>
                <el-tab-pane label="粉丝分析" name="fans"></el-tab-pane>
                <el-tab-pane label="专栏数据" name="column"></el-tab-pane>
              </el-tabs>
            </div>
            
            <!-- 核心数据概览 -->
            <div class="data-overview" v-if="activeDataTab === 'overview'">
              <div class="overview-header">
                <h3 class="overview-title">核心数据概览 <el-tag size="small" type="info">更新至1月23日</el-tag></h3>
                <div class="overview-actions">
                  <el-select v-model="timeRange" placeholder="时间选择" size="small" class="time-select">
                    <el-option label="近7天" value="7d"></el-option>
                    <el-option label="近30天" value="30d"></el-option>
                    <el-option label="近90天" value="90d"></el-option>
                    <el-option label="近1年" value="1y"></el-option>
                    <el-option label="自定义" value="custom"></el-option>
                  </el-select>
                  <el-button type="primary" size="small" class="export-btn">
                    <el-icon><Download /></el-icon>
                    <span>导出数据</span>
                  </el-button>
                </div>
              </div>
              
              <!-- 核心数据卡片 -->
              <div class="core-data">
                <!-- 播放量卡片 -->
                <div class="data-card play-count">
                  <div class="data-title">播放量</div>
                  <div class="data-value">4061</div>
                  <div class="data-change">
                    <el-icon><ArrowUp /></el-icon>
                    <span class="increase">+187</span>
                  </div>
                </div>
                
                <!-- 其他数据卡片 -->
                <div class="data-card">
                  <div class="data-title">空间访客</div>
                  <div class="data-value">30</div>
                  <div class="data-change">
                    <el-icon><ArrowDown /></el-icon>
                    <span class="decrease">-7</span>
                  </div>
                </div>
                
                <div class="data-card">
                  <div class="data-title">净增粉丝</div>
                  <div class="data-value">-1</div>
                  <div class="data-change">
                    <el-icon><ArrowUp /></el-icon>
                    <span class="increase">+1</span>
                  </div>
                </div>
                
                <div class="data-card">
                  <div class="data-title">点赞</div>
                  <div class="data-value">16</div>
                  <div class="data-change">
                    <el-icon><ArrowUp /></el-icon>
                    <span class="increase">+1</span>
                  </div>
                </div>
                
                <div class="data-card">
                  <div class="data-title">收藏</div>
                  <div class="data-value">24</div>
                  <div class="data-change">
                    <el-icon><ArrowUp /></el-icon>
                    <span class="increase">+1</span>
                  </div>
                </div>
                
                <div class="data-card">
                  <div class="data-title">硬币</div>
                  <div class="data-value">0</div>
                  <div class="data-change"></div>
                </div>
                
                <div class="data-card">
                  <div class="data-title">评论</div>
                  <div class="data-value">16</div>
                  <div class="data-change">
                    <el-icon><ArrowUp /></el-icon>
                    <span class="increase">+8</span>
                  </div>
                </div>
                
                <div class="data-card">
                  <div class="data-title">弹幕</div>
                  <div class="data-value">1</div>
                  <div class="data-change"></div>
                </div>
                
                <div class="data-card">
                  <div class="data-title">分享</div>
                  <div class="data-value">1</div>
                  <div class="data-change">
                    <el-icon><ArrowUp /></el-icon>
                    <span class="increase">+3</span>
                  </div>
                </div>
              </div>
              
              <!-- 播放量趋势图 -->
              <div class="play-trend-chart">
                <h4 class="chart-title">近7天播放量</h4>
                <div class="chart-container">
                  <!-- 这里可以集成ECharts或其他图表库 -->
                  <div class="mock-chart">
                    <div class="chart-legend">
                      <span class="legend-item">
                        <span class="legend-color total"></span>
                        <span>总播放量</span>
                      </span>
                      <span class="legend-item">
                        <span class="legend-color fans"></span>
                        <span>粉丝播放量</span>
                      </span>
                    </div>
                    <div class="chart-content">
                      <!-- 模拟图表 -->
                      <div class="chart-line total-line"></div>
                      <div class="chart-line fans-line"></div>
                      <div class="chart-grid"></div>
                      <div class="chart-axis x-axis">
                        <span class="axis-label">2026/01/17</span>
                        <span class="axis-label">2026/01/19</span>
                        <span class="axis-label">2026/01/21</span>
                        <span class="axis-label">2026/01/23</span>
                      </div>
                      <div class="chart-axis y-axis">
                        <span class="axis-label">0</span>
                        <span class="axis-label">200</span>
                        <span class="axis-label">400</span>
                        <span class="axis-label">600</span>
                        <span class="axis-label">800</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 账号诊断 -->
            <div class="account-diagnosis" v-if="activeDataTab === 'diagnosis'">
              <!-- 表现总结 -->
              <div class="diagnosis-summary">
                <h3 class="section-title">表现总结 <el-icon class="info-icon"><InfoFilled /></el-icon></h3>
                <div class="summary-tip">
                  <el-icon class="tip-icon"><WarningFilled /></el-icon>
                  <span>你的投稿活跃低于同类UP主，坚持创作，能帮助你快速进步与成长哦~</span>
                </div>
              </div>
              
              <!-- 雷达图和指标分析 -->
              <div class="diagnosis-content">
                <!-- 雷达图 -->
                <div class="radar-chart-container">
                  <div class="radar-chart">
                    <!-- 模拟雷达图 -->
                    <div class="radar-axes">
                      <div class="radar-axis">
                        <div class="axis-label">投稿</div>
                      </div>
                      <div class="radar-axis">
                        <div class="axis-label">新增关注</div>
                      </div>
                      <div class="radar-axis">
                        <div class="axis-label">点赞</div>
                      </div>
                      <div class="radar-axis">
                        <div class="axis-label">播放</div>
                      </div>
                    </div>
                    <div class="radar-shape">
                      <div class="radar-base"></div>
                      <div class="radar-data"></div>
                    </div>
                  </div>
                  <div class="radar-legend">
                    <div class="legend-item">
                      <span class="legend-dot my-data"></span>
                      <span>我的指标</span>
                    </div>
                    <div class="legend-item">
                      <span class="legend-dot peer-data"></span>
                      <span>同类UP主</span>
                    </div>
                  </div>
                </div>
                
                <!-- 指标分析 -->
                <div class="metrics-analysis">
                  <div class="metric-item">
                    <div class="metric-title">投稿:</div>
                    <div class="metric-content">
                      <el-icon class="metric-icon"><WarningFilled /></el-icon>
                      <span>你的投稿为 1 低于同类UP主</span>
                      <a href="#" class="metric-link">查看提升建议</a>
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-title">播放:</div>
                    <div class="metric-content">
                      <el-icon class="metric-icon"><CircleCheckFilled /></el-icon>
                      <span>你的播放为 2万 表现不错哟</span>
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-title">点赞:</div>
                    <div class="metric-content">
                      <el-icon class="metric-icon"><WarningFilled /></el-icon>
                      <span>你的点赞为 110 低于同类UP主</span>
                      <a href="#" class="metric-link">查看提升建议</a>
                    </div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-title">新增关注:</div>
                    <div class="metric-content">
                      <el-icon class="metric-icon"><WarningFilled /></el-icon>
                      <span>你的新增关注为 4 低于同类UP主</span>
                      <a href="#" class="metric-link">查看提升建议</a>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
            
            <!-- 稿件分析 -->
            <div class="article-analysis" v-if="activeDataTab === 'article'">
              <!-- 视频信息 -->
              <div class="video-info-card">
                <div class="video-thumbnail">
                  <img src="https://picsum.photos/id/1035/180/100" alt="视频缩略图">
                  <div class="video-duration">06:17</div>
                </div>
                <div class="video-details">
                  <div class="video-title">在byrut下载游戏的可能会中挖矿病毒audiog.exe\taskhost.exe</div>
                  <div class="video-stats">
                    <span class="stat-item">
                      <el-icon><VideoPlay /></el-icon>19.7万
                    </span>
                    <span class="stat-item">
                      <el-icon><StarFilled /></el-icon>3169
                    </span>
                    <span class="stat-item">
                      <el-icon><ChatDotRound /></el-icon>29
                    </span>
                  </div>
                  <div class="video-date">2025年09月01日 13:35:35</div>
                </div>
                <div class="video-actions">
                  <a href="#" class="switch-video">切换视频 <el-icon><ArrowRight /></el-icon></a>
                  <el-button type="primary" size="small" class="compare-btn">
                    <el-icon><DataAnalysis /></el-icon>稿件对比
                  </el-button>
                </div>
              </div>
              
              <!-- 数据标签页 -->
              <div class="data-tabs">
                <el-radio-group v-model="articleDataTab" size="small">
                  <el-radio-button value="data-overview" class="data-tab-btn active">数据总览</el-radio-button>
                  <el-radio-button value="play-analysis" class="data-tab-btn">播放分析</el-radio-button>
                  <el-radio-button value="fan-analysis" class="data-tab-btn">转粉分析</el-radio-button>
                </el-radio-group>
              </div>
              
              <!-- 核心大屏数据 -->
              <div class="core-big-screen">
                <h4 class="screen-title">核心大屏数据 <el-icon class="info-icon"><InfoFilled /></el-icon></h4>
                <div class="export-data">
                  <el-icon><Download /></el-icon>导出数据
                </div>
                
                <div class="big-screen-data">
                  <!-- 第一行 -->
                  <div class="data-row">
                    <div class="data-card highlight">
                      <div class="data-label">播放量</div>
                      <div class="data-value">19.7万</div>
                    </div>
                    <div class="data-card">
                      <div class="data-label">涨粉 <el-icon class="info-icon"><InfoFilled /></el-icon></div>
                      <div class="data-value">29</div>
                    </div>
                    <div class="data-card">
                      <div class="data-label">取消 <el-icon class="info-icon"><InfoFilled /></el-icon></div>
                      <div class="data-value">0</div>
                    </div>
                    <div class="data-card">
                      <div class="data-label">点赞</div>
                      <div class="data-value">3169</div>
                    </div>
                    <div class="data-card">
                      <div class="data-label">弹幕</div>
                      <div class="data-value">152</div>
                    </div>
                  </div>
                  
                  <!-- 第二行 -->
                  <div class="data-row">
                    <div class="data-card">
                      <div class="data-label">评论</div>
                      <div class="data-value">743</div>
                    </div>
                    <div class="data-card">
                      <div class="data-label">分享</div>
                      <div class="data-value">255</div>
                    </div>
                    <div class="data-card">
                      <div class="data-label">收藏</div>
                      <div class="data-value">1979</div>
                    </div>
                    <div class="data-card">
                      <div class="data-label">投币</div>
                      <div class="data-value">69</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 近30天播放量趋势 -->
              <div class="play-trend-section">
                <div class="trend-header">
                  <h4 class="trend-title">近30天播放量趋势</h4>
                  <div class="trend-update">更新至1月24日</div>
                  <div class="time-selector">
                    <span class="time-label">时间选择</span>
                    <el-select v-model="playTrendTimeRange" size="small" style="width: 100px;">
                      <el-option label="近30天" value="30d"></el-option>
                      <el-option label="近7天" value="7d"></el-option>
                      <el-option label="近90天" value="90d"></el-option>
                    </el-select>
                  </div>
                </div>
                <div class="trend-chart-container">
                  <!-- 模拟播放量趋势图 -->
                  <div class="play-trend-chart">
                    <div class="chart-axes">
                      <div class="chart-y-axis">
                        <div class="axis-tick">3000</div>
                        <div class="axis-tick">2250</div>
                        <div class="axis-tick">1500</div>
                        <div class="axis-tick">750</div>
                        <div class="axis-tick">0</div>
                      </div>
                      <div class="chart-x-axis">
                        <div class="axis-tick">2025/12/26</div>
                        <div class="axis-tick">2026/01/04</div>
                        <div class="axis-tick">2026/01/13</div>
                        <div class="axis-tick">2026/01/22</div>
                      </div>
                    </div>
                    <div class="chart-line-container">
                      <div class="chart-line"></div>
                      <div class="chart-area"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 粉丝分析 -->
            <div class="fans-analysis" v-if="activeDataTab === 'fans'">
              <!-- 数据概览 -->
              <div class="fans-overview">
                <div class="overview-header">
                  <h3 class="overview-title">数据概览 <el-icon class="info-icon"><InfoFilled /></el-icon></h3>
                  <div class="overview-update">更新至1月24日</div>
                  <div class="time-selector">
                    <span class="time-label">时间选择</span>
                    <el-select v-model="fansTimeRange" size="small" style="width: 100px;">
                      <el-option label="近7天" value="7d"></el-option>
                      <el-option label="近30天" value="30d"></el-option>
                      <el-option label="近90天" value="90d"></el-option>
                    </el-select>
                  </div>
                </div>
                
                <div class="fans-stats-grid">
                  <!-- 粉丝总数 -->
                  <div class="stat-card highlight">
                    <div class="stat-title">粉丝总数</div>
                    <div class="stat-value">719</div>
                    <div class="stat-icon">
                      <el-icon><UserFilled /></el-icon>
                    </div>
                  </div>
                  
                  <!-- 新增关注 -->
                  <div class="stat-card">
                    <div class="stat-title">新增关注</div>
                    <div class="stat-value">0</div>
                  </div>
                  
                  <!-- 净增粉丝 -->
                  <div class="stat-card">
                    <div class="stat-title">净增粉丝</div>
                    <div class="stat-value">-1</div>
                    <div class="stat-change negative">
                      <el-icon><ArrowDown /></el-icon>1
                    </div>
                  </div>
                  
                  <!-- 取消关注 -->
                  <div class="stat-card">
                    <div class="stat-title">取消关注</div>
                    <div class="stat-value">1</div>
                    <div class="stat-change negative">
                      <el-icon><ArrowUp /></el-icon>1
                    </div>
                  </div>
                  
                  <!-- 领取勋章粉丝数 -->
                  <div class="stat-card">
                    <div class="stat-title">领取勋章粉丝数</div>
                    <div class="stat-value">0</div>
                  </div>
                  
                  <!-- 充电粉丝数 -->
                  <div class="stat-card">
                    <div class="stat-title">充电粉丝数</div>
                    <div class="stat-value">0</div>
                  </div>
                </div>
              </div>
              
              <!-- 近7天粉丝总数趋势 -->
              <div class="fans-trend-section">
                <div class="trend-header">
                  <h3 class="trend-title">近7天粉丝总数</h3>
                  <div class="trend-actions">
                    <el-button type="text" class="export-data-btn">
                      <el-icon><Download /></el-icon>导出数据
                    </el-button>
                  </div>
                </div>
                <div class="trend-chart-container">
                  <div class="fans-trend-chart">
                    <div class="chart-axes">
                      <div class="chart-y-axis">
                        <div class="axis-tick">1100</div>
                        <div class="axis-tick">1000</div>
                        <div class="axis-tick">900</div>
                        <div class="axis-tick">800</div>
                        <div class="axis-tick">700</div>
                      </div>
                      <div class="chart-x-axis">
                        <div class="axis-tick">2026/01/18</div>
                        <div class="axis-tick">2026/01/20</div>
                        <div class="axis-tick">2026/01/22</div>
                        <div class="axis-tick">2026/01/24</div>
                      </div>
                    </div>
                    <div class="chart-line-container">
                      <div class="chart-line"></div>
                      <div class="chart-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 粉丝排行 -->
              <div class="fans-ranking-section">
                <h3 class="section-title">粉丝排行近30天</h3>
                <div class="ranking-grid">
                  <!-- 累计视频播放时长排行 -->
                  <div class="ranking-card">
                    <div class="ranking-header">
                      <el-icon class="ranking-icon"><VideoPlay /></el-icon>
                      <span class="ranking-title">累计视频播放时长排行</span>
                    </div>
                    <div class="ranking-list">
                      <div v-for="(item, index) in playTimeRanking" :key="item.id" class="ranking-item">
                        <div class="ranking-index">{{ index + 1 }}</div>
                        <el-avatar :size="32" :src="item.avatar"></el-avatar>
                        <span class="ranking-username">{{ item.username }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 视频互动指标排行 -->
                  <div class="ranking-card">
                    <div class="ranking-header">
                      <el-icon class="ranking-icon"><ChatDotRound /></el-icon>
                      <span class="ranking-title">视频互动指标排行</span>
                    </div>
                    <div class="ranking-list">
                      <div v-for="(item, index) in videoInteractionRanking" :key="item.id" class="ranking-item">
                        <div class="ranking-index">{{ index + 1 }}</div>
                        <el-avatar :size="32" :src="item.avatar"></el-avatar>
                        <span class="ranking-username">{{ item.username }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 动态互动指标排行 -->
                  <div class="ranking-card">
                    <div class="ranking-header">
                      <el-icon class="ranking-icon"><Document /></el-icon>
                      <span class="ranking-title">动态互动指标排行</span>
                    </div>
                    <div class="ranking-list">
                      <div v-for="(item, index) in dynamicInteractionRanking" :key="item.id" class="ranking-item">
                        <div class="ranking-index">{{ index + 1 }}</div>
                        <el-avatar :size="32" :src="item.avatar"></el-avatar>
                        <span class="ranking-username">{{ item.username }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 粉丝勋章排行 -->
                  <div class="ranking-card">
                    <div class="ranking-header">
                      <el-icon class="ranking-icon"><Medal /></el-icon>
                      <span class="ranking-title">粉丝勋章排行</span>
                    </div>
                    <div class="ranking-list empty">
                      <div class="empty-ranking">暂无数据</div>
                    </div>
                  </div>
                </div>
                
                <!-- 查看全部排行按钮 -->
                <div class="view-all-ranking">
                  <el-button type="primary" size="small" plain>查看全部排行</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 粉丝管理内容 -->
        <div v-else-if="currentActive === 'fans'" class="content-section">
          <div class="content-body">
            <div class="fans-container">
              <div class="fans-header">
                <h3>粉丝列表</h3>
              </div>
              
              <div class="fans-count-row">
                <div class="fans-count">
                  我的粉丝数 {{ totalFans }}
                </div>
                <div class="fans-filter">
                  <el-select v-model="fansFilter" size="small" style="min-width: 120px;">
                    <el-option label="全部粉丝" value="all"></el-option>
                    <el-option label="互关粉丝" value="mutual"></el-option>
                  </el-select>
                </div>
              </div>
              
              <div class="fans-list" v-loading="fansLoading">
                <template v-if="fans.length > 0">
                  <div v-for="fan in fans" :key="fan.id" class="fan-item">
                    <div class="fan-info">
                      <el-avatar :size="40" :src="fan.avatar"></el-avatar>
                      <span class="fan-username">{{ fan.username }}</span>
                      <el-tag v-if="fan.isMutual" size="small" type="success" style="margin-left: 8px;">互关</el-tag>
                    </div>
                    <div class="fan-actions">
                      <el-button 
                        size="small" 
                        :type="fan.isFollowing ? 'default' : 'primary'" 
                        :plain="!fan.isFollowing"
                        @click="handleFollowFan(fan)"
                      >
                        {{ fan.isFollowing ? '已关注' : '关注' }}
                      </el-button>
                      <el-dropdown>
                        <el-button size="small" :plain="true">
                          <el-icon><MoreFilled /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item>举报</el-dropdown-item>
                            <el-dropdown-item>移除粉丝</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>
                </template>
                <el-empty v-else description="暂无粉丝数据" />
              </div>
              
              <div class="fans-pagination">
                <el-pagination
                  v-model:current-page="fansCurrentPage"
                  v-model:page-size="fansPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="totalFans"
                  layout="prev, pager, next, jumper, total"
                ></el-pagination>
              </div>
            </div>
          </div>
        </div>

        <!-- 评论管理内容 -->
        <div v-else-if="currentActive === 'interaction-comment'" class="content-section">
          <!-- 移除标题 -->
          <div class="content-body">
            <div class="comment-management">
              <!-- 主标签页和搜索框 -->
              <div class="main-tabs-with-search">
                <!-- 主标签页：用户可见评论、待精选评论 -->
                <div class="main-tabs">
                  <el-radio-group v-model="activeCommentMainTab" size="large">
                    <el-radio-button value="visible">用户可见评论</el-radio-button>
                    <el-radio-button value="pending">待精选评论</el-radio-button>
                  </el-radio-group>
                </div>
                
                <!-- 搜索框 -->
                <div class="main-search">
                  <el-input
                    v-model="commentSearchText"
                    placeholder="搜索视频评论"
                    size="small"
                    style="width: 200px;"
                    clearable
                  >
                    <template #append>
                      <el-button size="small" @click="searchComments"><el-icon><Search /></el-icon></el-button>
                    </template>
                  </el-input>
                </div>
              </div>
              
              <!-- 搜索和过滤区域 -->
              <div class="comment-filter-bar">
                <!-- 视频评论蓝色字样 -->
                <div class="video-comment-label">视频评论</div>
                
                <div class="left-section">
                  <!-- 子标签页：视频评论、专栏评论、音频评论 -->
                  <div class="sub-tabs">
                    <el-radio-group v-model="activeCommentSubTab" size="small">
                      <el-radio-button value="video">视频评论</el-radio-button>
                      <el-radio-button value="column">专栏评论</el-radio-button>
                      <el-radio-button value="audio">音频评论</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
                
                <div class="right-section">
                  <!-- 评论类型和视频筛选 -->
                  <div class="filter-dropdowns">
                    <el-select v-model="commentTypeFilter" placeholder="全部评论" size="small" style="min-width: 120px; margin-right: 10px;">
                      <el-option label="全部评论" value="all"></el-option>
                      <el-option label="评论" value="comment"></el-option>
                      <el-option label="回复" value="reply"></el-option>
                    </el-select>
                    
                    <el-select v-model="videoFilter" placeholder="全部视频" size="small" style="min-width: 120px;">
                      <el-option label="全部视频" value="all"></el-option>
                      <el-option
                        v-for="video in videoList"
                        :key="video.id"
                        :label="video.title"
                        :value="video.id"
                      ></el-option>
                    </el-select>
                  </div>
                </div>
              </div>
              
              <!-- 操作栏 -->
              <div class="comment-actions">
                <div class="action-buttons">
                  <el-button size="small" plain @click="handleSelectAll(true)">全选</el-button>
                  <el-button size="small" plain>举报</el-button>
                  <el-button size="small" plain @click="handleBatchDelete">删除</el-button>
                </div>
                
                <!-- 排序选项 -->
                <div class="sort-options">
                  <el-radio-group v-model="commentSortBy" size="small">
                    <el-radio-button value="latest">最近发布</el-radio-button>
                    <el-radio-button value="likes">点赞最多</el-radio-button>
                    <el-radio-button value="replies">回复最多</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              
              <!-- 评论列表 -->
              <div class="comment-list">
                <div 
                  v-for="comment in comments" 
                  :key="comment.id" 
                  class="comment-item"
                >
                  <!-- 复选框 -->
                  <div class="comment-checkbox">
                    <el-checkbox v-model="comment.selected"></el-checkbox>
                  </div>
                  
                  <!-- 评论主体：头像、用户名、内容、操作 -->
                  <div class="comment-main">
                    <!-- 头像和用户名 -->
                    <div class="comment-header">
                      <el-avatar :size="40" :src="comment.avatar"></el-avatar>
                      <span class="username">{{ comment.username }}</span>
                    </div>
                    
                    <!-- 评论内容 -->
                    <div class="comment-content">
                      {{ comment.content }}
                    </div>
                    
                    <!-- 评论时间和操作 -->
                    <div class="comment-meta">
                      <span class="comment-time">{{ comment.time }}</span>
                      <el-button size="small" plain>
                        <el-icon><StarFilled /></el-icon>
                      </el-button>
                      <el-button size="small" plain>
                        <el-icon><ChatDotRound /></el-icon>回复
                      </el-button>
                      
                      <!-- 举报和删除按钮（鼠标悬停显示） -->
                      <div class="comment-actions-hover">
                        <el-button size="small" plain type="warning">
                          <el-icon><WarningFilled /></el-icon>举报
                        </el-button>
                        <el-button size="small" plain type="danger">
                          <el-icon><Delete /></el-icon>删除
                        </el-button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 视频缩略图 -->
                  <div class="comment-right">
                    <div class="video-thumbnail" v-if="comment.videoThumbnail">
                      <img :src="comment.videoThumbnail" alt="视频缩略图">
                      <div class="video-title">{{ comment.videoTitle }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 分页 -->
              <div class="comment-pagination">
                <div class="comment-total">
                  仅展示最近的50000条评论
                </div>
                <div class="custom-pagination">
                  <el-button 
                    v-for="(page, index) in visiblePages" 
                    :key="index"
                    :type="page === commentCurrentPage ? 'primary' : 'default'"
                    :plain="page !== commentCurrentPage"
                    :disabled="page === '...'"
                    @click="typeof page === 'number' && (commentCurrentPage = page)"
                    size="small"
                  >
                    {{ page }}
                  </el-button>
                  
                  <el-button 
                    v-if="commentCurrentPage < totalPages" 
                    @click="commentCurrentPage++"
                    size="small"
                  >
                    下一页
                  </el-button>
                  
                  <div class="pagination-info">
                    共{{ totalPages }}页 / {{ totalComments }}个
                  </div>
                </div>
              </div>
            </div>

            <el-dialog v-model="replyDialogVisible" title="回复评论" width="500px">
              <el-input
                v-model="replyContent"
                type="textarea"
                :rows="4"
                placeholder="请输入回复内容"
                maxlength="500"
                show-word-limit
              />
              <template #footer>
                <el-button @click="replyDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleReplyComment">发送</el-button>
              </template>
            </el-dialog>
          </div>
        </div>

        <div v-else-if="currentActive === 'interaction-danmu'" class="content-section">
          <!-- 移除标题 -->
          <div class="content-body">
            <div class="danmu-management">
              <!-- 顶部导航标签和搜索栏 -->
              <div class="danmu-tabs-with-search">
                <!-- 顶部导航标签 -->
                <div class="danmu-tabs">
                  <el-tabs v-model="activeDanmuTab" type="card">
                    <el-tab-pane label="稿件弹幕" name="article"></el-tab-pane>
                    <el-tab-pane label="弹幕设置" name="settings"></el-tab-pane>
                    <el-tab-pane label="弹幕反馈" name="feedback"></el-tab-pane>
                  </el-tabs>
                </div>
                
                <!-- 右侧搜索栏 -->
                <div class="danmu-search">
                  <el-input
                    v-model="danmuSearchText"
                    placeholder="搜索弹幕关键字"
                    size="small"
                    style="width: 200px;"
                    clearable
                  >
                    <template #append>
                      <el-button size="small" @click="searchDanmu"><el-icon><Search /></el-icon></el-button>
                    </template>
                  </el-input>
                </div>
              </div>
              
              <!-- 操作栏和筛选条件（仅在稿件弹幕标签页显示） -->
              <div v-if="activeDanmuTab === 'article'" class="danmu-header">
                <!-- 左侧操作按钮 -->
                <div class="danmu-actions">
                  <el-button size="small" type="danger">删除弹幕</el-button>
                  <el-button size="small" type="primary" plain>弹幕保护</el-button>
                  <el-button size="small" type="primary" plain>取消保护</el-button>
                  <el-button size="small" type="primary" plain>字幕</el-button>
                  <el-button size="small" type="primary" plain>普通</el-button>
                  <el-button size="small" type="primary" plain>
                    <el-icon><Refresh /></el-icon>刷新
                  </el-button>
                  <el-button size="small" type="primary" plain>弹幕转移</el-button>
                </div>
                
                <!-- 右侧筛选条件 -->
                <div class="danmu-filters">
                  <el-select v-model="danmuTypeFilter" placeholder="全部弹幕" size="small" style="min-width: 120px; margin-right: 15px;">
                    <el-option label="全部弹幕" value="all"></el-option>
                    <el-option label="普通弹幕" value="normal"></el-option>
                    <el-option label="字幕弹幕" value="subtitle"></el-option>
                  </el-select>
                  
                  <el-select v-model="danmuTimeFilter" placeholder="最近弹幕" size="small" style="min-width: 120px; margin-right: 15px;">
                    <el-option label="最近弹幕" value="latest"></el-option>
                    <el-option label="本周弹幕" value="week"></el-option>
                    <el-option label="本月弹幕" value="month"></el-option>
                  </el-select>
                  
                  <el-select v-model="danmuVideoFilter" placeholder="全部视频" size="small" style="min-width: 120px;">
                    <el-option label="全部视频" value="all"></el-option>
                    <el-option label="视频1" value="video1"></el-option>
                    <el-option label="视频2" value="video2"></el-option>
                  </el-select>
                </div>
              </div>
              
              <!-- 弹幕列表（仅在稿件弹幕标签页显示） -->
              <div v-if="activeDanmuTab === 'article'" class="danmu-list">
                <el-table :data="danmus" stripe style="width: 100%">
                  <el-table-column type="selection" width="55"></el-table-column>
                  <el-table-column prop="sender" label="发送者" width="120"></el-table-column>
                  <el-table-column prop="playTime" label="播放时间" width="100" sortable></el-table-column>
                  <el-table-column prop="content" label="弹幕内容" min-width="300">
                    <template #default="scope">
                      <div>{{ scope.row.content }}</div>
                      <div class="danmu-video-info">视频: {{ scope.row.videoTitle }}</div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="likes" label="点赞" width="80" sortable>
                    <template #default="scope">
                      <el-icon><StarFilled /></el-icon>{{ scope.row.likes }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="type" label="属性" width="80">
                    <template #default="scope">
                      <el-tag size="small">{{ scope.row.type }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="sendTime" label="发送时间" width="160" sortable></el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="scope">
                      <el-dropdown>
                        <el-button size="small" plain>
                          <el-icon><MoreFilled /></el-icon>
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item>删除</el-dropdown-item>
                            <el-dropdown-item>举报</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              
              <!-- 弹幕设置（仅在弹幕设置标签页显示） -->
              <div v-else-if="activeDanmuTab === 'settings'" class="danmu-settings">
                <!-- 发送弹幕的类型 -->
                <div class="setting-section">
                  <h4 class="section-title">发送弹幕的类型</h4>
                  <div class="radio-group">
                    <el-radio-group v-model="danmuSendType" size="large">
                      <el-radio value="all">允许发送所有类型的弹幕</el-radio>
                      <el-radio value="specified">允许发送指定类型的弹幕</el-radio>
                    </el-radio-group>
                  </div>
                </div>
                
                <!-- 高级弹幕请求 -->
                <div class="setting-section">
                  <h4 class="section-title">高级弹幕请求</h4>
                  <el-select v-model="advancedDanmuRequest" placeholder="任何人" style="min-width: 200px;">
                    <el-option label="任何人" value="anyone"></el-option>
                    <el-option label="仅粉丝" value="fans"></el-option>
                    <el-option label="仅关注3天以上粉丝" value="fans3d"></el-option>
                    <el-option label="禁止所有人" value="none"></el-option>
                  </el-select>
                </div>
                
                <!-- 黑名单 -->
                <div class="setting-section">
                  <h4 class="section-title">黑名单</h4>
                  <div class="setting-description">
                    <p>添加方式：</p>
                    <p>(1) 在网页播放器的弹幕列表上，右击弹幕选择"up主视频中禁言此用户"</p>
                    <p>(2) 在创作中心弹幕管理的删除弹幕按钮上，点击下拉按钮选择"删除并拉黑该用户"</p>
                  </div>
                </div>
                
                <!-- 关键词过滤 -->
                <div class="setting-section">
                  <h4 class="section-title">关键词过滤</h4>
                  <div class="filter-input-group">
                    <el-input
                      v-model="keywordFilterText"
                      placeholder="输入关键词进行过滤。例如mdzz"
                      style="flex: 1;"
                    ></el-input>
                    <el-button type="primary" style="margin-left: 10px;">添加</el-button>
                  </div>
                  <div class="setting-description">
                    <p>输入关键词进行过滤，例如mdzz。观众将不能在你的视频中发送包含指定关键词的弹幕</p>
                  </div>
                </div>
                
                <!-- 正则表达式过滤 -->
                <div class="setting-section">
                  <h4 class="section-title">正则表达式过滤</h4>
                  <div class="filter-input-group">
                    <el-input
                      v-model="regexFilterText"
                      placeholder="输入正则表达式进行过滤"
                      style="flex: 1;"
                    ></el-input>
                    <el-button type="primary" style="margin-left: 10px;">添加</el-button>
                  </div>
                  <div class="setting-description">
                    <p>观众将不能在你的视频中发送匹配指定正则表达式的弹幕</p>
                  </div>
                </div>
              </div>
              
              <!-- 弹幕反馈（仅在弹幕反馈标签页显示） -->
              <div v-else-if="activeDanmuTab === 'feedback'" class="danmu-feedback">
                <!-- 弹幕反馈子标签 -->
                <div class="danmu-feedback-tabs">
                  <el-tabs v-model="activeDanmuFeedbackTab" type="card" size="small">
                    <el-tab-pane label="弹幕举报" name="report"></el-tab-pane>
                    <el-tab-pane label="高级请求" name="advanced"></el-tab-pane>
                    <el-tab-pane label="弹幕保护" name="protection"></el-tab-pane>
                  </el-tabs>
                </div>
                
                <!-- 弹幕反馈操作栏 -->
                <div class="danmu-feedback-header">
                  <div class="feedback-actions">
                    <el-button size="small" type="danger">删除弹幕</el-button>
                    <el-button size="small" type="primary" plain>忽略举报</el-button>
                  </div>
                  
                  <div class="feedback-filter">
                    <el-select v-model="feedbackVideoFilter" placeholder="全部视频" size="small" style="min-width: 150px;">
                      <el-option label="全部视频" value="all"></el-option>
                      <el-option label="在byrut下载过游戏的可能会中挖矿病毒" value="video1"></el-option>
                      <el-option label="陈梦曾经在贴吧的帖子和评论" value="video2"></el-option>
                      <el-option label="NB化学实验室卡bug不用VIP做VIP实验" value="video3"></el-option>
                    </el-select>
                  </div>
                </div>
                
                <!-- 弹幕反馈列表 -->
                <div class="danmu-feedback-list">
                  <el-table :data="danmuFeedbackList" stripe style="width: 100%">
                    <el-table-column type="selection" width="55"></el-table-column>
                    <el-table-column prop="content" label="弹幕内容" min-width="200"></el-table-column>
                    <el-table-column prop="video" label="弹幕视频" min-width="250"></el-table-column>
                    <el-table-column prop="sender" label="发送者" width="120"></el-table-column>
                    <el-table-column prop="sendTime" label="发送时间" width="180" sortable></el-table-column>
                    <el-table-column label="操作" width="150">
                      <template #default="scope">
                        <el-button size="small" type="text" class="text-danger">删除弹幕</el-button>
                        <el-button size="small" type="text">忽略</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                
                <!-- 弹幕列表显示上限提示 -->
                <div class="danmu-list-limit">
                  弹幕列表显示上限10000条
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 收益管理内容 -->
        <div v-else-if="currentActive === 'revenue'" class="content-section">
          <!-- 移除标题 -->
          <div class="content-body">
            <p>这里是收益管理页面，您可以查看您的创作收益。</p>
          </div>
        </div>

        <!-- 创作设置内容 -->
        <div v-else-if="currentActive === 'settings'" class="content-section">
          <div class="content-body">
            <div class="settings-container">
              <div class="settings-header">
                <h3>创作设置</h3>
              </div>
              
              <el-form 
                v-loading="settingsLoading" 
                :model="settingsForm" 
                label-width="140px" 
                class="settings-form"
              >
                <el-form-item label="默认投稿分类">
                  <el-select 
                    v-model="settingsForm.defaultCategoryId" 
                    placeholder="请选择默认分类"
                    style="width: 300px;"
                  >
                    <el-option
                      v-for="category in categories"
                      :key="category.value"
                      :label="category.label"
                      :value="category.value"
                    />
                  </el-select>
                  <div class="form-item-tip">新投稿时默认选择的分类</div>
                </el-form-item>
                
                <el-form-item label="自动发布">
                  <el-switch v-model="settingsForm.autoPublish" />
                  <div class="form-item-tip">开启后，稿件审核通过后将自动发布</div>
                </el-form-item>
                
                <el-form-item label="评论通知">
                  <el-switch v-model="settingsForm.commentNotify" />
                  <div class="form-item-tip">收到新评论时发送通知</div>
                </el-form-item>
                
                <el-form-item label="点赞通知">
                  <el-switch v-model="settingsForm.likeNotify" />
                  <div class="form-item-tip">稿件获得点赞时发送通知</div>
                </el-form-item>
                
                <el-form-item label="关注通知">
                  <el-switch v-model="settingsForm.followNotify" />
                  <div class="form-item-tip">有新粉丝关注时发送通知</div>
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    :loading="saveSettingsLoading" 
                    @click="saveSettings"
                  >
                    保存设置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>

        <!-- 投稿内容 -->
        <div v-else-if="currentActive === 'upload'" class="content-section">
          <UploadView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { creatorApi, manuscriptApi, collectionApi } from '@/api/creator'
import { useUserStore } from '@/stores/user'
import { 
  VideoPlay, 
  Upload, 
  House, 
  Document, 
  DataAnalysis, 
  UserFilled, 
  ChatDotRound, 
  Coin, 
  Setting, 
  Menu, 
  Message, 
  Comment, 
  Monitor, 
  UploadFilled, 
  Picture, 
  Plus, 
  MoreFilled, 
  InfoFilled, 
  WarningFilled, 
  CircleCheckFilled, 
  ArrowDown, 
  ArrowUp, 
  StarFilled, 
  ArrowRight, 
  Medal, 
  Search, 
  Delete, 
  Refresh 
} from '@element-plus/icons-vue'
import UploadView from './UploadView.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 当前登录用户信息
const currentUser = computed(() => userStore.userInfo)

// 首页统计数据
const homeLoading = ref(false)
const homeError = ref(null)
const statsData = ref({
  followerCount: 0,
  totalViewCount: 0,
  totalCommentCount: 0,
  totalDanmuCount: 0,
  totalLikeCount: 0,
  totalShareCount: 0,
  totalFavoriteCount: 0,
  totalCoinCount: 0
})

// 侧边栏菜单引用
const menuRef = ref(null)

// 返回主站
const goToMainSite = () => {
  router.push('/')
}

// 跳转到个人主页
const goToUserProfile = () => {
  if (currentUser.value && currentUser.value.id) {
    router.push(`/profile/${currentUser.value.id}/home`)
  }
}

// 当前激活的菜单索引
const currentActive = ref('home')

// 菜单选择事件处理
const handleMenuSelect = (index, indexPath) => {
  // 根据索引导航到对应的路由
  const routeMap = {
    'home': '/create-center/home',
    'upload': '/create-center/upload',
    'content': '/create-center/content',
    'content-articles': '/create-center/content-articles',
    'content-appeal': '/create-center/content-appeal',
    'content-subtitle': '/create-center/content-subtitle',
    'data': '/create-center/data',
    'fans': '/create-center/fans',
    'interaction': '/create-center/interaction',
    'interaction-comment': '/create-center/interaction-comment',
    'interaction-danmu': '/create-center/interaction-danmu',
    'revenue': '/create-center/revenue',
    'settings': '/create-center/settings'
  }
  
  if (routeMap[index]) {
    router.push(routeMap[index])
  }
  
  // 滚动到顶部
  window.scrollTo(0, 0)
}

// 监听路由变化，同步当前激活的菜单
watch(
  () => route.path,
  (newPath) => {
    // 根据当前路径设置activeIndex
    const pathMap = {
      '/create-center/home': 'home',
      '/create-center/upload': 'upload',
      '/create-center/content': 'content',
      '/create-center/content-articles': 'content-articles',
      '/create-center/content-appeal': 'content-appeal',
      '/create-center/content-subtitle': 'content-subtitle',
      '/create-center/data': 'data',
      '/create-center/fans': 'fans',
      '/create-center/interaction': 'interaction',
      '/create-center/interaction-comment': 'interaction-comment',
      '/create-center/interaction-danmu': 'interaction-danmu',
      '/create-center/revenue': 'revenue',
      '/create-center/settings': 'settings'
    }
    
    if (pathMap[newPath]) {
      currentActive.value = pathMap[newPath]
      if (menuRef.value) {
        menuRef.value.activeIndex = pathMap[newPath]
      }
      if (newPath === '/create-center/settings') {
        loadSettings()
      }
      if (newPath === '/create-center/interaction-comment') {
        fetchComments()
        fetchVideoList()
      }
    }
  },
  { immediate: true }
)

// 评论/弹幕切换标签
const activeCommentTab = ref('comment')
// 排行切换标签
const activeRankingTab = ref('view')



// 最新评论数据
const latestComments = ref([])

// 最新弹幕数据（开发中）
const latestDanmus = ref([])
const danmuDeveloping = ref(true)

// 观看排行数据
const viewRanking = ref([
  { id: 1, username: '观看用户1', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 1234 },
  { id: 2, username: '观看用户2', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 987 },
  { id: 3, username: '观看用户3', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 765 },
  { id: 4, username: '观看用户4', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 543 },
  { id: 5, username: '观看用户5', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 321 }
])

// 互动排行数据
const interactionRanking = ref([
  { id: 1, username: '互动用户1', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 456 },
  { id: 2, username: '互动用户2', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 345 },
  { id: 3, username: '互动用户3', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 234 },
  { id: 4, username: '互动用户4', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 123 },
  { id: 5, username: '互动用户5', avatar: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg', count: 100 }
])

// 获取排名样式类
const getRankingClass = (index) => {
  if (index === 0) {
    return 'ranking-gold'
  } else if (index === 1) {
    return 'ranking-silver'
  } else if (index === 2) {
    return 'ranking-bronze'
  }
  return ''
}

// 稿件管理相关状态
// 主要选择栏
const mainTab = ref('video')

// 视频管理次级选择栏
const articleFilter = ref('all') // all: 全部稿件, draft: 草稿

// 状态筛选
const statusFilter = ref('processing') // processing: 进行中, approved: 已通过, rejected: 未通过

// 稿件状态常量（与后端对应）
const STATUS_PENDING_REVIEW = 0  // 待审核（草稿）
const STATUS_PROCESSING = 1      // 处理中
const STATUS_PUBLISHED = 3       // 已发布（已通过）
const STATUS_REJECTED = 4        // 已拒绝（未通过）

// 状态映射：前端筛选值 -> 后端状态码
const statusMap = {
  'draft': STATUS_PENDING_REVIEW,
  'processing': STATUS_PROCESSING,
  'approved': STATUS_PUBLISHED,
  'rejected': STATUS_REJECTED
}

// 稿件列表数据
const articles = ref([])
const articlesLoading = ref(false)
const totalArticles = ref(0)

// 稿件统计数据
const approvedCount = ref(0)
const rejectedCount = ref(0)
const processingCount = ref(0)
const draftCount = ref(0)

// 分页相关状态
const currentPage = ref(1)
const pageSize = ref(10)

// 获取稿件列表
const fetchArticles = async () => {
  if (!currentUser.value || !currentUser.value.id) {
    return
  }
  
  articlesLoading.value = true
  try {
    let status = null
    
    if (articleFilter.value === 'draft') {
      status = STATUS_PENDING_REVIEW
    } else if (statusFilter.value) {
      status = statusMap[statusFilter.value]
    }
    
    const response = await manuscriptApi.getUserManuscripts(
      currentUser.value.id,
      currentPage.value,
      pageSize.value,
      status
    )
    
    if (response.code === 200) {
      articles.value = response.data.records || []
      totalArticles.value = response.data.total || 0
    }
  } catch (error) {
    console.error('获取稿件列表失败:', error)
    ElMessage.error('获取稿件列表失败')
  } finally {
    articlesLoading.value = false
  }
}

// 获取稿件统计
const fetchManuscriptStats = async () => {
  if (!currentUser.value || !currentUser.value.id) {
    return
  }
  
  try {
    const response = await manuscriptApi.getManuscriptStats(currentUser.value.id)
    
    if (response.code === 200) {
      const stats = response.data
      draftCount.value = stats.draftCount || 0
      processingCount.value = stats.processingCount || 0
      approvedCount.value = stats.publishedCount || 0
      rejectedCount.value = stats.rejectedCount || 0
    }
  } catch (error) {
    console.error('获取稿件统计失败:', error)
  }
}

// 监听筛选条件变化，重新获取数据
watch([articleFilter, statusFilter], () => {
  currentPage.value = 1
  fetchArticles()
})

// 监听分页变化
watch([currentPage, pageSize], () => {
  fetchArticles()
})

// 监听当前激活菜单变化，加载稿件数据
watch(currentActive, (newVal) => {
  if (newVal === 'content-articles') {
    fetchArticles()
    fetchManuscriptStats()
  }
})

// 获取稿件状态类型
const getArticleStatusType = (status) => {
  const statusTypeMap = {
    [STATUS_PENDING_REVIEW]: 'info',
    [STATUS_PROCESSING]: 'warning',
    [STATUS_PUBLISHED]: 'success',
    [STATUS_REJECTED]: 'danger'
  }
  return statusTypeMap[status] || 'info'
}

// 获取稿件状态文本
const getArticleStatusText = (status) => {
  const statusTextMap = {
    [STATUS_PENDING_REVIEW]: '草稿',
    [STATUS_PROCESSING]: '进行中',
    [STATUS_PUBLISHED]: '已通过',
    [STATUS_REJECTED]: '未通过'
  }
  return statusTextMap[status] || '未知'
}

// 编辑稿件
const editArticle = (id) => {
  router.push(`/create-center/edit/${id}`)
}

// 删除稿件
const deleteArticle = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个稿件吗？删除后无法恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await manuscriptApi.deleteManuscript(id)
    
    if (response.code === 200) {
      ElMessage.success('删除成功')
      fetchArticles()
      fetchManuscriptStats()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除稿件失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 数据中心相关状态
const activeDataTab = ref('overview') // 活跃的数据中心标签页
const timeRange = ref('7d') // 时间范围

// 稿件分析相关状态
const articleDataTab = ref('data-overview') // 稿件数据标签页
const playTrendTimeRange = ref('30d') // 播放趋势图时间范围

// 粉丝分析相关状态
const fansTimeRange = ref('7d') // 粉丝数据时间范围

// 粉丝排行数据
const playTimeRanking = ref([
  { id: 1, username: 'bili_1220763...', avatar: 'https://picsum.photos/id/1001/40/40' },
  { id: 2, username: '不顶不是人', avatar: 'https://picsum.photos/id/1002/40/40' },
  { id: 3, username: '乘風', avatar: 'https://picsum.photos/id/1003/40/40' }
])

const videoInteractionRanking = ref([
  { id: 1, username: '不顶不是人', avatar: 'https://picsum.photos/id/1002/40/40' },
  { id: 2, username: 'bili_1220763...', avatar: 'https://picsum.photos/id/1001/40/40' },
  { id: 3, username: '61-boy', avatar: 'https://picsum.photos/id/1004/40/40' }
])

const dynamicInteractionRanking = ref([
  { id: 1, username: '伶琬莹·可爱', avatar: 'https://picsum.photos/id/1005/40/40' }
])

// 粉丝管理相关状态
const fansLoading = ref(false)
const totalFans = ref(0)
const fansCurrentPage = ref(1)
const fansPageSize = ref(10)
const fansFilter = ref('all')
const fans = ref([])
const fansStats = ref({
  totalFans: 0,
  newFansToday: 0,
  newFansThisWeek: 0,
  newFansThisMonth: 0
})

const fetchFansStats = async () => {
  try {
    const res = await creatorApi.getFansStats()
    if (res.code === 200) {
      fansStats.value = res.data
      totalFans.value = res.data.totalFans
    }
  } catch (error) {
    console.error('获取粉丝统计失败:', error)
  }
}

const fetchFansList = async () => {
  fansLoading.value = true
  try {
    const params = {
      page: fansCurrentPage.value,
      size: fansPageSize.value
    }
    if (fansFilter.value === 'mutual') {
      params.mutual = true
    }
    const res = await creatorApi.getFans(params)
    if (res.code === 200) {
      fans.value = res.data.list || []
      totalFans.value = res.data.total || 0
    }
  } catch (error) {
    console.error('获取粉丝列表失败:', error)
    ElMessage.error('获取粉丝列表失败')
  } finally {
    fansLoading.value = false
  }
}

const handleFollowFan = async (fan) => {
  try {
    if (fan.isFollowing) {
      await followApi.unfollow(fan.id)
      fan.isFollowing = false
      ElMessage.success('已取消关注')
    } else {
      await followApi.follow(fan.id)
      fan.isFollowing = true
      ElMessage.success('关注成功')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

let fansInitialized = false

const initFansData = () => {
  if (!fansInitialized) {
    fansInitialized = true
    fetchFansStats()
    fetchFansList()
  }
}

watch(fansFilter, () => {
  fansCurrentPage.value = 1
})

watch([fansCurrentPage, fansPageSize, fansFilter], () => {
  if (fansInitialized) {
    fetchFansList()
  }
})

// 申诉管理数据
const activeAppealTab = ref('全部')

// 模拟申诉稿件数据
const appealItems = ref([
  {
    id: 1,
    title: 'NOBOOK实验室 初中化学-粉尘爆炸实验',
    cover: 'https://picsum.photos/id/1035/120/90',
    submissionStatus: '已锁定',
    applyTime: '2025-02-08 13:52:56',
    applyNumber: '100684494',
    handleStatus: '申诉完成',
    status: '已完成'
  },
  {
    id: 2,
    title: '卧槽，这是陈梦?',
    cover: 'https://picsum.photos/id/1036/120/90',
    submissionStatus: '已发布',
    applyTime: '2025-01-26 23:57:53',
    applyNumber: '100656047',
    handleStatus: '申诉完成',
    status: '已完成'
  }
])

// 计算每个状态的申诉数量
const appealCount = computed(() => {
  return {
    all: appealItems.value.length,
    processing: appealItems.value.filter(item => item.status === '进行中').length,
    completed: appealItems.value.filter(item => item.status === '已完成').length
  }
})

// 过滤后的申诉列表
const filteredAppeals = computed(() => {
  if (activeAppealTab.value === '全部') {
    return appealItems.value
  } else if (activeAppealTab.value === '进行中') {
    return appealItems.value.filter(item => item.status === '进行中')
  } else if (activeAppealTab.value === '已完成') {
    return appealItems.value.filter(item => item.status === '已完成')
  }
  return appealItems.value
})

// 合集管理相关状态
const collectionForm = reactive({
  title: '777',
  description: '777',
  coverUrl: 'https://i0.hdslb.com/bfs/face/3378829f555891d2d5a4537e10264593a1d076b1.jpg'
})

// 合集封面上传处理
const handleCollectionCoverUpload = (file) => {
  // 模拟封面上传，实际项目中应该调用后端API
  collectionForm.coverUrl = URL.createObjectURL(file.raw)
  return false // 阻止自动上传
}

// 提交合集表单
const submitCollection = () => {
  console.log('提交合集:', collectionForm)
  // 实际项目中应该调用后端API提交数据
  ElMessage.success('合集提交成功')
}

// 取消合集编辑
const cancelCollection = () => {
  console.log('取消合集编辑')
  // 实际项目中应该重置表单或返回上一页
}

// 回到创作中心首页
const goToCreateCenterHome = () => {
  router.push('/create-center/home')
  // 滚动到顶部
  window.scrollTo(0, 0)
}

// 跳转到投稿页面（修改为在创作中心内部显示）
const goToUpload = () => {
  router.push('/create-center/upload')
  // 滚动到顶部
  window.scrollTo(0, 0)
}

// 投稿相关变量和函数
// 简化上传表单，只保留视频文件
const uploadForm = reactive({
  videoFile: null
})

// 表单验证规则，只验证视频文件
const uploadRules = {
  videoFile: [
    { required: true, message: '请上传视频文件', trigger: 'change' }
  ]
}

// 表单引用
const uploadFormRef = ref()

// 上传组件引用
const uploadRef = ref(null)

// 上传进度
const uploadProgress = ref(0)
const isUploading = ref(false)

// 处理视频上传
const handleVideoUpload = (file) => {
  uploadForm.videoFile = file.raw
  return false // 阻止自动上传
}

// 上传视频按钮点击事件
const handleUploadClick = () => {
  if (!uploadForm.videoFile) {
    // 没有选择文件，触发文件选择对话框
    if (uploadRef.value) {
      uploadRef.value.open()
    }
  } else {
    // 已经选择了文件，执行上传操作
    handleSubmit()
  }
}

// 提交上传
const handleSubmit = () => {
  uploadFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟上传进度
      isUploading.value = true
      uploadProgress.value = 0
      
      // 模拟上传速度变化
      const speeds = ['1.2 MB/s', '1.5 MB/s', '1.8 MB/s', '2.0 MB/s', '1.7 MB/s']
      let speedIndex = 0
      
      const interval = setInterval(() => {
        uploadProgress.value += 10
        uploadSpeed.value = speeds[speedIndex]
        speedIndex = (speedIndex + 1) % speeds.length
        
        if (uploadProgress.value >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            isUploading.value = false
            console.log('视频上传完成:', uploadForm)
            // 上传成功后进入发布页面
            uploadStatus.value = UploadStatus.PUBLISHING
          }, 500)
        }
      }, 300)
    } else {
      return false
    }
  })
}

// 上传状态枚举
const UploadStatus = {
  UPLOADING: 'uploading',
  PUBLISHING: 'publishing',
  COMPLETED: 'completed'
}

// 上传状态
const uploadStatus = ref(UploadStatus.UPLOADING)

// 上传速度
const uploadSpeed = ref('0 KB/s')

// 发布视频表单
const publishForm = reactive({
  coverFile: null,
  coverPreview: '',
  title: '',
  videoType: 'original', // original: 自制, repost: 转载
  category: '',
  tags: [],
  tagInput: '',
  description: '',
  collection: ''
})

// 分类列表
const categories = ref([
  { value: 1, label: '动画' },
  { value: 2, label: '音乐' },
  { value: 3, label: '舞蹈' },
  { value: 4, label: '游戏' },
  { value: 5, label: '知识' },
  { value: 6, label: '资讯' },
  { value: 7, label: '美食' },
  { value: 8, label: '生活' },
  { value: 9, label: '鬼畜' },
  { value: 10, label: '时尚' },
  { value: 11, label: '娱乐' },
  { value: 12, label: '影视' }
])

// 创作设置相关
const settingsLoading = ref(false)
const saveSettingsLoading = ref(false)
const settingsForm = reactive({
  defaultCategoryId: null,
  autoPublish: false,
  commentNotify: true,
  likeNotify: true,
  followNotify: true
})

const loadSettings = async () => {
  settingsLoading.value = true
  try {
    const res = await creatorApi.getSettings()
    if (res.code === 200 && res.data) {
      settingsForm.defaultCategoryId = res.data.defaultCategoryId || null
      settingsForm.autoPublish = res.data.autoPublish || false
      settingsForm.commentNotify = res.data.commentNotify !== false
      settingsForm.likeNotify = res.data.likeNotify !== false
      settingsForm.followNotify = res.data.followNotify !== false
    }
  } catch (error) {
    console.error('获取设置失败:', error)
  } finally {
    settingsLoading.value = false
  }
}

const saveSettings = async () => {
  saveSettingsLoading.value = true
  try {
    const res = await creatorApi.updateSettings({
      defaultCategoryId: settingsForm.defaultCategoryId,
      autoPublish: settingsForm.autoPublish,
      commentNotify: settingsForm.commentNotify,
      likeNotify: settingsForm.likeNotify,
      followNotify: settingsForm.followNotify
    })
    if (res.code === 200) {
      ElMessage.success('设置保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saveSettingsLoading.value = false
  }
}

// 合集列表
const collections = ref([
  { value: '', label: '不加入合集' },
  { value: 1, label: '我的合集1' },
  { value: 2, label: '我的合集2' },
  { value: 3, label: '我的合集3' }
])

// 处理封面上传
const handleCoverUpload = (file) => {
  publishForm.coverFile = file.raw
  // 生成封面预览
  const reader = new FileReader()
  reader.onload = (e) => {
    publishForm.coverPreview = e.target.result
  }
  reader.readAsDataURL(file.raw)
  return false // 阻止自动上传
}

// 添加标签
const addTag = () => {
  if (publishForm.tagInput.trim() && !publishForm.tags.includes(publishForm.tagInput.trim())) {
    publishForm.tags.push(publishForm.tagInput.trim())
    publishForm.tagInput = ''
  }
}

// 删除标签
const removeTag = (tag) => {
  const index = publishForm.tags.indexOf(tag)
  if (index > -1) {
    publishForm.tags.splice(index, 1)
  }
}

// 处理标签输入回车事件
const handleTagKeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  }
}

// 存草稿
const saveDraft = () => {
  console.log('保存草稿:', publishForm)
  ElMessage.success('草稿保存成功')
}

// 立即投稿
const submitPublish = () => {
  console.log('立即投稿:', publishForm)
  // 模拟投稿进度
  isUploading.value = true
  uploadProgress.value = 0
  
  const interval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        isUploading.value = false
        uploadStatus.value = UploadStatus.COMPLETED
        ElMessage.success('投稿成功！')
      }, 500)
    }
  }, 300)
}

// 添加分P
const addPart = () => {
  console.log('添加分P')
  ElMessage.info('添加分P功能待实现')
}

// 返回上传页面
const backToUpload = () => {
  // 重置上传状态
  uploadStatus.value = UploadStatus.UPLOADING
  uploadForm.videoFile = null
  uploadProgress.value = 0
  uploadSpeed.value = '0 KB/s'
  // 导航到上传页面
  router.push('/create-center/upload')
  // 滚动到顶部
  window.scrollTo(0, 0)
}

// 取消上传
const cancelUpload = () => {
  // 回到首页
  router.push('/create-center/home')
  // 滚动到顶部
  window.scrollTo(0, 0)
}

// 评论管理相关数据
const activeCommentMainTab = ref('visible')
const activeCommentSubTab = ref('video')
const commentTypeFilter = ref('all')
const videoFilter = ref('all')
const commentSearchText = ref('')
const commentSortBy = ref('latest')
const commentCurrentPage = ref(1)
const commentPageSize = ref(10)

const comments = ref([])
const commentLoading = ref(false)
const totalComments = ref(0)
const totalPages = ref(0)
const videoList = ref([])
const replyDialogVisible = ref(false)
const replyCommentId = ref(null)
const replyContent = ref('')
const replyToUserId = ref(null)

const fetchComments = async () => {
  commentLoading.value = true
  try {
    const params = {
      page: commentCurrentPage.value,
      size: commentPageSize.value,
      type: commentTypeFilter.value === 'all' ? undefined : commentTypeFilter.value,
      manuscriptId: videoFilter.value === 'all' ? undefined : videoFilter.value,
      keyword: commentSearchText.value || undefined,
      sortBy: commentSortBy.value
    }
    const res = await creatorApi.getComments(params)
    if (res.code === 200 && res.data) {
      comments.value = res.data.list.map(item => ({
        id: item.id,
        selected: false,
        username: item.user?.username || item.username || '未知用户',
        avatar: item.user?.avatar || item.avatar || '',
        content: item.content,
        time: item.createdAt || item.createTime,
        videoThumbnail: item.manuscript?.cover || item.videoThumbnail || '',
        videoTitle: item.manuscript?.title || item.videoTitle || '',
        likes: item.likes || 0,
        replies: item.replies || 0,
        userId: item.userId,
        manuscriptId: item.manuscriptId
      }))
      totalComments.value = res.data.total || 0
      totalPages.value = Math.ceil((res.data.total || 0) / commentPageSize.value)
    }
  } catch (error) {
    console.error('获取评论列表失败:', error)
  } finally {
    commentLoading.value = false
  }
}

const fetchVideoList = async () => {
  try {
    if (!currentUser.value?.id) return
    const res = await manuscriptApi.getUserManuscripts(currentUser.value.id, { page: 1, size: 100 })
    if (res.code === 200 && res.data) {
      videoList.value = res.data.list || []
    }
  } catch (error) {
    console.error('获取视频列表失败:', error)
  }
}

const handleDeleteComment = async (commentId) => {
  try {
    const res = await creatorApi.deleteComment(commentId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchComments()
    }
  } catch (error) {
    console.error('删除评论失败:', error)
  }
}

const openReplyDialog = (comment) => {
  replyCommentId.value = comment.id
  replyToUserId.value = comment.userId
  replyContent.value = ''
  replyDialogVisible.value = true
}

const handleReplyComment = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  try {
    const res = await creatorApi.replyComment(replyCommentId.value, replyContent.value, replyToUserId.value)
    if (res.code === 200) {
      ElMessage.success('回复成功')
      replyDialogVisible.value = false
      fetchComments()
    }
  } catch (error) {
    console.error('回复评论失败:', error)
  }
}

const handleSelectAll = (select) => {
  comments.value.forEach(comment => {
    comment.selected = select
  })
}

const handleBatchDelete = async () => {
  const selectedComments = comments.value.filter(c => c.selected)
  if (selectedComments.length === 0) {
    ElMessage.warning('请选择要删除的评论')
    return
  }
  try {
    await Promise.all(selectedComments.map(c => creatorApi.deleteComment(c.id)))
    ElMessage.success('批量删除成功')
    fetchComments()
  } catch (error) {
    console.error('批量删除失败:', error)
  }
}

watch([commentCurrentPage, commentTypeFilter, videoFilter, commentSortBy], () => {
  fetchComments()
})

watch(commentSearchText, () => {
  if (commentCurrentPage.value !== 1) {
    commentCurrentPage.value = 1
  } else {
    fetchComments()
  }
})

// 搜索评论
const searchComments = () => {
  fetchComments()
}

onMounted(() => {
  if (currentActive.value === 'interaction-comment') {
    fetchComments()
    fetchVideoList()
  }
  if (currentActive.value === 'content-articles') {
    fetchArticles()
    fetchManuscriptStats()
  }
  if (currentActive.value === 'fans') {
    initFansData()
  }
})

watch(currentActive, (newVal) => {
  if (newVal === 'fans') {
    initFansData()
  }
})

// 可见页码列表
const visiblePages = computed(() => {
  const pages = []
  const current = commentCurrentPage.value
  const total = totalPages.value
  
  // 总是显示第一页
  pages.push(1)
  
  // 如果当前页码大于3，显示省略号
  if (current > 3) {
    pages.push('...')
  }
  
  // 显示当前页码附近的页码
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  // 如果当前页码小于总页码-2，显示省略号
  if (current < total - 2) {
    pages.push('...')
  }
  
  // 如果总页码大于1，显示最后一页
  if (total > 1) {
    pages.push(total)
  }
  
  return pages
})

// 弹幕管理相关数据
const activeDanmuTab = ref('article') // article: 稿件弹幕, settings: 弹幕设置, feedback: 弹幕反馈
const danmuSearchText = ref('') // 搜索文本
const danmuTypeFilter = ref('all') // all: 全部弹幕, normal: 普通弹幕, subtitle: 字幕弹幕
const danmuTimeFilter = ref('latest') // latest: 最近弹幕, week: 本周弹幕, month: 本月弹幕
const danmuVideoFilter = ref('all') // all: 全部视频, 其他: 具体视频

// 弹幕设置相关数据
const danmuSendType = ref('all') // all: 允许发送所有类型的弹幕, specified: 允许发送指定类型的弹幕
const advancedDanmuRequest = ref('anyone') // anyone: 任何人, fans: 仅粉丝, fans3d: 仅关注3天以上粉丝, none: 禁止所有人
const keywordFilterText = ref('') // 关键词过滤输入框
const regexFilterText = ref('') // 正则表达式过滤输入框

// 弹幕反馈相关数据
const activeDanmuFeedbackTab = ref('report') // report: 弹幕举报, advanced: 高级请求, protection: 弹幕保护
const feedbackVideoFilter = ref('all') // all: 全部视频, 其他: 具体视频
const danmuFeedbackList = ref([
  { id: 1, content: '该', video: '在byrut下载过游戏的可能会中挖矿病毒', sender: '为梦绘色', sendTime: '2025-11-18 16:32:19' },
  { id: 2, content: '这不是很正常？很多正规软件也...', video: '在byrut下载过游戏的可能会中挖矿病毒', sender: '骨痂骨痂', sendTime: '2025-09-28 10:17:30' },
  { id: 3, content: '受着', video: '在byrut下载过游戏的可能会中挖矿病毒', sender: '爷的昵称值6个币', sendTime: '2025-09-19 10:50:24' },
  { id: 4, content: '这吐舌真难绷', video: '陈梦曾经在贴吧的帖子和评论', sender: '蒙古上单限定版', sendTime: '2025-05-20 23:52:37' },
  { id: 5, content: '这表情没绷住', video: '陈梦曾经在贴吧的帖子和评论', sender: 'AEFf_', sendTime: '2025-05-20 23:52:35' },
  { id: 6, content: 'byd吸嗨了', video: 'NB化学实验室卡bug不用VIP做VIP实验', sender: 'bili_114514881', sendTime: '2025-04-17 16:21:38' },
  { id: 7, content: '弹幕美术服', video: 'NB化学实验室卡bug不用VIP做VIP实验', sender: '失侍大王', sendTime: '2025-03-08 08:55:57' }
])

// 模拟弹幕数据
const danmus = ref([
  {
    id: 1,
    selected: false,
    sender: '浅忆Official',
    playTime: '03:43',
    content: '还不如删文件呢',
    likes: 0,
    type: '普通',
    sendTime: '2026-01-24 17:59:44',
    videoTitle: '在byrut下载游戏的可能会中挖矿病毒audiog.exe\taskhost.exe'
  },
  {
    id: 2,
    selected: false,
    sender: '無所見即我',
    playTime: '03:58',
    content: '360很容易啊，除了小白',
    likes: 0,
    type: '普通',
    sendTime: '2026-01-21 10:17:48',
    videoTitle: '在byrut下载游戏的可能会中挖矿病毒audiog.exe\taskhost.exe'
  },
  {
    id: 3,
    selected: false,
    sender: '夜月txllwhmc',
    playTime: '01:49',
    content: '这玩意儿还装着观赏吗',
    likes: 0,
    type: '普通',
    sendTime: '2026-01-10 03:15:34',
    videoTitle: '在byrut下载游戏的可能会中挖矿病毒audiog.exe\taskhost.exe'
  },
  {
    id: 4,
    selected: false,
    sender: '此人懒到不想取名字',
    playTime: '01:15',
    content: '另外下载的啥？',
    likes: 0,
    type: '普通',
    sendTime: '2026-01-09 16:20:59',
    videoTitle: 'proxypin 开源免费用的...'
  },
  {
    id: 5,
    selected: false,
    sender: '富春渔夫',
    playTime: '00:22',
    content: '好中二',
    likes: 0,
    type: '普通',
    sendTime: '2025-12-23 00:30:22',
    videoTitle: '符月华 贴吧 没有上某...'
  },
  {
    id: 6,
    selected: false,
    sender: '上紧固SFU',
    playTime: '01:32',
    content: '666',
    likes: 0,
    type: '普通',
    sendTime: '2025-12-19 17:33:50',
    videoTitle: '在byrut下载游戏的可能会中挖矿病毒audiog.exe\taskhost.exe'
  }
])

// 搜索弹幕
const searchDanmu = () => {
  // 实际项目中这里会调用API进行搜索
  console.log('搜索弹幕:', danmuSearchText.value)
}
</script>

<style scoped>
.create-center-container {
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏样式 */
.create-center-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.center-title-btn {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  line-height: 40px;
}

.center-title-btn:hover {
  background-color: rgba(24, 144, 255, 0.1);
  color: #409eff;
}

.main-site-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #fff;
  border: none;
  color: #606266;
}

.main-site-btn:hover {
  background-color: #f0f2f5;
  color: #1890ff;
  border: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  cursor: pointer;
}

.up-day-box {
  background-color: #f0f9ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  color: #1890ff;
  display: flex;
  align-items: center;
}

/* 主体内容区域样式 */
.create-center-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 200px;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-btn-large {
  width: 100%;
  height: 40px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #fb7299;
  border: none;
  color: #fff;
}

.upload-btn-large:hover {
  background-color: #f75982;
  color: #fff;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  font-size: 15px;
}

.sidebar-menu .el-menu-item.is-active {
  color: #1890ff;
  background-color: #ecf5ff;
}

/* 主内容区域样式 */
.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.content-header {
  margin-bottom: 20px;
}

.content-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.content-body {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.loading-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.developing-tip {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
}

/* 仪表盘统计卡片样式 */
.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 评论/弹幕选择栏样式 */
.comment-danmu-section {
  margin-top: 30px;
  padding: 0;
  background-color: transparent;
  box-shadow: none;
}

/* 排行选择栏样式 */
.ranking-section {
  margin-top: 30px;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.section-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.tab-buttons {
  display: flex;
  gap: 10px;
}

/* 互动列表样式 - 垂直布局 */
.interaction-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.interaction-item {
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.interaction-item:hover {
  background-color: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 互动列表样式 - 水平布局 */
.interaction-list-horizontal {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.interaction-item-horizontal {
  flex: 1;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  transition: all 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.interaction-item-horizontal:hover {
  background-color: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.username {
  font-weight: 500;
  color: #303133;
}

/* 内容样式 */
.interaction-content {
  color: #606266;
  margin-bottom: auto;
  line-height: 1.5;
  flex: 1;
}

/* 时间样式 */
.interaction-time {
  font-size: 12px;
  color: #909399;
  text-align: right;
  margin-top: 8px;
}

/* 评论弹幕按钮样式 */
.tab-buttons .el-button {
  border: none;
  box-shadow: none;
}

.tab-buttons .el-button--primary:not(.is-plain) {
  background-color: #1890ff;
  border-color: transparent;
}

.tab-buttons .el-button--primary.is-plain {
  background-color: transparent;
  border-color: transparent;
  color: #1890ff;
}

/* 排行列表样式 */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background-color: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.ranking-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.ranking-count {
  margin-left: auto;
  font-weight: 600;
  color: #f77825;
}

/* 排行列表样式 - 水平布局 */
.ranking-list-horizontal {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-top: 10px;
}

.ranking-item-horizontal {
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 120px;
}

.ranking-item-horizontal:hover {
  background-color: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 水平排行项中的排名索引 */
.ranking-item-horizontal .ranking-index {
  margin-bottom: 10px;
}

/* 水平排行项中的用户信息 */
.ranking-item-horizontal .user-info {
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

/* 水平排行项中的用户名称 */
.ranking-item-horizontal .username {
  font-size: 14px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 排名样式 - 金色（第一名） */
.ranking-gold {
  border-color: #f7c13b;
  color: #f7c13b;
}

.ranking-gold + .username {
  color: #f7c13b;
  font-weight: bold;
}

/* 排名样式 - 银色（第二名） */
.ranking-silver {
  border-color: #c0c4cc;
  color: #c0c4cc;
}

.ranking-silver + .username {
  color: #c0c4cc;
  font-weight: bold;
}

/* 排名样式 - 铜色（第三名） */
.ranking-bronze {
  border-color: #e8a055;
  color: #e8a055;
}

.ranking-bronze + .username {
  color: #e8a055;
  font-weight: bold;
}

/* 头像边框样式 */
.el-avatar.ranking-gold {
  border: 2px solid #f7c13b;
  box-shadow: 0 0 8px rgba(247, 193, 59, 0.4);
}

.el-avatar.ranking-silver {
  border: 2px solid #c0c4cc;
  box-shadow: 0 0 8px rgba(192, 196, 204, 0.4);
}

.el-avatar.ranking-bronze {
  border: 2px solid #e8a055;
  box-shadow: 0 0 8px rgba(232, 160, 85, 0.4);
}

/* 水平排行项中的计数 */
.ranking-item-horizontal .ranking-count {
  margin: auto 0 0 0;
}

/* 评论管理样式 */
.comment-management {
  width: 100%;
}

/* 主标签页样式 */
.main-tabs {
  margin-bottom: 20px;
}

.main-tabs .el-radio-group {
  font-size: 16px;
}

/* 主标签页和搜索框组合样式 */
.main-tabs-with-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 主搜索框样式 */
.main-search {
  display: flex;
  align-items: center;
}

/* 评论过滤栏样式 */
.comment-filter-bar {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 15px;
}

.left-section {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* 子标签页样式 */
.sub-tabs {
  margin-right: 20px;
}

/* 筛选下拉框样式 */
.filter-dropdowns {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 视频评论蓝色字样样式 */
.video-comment-label {
  color: #1890ff;
  font-weight: 500;
  font-size: 14px;
}

/* 评论操作栏样式 */
.comment-actions {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

/* 操作按钮组样式 */
.action-buttons {
  display: flex;
  align-items: center;
  gap: 5px; /* 紧凑排布 */
}

.action-buttons .el-button {
  margin-right: 0; /* 移除默认右边距，使用gap控制间距 */
}

/* 排序选项样式 */
.sort-options {
  display: flex;
  align-items: center;
  margin-left: auto; /* 靠右对齐 */
}

/* 评论列表样式 */
.comment-list {
  margin-bottom: 20px;
}

/* 评论项样式 */
.comment-item {
  display: flex;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  gap: 15px;
}

.comment-item:hover .comment-actions-hover {
  display: flex;
}

/* 复选框样式 */
.comment-checkbox {
  margin-top: 5px;
  flex-shrink: 0;
}

/* 评论主体样式 */
.comment-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: flex-start;
}

/* 头像和用户名样式 */
.comment-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 5px;
}

.comment-header .el-avatar {
  margin-right: 10px;
  flex-shrink: 0;
}

/* 用户名样式 */
.username {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  line-height: 40px;
}

/* 评论内容样式 */
.comment-content {
  line-height: 1.5;
  color: #303133;
  font-size: 14px;
  margin-left: 50px;
  margin-top: 0;
  margin-bottom: 0;
}

/* 评论元信息样式 */
.comment-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 5px;
  margin-left: 50px;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-meta .el-button {
  min-width: auto;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
  font-size: 12px;
}

/* 举报和删除按钮样式（鼠标悬停显示） */
.comment-actions-hover {
  display: none;
  align-items: center;
  gap: 5px;
  margin-left: 15px;
}

.comment-actions-hover .el-button {
  min-width: auto;
  padding: 0 8px;
  height: 24px;
  line-height: 24px;
  font-size: 12px;
}

.comment-right {
  margin-left: 20px;
  align-self: flex-start;
}

/* 视频缩略图样式 */
.video-thumbnail {
  width: 120px;
  text-align: center;
  margin-top: 0;
}

.video-thumbnail img {
  width: 100%;
  height: 68px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}

.video-title {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 弹幕管理样式 */
.danmu-management {
  width: 100%;
}

/* 弹幕标签页和搜索组合样式 */
.danmu-tabs-with-search {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 弹幕标签页样式 */
.danmu-tabs {
  flex: 1;
}

/* 弹幕搜索样式 */
.danmu-search {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

/* 弹幕头部样式（操作栏和筛选条件） */
.danmu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 15px;
}

/* 弹幕筛选条件样式 */
.danmu-filters {
  display: flex;
  align-items: center;
  margin-left: auto;
}

/* 弹幕操作按钮样式 */
.danmu-actions {
  display: flex;
}

/* 弹幕设置样式 */
.danmu-settings {
  width: 100%;
}

/* 设置区块样式 */
.setting-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

/* 区块标题样式 */
.setting-section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
  display: block;
}

/* 单选按钮组样式 */
.radio-group {
  margin-top: 10px;
}

/* 过滤输入框组样式 */
.filter-input-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

/* 设置描述样式 */
.setting-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

/* 弹幕反馈样式 */
.danmu-feedback {
  width: 100%;
}

/* 弹幕反馈子标签样式 */
.danmu-feedback-tabs {
  margin-bottom: 20px;
}

/* 弹幕反馈操作栏样式 */
.danmu-feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 15px;
}

/* 反馈操作按钮样式 */
.feedback-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 反馈筛选样式 */
.feedback-filter {
  display: flex;
  align-items: center;
}

/* 弹幕反馈列表样式 */
.danmu-feedback-list {
  margin-bottom: 20px;
}

/* 弹幕列表显示上限提示样式 */
.danmu-list-limit {
  text-align: right;
  color: #909399;
  font-size: 12px;
  margin-top: 10px;
}

/* 文本样式 - 危险色 */
.text-danger {
  color: #f56c6c;
}

.danmu-actions .el-button {
  min-width: auto;
  padding: 0 8px;
  height: 28px;
  line-height: 28px;
  font-size: 12px;
}

/* 弹幕列表样式 */
.danmu-list {
  margin-top: 20px;
}

/* 弹幕列表中的视频信息样式 */
.danmu-video-info {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 表格样式调整 */
.danmu-list .el-table {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.danmu-list .el-table__header-wrapper th {
  background-color: #f5f7fa;
  font-weight: 500;
  color: #303133;
}

.danmu-list .el-table__body-wrapper td {
  padding: 12px 0;
}

/* 评论分页样式 */
.comment-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.comment-total {
  font-size: 12px;
  color: #909399;
}

.pagination-control {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 自定义分页样式 */
.custom-pagination {
  display: flex;
  align-items: center;
  gap: 5px;
}

.custom-pagination .el-button {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-pagination .el-button--primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.custom-pagination .el-button--primary.is-plain {
  background-color: #fff;
  border-color: #d9d9d9;
  color: #1890ff;
}

/* 省略号样式 */
.custom-pagination .ellipsis {
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

/* 分页信息样式 */
.pagination-info {
  margin-left: 15px;
  font-size: 14px;
  color: #606266;
}

/* 稿件管理页面样式 */
/* 主要选择栏 */
.content-tabs {
  margin-bottom: 15px;
}

/* 视频管理选择栏 */
.video-filters {
  margin-bottom: 20px;
}

/* 过滤行样式 */
.filter-row {
  margin-bottom: 10px;
}

/* 过滤行之间的间距 */
.filter-row:not(:last-child) {
  margin-bottom: 15px;
}

/* 单个过滤组样式 */
.filter-row .el-radio-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 隐藏次级选择栏和状态选择栏 */
.sub-tabs,
.status-tabs {
  display: none;
}

/* 视频稿件列表 */
.article-list {
  margin-bottom: 20px;
}

/* 表格样式调整 */
.article-list .el-table {
  border-radius: 6px;
  overflow: hidden;
}

/* 分页导航栏 */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #e0e0e0;
}

/* 合集管理样式 */
.collection-management {
  margin-top: 20px;
}

/* 面包屑导航 */
.collection-breadcrumb {
  margin-bottom: 20px;
}

/* 合集表单容器 */
.collection-form-container {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 表单标题 */
.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

/* 合集表单 */
.collection-form {
  max-width: 100%;
}

/* 封面上传区域 */
.cover-upload-section {
  width: 100%;
  height: 100%;
}

/* 封面预览 */
.cover-preview {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cover-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

/* 封面占位符 */
.cover-placeholder {
  width: 100%;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cover-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  justify-content: flex-start;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .collection-form .el-row {
    flex-direction: column;
  }
  
  .collection-form .el-col {
    width: 100% !important;
    margin-bottom: 15px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 10px;
  }
}

/* 数据中心样式 */
/* 标签页样式 */
.data-center-tabs {
  margin-bottom: 20px;
}

/* 数据概览区域 */
.data-overview {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

/* 概览头部 */
.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overview-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.overview-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.time-select {
  width: 120px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 核心数据卡片 */
.core-data {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.data-card {
  background-color: #fafafa;
  padding: 15px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.data-card:hover {
  background-color: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 播放量卡片特殊样式 */
.data-card.play-count {
  background-color: #ff5050;
  color: #fff;
}

.data-card.play-count:hover {
  background-color: #ff7875;
}

.data-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.data-card.play-count .data-title {
  color: rgba(255, 255, 255, 0.8);
}

.data-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.data-card.play-count .data-value {
  color: #fff;
}

.data-change {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.increase {
  color: #67c23a;
}

.decrease {
  color: #f56c6c;
}

.data-card.play-count .increase,
.data-card.play-count .decrease {
  color: rgba(255, 255, 255, 0.9);
}

/* 播放量趋势图 */
.play-trend-chart {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 6px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 模拟图表样式 */
.mock-chart {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 图表图例 */
.chart-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  justify-content: flex-end;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.total {
  background-color: #ff5050;
}

.legend-color.fans {
  background-color: #409eff;
}

/* 图表内容 */
.chart-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 网格线 */
.chart-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, transparent 0%, transparent 95%, #e0e0e0 95%, #e0e0e0 100%);
  background-size: 100% 20%;
}

/* 折线 */
.chart-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-top: 2px solid transparent;
  border-right: 2px solid transparent;
}

/* 总播放量折线 */
.total-line {
  border-color: transparent transparent transparent #ff5050;
  border-radius: 50% 0 0 50%;
  transform: scaleY(0.65);
  transform-origin: bottom left;
}

/* 粉丝播放量折线 */
.fans-line {
  border-color: transparent transparent transparent #409eff;
  border-radius: 50% 0 0 50%;
  transform: scaleY(0.4);
  transform-origin: bottom left;
  opacity: 0.6;
}

/* 坐标轴 */
.chart-axis {
  position: absolute;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

/* X轴 */
.x-axis {
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0 10px;
  box-sizing: border-box;
}

/* Y轴 */
.y-axis {
  top: 0;
  left: 0;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 10px;
  box-sizing: border-box;
  text-align: right;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .overview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .core-data {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .data-value {
    font-size: 20px;
  }
  
  .chart-container {
    height: 250px;
  }
}

/* 内容区域通用样式 */
.content-section {
  height: 100%;
}

/* 投稿表单样式 */
.upload-form {
  max-width: 800px;
  margin: 30px auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 提示框样式 */
.upload-tips {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 800px;
}

.tip-box {
  flex: 1;
  min-width: 250px;
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tip-title {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  margin: 0 0 8px 0;
}

.tip-content {
  font-size: 14px;
  color: #606266;
  margin: 0;
  line-height: 1.5;
}

/* 移除el-form-item__content的内边距 */
.no-content-padding .el-form-item__content {
  padding: 0;
  margin: 0;
}

/* 全屏上传区域样式 */
.full-width-upload {
  width: 100%;
  max-width: 600px;
}

/* 让el-upload-dragger填满两边白边 */
.full-width-upload .el-upload-dragger {
  width: 100%;
  height: 100%;
  margin-bottom: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.full-width-upload .el-upload-dragger:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

/* 表单按钮样式 */
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  width: 100%;
}

.form-actions .el-button--primary {
  background-color: #1890ff;
  border-color: #1890ff;
  font-size: 16px;
  padding: 12px 24px;
  height: auto;
}

.form-actions .el-button--primary:hover {
  background-color: #409eff;
  border-color: #409eff;
}

/* 上传进度和速度显示 */
.upload-progress-bar {
  margin-bottom: 20px;
}

.upload-speed {
  margin-top: 10px;
  text-align: right;
  font-size: 14px;
  color: #606266;
}

/* 添加分P按钮 */
.add-part-btn {
  margin-bottom: 30px;
}

/* 发布视频表单样式 */
.publish-form {
  max-width: 800px;
  margin: 0 auto;
}

/* 封面上传样式 */
.cover-upload-section {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.cover-uploader {
  width: 320px;
  height: 180px;
}

.cover-preview {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cover-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}

.cover-tip {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #909399;
  font-size: 14px;
}

/* 标签输入样式 */
.tag-input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

/* 发布按钮样式 */
.publish-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  justify-content: flex-end;
}

/* 上传完成页面样式 */
.upload-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

/* 发布表单项样式 */
.publish-form .el-form-item {
  margin-bottom: 20px;
}

/* 粉丝管理样式 */
.fans-container {
  padding: 20px;
}

.fans-header {
  margin-bottom: 15px;
}

.fans-header h3 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.fans-count-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.fans-count {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.fans-filter {
  display: flex;
  align-items: center;
}

.fans-list {
  margin-bottom: 20px;
}

.fan-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.fan-item:last-child {
  border-bottom: none;
}

.fan-info {
  display: flex;
  align-items: center;
}

.fan-info .el-avatar {
  margin-right: 12px;
}

/* 创作设置样式 */
.settings-container {
  padding: 20px;
}

.settings-header {
  margin-bottom: 20px;
}

.settings-header h3 {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.settings-form {
  max-width: 600px;
}

.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.fan-username {
  font-size: 14px;
  color: #333;
}

.fan-actions {
  display: flex;
  gap: 8px;
}

.fans-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.publish-form .el-form-item__label {
  font-weight: 600;
}

/* 申诉管理样式 */
.appeal-tabs {
  margin-bottom: 20px;
  padding: 0 20px;
}

.appeal-radio-group {
  display: flex;
  gap: 10px;
}

.appeal-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 0 20px;
}

.appeal-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.appeal-card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.appeal-title {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.appeal-status {
  font-size: 14px;
  color: #606266;
}

.appeal-cover {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  align-self: flex-end;
}

.appeal-card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.appeal-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  flex: 1;
}

.info-item {
  line-height: 1.5;
}

.appeal-actions {
  display: flex;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .appeal-list {
    grid-template-columns: 1fr;
  }
}

/* 账号诊断样式 */
.account-diagnosis {
  padding: 20px;
}

/* 稿件分析样式 */
.article-analysis {
  padding: 20px;
}

/* 视频信息卡片 */
.video-info-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.video-thumbnail {
  position: relative;
  width: 180px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.video-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.5;
}

.video-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.video-date {
  font-size: 14px;
  color: #909399;
}

.video-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.switch-video {
  font-size: 14px;
  color: #1890ff;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
}

.switch-video:hover {
  text-decoration: underline;
}

.compare-btn {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

.compare-btn:hover {
  background-color: #ff7875;
  border-color: #ff7875;
}

/* 数据标签页 */
.data-tabs {
  margin-bottom: 20px;
}

.data-tab-btn {
  font-size: 14px;
  padding: 8px 16px;
}

.data-tab-btn.active {
  background-color: #1890ff;
  color: #fff;
}

/* 核心大屏数据 */
.core-big-screen {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
}

.screen-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-data {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 14px;
  color: #1890ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.export-data:hover {
  text-decoration: underline;
}

.big-screen-data {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-row {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.data-card {
  flex: 1;
  min-width: 120px;
  background-color: #fff;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.data-card.highlight {
  background-color: #ff4d4f;
  color: #fff;
}

.data-label {
  font-size: 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.data-value {
  font-size: 24px;
  font-weight: 600;
}

/* 播放量趋势 */
.play-trend-section {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.trend-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-update {
  font-size: 14px;
  color: #909399;
}

.time-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}

/* 播放趋势图 */
.trend-chart-container {
  height: 300px;
  background-color: #fff;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.play-trend-chart {
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.chart-axes {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.chart-y-axis {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 10px;
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.chart-x-axis {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  font-size: 12px;
  color: #909399;
}

.chart-line-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.chart-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, #ff4d4f, #ff4d4f);
  background-size: 100% 100%;
  background-position: 0 100%;
  background-repeat: no-repeat;
  clip-path: polygon(0% 85%, 20% 85%, 30% 80%, 40% 30%, 50% 60%, 60% 65%, 70% 63%, 80% 65%, 90% 62%, 100% 63%, 100% 100%, 0% 100%);
  mask-image: linear-gradient(to right, rgba(0, 0, 0, 1), rgba(0, 0, 0, 1));
}

.chart-area {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(255, 77, 79, 0.1), rgba(255, 77, 79, 0.3));
  clip-path: polygon(0% 85%, 20% 85%, 30% 80%, 40% 30%, 50% 60%, 60% 65%, 70% 63%, 80% 65%, 90% 62%, 100% 63%, 100% 100%, 0% 100%);
}

/* 粉丝分析样式 */
.fans-analysis {
  padding: 20px;
}

/* 数据概览 */
.fans-overview {
  margin-bottom: 30px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.overview-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview-update {
  font-size: 14px;
  color: #909399;
}

/* 粉丝数据卡片网格 */
.fans-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-card.highlight {
  background-color: #ff4d4f;
  color: #fff;
  overflow: hidden;
}

.stat-title {
  font-size: 14px;
  margin-bottom: 8px;
  color: #606266;
}

.stat-card.highlight .stat-title {
  color: rgba(255, 255, 255, 0.9);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-card.highlight .stat-value {
  color: #fff;
}

.stat-icon {
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 80px;
  opacity: 0.2;
  color: #fff;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  margin-top: 8px;
}

.stat-change.negative {
  color: #f56c6c;
}

/* 粉丝趋势 */
.fans-trend-section {
  margin-bottom: 30px;
  background-color: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.trend-actions {
  display: flex;
  gap: 10px;
}

.export-data-btn {
  color: #1890ff;
}

.export-data-btn:hover {
  color: #409eff;
}

/* 粉丝趋势图 */
.fans-trend-chart {
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.fans-trend-chart .chart-line {
  clip-path: polygon(0% 60%, 10% 60%, 20% 60%, 30% 60%, 40% 60%, 50% 60%, 60% 60%, 70% 60%, 80% 60%, 90% 60%, 100% 60%, 100% 100%, 0% 100%);
  background-color: #ff4d4f;
  background-image: none;
  height: 40%;
  bottom: 40%;
}

.chart-dot {
  position: absolute;
  bottom: 40%;
  left: 30%;
  width: 12px;
  height: 12px;
  background-color: #ff4d4f;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px #ff4d4f;
}

/* 粉丝排行 */
.fans-ranking-section {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}

.ranking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.ranking-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.ranking-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-icon {
  font-size: 18px;
  color: #1890ff;
}

.ranking-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ranking-index {
  width: 20px;
  font-size: 14px;
  color: #909399;
  text-align: center;
}

.ranking-username {
  font-size: 14px;
  color: #303133;
}

.ranking-list.empty {
  justify-content: center;
  align-items: center;
  height: 120px;
  color: #909399;
  font-size: 14px;
}

.view-all-ranking {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 表现总结 */
.diagnosis-summary {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  font-size: 16px;
  color: #909399;
  cursor: help;
}

.summary-tip {
  background-color: #fef0f0;
  border: 1px solid #fbc4ab;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
}

.tip-icon {
  font-size: 16px;
}

/* 诊断内容：雷达图和指标分析 */
.diagnosis-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

/* 雷达图 */
.radar-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

.radar-chart {
  width: 300px;
  height: 300px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-axes {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-axis {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-axis:nth-child(1) { transform: rotate(45deg); }
.radar-axis:nth-child(2) { transform: rotate(135deg); }
.radar-axis:nth-child(3) { transform: rotate(225deg); }
.radar-axis:nth-child(4) { transform: rotate(315deg); }

.axis-label {
  position: absolute;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.radar-axis:nth-child(1) .axis-label { top: 10px; }
.radar-axis:nth-child(2) .axis-label { right: 10px; }
.radar-axis:nth-child(3) .axis-label { bottom: 10px; }
.radar-axis:nth-child(4) .axis-label { left: 10px; }

.radar-shape {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-base {
  width: 200px;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  position: relative;
}

.radar-base::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #d9d9d9;
  transform: translateY(-50%);
}

.radar-base::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background-color: #d9d9d9;
  transform: translateX(-50%);
}

.radar-data {
  position: absolute;
  width: 200px;
  height: 200px;
  background-color: rgba(255, 77, 79, 0.2);
  clip-path: polygon(50% 20%, 80% 50%, 50% 80%, 20% 50%);
  border: 2px solid #ff4d4f;
}

.radar-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.my-data {
  background-color: #ff4d4f;
}

.legend-dot.peer-data {
  background-color: #d9d9d9;
}

/* 指标分析 */
.metrics-analysis {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.metric-icon {
  font-size: 16px;
}

.metric-item:nth-child(1) .metric-icon,
.metric-item:nth-child(3) .metric-icon,
.metric-item:nth-child(4) .metric-icon {
  color: #f56c6c;
}

.metric-item:nth-child(2) .metric-icon {
  color: #67c23a;
}

.metric-link {
  color: #1890ff;
  text-decoration: none;
  margin-left: auto;
}

.metric-link:hover {
  text-decoration: underline;
}

/* 播放分布 */
.play-distribution {
  margin-top: 40px;
}

.distribution-tip {
  background-color: #fef0f0;
  border: 1px solid #fbc4ab;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.highlight {
  color: #1890ff;
  font-weight: 500;
}

/* 分布内容 */
.distribution-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

/* 人群分布和观看途径 */
.audience-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.stat-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-period {
  font-size: 14px;
  font-weight: 400;
  color: #909399;
}

.stat-sort {
  font-size: 14px;
  font-weight: 400;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

/* 进度条样式 */
.progress-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: space-between;
}

/* 来源稿件占比 */
.source-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.source-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.source-title {
  font-size: 14px;
  color: #606266;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
}

.source-percent {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  min-width: 50px;
  text-align: right;
}

/* 合集下拉框样式 */
.publish-form .el-select {
  width: 100%;
}

/* 申诉管理样式 */


</style>
