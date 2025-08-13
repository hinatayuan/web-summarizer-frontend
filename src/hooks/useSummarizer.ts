import { useState, useCallback, useEffect, useRef } from 'react'
import { MastraClient } from '@mastra/client-js'
import { SummaryData, LoadingState, AnalysisHistory } from '../types'
import { storage } from '../utils/storage'
import { useThrottle } from './useThrottle'

const API_BASE_URL =
  import.meta.env.VITE_MASTRA_API_URL || 'http://localhost:3000'
const AGENT_ID = import.meta.env.VITE_AGENT_ID || 'summarizerAgent'

export const useSummarizer = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: 'fetching'
  })
  const [currentData, setCurrentData] = useState<SummaryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<AnalysisHistory[]>(() =>
    storage.getHistory()
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState<string>('')
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    lastRequestTime: number
    averageResponseTime: number
    requestCount: number
  }>({
    lastRequestTime: 0,
    averageResponseTime: 0,
    requestCount: 0
  })

  // 性能监控
  const performanceRef = useRef<{
    requestStartTime: number
    responseTimes: number[]
  }>({
    requestStartTime: 0,
    responseTimes: []
  })

  // 节流更新流式内容，减少DOM重绘频率
  const throttledSetStreamingContent = useThrottle((content: string) => {
    setStreamingContent(content)
  }, 100) // 每100ms最多更新一次

  // 节流更新进度
  const throttledSetLoadingState = useThrottle((update: Partial<LoadingState>) => {
    setLoadingState(prev => ({ ...prev, ...update }))
  }, 50) // 每50ms最多更新一次

  // 初始化MastraClient
  const client = new MastraClient({
    baseUrl: API_BASE_URL
  })

  // 连接预热和 API 诊断
  useEffect(() => {
    const preWarmConnection = async () => {
      try {
        // 发送一个轻量级请求来预热连接
        await fetch(`${API_BASE_URL}/health`, { 
          method: 'HEAD',
          mode: 'no-cors' // 避免 CORS 问题
        }).catch(() => {
          // 忽略错误，只是为了预热连接
        })
        
        // 检查 Agent 是否支持流式
        console.log('🔧 API 诊断信息:', {
          apiUrl: API_BASE_URL,
          agentId: AGENT_ID,
          clientType: client.constructor?.name || 'MastraClient'
        })
        
        // 尝试获取 Agent 信息
        try {
          const agentInfo = client.getAgent(AGENT_ID)
          console.log('🤖 Agent 信息:', {
            hasStream: typeof agentInfo?.stream === 'function',
            hasGenerate: typeof agentInfo?.generate === 'function',
            methods: Object.getOwnPropertyNames(agentInfo || {})
          })
        } catch (agentError) {
          console.warn('❌ 无法获取 Agent 信息:', agentError)
        }
      } catch (error) {
        console.warn('🚨 API 诊断失败:', error)
      }
    }

    preWarmConnection()
  }, [])

  // 性能监控工具函数
  const startPerformanceTracking = useCallback(() => {
    performanceRef.current.requestStartTime = performance.now()
  }, [])

  const endPerformanceTracking = useCallback(() => {
    const endTime = performance.now()
    const responseTime = endTime - performanceRef.current.requestStartTime
    
    performanceRef.current.responseTimes.push(responseTime)
    
    // 保持最近10次请求的性能数据
    if (performanceRef.current.responseTimes.length > 10) {
      performanceRef.current.responseTimes.shift()
    }
    
    const avgResponseTime = performanceRef.current.responseTimes.reduce((sum, time) => sum + time, 0) / performanceRef.current.responseTimes.length
    
    setPerformanceMetrics(prev => ({
      lastRequestTime: responseTime,
      averageResponseTime: avgResponseTime,
      requestCount: prev.requestCount + 1
    }))
    
    // 性能日志
    if (responseTime > 2000) {
      console.warn('🐌 慢请求检测:', {
        responseTime: `${responseTime.toFixed(0)}ms`,
        averageResponseTime: `${avgResponseTime.toFixed(0)}ms`,
        url: API_BASE_URL
      })
    }
  }, [])

  // 简化的进度更新 - 仅用于普通分析
  const updateProgress = useCallback((stage: LoadingState['stage'], progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      stage,
      progress: Math.min(progress, 100)
    }))
  }, [])

  // 解析API返回的数据，增强数据处理逻辑
  const parseApiResponse = (result: any, url: string): SummaryData => {
    let summaryData: SummaryData

    // 如果是字符串，尝试解析JSON
    if (typeof result === 'string') {
      try {
        // 处理可能的markdown格式或其他格式的响应
        let cleanResult = result.trim()
        
        // 如果包含markdown代码块，提取JSON部分
        const jsonMatch = cleanResult.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
        if (jsonMatch) {
          cleanResult = jsonMatch[1]
        }
        
        const parsed = JSON.parse(cleanResult)
        summaryData = parsed
      } catch (parseError) {
        console.warn('JSON解析失败，创建基本结构:', parseError)
        // 如果解析失败，将字符串作为摘要内容
        summaryData = {
          title: '网页分析结果',
          summary: result,
          keyPoints: extractKeyPointsFromText(result),
          keywords: extractKeywordsFromText(result),
          highlights: [],
          readingTime: estimateReadingTime(result),
          sourceUrl: url,
          createdAt: new Date().toISOString()
        }
      }
    } 
    // 如果是对象，直接使用并补充缺失字段
    else if (result && typeof result === 'object') {
      summaryData = {
        title: result.title || '网页分析结果',
        summary: result.summary || result.content || '无法获取摘要',
        keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : 
                  Array.isArray(result.key_points) ? result.key_points :
                  result.keyPoints ? [result.keyPoints] : [],
        keywords: Array.isArray(result.keywords) ? result.keywords :
                 Array.isArray(result.tags) ? result.tags :
                 result.keywords ? [result.keywords] : [],
        highlights: Array.isArray(result.highlights) ? result.highlights : [],
        readingTime: result.readingTime || result.reading_time || '未知',
        sourceUrl: result.sourceUrl || url,
        createdAt: result.createdAt || new Date().toISOString(),
        ...result
      }
    } 
    else {
      throw new Error('API返回数据格式不正确')
    }

    // 确保数据结构完整性
    summaryData = validateAndEnhanceData(summaryData, url)
    
    return summaryData
  }

  // 从文本中提取关键要点
  const extractKeyPointsFromText = (text: string): string[] => {
    const sentences = text.split(/[.。!！?？]+/).filter(s => s.trim().length > 10)
    return sentences.slice(0, 5).map(s => s.trim())
  }

  // 从文本中提取关键词
  const extractKeywordsFromText = (text: string): string[] => {
    // 简单的关键词提取逻辑
    const words = text.match(/[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}/g) || []
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word)
  }

  // 估算阅读时间
  const estimateReadingTime = (text: string): string => {
    const wordsPerMinute = 200
    const wordCount = text.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return `${minutes} 分钟`
  }

  // 验证和增强数据
  const validateAndEnhanceData = (data: SummaryData, url: string): SummaryData => {
    // 确保必需字段存在
    if (!data.title || data.title.trim() === '') {
      data.title = '网页分析结果'
    }
    if (!data.summary || data.summary.trim() === '') {
      data.summary = '无法获取有效摘要'
    }
    if (!Array.isArray(data.keyPoints)) {
      data.keyPoints = []
    }
    if (!Array.isArray(data.keywords)) {
      data.keywords = []
    }
    if (!Array.isArray(data.highlights)) {
      data.highlights = []
    }
    if (!data.readingTime) {
      data.readingTime = estimateReadingTime(data.summary)
    }
    if (!data.sourceUrl) {
      data.sourceUrl = url
    }
    if (!data.createdAt) {
      data.createdAt = new Date().toISOString()
    }

    // 为highlights添加ID和类型
    data.highlights = data.highlights.map((highlight, index) => ({
      ...highlight,
      id: highlight.id || `highlight-${index}`,
      type: highlight.type || 'important'
    }))

    return data
  }

  // 普通分析
  const analyzePage = useCallback(
    async (url: string): Promise<SummaryData | null> => {
      if (!url.trim()) {
        setError('请输入有效的URL')
        return null
      }

      try {
        setError(null)
        setStreamingContent('')
        setLoadingState({ isLoading: true, progress: 0, stage: 'fetching' })
        
        // 开始性能监控
        startPerformanceTracking()

        // 简化进度更新
        updateProgress('fetching', 20)
        updateProgress('extracting', 40)
        updateProgress('analyzing', 60)

        console.log('正在调用Mastra Agent，URL:', API_BASE_URL, 'Agent ID:', AGENT_ID)

        // 调用MastraClient的Agent
        const result = await client.getAgent(AGENT_ID).generate({
          messages: [
            {
              role: 'user',
              content: `请分析这个网页并返回JSON格式的摘要，包含以下字段：
{
  "title": "页面标题",
  "summary": "内容摘要",
  "keyPoints": ["要点1", "要点2"],
  "keywords": ["关键词1", "关键词2"],
  "highlights": [],
  "readingTime": "预计阅读时间"
}

网页URL: ${url}`
            }
          ]
        })

        updateProgress('complete', 100)
        
        // 结束性能监控
        endPerformanceTracking()

        // 解析结果
        const summaryData = parseApiResponse(result, url)

        // 保存到历史记录
        const historyItem: AnalysisHistory = {
          id: Date.now().toString(),
          url,
          title: summaryData.title,
          summary: summaryData.summary,
          createdAt: new Date().toISOString(),
          data: summaryData
        }

        storage.saveToHistory(historyItem)
        setHistory(storage.getHistory())
        setCurrentData(summaryData)

        return summaryData
      } catch (err) {
        console.error('分析失败:', err)
        let errorMessage = '分析失败，请稍后重试'

        if (err instanceof Error) {
          if (err.message.includes('fetch')) {
            errorMessage = '无法连接到服务器，请检查网络连接'
          } else if (err.message.includes('timeout')) {
            errorMessage = '请求超时，请稍后重试'
          } else {
            errorMessage = err.message
          }
        }

        setError(errorMessage)
        return null
      } finally {
        setLoadingState({ isLoading: false, progress: 100, stage: 'complete' })
      }
    },
    [client, updateProgress, startPerformanceTracking, endPerformanceTracking]
  )

  // 优化的流式分析
  const analyzePageStream = useCallback(
    async (
      url: string,
      onChunk?: (chunk: string) => void
    ): Promise<SummaryData | null> => {
      if (!url.trim()) {
        setError('请输入有效的URL')
        return null
      }

      try {
        setError(null)
        setIsStreaming(true)
        setStreamingContent('')
        setLoadingState({ isLoading: true, progress: 10, stage: 'fetching' })
        
        // 开始性能监控
        startPerformanceTracking()

        console.log('正在进行流式分析，URL:', API_BASE_URL, 'Agent ID:', AGENT_ID)

        // 尝试使用流式API - 优化请求参数
        const streamResponse = await client.getAgent(AGENT_ID).stream({
          messages: [
            {
              role: 'system',
              content: '你是一个专业的网页内容分析助手。请逐步流式输出分析结果，不要等待完整分析完成再输出。立即开始输出，边分析边输出每个部分的结果。'
            },
            {
              role: 'user',
              content: `请立即开始流式分析这个网页：${url}

要求：
1. 立即输出 "🔍 开始分析网页..."
2. 然后输出页面标题
3. 逐句输出内容摘要，每分析一段就立即输出
4. 输出关键要点，每发现一个要点就立即输出
5. 最后输出关键词

请确保每个步骤都立即流式输出，不要等待完整分析完成！`
            }
          ],
          // 尝试添加流式配置参数
          temperature: 0.3,  // 降低随机性以提高响应速度
          maxTokens: 1500   // 限制长度以提高速度
        })

        let fullResponse = ''
        let chunkCount = 0
        let firstChunkTime = 0

        console.log('📦 Stream Response 详细信息:', {
          type: typeof streamResponse,
          constructor: streamResponse?.constructor?.name,
          hasProcessDataStream: streamResponse && 'processDataStream' in streamResponse,
          hasAsyncIterator: streamResponse && Symbol.asyncIterator in streamResponse,
          isReadableStream: streamResponse instanceof ReadableStream,
          allKeys: streamResponse ? Object.getOwnPropertyNames(streamResponse) : []
        })

        // 优化的流式处理 - 简化检测逻辑
        if (streamResponse && typeof streamResponse === 'object') {
          let streamProcessed = false
          
          // 优先尝试 Mastra 特定的 processDataStream（最常用）
          if ('processDataStream' in streamResponse && typeof streamResponse.processDataStream === 'function') {
            try {
              await streamResponse.processDataStream({
                onTextPart: (chunk: string) => {
                  const now = performance.now()
                  if (chunkCount === 0) {
                    firstChunkTime = now
                    console.log('🚀 收到第一个chunk！延迟:', (now - performanceRef.current.requestStartTime).toFixed(0), 'ms')
                  }
                  
                  fullResponse += chunk
                  chunkCount++
                  
                  console.log(`📨 Chunk ${chunkCount}:`, {
                    size: chunk.length,
                    delay: chunkCount === 1 ? 'First' : `${(now - firstChunkTime).toFixed(0)}ms`,
                    preview: chunk.substring(0, 100) + (chunk.length > 100 ? '...' : '')
                  })
                  
                  // 实时更新流式内容以确保真实流式效果
                  setStreamingContent(fullResponse)
                  onChunk?.(chunk)
                  
                  // 进度更新可以节流
                  const progress = Math.min(10 + (chunkCount * 2), 90)
                  if (chunkCount % 3 === 0) {
                    setLoadingState(prev => ({ ...prev, progress }))
                  }
                }
              })
              streamProcessed = true
            } catch (streamError) {
              console.warn('Mastra流式处理失败:', streamError)
            }
          }
          
          // 如果Mastra方法失败，尝试异步迭代器
          if (!streamProcessed && Symbol.asyncIterator in streamResponse) {
            try {
              for await (const chunk of streamResponse as AsyncIterable<string>) {
                if (chunk && typeof chunk === 'string') {
                  fullResponse += chunk
                  chunkCount++
                  
                  // 实时更新流式内容以确保真实流式效果
                  setStreamingContent(fullResponse)
                  onChunk?.(chunk)
                  
                  // 进度更新可以节流
                  const progress = Math.min(10 + (chunkCount * 2), 90)
                  if (chunkCount % 3 === 0) {
                    setLoadingState(prev => ({ ...prev, progress }))
                  }
                }
              }
              streamProcessed = true
            } catch (iteratorError) {
              console.warn('异步迭代器处理失败:', iteratorError)
            }
          }
          
          // 回退到静态内容处理
          if (!streamProcessed) {
            console.warn('⚠️ 未检测到流式响应，使用静态内容')
            fullResponse = typeof streamResponse === 'string' 
              ? streamResponse 
              : JSON.stringify(streamResponse)
            
            // 如果是静态内容，模拟流式效果让用户看到区别
            console.log('📄 静态内容长度:', fullResponse.length)
            if (fullResponse.length > 100) {
              // 将静态内容分块显示，让用户知道这不是真正的流式
              const chunks = fullResponse.match(/.{1,50}/g) || [fullResponse]
              let displayedContent = ''
              
              for (let i = 0; i < chunks.length; i++) {
                displayedContent += chunks[i]
                setStreamingContent(`[伪流式] ${displayedContent}`)
                onChunk?.(chunks[i])
                
                // 短暂延迟以区别于真实流式
                await new Promise(resolve => setTimeout(resolve, 20))
              }
            } else {
              setStreamingContent(`[静态响应] ${fullResponse}`)
              onChunk?.(fullResponse)
            }
          }
          
          // 确保最终内容完整显示
          if (streamProcessed && chunkCount > 0) {
            setStreamingContent(fullResponse)
            console.log('✅ 流式处理完成:', {
              totalChunks: chunkCount,
              totalLength: fullResponse.length,
              isRealStream: chunkCount > 1,
              avgChunkSize: fullResponse.length / chunkCount
            })
          }
        } else {
          // 如果不支持流式，回退到普通分析
          console.warn('流式API不可用，回退到普通分析')
          setIsStreaming(false)
          return await analyzePage(url)
        }

        // 完成流式处理
        setLoadingState(prev => ({ ...prev, progress: 100, stage: 'complete' }))
        
        // 结束性能监控
        endPerformanceTracking()

        // 解析最终结果
        const summaryData = parseApiResponse(fullResponse, url)
        setCurrentData(summaryData)

        // 保存到历史记录
        const historyItem: AnalysisHistory = {
          id: Date.now().toString(),
          url,
          title: summaryData.title,
          summary: summaryData.summary,
          createdAt: new Date().toISOString(),
          data: summaryData
        }

        storage.saveToHistory(historyItem)
        setHistory(storage.getHistory())

        return summaryData
      } catch (err) {
        console.error('流式分析失败:', err)
        setIsStreaming(false)
        // 回退到普通分析
        return await analyzePage(url)
      } finally {
        setIsStreaming(false)
        setLoadingState({ isLoading: false, progress: 100, stage: 'complete' })
      }
    },
    [client, analyzePage, startPerformanceTracking, endPerformanceTracking, throttledSetStreamingContent, throttledSetLoadingState]
  )

  const loadFromHistory = useCallback((item: AnalysisHistory) => {
    setCurrentData(item.data)
    setError(null)
    setStreamingContent('')
  }, [])

  const deleteHistoryItem = useCallback((id: string) => {
    storage.deleteFromHistory(id)
    setHistory(storage.getHistory())
  }, [])

  const clearAllHistory = useCallback(() => {
    storage.clearHistory()
    setHistory([])
  }, [])

  return {
    loadingState,
    currentData,
    error,
    history,
    isStreaming,
    streamingContent,
    performanceMetrics,
    analyzePage,
    analyzePageStream,
    loadFromHistory,
    deleteHistoryItem,
    clearAllHistory
  }
}