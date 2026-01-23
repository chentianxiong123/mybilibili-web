# 视频收藏功能优化 - 实现计划

## 任务分解与优先级

### [ ] 任务 1: 修改后端 API 以支持获取视频的收藏状态
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 修改 `VideoInteractionService` 接口，添加获取视频在哪些收藏夹中的方法
  - 在 `VideoInteractionServiceImpl` 中实现该方法
  - 在 `VideoInteractionController` 中添加相应的 API 端点
- **成功标准**:
  - 后端 API 能够返回视频在哪些收藏夹中
- **测试要求**:
  - `programmatic` TR-1.1: API 返回 200 状态码
  - `programmatic` TR-1.2: API 返回正确的收藏夹列表

### [ ] 任务 2: 修改前端代码以获取视频的收藏状态
- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 修改 `VideoView.vue` 中的 `loadFavoriteFolders` 函数，在加载收藏夹列表时同时获取视频的收藏状态
  - 根据返回的收藏状态，设置 `selectedFolders` 的初始值
- **成功标准**:
  - 弹窗打开时，已收藏的收藏夹被默认选中
- **测试要求**:
  - `human-judgement` TR-2.1: 弹窗打开时，已收藏的收藏夹显示为选中状态
  - `programmatic` TR-2.2: 控制台无错误信息

### [ ] 任务 3: 修改后端 API 以支持更新视频的收藏夹
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 修改 `VideoInteractionService` 接口，添加更新视频收藏夹的方法
  - 在 `VideoInteractionServiceImpl` 中实现该方法，先删除视频在所有收藏夹中的记录，然后重新添加到选中的收藏夹中
  - 在 `VideoInteractionController` 中添加相应的 API 端点
- **成功标准**:
  - 后端 API 能够更新视频的收藏夹
- **测试要求**:
  - `programmatic` TR-3.1: API 返回 200 状态码
  - `programmatic` TR-3.2: API 返回更新成功的消息

### [ ] 任务 4: 修改前端代码以调用更新视频收藏夹的 API
- **优先级**: P0
- **依赖**: 任务 3
- **描述**:
  - 修改 `VideoView.vue` 中的 `confirmFavorite` 函数，调用更新视频收藏夹的 API
  - 处理 API 调用的成功和失败情况
- **成功标准**:
  - 点击确定按钮后，视频的收藏夹被更新
- **测试要求**:
  - `human-judgement` TR-4.1: 点击确定按钮后，显示更新成功的提示
  - `programmatic` TR-4.2: 控制台无错误信息

### [ ] 任务 5: 测试和优化
- **优先级**: P1
- **依赖**: 任务 1-4
- **描述**:
  - 测试收藏功能的完整流程
  - 优化用户体验，确保操作流畅
  - 处理边界情况，如网络错误、未登录等
- **成功标准**:
  - 收藏功能能够正常工作
  - 用户体验良好
- **测试要求**:
  - `human-judgement` TR-5.1: 收藏功能操作流畅
  - `programmatic` TR-5.2: 控制台无错误信息

## 实现细节

### 后端实现
1. 在 `VideoInteractionService` 接口中添加 `getVideoFavoriteFolders` 方法，返回视频在哪些收藏夹中
2. 在 `VideoInteractionServiceImpl` 中实现该方法，查询 `favorite_videos` 表获取视频的收藏夹
3. 在 `VideoInteractionController` 中添加 `/video/{id}/favorite/folders` 端点
4. 在 `VideoInteractionService` 接口中添加 `updateVideoFavoriteFolders` 方法，更新视频的收藏夹
5. 在 `VideoInteractionServiceImpl` 中实现该方法，先删除视频在所有收藏夹中的记录，然后重新添加到选中的收藏夹中
6. 在 `VideoInteractionController` 中添加 `/video/{id}/favorite/folders` 端点（PUT 方法）

### 前端实现
1. 修改 `VideoView.vue` 中的 `loadFavoriteFolders` 函数，调用新的 API 获取视频的收藏状态
2. 根据返回的收藏状态，设置 `selectedFolders` 的初始值
3. 修改 `confirmFavorite` 函数，调用更新视频收藏夹的 API
4. 处理 API 调用的成功和失败情况
5. 优化弹窗的显示效果，确保已收藏的收藏夹被清晰标记

## 预期结果

用户点击视频互动栏的收藏按钮后，会弹出一个弹窗，显示所有收藏夹，并默认选中视频已经收藏到的收藏夹。用户可以修改选中的收藏夹，然后点击确定按钮，视频的收藏夹会被更新。