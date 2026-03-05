# 仿Bilibili项目 - 数据库设计与API接口文档

## 一、数据库设计

### 1. 数据库概述
- **数据库名称**: bilibili
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **引擎**: InnoDB

### 2. 表结构设计

#### 2.1 用户表 (`users`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 用户ID |
| `username` | `VARCHAR(50)` | `UNIQUE NOT NULL` | 用户名 |
| `password` | `VARCHAR(255)` | `NOT NULL` | 密码（加密存储） |
| `nickname` | `VARCHAR(50)` | `NOT NULL` | 昵称 |
| `avatar` | `VARCHAR(255)` | | 头像URL |
| `email` | `VARCHAR(100)` | `UNIQUE` | 邮箱 |
| `phone` | `VARCHAR(20)` | `UNIQUE` | 手机号 |
| `gender` | `TINYINT` | `DEFAULT 0` | 性别(0:未知,1:男,2:女) |
| `birthdate` | `DATE` | | 出生日期 |
| `signature` | `VARCHAR(255)` | | 个人签名 |
| `level` | `INT` | `DEFAULT 1` | 用户等级 |
| `following_count` | `INT` | `DEFAULT 0` | 关注数 |
| `follower_count` | `INT` | `DEFAULT 0` | 粉丝数 |
| `video_count` | `INT` | `DEFAULT 0` | 视频数 |
| `liked_count` | `INT` | `DEFAULT 0` | 获赞数 |
| `coin_count` | `INT` | `DEFAULT 0` | 硬币数 |
| `point_count` | `INT` | `DEFAULT 0` | 积分 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

#### 2.2 分类表 (`categories`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 分类ID |
| `name` | `VARCHAR(50)` | `UNIQUE NOT NULL` | 分类名称 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

#### 2.3 视频表 (`videos`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 视频ID |
| `title` | `VARCHAR(100)` | `NOT NULL` | 视频标题 |
| `description` | `TEXT` | | 视频描述 |
| `cover_url` | `VARCHAR(255)` | `NOT NULL` | 封面URL |
| `play_url` | `VARCHAR(255)` | `NOT NULL` | 播放URL |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 上传用户ID |
| `category_id` | `INT` | `NOT NULL REFERENCES categories(id)` | 分类ID |
| `view_count` | `INT` | `DEFAULT 0` | 观看数 |
| `like_count` | `INT` | `DEFAULT 0` | 点赞数 |
| `coin_count` | `INT` | `DEFAULT 0` | 投币数 |
| `collect_count` | `INT` | `DEFAULT 0` | 收藏数 |
| `share_count` | `INT` | `DEFAULT 0` | 分享数 |
| `comment_count` | `INT` | `DEFAULT 0` | 评论数 |
| `danmaku_count` | `INT` | `DEFAULT 0` | 弹幕数 |
| `duration` | `VARCHAR(20)` | `NOT NULL` | 视频时长 |
| `upload_time` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 上传时间 |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

#### 2.4 标签表 (`tags`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 标签ID |
| `name` | `VARCHAR(30)` | `UNIQUE NOT NULL` | 标签名称 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

#### 2.5 视频标签关联表 (`video_tags`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 关联ID |
| `video_id` | `INT` | `NOT NULL REFERENCES videos(id)` | 视频ID |
| `tag_id` | `INT` | `NOT NULL REFERENCES tags(id)` | 标签ID |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `UNIQUE KEY` | | `(video_id, tag_id)` | 确保不重复标签 |

#### 2.6 评论表 (`comments`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 评论ID |
| `video_id` | `INT` | `NOT NULL REFERENCES videos(id)` | 视频ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `content` | `TEXT` | `NOT NULL` | 评论内容 |
| `like_count` | `INT` | `DEFAULT 0` | 点赞数 |
| `reply_count` | `INT` | `DEFAULT 0` | 回复数 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

#### 2.7 回复表 (`replies`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 回复ID |
| `comment_id` | `INT` | `NOT NULL REFERENCES comments(id)` | 评论ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `content` | `TEXT` | `NOT NULL` | 回复内容 |
| `like_count` | `INT` | `DEFAULT 0` | 点赞数 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | 更新时间 |

#### 2.8 关注表 (`follows`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 关注ID |
| `follower_id` | `INT` | `NOT NULL REFERENCES users(id)` | 关注者ID |
| `followed_id` | `INT` | `NOT NULL REFERENCES users(id)` | 被关注者ID |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `UNIQUE KEY` | | `(follower_id, followed_id)` | 确保不重复关注 |

