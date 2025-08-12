import React, { useState } from 'react';
import { Search, Loader2, Globe, Zap } from 'lucide-react';
import { LoadingState } from '../types';

interface UrlInputProps {
  onAnalyze: (url: string) => Promise<void>;
  onAnalyzeStream?: (url: string, onChunk?: (chunk: string) => void) => Promise<void>;
  loadingState: LoadingState;
  isStreaming?: boolean;
  disabled?: boolean;
}

const EXAMPLE_URLS = [
  'https://blog.github.com',
  'https://techcrunch.com/latest',
  'https://news.ycombinator.com',
  'https://www.theverge.com'
];

const STAGE_LABELS = {
  fetching: '正在获取网页内容...',
  extracting: '正在提取主要内容...',
  analyzing: '正在AI分析摘要...',
  complete: '分析完成！'
};

export const UrlInput: React.FC<UrlInputProps> = ({ 
  onAnalyze, 
  onAnalyzeStream,
  loadingState, 
  isStreaming = false,
  disabled = false 
}) => {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [useStreaming, setUseStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setUrlError('请输入网页URL');
      return;
    }
    
    if (!validateUrl(url)) {
      setUrlError('请输入有效的URL（例如：https://example.com）');
      return;
    }
    
    setUrlError('');
    setStreamingText('');

    if (useStreaming && onAnalyzeStream) {
      await onAnalyzeStream(url, (chunk) => {
        setStreamingText(prev => prev + chunk);
      });
    } else {
      await onAnalyze(url);
    }
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setUrlError('');
  };

  const { isLoading, progress, stage } = loadingState;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL输入框 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError('');
            }}
            placeholder="输入要分析的网页URL，例如：https://example.com/article"
            className={`input pl-12 pr-40 text-lg ${
              urlError ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            disabled={disabled || isLoading}
          />
          
          {/* 流式开关 */}
          {onAnalyzeStream && (
            <div className="absolute inset-y-0 right-32 flex items-center pr-2">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={(e) => setUseStreaming(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                  disabled={isLoading}
                />
                <Zap className="w-4 h-4" />
                <span>流式</span>
              </label>
            </div>
          )}
          
          <button
            type="submit"
            disabled={disabled || isLoading || !url.trim()}
            className="absolute inset-y-0 right-0 mr-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">
              {isLoading ? '分析中...' : '分析'}
            </span>
          </button>
        </div>

        {/* 错误提示 */}
        {urlError && (
          <div className="text-red-600 text-sm animate-fade-in">
            {urlError}
          </div>
        )}

        {/* 示例URL */}
        {!isLoading && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">试试这些示例：</span>
            {EXAMPLE_URLS.map((exampleUrl, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleExampleClick(exampleUrl)}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200"
              >
                {exampleUrl.replace('https://', '').split('/')[0]}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* 加载状态 */}
      {isLoading && (
        <div className="mt-6 card animate-slide-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                {isStreaming && <Zap className="w-4 h-4 text-primary-600" />}
                <span>{STAGE_LABELS[stage]}</span>
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {isStreaming ? '正在实时分析...' : '正在处理您的请求，请稍候...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 流式输出实时显示 */}
      {isStreaming && streamingText && (
        <div className="mt-4 card bg-gray-50">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-primary-600" />
            <h3 className="font-medium text-gray-800">实时分析结果</h3>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap break-words">
            {streamingText}
            <span className="inline-block w-2 h-5 bg-primary-600 animate-pulse ml-1"></span>
          </div>
        </div>
      )}
    </div>
  );
};
