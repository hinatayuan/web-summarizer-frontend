import React, { useState, useEffect } from 'react'
import { Search, Zap, Loader2, Link, Eye, Bug } from 'lucide-react'
import { LoadingState } from '../types'
import { useStreamDebugger } from '../hooks/useStreamDebugger'
import { FileUpload } from './FileUpload'
import { uploadFileToTempStorage, cleanupTempUrl } from '../utils/fileUpload'

interface UrlInputProps {
  onAnalyze: (url: string, mode?: string, contentType?: string) => Promise<void>
  onAnalyzeStream: (
    url: string,
    onChunk?: (chunk: string) => void,
    mode?: string,
    contentType?: string
  ) => Promise<void>
  loadingState: LoadingState
  isStreaming: boolean
  streamingContent?: string
  disabled?: boolean
  selectedMode?: string
  selectedContentType?: string
}

export const UrlInput: React.FC<UrlInputProps> = ({
  onAnalyze,
  onAnalyzeStream,
  loadingState,
  isStreaming,
  streamingContent = '',
  disabled = false,
  selectedMode = 'standard',
  selectedContentType = 'url'
}) => {
  const [url, setUrl] = useState('')
  const [showStreamPreview, setShowStreamPreview] = useState(false)
  const [showDebugMode, setShowDebugMode] = useState(false)
  const [debugReport, setDebugReport] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string>('')
  
  const { debugStream, debugInfo, isDebugging, generateDebugReport } = useStreamDebugger()

  // 自动显示流式预览
  useEffect(() => {
    if (isStreaming && streamingContent) {
      setShowStreamPreview(true)
    } else if (!isStreaming) {
      // 延迟隐藏预览，让用户能看到完整结果
      const timer = setTimeout(() => setShowStreamPreview(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isStreaming, streamingContent])

  // 生成调试报告
  useEffect(() => {
    if (debugInfo && !isDebugging) {
      const report = generateDebugReport(debugInfo)
      setDebugReport(report)
    }
  }, [debugInfo, isDebugging, generateDebugReport])

  // 处理文件选择
  const handleFileSelect = async (file: File | null, objectUrl?: string) => {
    if (file) {
      setSelectedFile(file)
      
      try {
        // 上传文件到临时存储
        const uploadResult = await uploadFileToTempStorage(file);
        
        if (uploadResult.success && uploadResult.url) {
          setFileUrl(uploadResult.url)
          
          // 如果是base64 URL，直接传递给后端
          // 如果是http URL，后端可以直接访问
          setUrl(uploadResult.url)
        } else {
          console.error('File upload failed:', uploadResult.error)
          // 降级使用对象URL
          if (objectUrl) {
            setFileUrl(objectUrl)
            setUrl(objectUrl)
          }
        }
      } catch (error) {
        console.error('File processing error:', error)
        // 降级使用对象URL
        if (objectUrl) {
          setFileUrl(objectUrl)
          setUrl(objectUrl)
        }
      }
    } else {
      // 清理之前的文件URL
      if (fileUrl) {
        cleanupTempUrl(fileUrl)
      }
      setSelectedFile(null)
      setFileUrl('')
      setUrl('')
    }
  }

  // 根据内容类型决定显示哪种输入方式
  const showFileUpload = selectedContentType === 'pdf'
  const showUrlInput = selectedContentType === 'url' || selectedContentType === 'rss'
  const showTextInput = selectedContentType === 'text'

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 检查输入是否有效
  const isInputValid = (): boolean => {
    if (showUrlInput || selectedContentType === 'rss') {
      return Boolean(url.trim() && isValidUrl(url))
    } else if (showTextInput) {
      return url.trim().length > 0
    } else if (showFileUpload) {
      return selectedFile !== null
    }
    return false
  }

  const handleAnalyze = async () => {
    if (!isInputValid() || loadingState.isLoading || disabled) {
      return
    }
    setShowStreamPreview(false)
    setDebugReport('')
    await onAnalyze(url, selectedMode, selectedContentType)
  }

  const handleAnalyzeStream = async () => {
    if (!isInputValid() || loadingState.isLoading || disabled) {
      return
    }

    setShowStreamPreview(true)
    setDebugReport('')
    await onAnalyzeStream(url, undefined, selectedMode, selectedContentType)
  }

  const handleDebugStream = async () => {
    if (!isInputValid() || isDebugging || disabled) {
      return
    }

    try {
      setShowStreamPreview(true)
      setDebugReport('')
      const result = await debugStream(url)
      console.log('📄 调试结果:', result)
    } catch (error) {
      console.error('调试失败:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        if (e.altKey) {
          handleDebugStream() // Ctrl+Alt+Enter 调试模式
        } else {
          handleAnalyzeStream() // Ctrl+Enter 流式分析
        }
      } else {
        handleAnalyze() // Enter 普通分析
      }
    }
  }

  const getStageText = () => {
    if (isDebugging) {
      return '正在调试流式性能...'
    }
    
    switch (loadingState.stage) {
      case 'fetching':
        return isStreaming ? '连接流式服务...' : '正在获取网页内容...'
      case 'extracting':
        return isStreaming ? '开始流式提取...' : '正在提取关键信息...'
      case 'analyzing':
        return isStreaming ? '流式分析进行中...' : '正在进行AI分析...'
      case 'complete':
        return '分析完成'
      default:
        return '处理中...'
    }
  }

  const formatStreamContent = (content: string) => {
    // 简单的格式化处理
    return content
      .replace(/\n\n/g, '\n')
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .trim()
  }

  return (
    <div className="card bg-white shadow-lg">
      <div className="space-y-4">
        {/* 标题 */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              智能网页内容分析
            </h2>
            {/* 调试模式切换 */}
            <button
              onClick={() => setShowDebugMode(!showDebugMode)}
              className={`p-2 rounded-lg transition-colors ${
                showDebugMode 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="切换调试模式"
            >
              <Bug className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600">
            输入任意网页URL，获取AI驱动的内容摘要和关键信息提取
          </p>
        </div>

        {/* 内容输入区域 */}
        <div className="space-y-4">
          {/* URL输入 */}
          {showUrlInput && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://example.com/article"
              disabled={loadingState.isLoading || isDebugging || disabled}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
            </div>
          )}

          {/* PDF文件上传 */}
          {showFileUpload && (
            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedTypes=".pdf"
              maxSize={10}
              disabled={loadingState.isLoading || isDebugging || disabled}
            />
          )}

          {/* 文本输入 */}
          {showTextInput && (
            <div className="relative">
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    if (e.altKey) {
                      handleDebugStream()
                    } else {
                      handleAnalyzeStream()
                    }
                  }
                }}
                placeholder="在此输入要分析的文本内容..."
                disabled={loadingState.isLoading || isDebugging || disabled}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none"
                rows={6}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                Ctrl+Enter 发送
              </div>
            </div>
          )}

          {/* 快捷键提示 */}
          {isInputValid() && !loadingState.isLoading && !isDebugging && (
            <div className="text-xs text-gray-500 text-center">
              {showDebugMode ? (
                <span>
                  按 Enter 标准分析 • 按 Ctrl+Enter 流式分析 • 按 Ctrl+Alt+Enter 调试模式
                </span>
              ) : (
                <span>
                  按 Enter 开始分析 • 按 Ctrl+Enter 流式分析
                </span>
              )}
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyze}
              disabled={
                !isInputValid() ||
                loadingState.isLoading ||
                isDebugging ||
                disabled
              }
              className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingState.isLoading && !isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>
                {loadingState.isLoading && !isStreaming
                  ? '分析中...'
                  : '标准分析'}
              </span>
            </button>

            <button
              onClick={handleAnalyzeStream}
              disabled={
                !isInputValid() ||
                loadingState.isLoading ||
                isDebugging ||
                disabled
              }
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <span>{isStreaming ? '流式分析中...' : '流式分析'}</span>
            </button>

            {/* 调试按钮 */}
            {showDebugMode && (
              <button
                onClick={handleDebugStream}
                disabled={
                  !isInputValid() ||
                  isDebugging ||
                  disabled
                }
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-lg hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isDebugging ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Bug className="w-5 h-5" />
                )}
                <span>{isDebugging ? '调试中...' : '调试模式'}</span>
              </button>
            )}
          </div>

          {/* URL验证提示 */}
          {url.trim() && !isValidUrl(url) && (
            <div className="text-sm text-red-600 flex items-center space-x-1">
              <span>请输入有效的URL格式（例如：https://example.com）</span>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {(loadingState.isLoading || isDebugging) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{getStageText()}</span>
              <span>{isDebugging ? '调试中' : `${Math.round(loadingState.progress)}%`}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ease-out ${
                  isDebugging
                    ? 'bg-gradient-to-r from-red-500 to-orange-500'
                    : isStreaming 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                    : 'bg-gradient-to-r from-primary-500 to-primary-600'
                }`}
                style={{ width: isDebugging ? '100%' : `${loadingState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 调试报告 */}
        {showDebugMode && debugReport && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-red-800 flex items-center space-x-2">
                <Bug className="w-4 h-4" />
                <span>流式性能调试报告</span>
              </h4>
              <button
                onClick={() => navigator.clipboard.writeText(debugReport)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                复制报告
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <pre className="text-xs text-red-700 whitespace-pre-wrap">
                {debugReport}
              </pre>
            </div>
          </div>
        )}

        {/* 流式输出实时预览 */}
        {showStreamPreview && (streamingContent || isStreaming) && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  实时分析预览
                </span>
                {debugInfo && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    debugInfo.isRealStream 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.isRealStream ? '真流式' : '伪流式'}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowStreamPreview(false)}
                className="text-purple-600 hover:text-purple-800 text-sm"
              >
                隐藏
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {streamingContent ? formatStreamContent(streamingContent) : (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>等待流式内容...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 流式进度指示器 */}
            {(isStreaming || isDebugging) && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-purple-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span>
                  {isDebugging ? '正在调试流式性能...' : '正在实时生成内容...'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 功能特点 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-xs text-gray-600">智能提取</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-xs text-gray-600">关键高亮</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
            <div className="text-xs text-gray-600">流式响应</div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            </div>
            <div className="text-xs text-gray-600">历史记录</div>
          </div>
        </div>
      </div>
    </div>
  )
}