#### 2.9 点赞表 (`likes`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 点赞ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `video_id` | `INT` | `NOT NULL REFERENCES videos(id)` | 视频ID |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `UNIQUE KEY` | | `(user_id, video_id)` | 确保不重复点赞 |

#### 2.10 投币表 (`coins`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 投币ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `video_id` | `INT` | `NOT NULL REFERENCES videos(id)` | 视频ID |
| `coin_count` | `INT` | `NOT NULL DEFAULT 1` | 投币数量 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `UNIQUE KEY` | | `(user_id, video_id)` | 确保不重复投币 |

#### 2.11 收藏表 (`collections`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 收藏ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `video_id` | `INT` | `NOT NULL REFERENCES videos(id)` | 视频ID |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |
| `UNIQUE KEY` | | `(user_id, video_id)` | 确保不重复收藏 |

#### 2.12 观看历史表 (`watch_history`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 历史ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `video_id` | `INT` | `NOT NULL REFERENCES videos(id)` | 视频ID |
| `watch_time` | `VARCHAR(20)` | | 观看时长 |
| `last_watch_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 最后观看时间 |

#### 2.13 搜索历史表 (`search_history`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 历史ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `keyword` | `VARCHAR(100)` | `NOT NULL` | 搜索关键词 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

#### 2.14 弹幕表 (`danmakus`)
| 字段名 | 数据类型 | 约束 | 描述 |
| --- | --- | --- | --- |
| `id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | 弹幕ID |
| `video_id` | `INT` | `NOT NULL REFERENCES videos(id)` | 视频ID |
| `user_id` | `INT` | `NOT NULL REFERENCES users(id)` | 用户ID |
| `content` | `VARCHAR(200)` | `NOT NULL` | 弹幕内容 |
| `time` | `VARCHAR(20)` | `NOT NULL` | 弹幕出现时间 |
| `color` | `VARCHAR(20)` | `DEFAULT '#ffffff'` | 弹幕颜色 |
| `mode` | `TINYINT` | `DEFAULT 1` | 弹幕模式 |
| `created_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | 创建时间 |

### 3. 索引设计

| 索引名称 | 表名 | 字段 | 类型 | 描述 |
| --- | --- | --- | --- | --- |
| `idx_videos_user_id` | `videos` | `user_id` | 普通索引 | 加速用户视频查询 |
| `idx_videos_category_id` | `videos` | `category_id` | 普通索引 | 加速分类视频查询 |
| `idx_videos_upload_time` | `videos` | `upload_time` | 普通索引 | 加速时间排序查询 |
| `idx_comments_video_id` | `comments` | `video_id` | 普通索引 | 加速视频评论查询 |
| `idx_replies_comment_id` | `replies` | `comment_id` | 普通索引 | 加速评论回复查询 |
| `idx_follows_follower_id` | `follows` | `follower_id` | 普通索引 | 加速关注列表查询 |
| `idx_follows_followed_id` | `follows` | `followed_id` | 普通索引 | 加速粉丝列表查询 |
| `idx_likes_video_id` | `likes` | `video_id` | 普通索引 | 加速视频点赞查询 |
| `idx_coins_video_id` | `coins` | `video_id` | 普通索引 | 加速视频投币查询 |
| `idx_collections_video_id` | `collections` | `video_id` | 普通索引 | 加速视频收藏查询 |
| `idx_watch_history_user_id` | `watch_history` | `user_id` | 普通索引 | 加速用户观看历史查询 |
| `idx_search_history_user_id` | `search_history` | `user_id` | 普通索引 | 加速用户搜索历史查询 |
| `idx_danmakus_video_id` | `danmakus` | `video_id` | 普通索引 | 加速视频弹幕查询 |
| `idx_danmakus_time` | `danmakus` | `time` | 普通索引 | 加速弹幕时间排序 |

## 二、API接口设计

### 1. 接口基础信息
- **基础URL**: `http://localhost:7071/web`
- **请求方式**: RESTful API
- **认证方式**: JWT Token
- **响应格式**: JSON

### 2. 用户相关接口

