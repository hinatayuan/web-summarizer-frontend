import React from 'react';
import { Globe, History, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onShowHistory: () => void;
  hasHistory: boolean;
  apiStatus: 'online' | 'offline' | 'unknown';
  onCheckApi: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onShowHistory, 
  hasHistory, 
  apiStatus,
  onCheckApi 
}) => {
  const getStatusColor = () => {
    switch (apiStatus) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = () => {
    return apiStatus === 'online' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo和标题 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Web Summarizer
              </h1>
              <p className="text-xs text-gray-500 leading-tight">
                基于Mastra + DeepSeek的智能网页摘要工具
              </p>
            </div>
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center space-x-4">
            {/* API状态指示器 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onCheckApi}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${getStatusColor()} hover:bg-gray-100`}
                title="点击检查API状态"
              >
                {getStatusIcon()}
                <span className="hidden sm:inline">
                  {apiStatus === 'online' ? '在线' : apiStatus === 'offline' ? '离线' : '检查中'}
                </span>
                <RefreshCw className="w-3 h-3 ml-1 hover:animate-spin" />
              </button>
            </div>

            {/* 历史记录按钮 */}
            <button
              onClick={onShowHistory}
              disabled={!hasHistory}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={hasHistory ? '查看分析历史' : '暂无历史记录'}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">历史记录</span>
              {hasHistory && (
                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
              )}
            </button>

            {/* 版本信息 */}
            <div className="hidden lg:flex items-center space-x-2 text-xs text-gray-500">
              <span>v1.0.0</span>
              <span>•</span>
              <span>Powered by Mastra</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
