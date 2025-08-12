import React, { useState, useEffect } from 'react'
import { Search, Zap, Loader2, Link, Eye } from 'lucide-react'
import { LoadingState } from '../types'

interface UrlInputProps {
  onAnalyze: (url: string) => Promise<void>
  onAnalyzeStream: (
    url: string,
    onChunk?: (chunk: string) => void
  ) => Promise<void>
  loadingState: LoadingState
  isStreaming: boolean
  streamingContent?: string
  disabled?: boolean
}

export const UrlInput: React.FC<UrlInputProps> = ({
  onAnalyze,
  onAnalyzeStream,
  loadingState,
  isStreaming,
  streamingContent = '',
  disabled = false
}) => {
  const [url, setUrl] = useState('')
  const [showStreamPreview, setShowStreamPreview] = useState(false)

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

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAnalyze = async () => {
    if (!url.trim() || !isValidUrl(url) || loadingState.isLoading || disabled) {
      return
    }
    setShowStreamPreview(false)
    await onAnalyze(url)
  }

  const handleAnalyzeStream = async () => {
    if (!url.trim() || !isValidUrl(url) || loadingState.isLoading || disabled) {
      return
    }

    setShowStreamPreview(true)
    await onAnalyzeStream(url)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        handleAnalyzeStream()
      } else {
        handleAnalyze()
      }
    }
  }

  const getStageText = () => {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            智能网页内容分析
          </h2>
          <p className="text-gray-600">
            输入任意网页URL，获取AI驱动的内容摘要和关键信息提取
          </p>
        </div>

        {/* URL输入区域 */}
        <div className="space-y-4">
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
              disabled={loadingState.isLoading || disabled}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
          </div>

          {/* 快捷键提示 */}
          {url.trim() && isValidUrl(url) && !loadingState.isLoading && (
            <div className="text-xs text-gray-500 text-center">
              按 Enter 开始分析 • 按 Ctrl+Enter 流式分析
            </div>
          )}

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyze}
              disabled={
                !url.trim() ||
                !isValidUrl(url) ||
                loadingState.isLoading ||
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
                !url.trim() ||
                !isValidUrl(url) ||
                loadingState.isLoading ||
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
          </div>

          {/* URL验证提示 */}
          {url.trim() && !isValidUrl(url) && (
            <div className="text-sm text-red-600 flex items-center space-x-1">
              <span>请输入有效的URL格式（例如：https://example.com）</span>
            </div>
          )}
        </div>

        {/* 进度条 */}
        {loadingState.isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{getStageText()}</span>
              <span>{Math.round(loadingState.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ease-out ${
                  isStreaming 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                    : 'bg-gradient-to-r from-primary-500 to-primary-600'
                }`}
                style={{ width: `${loadingState.progress}%` }}
              />
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
            {isStreaming && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-purple-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span>正在实时生成内容...</span>
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