#### 2.1 注册
- **URL**: `/user/register`
- **方法**: `POST`
- **参数**:
  - `username`: 用户名 (必填)
  - `password`: 密码 (必填)
  - `nickname`: 昵称 (选填)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "注册成功",
    "data": {
      "user": {
        "id": 1,
        "username": "testuser",
        "nickname": "测试用户",
        "avatar": "默认头像URL",
        "level": 1
      }
    }
  }
  ```

#### 2.2 登录
- **URL**: `/user/login`
- **方法**: `POST`
- **参数**:
  - `username`: 用户名 (必填)
  - `password`: 密码 (必填)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "登录成功",
    "data": {
      "user": {
        "id": 1,
        "username": "testuser",
        "nickname": "测试用户",
        "avatar": "头像URL",
        "level": 5,
        "followingCount": 120,
        "followerCount": 85,
        "videoCount": 15
      },
      "token": "JWT令牌",
      "refreshToken": "刷新令牌"
    }
  }
  ```

#### 2.3 获取用户信息
- **URL**: `/user/{id}`
- **方法**: `GET`
- **参数**: 路径参数 `id` (用户ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "id": 1,
      "username": "testuser",
      "nickname": "测试用户",
      "avatar": "头像URL",
      "email": "test@example.com",
      "phone": "13800138000",
      "gender": 1,
      "birthdate": "2000-01-01",
      "signature": "个人签名",
      "level": 5,
      "followingCount": 120,
      "followerCount": 85,
      "videoCount": 15,
      "likedCount": 320,
      "coinCount": 150,
      "pointCount": 5000
    }
  }
  ```

#### 2.4 更新用户信息
- **URL**: `/user/{id}`
- **方法**: `PUT`
- **参数**:
  - 路径参数 `id` (用户ID)
  - `nickname`: 昵称 (选填)
  - `avatar`: 头像URL (选填)
  - `email`: 邮箱 (选填)
  - `phone`: 手机号 (选填)
  - `gender`: 性别 (选填)
  - `birthdate`: 出生日期 (选填)
  - `signature`: 个人签名 (选填)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "更新成功",
    "data": {
      "id": 1,
      "username": "testuser",
      "nickname": "新昵称",
      "avatar": "新头像URL",
      "email": "newemail@example.com",
      "phone": "13900139000",
      "gender": 1,
      "birthdate": "2000-01-01",
      "signature": "新个人签名",
      "level": 5,
      "followingCount": 120,
      "followerCount": 85,
      "videoCount": 15,
      "likedCount": 320,
      "coinCount": 150,
      "pointCount": 5000
    }
  }
  ```

### 3. 视频相关接口

#### 3.1 获取推荐视频
- **URL**: `/video/recommended`
- **方法**: `GET`
- **参数**:
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认20)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "videos": [
        {
          "id": 1,
          "title": "视频标题",
          "description": "视频描述",
          "coverUrl": "封面URL",
          "playUrl": "播放URL",
          "uploader": {
            "id": 1,
            "name": "用户名",
            "avatar": "头像URL"
          },
          "categoryId": 1,
          "categoryName": "动画",
          "viewCount": 123456,
          "likeCount": 12345,
          "coinCount": 1234,
          "collectCount": 2345,
          "shareCount": 3456,
          "commentCount": 456,
          "uploadTime": "2023-01-01T12:00:00Z",
          "duration": "10:30"
        }
      ],
      "total": 100,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

#### 3.2 获取分类视频
- **URL**: `/video/category/{id}`
- **方法**: `GET`
- **参数**:
  - 路径参数 `id` (分类ID)
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认20)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "videos": [
        // 视频列表，格式同推荐视频
      ],
      "total": 50,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

#### 3.3 获取热门视频
- **URL**: `/video/hot`
- **方法**: `GET`
- **参数**:
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认10)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "videos": [
        // 视频列表，格式同推荐视频
      ],
      "total": 100,
      "page": 1,
      "pageSize": 10
    }
  }
  ```

#### 3.4 获取视频详情
- **URL**: `/video/{id}`
- **方法**: `GET`
- **参数**: 路径参数 `id` (视频ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "id": 1,
      "title": "视频详情标题",
      "description": "视频详细描述",
      "coverUrl": "封面URL",
      "playUrl": "播放URL",
      "uploader": {
        "id": 1,
        "name": "用户名",
        "avatar": "头像URL",
        "level": 5,
        "isFollowing": false
      },
      "categoryId": 1,
      "categoryName": "动画",
      "tags": ["测试", "视频", "详情"],
      "viewCount": 123456,
      "likeCount": 12345,
      "coinCount": 1234,
      "collectCount": 2345,
      "shareCount": 3456,
      "commentCount": 456,
      "uploadTime": "2023-01-01T12:00:00Z",
      "duration": "10:30",
      "danmakuCount": 1234
    }
  }
  ```

