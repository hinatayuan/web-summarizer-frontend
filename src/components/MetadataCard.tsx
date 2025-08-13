import React from 'react';
import { Clock, Database, Zap, Globe, TrendingUp } from 'lucide-react';
import { SummaryMetadata } from '../types';

interface MetadataCardProps {
  metadata: SummaryMetadata;
  className?: string;
}

const modeNames = {
  standard: '标准模式',
  detailed: '详细模式',
  concise: '简洁模式',
  technical: '技术模式',
  multilingual: '多语言模式',
  rag: 'RAG增强模式'
};

const contentTypeNames = {
  article: '文章',
  pdf: 'PDF文档',
  rss: 'RSS源',
  webpage: '网页',
  technical: '技术文档'
};

export const MetadataCard: React.FC<MetadataCardProps> = ({
  metadata,
  className = ''
}) => {
  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return 'text-red-600';
    if (similarity > 0.6) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">处理信息</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
        {/* 处理模式 */}
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-gray-500">模式</div>
            <div className="font-medium text-gray-900">
              {modeNames[metadata.mode] || metadata.mode}
            </div>
          </div>
        </div>

        {/* 内容类型 */}
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-green-500" />
          <div>
            <div className="text-gray-500">类型</div>
            <div className="font-medium text-gray-900">
              {contentTypeNames[metadata.contentType] || metadata.contentType}
            </div>
          </div>
        </div>

        {/* 处理时间 */}
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <div>
            <div className="text-gray-500">耗时</div>
            <div className="font-medium text-gray-900">
              {formatProcessingTime(metadata.processingTime)}
            </div>
          </div>
        </div>

        {/* 语言 */}
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-purple-500" />
          <div>
            <div className="text-gray-500">语言</div>
            <div className="font-medium text-gray-900">
              {metadata.language}
            </div>
          </div>
        </div>

        {/* 相似度 */}
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-gray-500">相似度</div>
            <div className={`font-medium ${getSimilarityColor(metadata.similarity)}`}>
              {(metadata.similarity * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 功能标签 */}
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <div>
            <div className="text-gray-500">功能</div>
            <div className="flex flex-wrap gap-1">
              {metadata.cached && (
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  缓存
                </span>
              )}
              {metadata.ragEnhanced && (
                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  RAG
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};