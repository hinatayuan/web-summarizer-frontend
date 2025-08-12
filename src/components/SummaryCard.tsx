import React from 'react';
import { FileText, Clock, Key, Target, ExternalLink, Copy, Check } from 'lucide-react';
import { SummaryData } from '../types';
import { useState } from 'react';

interface SummaryCardProps {
  data: SummaryData;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ data }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const CopyButton: React.FC<{ text: string; section: string }> = ({ text, section }) => (
    <button
      onClick={() => copyToClipboard(text, section)}
      className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200"
      title="复制内容"
    >
      {copiedSection === section ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* 标题和基本信息 */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
              {data.title}
            </h1>
            {data.sourceUrl && (
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4" />
                <span>访问原文</span>
              </a>
            )}
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{data.readingTime}</span>
            </div>
            {data.createdAt && (
              <span>{new Date(data.createdAt).toLocaleDateString('zh-CN')}</span>
            )}
          </div>
        </div>
      </div>

      {/* 摘要 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <span>内容摘要</span>
          </h2>
          <CopyButton text={data.summary} section="summary" />
        </div>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {data.summary}
          </p>
        </div>
      </div>

      {/* 关键要点 */}
      {data.keyPoints && data.keyPoints.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>关键要点</span>
            </h2>
            <CopyButton 
              text={data.keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')} 
              section="keyPoints" 
            />
          </div>
          <div className="space-y-3">
            {data.keyPoints.map((point, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-gray-700 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 关键词 */}
      {data.keywords && data.keywords.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-600" />
              <span>关键词</span>
            </h2>
            <CopyButton 
              text={data.keywords.join(', ')} 
              section="keywords" 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors duration-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="card bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">分析统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {data.keyPoints?.length || 0}
            </div>
            <div className="text-gray-600">关键要点</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.keywords?.length || 0}
            </div>
            <div className="text-gray-600">关键词</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.highlights?.length || 0}
            </div>
            <div className="text-gray-600">高亮片段</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.readingTime}
            </div>
            <div className="text-gray-600">阅读时长</div>
          </div>
        </div>
      </div>
    </div>
  );
};
