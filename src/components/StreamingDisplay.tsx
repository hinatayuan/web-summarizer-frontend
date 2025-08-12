import React, { useState, useEffect, useRef } from 'react';
import { Zap, Eye, EyeOff, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

interface StreamingDisplayProps {
  content: string;
  isStreaming: boolean;
  onClose?: () => void;
  title?: string;
}

export const StreamingDisplay: React.FC<StreamingDisplayProps> = ({
  content,
  isStreaming,
  onClose,
  title = "流式分析"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastContentLength = useRef(0);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && contentRef.current && content.length > lastContentLength.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
    lastContentLength.current = content.length;
  }, [content, autoScroll]);

  // 复制内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 格式化显示内容
  const formatContent = (text: string) => {
    if (!text) return '';
    
    // 基本的Markdown格式处理
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-800 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-3">$1</h1>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^\- (.*)$/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*)$/gm, '<li class="ml-4 list-decimal">$1</li>');
  };

  if (!content && !isStreaming) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : 'relative'
    }`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-purple-200 bg-white/50 backdrop-blur-sm rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-800">{title}</span>
          </div>
          
          {/* 流式状态指示器 */}
          {isStreaming && (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
              <span className="text-sm text-purple-600">实时生成中...</span>
            </div>
          )}
          
          {!isStreaming && content && (
            <div className="flex items-center space-x-1 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm">生成完成</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 自动滚动切换 */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded transition-colors ${
              autoScroll 
                ? 'text-purple-600 hover:bg-purple-100' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={autoScroll ? "关闭自动滚动" : "开启自动滚动"}
          >
            {autoScroll ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            disabled={!content}
            className="p-1.5 text-gray-600 hover:text-purple-600 rounded transition-colors disabled:opacity-50"
            title="复制内容"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* 展开/收缩按钮 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-600 hover:text-purple-600 rounded transition-colors"
            title={isExpanded ? "收缩" : "展开"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* 关闭按钮 */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
              title="关闭"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div 
        ref={contentRef}
        className={`overflow-y-auto p-4 ${
          isExpanded ? 'h-full max-h-[calc(100vh-8rem)]' : 'max-h-80'
        }`}
        onScroll={(e) => {
          const target = e.target as HTMLElement;
          const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
          if (!isAtBottom && autoScroll) {
            setAutoScroll(false);
          }
        }}
      >
        {content ? (
          <div 
            className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: `<p class="mb-3">${formatContent(content)}</p>` 
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-20 text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
              <span>等待流式内容...</span>
            </div>
          </div>
        )}

        {/* 输入光标效果 */}
        {isStreaming && (
          <span className="inline-block w-2 h-5 bg-purple-500 animate-pulse ml-1 align-text-bottom"></span>
        )}
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 bg-white/30 backdrop-blur-sm border-t border-purple-200 rounded-b-lg">
        <div className="flex items-center space-x-4">
          <span>字符数: {content.length}</span>
          {content && (
            <span>约 {Math.ceil(content.length / 500)} 段</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {autoScroll && (
            <span className="text-purple-600">自动滚动</span>
          )}
          {isStreaming && (
            <span className="text-purple-600">实时更新</span>
          )}
        </div>
      </div>
    </div>
  );
};