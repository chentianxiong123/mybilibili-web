# 修复收藏数计算逻辑 - 实现计划

## [ ] 任务 1: 分析当前收藏数计算逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 分析当前的收藏数计算逻辑，了解为什么会出现负数的收藏数。
  - 分析收藏数计算逻辑与收藏夹功能的关系。
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-1.1: 分析当前代码中的收藏数计算逻辑。
  - `human-judgement` TR-1.2: 理解收藏数计算逻辑的问题所在。
- **Notes**: 需要查看 `VideoInteractionServiceImpl` 类中的 `addVideoToFavoriteFolders` 和 `removeVideoFromFavoriteFolder` 方法。

## [ ] 任务 2: 修改收藏数计算逻辑
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 修改 `addVideoToFavoriteFolders` 方法，确保一个用户对一个视频的收藏只计算一次。
  - 修改 `removeVideoFromFavoriteFolder` 方法，确保收藏数不会出现负数。
  - 修改 `updateVideoFavoriteFolders` 方法，确保收藏数在收藏夹之间移动时保持不变。
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-2.1: 修复后的收藏数计算逻辑应该正确。
  - `programmatic` TR-2.2: 收藏数应该始终是非负数。
  - `programmatic` TR-2.3: 收藏数在收藏夹之间移动时应该保持不变。
- **Notes**: 需要添加逻辑来检查用户是否已经收藏了视频，而不是简单地根据收藏夹的数量来计算收藏数。

## [ ] 任务 3: 测试收藏数计算逻辑
- **Priority**: P0
- **Depends On**: 任务 2
- **Description**: 
  - 测试修复后的收藏数计算逻辑，确保收藏数计算正确。
  - 测试收藏数不会出现负数。
  - 测试收藏数在收藏夹之间移动时保持不变。
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 测试用户将视频收藏到多个收藏夹时，收藏数只增加 1。
  - `programmatic` TR-3.2: 测试用户将视频从所有收藏夹中移除时，收藏数减少 1，但不会小于 0。
  - `programmatic` TR-3.3: 测试用户在不同收藏夹之间移动视频时，收藏数保持不变。
- **Notes**: 需要编写测试用例来验证修复后的收藏数计算逻辑。

## [ ] 任务 4: 优化收藏数计算性能
- **Priority**: P1
- **Depends On**: 任务 3
- **Description**: 
  - 优化收藏数计算逻辑，确保在大量收藏操作时系统的响应速度。
  - 考虑添加缓存机制来提高收藏数计算的性能。
- **Acceptance Criteria Addressed**: NFR-2
- **Test Requirements**:
  - `programmatic` TR-4.1: 收藏数计算的响应时间应该在合理范围内。
  - `human-judgement` TR-4.2: 系统在处理大量收藏操作时应该保持响应速度。
- **Notes**: 可以考虑使用缓存来存储视频的收藏数，减少数据库查询的次数。

## [ ] 任务 5: 验证修复结果
- **Priority**: P1
- **Depends On**: 任务 4
- **Description**: 
  - 验证修复后的收藏数计算逻辑是否与现有的收藏夹功能兼容。
  - 验证修复后的收藏数计算逻辑是否满足所有需求。
- **Acceptance Criteria Addressed**: NFR-1
- **Test Requirements**:
  - `human-judgement` TR-5.1: 修复后的收藏数计算逻辑应该与现有的收藏夹功能兼容。
  - `human-judgement` TR-5.2: 修复后的收藏数计算逻辑应该满足所有需求。
- **Notes**: 需要测试收藏夹的其他功能是否正常运行。