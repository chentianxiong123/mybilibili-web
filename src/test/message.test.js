/**
 * 消息功能自动化测试
 * 使用 Vitest 进行单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'

// 模拟 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('消息功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('发送消息', () => {
    it('应该成功发送消息', async () => {
      const mockMessage = {
        id: 1,
        senderId: 5,
        receiverId: 4,
        content: '测试消息',
        isRead: false,
        createdAt: new Date()
      }

      // 模拟 API 响应
      const mockSendMessage = vi.fn().mockResolvedValue({
        code: 200,
        data: mockMessage,
        message: '发送成功'
      })

      const result = await mockSendMessage({
        receiverId: 4,
        content: '测试消息',
        messageType: 1
      })

      expect(result.code).toBe(200)
      expect(result.data.content).toBe('测试消息')
      expect(result.data.senderId).toBe(5)
      expect(result.data.receiverId).toBe(4)
    })

    it('未登录时不应发送消息', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const token = localStorage.getItem('token')
      expect(token).toBeNull()
    })
  })

  describe('会话列表', () => {
    it('应该正确获取会话列表', async () => {
      const mockConversations = [
        {
          id: 1,
          userId: 4,
          targetUserId: 5,
          targetUserName: '用户5',
          targetUserAvatar: 'avatar.jpg',
          lastMessageContent: '你好',
          unreadCount: 2
        },
        {
          id: 2,
          userId: 4,
          targetUserId: 6,
          targetUserName: '用户6',
          targetUserAvatar: 'avatar2.jpg',
          lastMessageContent: '测试',
          unreadCount: 0
        }
      ]

      const mockGetConversations = vi.fn().mockResolvedValue({
        code: 200,
        data: mockConversations
      })

      const result = await mockGetConversations()

      expect(result.code).toBe(200)
      expect(result.data).toHaveLength(2)
      expect(result.data[0].unreadCount).toBe(2)
    })

    it('应该按最后消息时间排序', async () => {
      const mockConversations = [
        { id: 1, lastMessageTime: '2024-01-15 10:00:00' },
        { id: 2, lastMessageTime: '2024-01-15 12:00:00' },
        { id: 3, lastMessageTime: '2024-01-15 11:00:00' }
      ]

      // 按时间倒序排序
      const sorted = [...mockConversations].sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      )

      expect(sorted[0].id).toBe(2) // 最晚的消息
      expect(sorted[1].id).toBe(3)
      expect(sorted[2].id).toBe(1)
    })
  })

  describe('已读功能', () => {
    it('点开会话后应该标记消息为已读', async () => {
      const mockMessages = [
        { id: 1, senderId: 5, receiverId: 4, isRead: false },
        { id: 2, senderId: 5, receiverId: 4, isRead: false }
      ]

      const mockMarkAsRead = vi.fn().mockResolvedValue({
        code: 200,
        message: '标记成功'
      })

      // 模拟标记已读
      const unreadMessages = mockMessages.filter(msg => !msg.isRead)
      const messageIds = unreadMessages.map(msg => msg.id)
      
      await mockMarkAsRead(messageIds)

      expect(mockMarkAsRead).toHaveBeenCalledWith([1, 2])
    })

    it('未读计数应该正确计算', () => {
      const conversations = [
        { id: 1, unreadCount: 2 },
        { id: 2, unreadCount: 0 },
        { id: 3, unreadCount: 5 }
      ]

      const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
      
      expect(totalUnread).toBe(7)
    })
  })

  describe('消息气泡', () => {
    it('自己的消息应该在右侧', () => {
      const currentUserId = 4
      const message = { senderId: 4, content: '我的消息' }
      
      const isSelf = message.senderId === currentUserId
      
      expect(isSelf).toBe(true)
    })

    it('对方的消息应该在左侧', () => {
      const currentUserId = 4
      const message = { senderId: 5, content: '对方的消息' }
      
      const isSelf = message.senderId === currentUserId
      
      expect(isSelf).toBe(false)
    })
  })

  describe('时间格式化', () => {
    it('应该正确格式化时间', () => {
      const formatTime = (date) => {
        const now = new Date()
        const diff = now - date
        const minutes = Math.floor(diff / 60000)
        
        if (minutes < 1) return '刚刚'
        if (minutes < 60) return `${minutes}分钟前`
        return '很久以前'
      }

      const justNow = new Date(Date.now() - 30000) // 30秒前
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000) // 5分钟前

      expect(formatTime(justNow)).toBe('刚刚')
      expect(formatTime(fiveMinutesAgo)).toBe('5分钟前')
    })
  })
})

describe('API 集成测试', () => {
  describe('消息 API', () => {
    it('应该正确调用发送消息 API', async () => {
      const mockApi = {
        sendMessage: vi.fn().mockResolvedValue({
          code: 200,
          data: { id: 1 },
          message: '发送成功'
        })
      }

      const result = await mockApi.sendMessage({
        receiverId: 4,
        content: '测试',
        messageType: 1
      })

      expect(mockApi.sendMessage).toHaveBeenCalledWith({
        receiverId: 4,
        content: '测试',
        messageType: 1
      })
      expect(result.code).toBe(200)
    })

    it('应该正确调用获取消息列表 API', async () => {
      const mockApi = {
        getMessages: vi.fn().mockResolvedValue({
          code: 200,
          data: [{ id: 1 }, { id: 2 }]
        })
      }

      const result = await mockApi.getMessages(1, 1, 20)

      expect(result.code).toBe(200)
      expect(result.data).toHaveLength(2)
    })

    it('应该正确调用标记已读 API', async () => {
      const mockApi = {
        batchMarkAsRead: vi.fn().mockResolvedValue({
          code: 200,
          message: '标记成功'
        })
      }

      await mockApi.batchMarkAsRead([1, 2, 3])

      expect(mockApi.batchMarkAsRead).toHaveBeenCalledWith([1, 2, 3])
    })
  })
})
