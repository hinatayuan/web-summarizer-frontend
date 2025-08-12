import React, { useState } from 'react';
import { History, Trash2, Search, X, Calendar, ExternalLink } from 'lucide-react';
import { AnalysisHistory } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisHistory[];
  onLoadItem: (item: AnalysisHistory) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onLoadItem,
  onDeleteItem,
  onClearAll
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* 侧边栏 */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">分析历史</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索历史记录..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* 统计和清空 */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>共 {history.length} 条记录</span>
              {history.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  清空全部
                </button>
              )}
            </div>
          </div>
          
          {/* 历史列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <History className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {history.length === 0 ? '暂无历史记录' : '未找到匹配结果'}
                </p>
                <p className="text-sm">
                  {history.length === 0 ? '分析网页后记录将显示在这里' : '尝试使用不同的搜索词'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      onLoadItem(item);
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-primary-700">
                        {item.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.summary}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate max-w-40">
                          {new URL(item.url).hostname}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};