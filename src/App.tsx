import React, { useState } from 'react';
import { Header } from './components/Header';
import { UrlInput } from './components/UrlInput';
import { SummaryCard } from './components/SummaryCard';
import { HighlightView } from './components/HighlightView';
import { HistoryPanel } from './components/HistoryPanel';
import { useSummarizer } from './hooks/useSummarizer';
import { AlertCircle } from 'lucide-react';

function App() {
  const [showHistory, setShowHistory] = useState(false);
  const {
    loadingState,
    currentData,
    error,
    history,
    analyzePage,
    loadFromHistory,
    deleteHistoryItem,
    clearAllHistory
  } = useSummarizer();

  const handleAnalyze = async (url: string) => {
    await analyzePage(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <Header 
        onShowHistory={() => setShowHistory(true)}
        hasHistory={history.length > 0}
      />

      {/* 主体内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL输入区域 */}
        <div className="mb-8">
          <UrlInput 
            onAnalyze={handleAnalyze}
            loadingState={loadingState}
            disabled={loadingState.isLoading}
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
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full"></div>
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
                  <span>AI驱动摘要</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>关键信息高亮</span>
                </div>
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
                基于AI的智能网页内容摘要工具，帮助您快速理解网页核心信息
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>© 2024 Web Summarizer</span>
              <span>•</span>
              <span>由 Mastra + DeepSeek 驱动</span>
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