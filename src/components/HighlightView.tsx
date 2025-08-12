import React, { useState } from 'react';
import { Highlighter, Quote, TrendingUp, Target, Filter, Copy, Check } from 'lucide-react';
import { HighlightItem } from '../types';

interface HighlightViewProps {
  highlights: HighlightItem[];
}

const HIGHLIGHT_TYPES = {
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
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHighlights = selectedType === 'all' 
    ? highlights 
    : highlights.filter(h => h.type === selectedType);

  const highlightCounts = highlights.reduce((acc, highlight) => {
    acc[highlight.type] = (acc[highlight.type] || 0) + 1;
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
            <span>内容高亮</span>
            <span className="text-sm font-normal text-gray-500">
              ({filteredHighlights.length} 项)
            </span>
          </h2>
        </div>

        {/* 类型过滤器 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedType('all')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-200 ${
              selectedType === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>全部</span>
            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs">
              {highlights.length}
            </span>
          </button>

          {Object.entries(HIGHLIGHT_TYPES).map(([type, config]) => {
            const count = highlightCounts[type] || 0;
            if (count === 0) return null;

            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors duration-200 ${
                  selectedType === type
                    ? config.color
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${selectedType === type ? config.iconColor : 'text-gray-500'}`} />
                <span>{config.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  selectedType === type 
                    ? 'bg-white/20' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 高亮列表 */}
        <div className="space-y-4">
          {filteredHighlights.map((highlight) => {
            const config = HIGHLIGHT_TYPES[highlight.type];
            const Icon = config.icon;

            return (
              <div
                key={highlight.id}
                className={`p-4 rounded-lg border ${config.color} hover:shadow-sm transition-shadow duration-200`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${config.iconColor} flex-shrink-0`} />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {config.label}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(highlight.text, highlight.id)}
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

                <blockquote className="text-gray-800 leading-relaxed mb-3 pl-4 border-l-2 border-current">
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

        {filteredHighlights.length === 0 && selectedType !== 'all' && (
          <div className="text-center py-8">
            <div className={`w-12 h-12 rounded-full ${HIGHLIGHT_TYPES[selectedType as keyof typeof HIGHLIGHT_TYPES]?.color} mx-auto mb-3 flex items-center justify-center`}>
              {(() => {
                const Icon = HIGHLIGHT_TYPES[selectedType as keyof typeof HIGHLIGHT_TYPES]?.icon;
                return Icon ? <Icon className="w-6 h-6" /> : null;
              })()}
            </div>
            <p className="text-gray-500">
              暂无「{HIGHLIGHT_TYPES[selectedType as keyof typeof HIGHLIGHT_TYPES]?.label}」类型的高亮内容
            </p>
          </div>
        )}
      </div>

      {/* 快速统计 */}
      {highlights.length > 0 && (
        <div className="card bg-gradient-to-r from-yellow-50 to-orange-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">高亮统计</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(HIGHLIGHT_TYPES).map(([type, config]) => {
              const count = highlightCounts[type] || 0;
              if (count === 0) return null;

              const Icon = config.icon;
              return (
                <div key={type} className="flex items-center space-x-2 text-sm">
                  <Icon className={`w-4 h-4 ${config.iconColor}`} />
                  <span className="text-gray-600">{config.label}:</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
