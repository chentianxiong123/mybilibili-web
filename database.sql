-- 数据库初始化SQL脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS bilibili DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bilibili;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    gender TINYINT DEFAULT 0 COMMENT '0:未知,1:男,2:女',
    birthdate DATE,
    signature VARCHAR(255),
    level INT DEFAULT 1,
    following_count INT DEFAULT 0,
    follower_count INT DEFAULT 0,
    video_count INT DEFAULT 0,
    liked_count INT DEFAULT 0,
    coin_count INT DEFAULT 0,
    point_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 视频表
CREATE TABLE IF NOT EXISTS videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cover_url VARCHAR(255) NOT NULL,
    play_url VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    coin_count INT DEFAULT 0,
    collect_count INT DEFAULT 0,
    share_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    danmaku_count INT DEFAULT 0,
    duration VARCHAR(20) NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 视频标签关联表
CREATE TABLE IF NOT EXISTS video_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY uk_video_tag (video_id, tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 回复表
CREATE TABLE IF NOT EXISTS replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    like_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 关注表
CREATE TABLE IF NOT EXISTS follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_follow (follower_id, followed_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 点赞表
CREATE TABLE IF NOT EXISTS likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_video (user_id, video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 投币表
CREATE TABLE IF NOT EXISTS coins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    coin_count INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_video_coin (user_id, video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. 收藏表
CREATE TABLE IF NOT EXISTS collections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_video_collect (user_id, video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. 观看历史表
CREATE TABLE IF NOT EXISTS watch_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    video_id INT NOT NULL,
    watch_time VARCHAR(20),
    last_watch_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. 搜索历史表
CREATE TABLE IF NOT EXISTS search_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. 弹幕表
CREATE TABLE IF NOT EXISTS danmakus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    video_id INT NOT NULL,
    user_id INT NOT NULL,
    content VARCHAR(200) NOT NULL,
    time VARCHAR(20) NOT NULL,
    color VARCHAR(20) DEFAULT '#ffffff',
    mode TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建索引以提高查询性能
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_upload_time ON videos(upload_time);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_replies_comment_id ON replies(comment_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);
CREATE INDEX idx_likes_video_id ON likes(video_id);
CREATE INDEX idx_coins_video_id ON coins(video_id);
CREATE INDEX idx_collections_video_id ON collections(video_id);
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_danmakus_video_id ON danmakus(video_id);
CREATE INDEX idx_danmakus_time ON danmakus(time);

-- 插入初始分类数据
INSERT INTO categories (name) VALUES
('动画'),
('音乐'),
('舞蹈'),
('游戏'),
('知识'),
('资讯'),
('美食'),
('生活'),
('番剧'),
('国创'),
('科技'),
('运动'),
('汽车'),
('动物'),
('鬼畜'),
('时尚'),
('娱乐'),
('影视'),
('纪录片'),
('电影'),
('电视剧'),
('综艺');

-- 插入初始标签数据
INSERT INTO tags (name) VALUES
('原神'),
('我的世界'),
('英雄联盟'),
('鬼畜视频'),
('美食制作'),
('动漫推荐'),
('游戏攻略'),
('音乐MV'),
('舞蹈教学'),
('科技测评'),
('生活日常'),
('旅行'),
('健身'),
('学习'),
('职场');

-- 插入测试用户数据
INSERT INTO users (username, password, nickname, avatar, level) VALUES
('testuser', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '测试用户', 'https://picsum.photos/id/1005/40/40', 5),
('user1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '用户1', 'https://picsum.photos/id/1012/40/40', 3),
('user2', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', '用户2', 'https://picsum.photos/id/1027/40/40', 2);

-- 插入测试视频数据
INSERT INTO videos (title, description, cover_url, play_url, user_id, category_id, duration) VALUES
('测试视频1', '这是一个测试视频', 'https://picsum.photos/id/1015/320/180', 'https://example.com/video/1', 1, 1, '10:30'),
('测试视频2', '这是另一个测试视频', 'https://picsum.photos/id/1016/320/180', 'https://example.com/video/2', 1, 2, '05:45'),
('测试视频3', '游戏测试视频', 'https://picsum.photos/id/1018/320/180', 'https://example.com/video/3', 2, 4, '15:20');

-- 插入视频标签关联数据
INSERT INTO video_tags (video_id, tag_id) VALUES
(1, 1),
(1, 6),
(2, 8),
(3, 3),
(3, 7);

-- 插入测试评论数据
INSERT INTO comments (video_id, user_id, content) VALUES
(1, 2, '这个视频很不错！'),
(1, 3, '学习了，感谢分享'),
(2, 1, '音乐很好听');

-- 插入测试回复数据
INSERT INTO replies (comment_id, user_id, content) VALUES
(1, 1, '谢谢支持！'),
(2, 1, '不客气，很高兴能帮到你');

-- 插入测试关注数据
INSERT INTO follows (follower_id, followed_id) VALUES
(2, 1),
(3, 1),
(1, 2);

-- 插入测试点赞数据
INSERT INTO likes (user_id, video_id) VALUES
(2, 1),
(3, 1),
(1, 3);

-- 插入测试投币数据
INSERT INTO coins (user_id, video_id, coin_count) VALUES
(2, 1, 1),
(1, 3, 2);

-- 插入测试收藏数据
INSERT INTO collections (user_id, video_id) VALUES
(2, 1),
(1, 3);

-- 插入测试观看历史数据
INSERT INTO watch_history (user_id, video_id, watch_time) VALUES
(1, 1, '05:00'),
(1, 3, '10:00'),
(2, 1, '08:30');

-- 插入测试搜索历史数据
INSERT INTO search_history (user_id, keyword) VALUES
(1, '原神'),
(1, '英雄联盟'),
(2, '美食制作');

-- 插入测试弹幕数据
INSERT INTO danmakus (video_id, user_id, content, time) VALUES
(1, 1, '前方高能', '01:00'),
(1, 2, '哈哈哈哈', '02:30'),
(1, 3, '学到了', '05:15');
