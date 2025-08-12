import { useState, useCallback } from 'react'
import { MastraClient } from '@mastra/client-js'
import { SummaryData, LoadingState, AnalysisHistory } from '../types'
import { storage } from '../utils/storage'

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

  // 初始化MastraClient
  const client = new MastraClient({
    baseUrl: API_BASE_URL
  })

  // 模拟进度更新
  const simulateProgress = useCallback(
    (stage: LoadingState['stage'], duration: number) => {
      return new Promise<void>((resolve) => {
        let progress = 0
        const increment = 100 / (duration / 100)

        const timer = setInterval(() => {
          progress += increment
          if (progress >= 100) {
            progress = 100
            clearInterval(timer)
            resolve()
          }

          setLoadingState((prev) => ({
            ...prev,
            progress: Math.min(progress, 100),
            stage
          }))
        }, 100)
      })
    },
    []
  )

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

        // 模拟进度
        await simulateProgress('fetching', 1000)
        setLoadingState((prev) => ({ ...prev, stage: 'extracting' }))
        await simulateProgress('extracting', 1000)
        setLoadingState((prev) => ({ ...prev, stage: 'analyzing' }))

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

        await simulateProgress('complete', 500)

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
    [client, simulateProgress]
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

        console.log('正在进行流式分析，URL:', API_BASE_URL, 'Agent ID:', AGENT_ID)

        // 尝试使用流式API
        const streamResponse = await client.getAgent(AGENT_ID).stream({
          messages: [
            {
              role: 'user',
              content: `请分析这个网页并以流式方式逐步返回分析结果。
首先返回页面基本信息，然后是内容摘要，接着是关键要点，最后是关键词。
请用清晰的格式分段返回，便于用户实时查看分析进展。

网页URL: ${url}`
            }
          ]
        })

        let fullResponse = ''
        let chunkCount = 0

        // 处理流式响应 - 修复TypeScript错误
        if (streamResponse && typeof streamResponse === 'object') {
          // 检查是否有processDataStream方法（Mastra特定）
          if ('processDataStream' in streamResponse && typeof streamResponse.processDataStream === 'function') {
            try {
              await streamResponse.processDataStream({
                onTextPart: (chunk: string) => {
                  fullResponse += chunk
                  chunkCount++
                  
                  // 更新流式内容显示
                  setStreamingContent(fullResponse)
                  
                  // 调用回调函数
                  onChunk?.(chunk)
                  
                  // 更新进度
                  const progress = Math.min(10 + (chunkCount * 2), 90)
                  setLoadingState(prev => ({ ...prev, progress }))
                }
              })
            } catch (streamError) {
              console.warn('流式处理错误:', streamError)
              // 如果流式处理失败，尝试获取完整响应
              if (typeof streamResponse === 'string') {
                fullResponse = streamResponse
              } else if (streamResponse && typeof streamResponse === 'object') {
                fullResponse = JSON.stringify(streamResponse)
              }
            }
          } 
          // 检查是否是标准的异步可迭代对象
          else if (Symbol.asyncIterator in streamResponse) {
            try {
              for await (const chunk of streamResponse as AsyncIterable<string>) {
                if (chunk && typeof chunk === 'string') {
                  fullResponse += chunk
                  chunkCount++
                  
                  // 更新流式内容显示
                  setStreamingContent(fullResponse)
                  
                  // 调用回调函数
                  onChunk?.(chunk)
                  
                  // 更新进度
                  const progress = Math.min(10 + (chunkCount * 2), 90)
                  setLoadingState(prev => ({ ...prev, progress }))
                  
                  // 添加小延迟以显示流式效果
                  await new Promise(resolve => setTimeout(resolve, 50))
                }
              }
            } catch (iteratorError) {
              console.warn('异步迭代器处理失败:', iteratorError)
              // 回退处理
              if (typeof streamResponse === 'string') {
                fullResponse = streamResponse
              } else {
                fullResponse = JSON.stringify(streamResponse)
              }
            }
          }
          // 如果都不支持，直接使用响应内容
          else {
            if (typeof streamResponse === 'string') {
              fullResponse = streamResponse
            } else {
              fullResponse = JSON.stringify(streamResponse)
            }
            
            // 模拟流式效果
            const chunks = fullResponse.match(/.{1,50}/g) || [fullResponse]
            for (const chunk of chunks) {
              setStreamingContent(prev => prev + chunk)
              onChunk?.(chunk)
              await new Promise(resolve => setTimeout(resolve, 100))
            }
          }
        } else {
          // 如果不支持流式，回退到普通分析
          console.warn('流式API不可用，回退到普通分析')
          setIsStreaming(false)
          return await analyzePage(url)
        }

        // 完成流式处理
        setLoadingState(prev => ({ ...prev, progress: 100, stage: 'complete' }))

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
    [client, analyzePage]
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
    analyzePage,
    analyzePageStream,
    loadFromHistory,
    deleteHistoryItem,
    clearAllHistory
  }
}