#### 3.5 上传视频
- **URL**: `/video/upload`
- **方法**: `POST`
- **参数**:
  - `title`: 视频标题 (必填)
  - `description`: 视频描述 (选填)
  - `cover`: 封面文件 (必填)
  - `video`: 视频文件 (必填)
  - `categoryId`: 分类ID (必填)
  - `tags`: 标签列表 (选填)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "上传成功",
    "data": {
      "id": 1,
      "title": "上传的视频标题",
      "description": "视频描述",
      "coverUrl": "封面URL",
      "playUrl": "播放URL",
      "uploadTime": "2023-01-01T12:00:00Z"
    }
  }
  ```

### 4. 评论相关接口

#### 4.1 获取视频评论
- **URL**: `/comment/video/{id}`
- **方法**: `GET`
- **参数**:
  - 路径参数 `id` (视频ID)
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认10)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "comments": [
        {
          "id": 1,
          "videoId": 1,
          "userId": 1,
          "userName": "用户名",
          "userAvatar": "头像URL",
          "content": "评论内容",
          "likeCount": 100,
          "replyCount": 10,
          "createTime": "2023-01-01T12:00:00Z",
          "replies": [
            {
              "id": 1,
              "commentId": 1,
              "userId": 2,
              "userName": "回复用户",
              "userAvatar": "头像URL",
              "content": "回复内容",
              "likeCount": 5,
              "createTime": "2023-01-01T12:30:00Z"
            }
          ]
        }
      ],
      "total": 50,
      "page": 1,
      "pageSize": 10
    }
  }
  ```

#### 4.2 发表评论
- **URL**: `/comment`
- **方法**: `POST`
- **参数**:
  - `videoId`: 视频ID (必填)
  - `content`: 评论内容 (必填)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "评论成功",
    "data": {
      "id": 1,
      "videoId": 1,
      "userId": 1,
      "userName": "用户名",
      "userAvatar": "头像URL",
      "content": "评论内容",
      "likeCount": 0,
      "replyCount": 0,
      "createTime": "2023-01-01T12:00:00Z",
      "replies": []
    }
  }
  ```

#### 4.3 回复评论
- **URL**: `/comment/reply`
- **方法**: `POST`
- **参数**:
  - `commentId`: 评论ID (必填)
  - `content`: 回复内容 (必填)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "回复成功",
    "data": {
      "id": 1,
      "commentId": 1,
      "userId": 1,
      "userName": "用户名",
      "userAvatar": "头像URL",
      "content": "回复内容",
      "likeCount": 0,
      "createTime": "2023-01-01T12:30:00Z"
    }
  }
  ```

### 5. 互动相关接口

#### 5.1 点赞视频
- **URL**: `/interaction/like/{id}`
- **方法**: `POST`
- **参数**: 路径参数 `id` (视频ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "liked": true,
      "likeCount": 12346
    }
  }
  ```

#### 5.2 取消点赞
- **URL**: `/interaction/like/{id}`
- **方法**: `DELETE`
- **参数**: 路径参数 `id` (视频ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "liked": false,
      "likeCount": 12344
    }
  }
  ```

#### 5.3 投币视频
- **URL**: `/interaction/coin/{id}`
- **方法**: `POST`
- **参数**:
  - 路径参数 `id` (视频ID)
  - `coinCount`: 投币数量 (默认1)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "coined": true,
      "coinCount": 1235
    }
  }
  ```

#### 5.4 收藏视频
- **URL**: `/interaction/collect/{id}`
- **方法**: `POST`
- **参数**: 路径参数 `id` (视频ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "collected": true,
      "collectCount": 2346
    }
  }
  ```

#### 5.5 取消收藏
- **URL**: `/interaction/collect/{id}`
- **方法**: `DELETE`
- **参数**: 路径参数 `id` (视频ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "collected": false,
      "collectCount": 2344
    }
  }
  ```

#### 5.6 分享视频
- **URL**: `/interaction/share/{id}`
- **方法**: `POST`
- **参数**: 路径参数 `id` (视频ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "shared": true,
      "shareCount": 3457
    }
  }
  ```

### 6. 搜索相关接口

