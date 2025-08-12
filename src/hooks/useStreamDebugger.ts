import { useState, useCallback } from 'react'
import { MastraClient } from '@mastra/client-js'

const API_BASE_URL = import.meta.env.VITE_MASTRA_API_URL || 'http://localhost:3000'
const AGENT_ID = import.meta.env.VITE_AGENT_ID || 'summarizerAgent'

interface StreamDebugInfo {
  startTime: number
  chunks: Array<{
    timestamp: number
    size: number
    content: string
    delay: number
  }>
  totalTime: number
  isRealStream: boolean
}

export const useStreamDebugger = () => {
  const [debugInfo, setDebugInfo] = useState<StreamDebugInfo | null>(null)
  const [isDebugging, setIsDebugging] = useState(false)

  const client = new MastraClient({
    baseUrl: API_BASE_URL
  })

  const debugStream = useCallback(async (url: string) => {
    setIsDebugging(true)
    setDebugInfo(null)

    const startTime = Date.now()
    const chunks: StreamDebugInfo['chunks'] = []
    let lastChunkTime = startTime

    try {
      console.log('🔍 开始流式调试分析...')
      console.log('📡 API URL:', API_BASE_URL)
      console.log('🤖 Agent ID:', AGENT_ID)
      console.log('⏰ 开始时间:', new Date(startTime).toISOString())

      // 使用更详细的流式配置
      const streamResponse = await client.getAgent(AGENT_ID).stream({
        messages: [
          {
            role: 'system',
            content: '你是一个专业的网页内容分析助手。请逐步分析网页内容，先返回标题，然后逐句返回摘要，最后返回关键词。每个部分都要立即输出，不要等待。'
          },
          {
            role: 'user',
            content: `请立即开始流式分析这个网页：${url}

要求：
1. 立即返回 "开始分析..."
2. 然后返回网页标题
3. 逐句返回内容摘要
4. 最后返回关键词

请确保每个步骤都立即输出，不要等待完整分析完成。`
          }
        ],
        // 尝试添加流式配置
        stream: true,
        temperature: 0.7,
        max_tokens: 2000
      } as any)

      console.log('📦 Stream Response 类型:', typeof streamResponse)
      console.log('📦 Stream Response 构造函数:', streamResponse?.constructor?.name)
      console.log('📦 Stream Response 可用方法:', Object.getOwnPropertyNames(streamResponse || {}))
      
      // 检查响应对象的详细信息
      if (streamResponse && typeof streamResponse === 'object') {
        console.log('🔍 检查流式响应对象...')
        console.log('- 是否有 processDataStream:', 'processDataStream' in streamResponse)
        console.log('- 是否有 Symbol.asyncIterator:', Symbol.asyncIterator in streamResponse)
        console.log('- 是否是 ReadableStream:', streamResponse instanceof ReadableStream)
        console.log('- 所有属性:', Object.keys(streamResponse))
      }

      let totalContent = ''
      let chunkCount = 0

      // 方法1：尝试 Mastra 特定的 processDataStream
      if (streamResponse && 'processDataStream' in streamResponse && typeof streamResponse.processDataStream === 'function') {
        console.log('🔄 使用 Mastra processDataStream 方法')
        
        await streamResponse.processDataStream({
          onTextPart: (chunk: string) => {
            const now = Date.now()
            const delay = now - lastChunkTime
            chunkCount++
            
            console.log(`📨 Chunk ${chunkCount}:`, {
              size: chunk.length,
              delay: `${delay}ms`,
              content: chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''),
              timestamp: new Date(now).toISOString()
            })
            
            chunks.push({
              timestamp: now,
              size: chunk.length,
              content: chunk,
              delay
            })
            
            totalContent += chunk
            lastChunkTime = now
          },
          onError: (error: any) => {
            console.error('❌ 流式处理错误:', error)
          },
          onComplete: () => {
            console.log('✅ 流式处理完成')
          }
        })
      }
      // 方法2：尝试标准异步迭代器
      else if (streamResponse && Symbol.asyncIterator in streamResponse) {
        console.log('🔄 使用标准异步迭代器')
        
        for await (const chunk of streamResponse as AsyncIterable<string>) {
          const now = Date.now()
          const delay = now - lastChunkTime
          chunkCount++
          
          console.log(`📨 Chunk ${chunkCount}:`, {
            size: chunk.length,
            delay: `${delay}ms`,
            content: chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''),
            timestamp: new Date(now).toISOString()
          })
          
          chunks.push({
            timestamp: now,
            size: chunk.length,
            content: chunk,
            delay
          })
          
          totalContent += chunk
          lastChunkTime = now
        }
      }
      // 方法3：检查是否是 ReadableStream
      else if (streamResponse instanceof ReadableStream) {
        console.log('🔄 使用 ReadableStream')
        
        const reader = streamResponse.getReader()
        const decoder = new TextDecoder()
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          const now = Date.now()
          const delay = now - lastChunkTime
          chunkCount++
          
          console.log(`📨 Chunk ${chunkCount}:`, {
            size: chunk.length,
            delay: `${delay}ms`,
            content: chunk.substring(0, 50) + (chunk.length > 50 ? '...' : ''),
            timestamp: new Date(now).toISOString()
          })
          
          chunks.push({
            timestamp: now,
            size: chunk.length,
            content: chunk,
            delay
          })
          
          totalContent += chunk
          lastChunkTime = now
        }
      }
      // 方法4：回退处理
      else {
        console.log('⚠️ 不支持流式，使用回退方法')
        const content = typeof streamResponse === 'string' ? streamResponse : JSON.stringify(streamResponse)
        const now = Date.now()
        
        chunks.push({
          timestamp: now,
          size: content.length,
          content,
          delay: now - startTime
        })
        
        totalContent = content
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // 分析是否是真正的流式输出
      const isRealStream = chunks.length > 1 && chunks.some(chunk => chunk.delay < 1000)
      
      const debugResult: StreamDebugInfo = {
        startTime,
        chunks,
        totalTime,
        isRealStream
      }
      
      console.log('📊 流式调试结果:', {
        总耗时: `${totalTime}ms`,
        块数量: chunks.length,
        是否真流式: isRealStream,
        平均延迟: chunks.length > 1 ? `${chunks.slice(1).reduce((sum, chunk) => sum + chunk.delay, 0) / (chunks.length - 1)}ms` : 'N/A',
        总内容长度: totalContent.length
      })
      
      setDebugInfo(debugResult)
      return { debugResult, content: totalContent }
      
    } catch (error) {
      console.error('❌ 流式调试失败:', error)
      throw error
    } finally {
      setIsDebugging(false)
    }
  }, [client])

  // 生成调试报告
  const generateDebugReport = useCallback((info: StreamDebugInfo) => {
    const avgDelay = info.chunks.length > 1 
      ? info.chunks.slice(1).reduce((sum, chunk) => sum + chunk.delay, 0) / (info.chunks.length - 1)
      : 0
    
    return `## 🔍 流式分析调试报告

### 基本信息
- **总耗时**: ${info.totalTime}ms (${(info.totalTime / 1000).toFixed(1)}秒)
- **数据块数量**: ${info.chunks.length}
- **是否真流式**: ${info.isRealStream ? '✅ 是' : '❌ 否'}
- **平均延迟**: ${avgDelay.toFixed(1)}ms
- **总内容长度**: ${info.chunks.reduce((sum, chunk) => sum + chunk.size, 0)} 字符

### 详细时间线
${info.chunks.map((chunk, index) => 
  `**Chunk ${index + 1}** (${new Date(chunk.timestamp).toISOString()})
  - 大小: ${chunk.size} 字符
  - 延迟: ${chunk.delay}ms
  - 内容预览: ${chunk.content.substring(0, 100)}${chunk.content.length > 100 ? '...' : ''}`
).join('\n\n')}

### 诊断建议
${info.isRealStream 
  ? '✅ 检测到真正的流式输出！' 
  : `❌ 未检测到真正的流式输出。可能原因：
- DeepSeek API 可能不支持真实流式输出
- Mastra 客户端可能实现了伪流式
- 网络层面可能存在缓冲
- API 配置可能需要调整`
}

### 优化建议
1. **检查 API 配置**: 确认 DeepSeek API 是否支持流式输出
2. **调整请求参数**: 尝试不同的 temperature 和 max_tokens 设置
3. **检查网络环境**: 确认是否有代理或 CDN 缓冲
4. **联系 Mastra 支持**: 询问流式实现的具体细节`
  }, [])

  return {
    debugStream,
    debugInfo,
    isDebugging,
    generateDebugReport
  }
}