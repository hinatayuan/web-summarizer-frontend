import React, { useState } from 'react';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { SummaryCard } from './components/SummaryCard';
import { HighlightView } from './components/HighlightView';
import { HistoryPanel } from './components/HistoryPanel';
import { useSummarizer } from './hooks/useSummarizer';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  
  const {
    loadingState,
    currentData,
    error,
    history,
    isStreaming,
    analyzePage,
    analyzePageStream,
    loadFromHistory,
    deleteHistoryItem,
    clearAllHistory
  } = useSummarizer();

  // 测试API连接状态
  const checkApiStatus = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_MASTRA_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/health`, { 
        method: 'GET',
        timeout: 5000 
      });
      setApiStatus(response.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  };

  // 组件挂载时检查API状态
  React.useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async (url: string) => {
    await analyzePage(url);
  };

  const handleAnalyzeStream = async (url: string, onChunk?: (chunk: string) => void) => {
    await analyzePageStream(url, onChunk);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <Header 
        onShowHistory={() => setShowHistory(true)}
        hasHistory={history.length > 0}
        apiStatus={apiStatus}
        onCheckApi={checkApiStatus}
      />

      {/* API状态提示 */}
      {apiStatus === 'offline' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <WifiOff className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                无法连接到Mastra API服务器。请确保后端服务正在运行。
                <button 
                  onClick={checkApiStatus}
                  className="ml-2 font-medium underline hover:text-red-800"
                >
                  重新检查
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL输入区域 */}
        <div className="mb-8">
          <UrlInput 
            onAnalyze={handleAnalyze}
            onAnalyzeStream={handleAnalyzeStream}
            loadingState={loadingState}
            isStreaming={isStreaming}
            disabled={loadingState.isLoading || apiStatus === 'offline'}
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-8 card border-red-200 bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">分析失败</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-1">
                  请检查网络连接和URL是否正确，或稍后重试。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 结果展示区域 */}
        {currentData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：摘要卡片 */}
            <div className="space-y-6">
              <SummaryCard data={currentData} />
            </div>

            {/* 右侧：高亮显示 */}
            <div className="space-y-6">
              <HighlightView highlights={currentData.highlights} />
            </div>
          </div>
        )}

        {/* 没有数据时的占位符 */}
        {!currentData && !loadingState.isLoading && !error && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  {apiStatus === 'online' ? (
                    <Wifi className="w-4 h-4 text-white" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                欢迎使用 Web Summarizer
              </h2>
              <p className="text-gray-600 mb-6">
                输入任意网页URL，让AI帮您快速提取核心内容和关键信息
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>智能内容提取</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>DeepSeek AI驱动</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>关键信息高亮</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>支持流式分析</span>
                </div>
              </div>
              
              {/* API状态显示 */}
              <div className="mt-6 flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'online' ? 'bg-green-500' : 
                  apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-xs text-gray-500">
                  API状态: {apiStatus === 'online' ? '在线' : apiStatus === 'offline' ? '离线' : '检查中'}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Web Summarizer
              </h3>
              <p className="text-sm text-gray-600">
                基于Mastra + DeepSeek的智能网页内容摘要工具
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>© 2024 Web Summarizer</span>
              <span>•</span>
              <span>Powered by Mastra + DeepSeek</span>
              <span>•</span>
              <span>部署在 Cloudflare Workers</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 历史记录面板 */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onLoadItem={loadFromHistory}
        onDeleteItem={deleteHistoryItem}
        onClearAll={clearAllHistory}
      />
    </div>
  );
}

export default App;