#### 6.1 搜索视频
- **URL**: `/search`
- **方法**: `GET`
- **参数**:
  - `keyword`: 搜索关键词 (必填)
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认20)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "搜索成功",
    "data": {
      "videos": [
        // 视频列表，格式同推荐视频
      ],
      "total": 50,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

#### 6.2 获取热搜榜
- **URL**: `/search/hot`
- **方法**: `GET`
- **参数**:
  - `limit`: 数量限制 (默认10)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": [
      {
        "rank": 1,
        "keyword": "原神",
        "hot": "999万"
      },
      {
        "rank": 2,
        "keyword": "我的世界",
        "hot": "888万"
      }
    ]
  }
  ```

### 7. 分类相关接口

#### 7.1 获取分类列表
- **URL**: `/category`
- **方法**: `GET`
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": [
      {
        "id": 1,
        "name": "动画"
      },
      {
        "id": 2,
        "name": "音乐"
      }
    ]
  }
  ```

### 8. 关注相关接口

#### 8.1 关注用户
- **URL**: `/follow/{id}`
- **方法**: `POST`
- **参数**: 路径参数 `id` (被关注用户ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "关注成功",
    "data": {
      "followed": true,
      "followerCount": 86
    }
  }
  ```

#### 8.2 取消关注
- **URL**: `/follow/{id}`
- **方法**: `DELETE`
- **参数**: 路径参数 `id` (被关注用户ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "取消关注成功",
    "data": {
      "followed": false,
      "followerCount": 84
    }
  }
  ```

#### 8.3 获取关注列表
- **URL**: `/user/{id}/following`
- **方法**: `GET`
- **参数**:
  - 路径参数 `id` (用户ID)
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认20)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "users": [
        {
          "id": 2,
          "username": "用户2",
          "nickname": "昵称2",
          "avatar": "头像URL",
          "level": 3
        }
      ],
      "total": 120,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

#### 8.4 获取粉丝列表
- **URL**: `/user/{id}/followers`
- **方法**: `GET`
- **参数**:
  - 路径参数 `id` (用户ID)
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认20)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "users": [
        {
          "id": 3,
          "username": "用户3",
          "nickname": "昵称3",
          "avatar": "头像URL",
          "level": 2
        }
      ],
      "total": 85,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

### 9. 创作中心相关接口

#### 9.1 获取用户视频列表
- **URL**: `/user/{id}/videos`
- **方法**: `GET`
- **参数**:
  - 路径参数 `id` (用户ID)
  - `page`: 页码 (默认1)
  - `pageSize`: 每页数量 (默认20)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "videos": [
        // 视频列表，格式同推荐视频
      ],
      "total": 15,
      "page": 1,
      "pageSize": 20
    }
  }
  ```

#### 9.2 获取视频数据统计
- **URL**: `/analytics/video/{id}`
- **方法**: `GET`
- **参数**: 路径参数 `id` (视频ID)
- **返回**:
  ```json
  {
    "code": 200,
    "message": "获取成功",
    "data": {
      "viewCount": 123456,
      "likeCount": 12345,
      "coinCount": 1234,
      "collectCount": 2345,
      "shareCount": 3456,
      "commentCount": 456,
      "danmakuCount": 1234,
      "trend": [
        {
          "date": "2023-01-01",
          "views": 1000
        },
        {
          "date": "2023-01-02",
          "views": 1200
        }
      ]
    }
  }
  ```

## 三、技术实现建议

### 1. 后端技术栈选择
- **语言**: Node.js (Express.js 或 Koa.js) 或 Java (Spring Boot)
- **数据库**: MySQL 或 PostgreSQL
- **缓存**: Redis (用于热点数据和会话管理)
- **认证**: JWT (JSON Web Token)
- **文件存储**: 本地文件系统或对象存储服务 (如阿里云OSS、腾讯云COS)

### 2. 性能优化建议
- 使用数据库索引优化查询性能
- 实现缓存机制减少数据库查询
- 使用CDN加速静态资源和视频内容
- 实现视频转码和多分辨率支持
- 采用异步处理视频上传和转码

### 3. 安全建议
- 密码加密存储 (bcrypt)
- 防止SQL注入和XSS攻击
- 实现接口访问频率限制
- 视频内容审核机制
- 敏感操作需要二次验证

### 4. 部署建议
- 使用容器化部署 (Docker)
- 实现负载均衡和水平扩展
- 配置CI/CD流程
- 监控系统运行状态

## 四、总结

本文档详细描述了仿Bilibili项目的数据库设计和API接口设计，覆盖了用户、视频、评论、互动等核心功能。数据库设计考虑了数据完整性和查询性能，API接口设计遵循RESTful规范，提供了完整的功能支持。

在实现过程中，建议根据实际技术栈和项目规模进行适当调整，确保系统的稳定性、安全性和可扩展性。