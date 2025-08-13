import React, { useState } from 'react';
import { Highlighter, Quote, TrendingUp, Target, Filter, Copy, Check } from 'lucide-react';
import { HighlightItem } from '../types';

interface HighlightViewProps {
  highlights: HighlightItem[];
}

// 新的重要性级别配置
const IMPORTANCE_LEVELS = {
  high: {
    label: '高重要性',
    color: 'bg-red-100 border-red-200 text-red-800',
    iconColor: 'text-red-600',
    priority: 3
  },
  medium: {
    label: '中重要性', 
    color: 'bg-yellow-100 border-yellow-200 text-yellow-800',
    iconColor: 'text-yellow-600',
    priority: 2
  },
  low: {
    label: '低重要性',
    color: 'bg-gray-100 border-gray-200 text-gray-800', 
    iconColor: 'text-gray-600',
    priority: 1
  }
} as const;

// 分类图标映射
const CATEGORY_ICONS = {
  '重点强调': Target,
  '重要内容': Target,
  '标记内容': Highlighter,
  '引用内容': Quote,
  '章节标题': Highlighter,
  '列表要点': TrendingUp,
  // 兼容旧格式
  '主要观点': Target,
  '数据': TrendingUp,
  '结论': Highlighter
} as const;

// 兼容旧格式的类型映射
const LEGACY_HIGHLIGHT_TYPES = {
  important: {
    label: '重要内容',
    icon: Target,
    color: 'bg-red-100 border-red-200 text-red-800',
    iconColor: 'text-red-600'
  },
  quote: {
    label: '引用',
    icon: Quote,
    color: 'bg-blue-100 border-blue-200 text-blue-800',
    iconColor: 'text-blue-600'
  },
  statistic: {
    label: '统计数据',
    icon: TrendingUp,
    color: 'bg-green-100 border-green-200 text-green-800',
    iconColor: 'text-green-600'
  },
  conclusion: {
    label: '结论',
    icon: Highlighter,
    color: 'bg-purple-100 border-purple-200 text-purple-800',
    iconColor: 'text-purple-600'
  }
} as const;

export const HighlightView: React.FC<HighlightViewProps> = ({ highlights }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 智能适配新旧格式，为每个高亮添加ID
  const normalizedHighlights = highlights.map((highlight, index) => ({
    ...highlight,
    id: highlight.id || `highlight-${index}`,
    // 优先使用新格式，兼容旧格式
    importance: highlight.importance || 'medium',
    category: highlight.category || (highlight.type ? LEGACY_HIGHLIGHT_TYPES[highlight.type]?.label || '其他' : '其他')
  }));

  // 按重要性和分类过滤
  const filteredHighlights = selectedFilter === 'all' 
    ? normalizedHighlights 
    : selectedFilter.startsWith('importance:')
      ? normalizedHighlights.filter(h => h.importance === selectedFilter.replace('importance:', ''))
      : normalizedHighlights.filter(h => h.category === selectedFilter);

  // 按重要性排序：高 > 中 > 低
  const sortedHighlights = filteredHighlights.sort((a, b) => {
    const priorityA = IMPORTANCE_LEVELS[a.importance as keyof typeof IMPORTANCE_LEVELS]?.priority || 0;
    const priorityB = IMPORTANCE_LEVELS[b.importance as keyof typeof IMPORTANCE_LEVELS]?.priority || 0;
    return priorityB - priorityA;
  });

  // 统计信息
  const importanceCounts = normalizedHighlights.reduce((acc, highlight) => {
    acc[highlight.importance] = (acc[highlight.importance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = normalizedHighlights.reduce((acc, highlight) => {
    acc[highlight.category] = (acc[highlight.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  if (!highlights.length) {
    return (
      <div className="card text-center py-12">
        <Highlighter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">暂无高亮内容</h3>
        <p className="text-sm text-gray-400">
          AI分析完成后，重要的文本片段将在这里显示
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Highlighter className="w-5 h-5 text-yellow-600" />
            <span>智能高亮内容</span>
            <span className="text-sm font-normal text-gray-500">
              ({sortedHighlights.length} 项)
            </span>
          </h2>
        </div>

        {/* 双重过滤器：重要性 + 分类 */}
        <div className="space-y-4 mb-6">
          {/* 重要性过滤器 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">按重要性筛选</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-200 ${
                  selectedFilter === 'all'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>全部</span>
                <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                  {normalizedHighlights.length}
                </span>
              </button>

              {Object.entries(IMPORTANCE_LEVELS).map(([level, config]) => {
                const count = importanceCounts[level] || 0;
                if (count === 0) return null;

                return (
                  <button
                    key={level}
                    onClick={() => setSelectedFilter(`importance:${level}`)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-200 ${
                      selectedFilter === `importance:${level}`
                        ? config.color
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      selectedFilter === `importance:${level}` ? 'bg-white' : config.iconColor.replace('text-', 'bg-')
                    }`} />
                    <span>{config.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      selectedFilter === `importance:${level}` 
                        ? 'bg-white/20' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 分类过滤器 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">按内容分类筛选</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([category, count]) => {
                if (count === 0) return null;
                const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Highlighter;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedFilter(category)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-200 ${
                      selectedFilter === category
                        ? 'bg-blue-100 border-blue-200 text-blue-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${selectedFilter === category ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span>{category}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      selectedFilter === category 
                        ? 'bg-white/20' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 高亮列表 */}
        <div className="space-y-4">
          {sortedHighlights.map((highlight) => {
            const importanceConfig = IMPORTANCE_LEVELS[highlight.importance as keyof typeof IMPORTANCE_LEVELS];
            const Icon = CATEGORY_ICONS[highlight.category as keyof typeof CATEGORY_ICONS] || Highlighter;
            
            return (
              <div
                key={highlight.id}
                className={`p-4 rounded-lg border ${importanceConfig.color} hover:shadow-sm transition-shadow duration-200`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {/* 重要性指示器 */}
                    <div className={`w-3 h-3 rounded-full ${importanceConfig.iconColor.replace('text-', 'bg-')} flex-shrink-0`} />
                    
                    {/* 分类图标和标签 */}
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${importanceConfig.iconColor} flex-shrink-0`} />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-600">
                          {highlight.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {importanceConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(highlight.text, highlight.id || '')}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
                    title="复制文本"
                  >
                    {copiedId === highlight.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <blockquote className="text-gray-800 leading-relaxed mb-3 pl-4 border-l-3 border-current">
                  "{highlight.text}"
                </blockquote>

                {highlight.context && (
                  <div className="text-xs text-gray-600 bg-white/50 rounded px-2 py-1">
                    <span className="font-medium">上下文：</span>
                    {highlight.context}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedHighlights.length === 0 && selectedFilter !== 'all' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
              <Highlighter className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">
              当前筛选条件下暂无高亮内容
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
