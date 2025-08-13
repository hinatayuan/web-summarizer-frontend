import React from 'react';
import { BarChart3, FileText, Highlighter, TrendingUp } from 'lucide-react';
import { ContentStats, HighlightItem } from '../types';

interface ContentStatsCardProps {
  contentStats?: ContentStats;
  highlights?: HighlightItem[];
  title: string;
  summary: string;
}

export const ContentStatsCard: React.FC<ContentStatsCardProps> = ({
  contentStats,
  highlights = [],
  title,
  summary
}) => {
  // 计算统计数据 - 兼容新旧格式
  const normalizedHighlights = highlights.map(h => ({
    ...h,
    importance: h.importance || 'medium'
  }));

  const stats = {
    totalWords: contentStats?.totalWords || summary.length || 0,
    highlightCount: contentStats?.highlightCount || highlights.length,
    importantHighlights: contentStats?.importantHighlights || 
      normalizedHighlights.filter(h => h.importance === 'high').length
  };

  // 计算各重要性级别的分布
  const importanceDistribution = normalizedHighlights.reduce((acc, highlight) => {
    acc[highlight.importance] = (acc[highlight.importance] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 计算分析质量得分 (0-100)
  const qualityScore = Math.min(100, Math.round(
    (stats.importantHighlights * 20) + 
    (stats.highlightCount * 3) + 
    (title !== '未知标题' ? 20 : 0) +
    (summary.length > 100 ? 20 : summary.length / 5)
  ));

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatNumber = (num: number) => {
    if (num > 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>内容分析统计</span>
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(qualityScore)}`}>
          质量分: {qualityScore}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* 总字数 */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatNumber(stats.totalWords)}
          </div>
          <div className="text-xs text-gray-600">总字数</div>
        </div>

        {/* 高亮数量 */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg mx-auto mb-2">
            <Highlighter className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.highlightCount}
          </div>
          <div className="text-xs text-gray-600">高亮内容</div>
        </div>

        {/* 重要高亮 */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.importantHighlights}
          </div>
          <div className="text-xs text-gray-600">重要内容</div>
        </div>

        {/* 覆盖率 */}
        <div className="text-center">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-2">
            <div className="w-5 h-5 bg-green-600 rounded-full"></div>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.totalWords > 0 ? Math.round((stats.highlightCount / Math.max(stats.totalWords / 100, 1)) * 10) / 10 : 0}%
          </div>
          <div className="text-xs text-gray-600">覆盖率</div>
        </div>
      </div>

      {/* 重要性分布 */}
      {Object.keys(importanceDistribution).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">重要性分布</h4>
          <div className="space-y-2">
            {[
              { key: 'high', label: '高重要性', color: 'bg-red-500' },
              { key: 'medium', label: '中重要性', color: 'bg-yellow-500' },
              { key: 'low', label: '低重要性', color: 'bg-gray-400' }
            ].map(({ key, label, color }) => {
              const count = importanceDistribution[key] || 0;
              const percentage = stats.highlightCount > 0 ? (count / stats.highlightCount) * 100 : 0;
              
              if (count === 0) return null;
              
              return (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0`} />
                  <span className="text-xs text-gray-600 flex-1">{label}</span>
                  <span className="text-xs font-medium text-gray-900">{count}</span>
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 分析提示 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {qualityScore >= 80 && "✨ 分析质量优秀，内容丰富且结构清晰"}
          {qualityScore >= 60 && qualityScore < 80 && "📊 分析质量良好，建议关注重要内容提取"}
          {qualityScore < 60 && "🔍 可尝试分析包含更多结构化内容的页面"}
        </div>
      </div>
    </div>
  );
};