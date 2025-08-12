import React, { useState } from 'react'
import { Search, Zap, Loader2, Link } from 'lucide-react'
import { LoadingState } from '../types'

interface UrlInputProps {
  onAnalyze: (url: string) => Promise<void>
  onAnalyzeStream: (
    url: string,
    onChunk?: (chunk: string) => void
  ) => Promise<void>
  loadingState: LoadingState
  isStreaming: boolean
  disabled?: boolean
}

export const UrlInput: React.FC<UrlInputProps> = ({
  onAnalyze,
  onAnalyzeStream,
  loadingState,
  isStreaming,
  disabled = false
}) => {
  const [url, setUrl] = useState('')
  const [streamOutput, setStreamOutput] = useState('')

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
    await onAnalyze(url)
  }

  const handleAnalyzeStream = async () => {
    if (!url.trim() || !isValidUrl(url) || loadingState.isLoading || disabled) {
      return
    }

    setStreamOutput('')
    await onAnalyzeStream(url, (chunk) => {
      setStreamOutput((prev) => prev + chunk)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAnalyze()
    }
  }

  const getStageText = () => {
    switch (loadingState.stage) {
      case 'fetching':
        return '正在获取网页内容...'
      case 'extracting':
        return '正在提取关键信息...'
      case 'analyzing':
        return '正在进行AI分析...'
      case 'complete':
        return '分析完成'
      default:
        return '处理中...'
    }
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
                  : '开始分析'}
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
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 流式输出显示 */}
        {isStreaming && streamOutput && (
          <div className="bg-gray-50 border rounded-lg p-4 max-h-40 overflow-y-auto">
            <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {streamOutput}
            </div>
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
