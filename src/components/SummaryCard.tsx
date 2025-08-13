import React from 'react';
import { FileText, Clock, Key, Target, ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import { SummaryData } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuickActions } from './QuickActions';
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
      // 降级方案：创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedSection(section);
        setTimeout(() => setCopiedSection(null), 2000);
      } catch (fallbackError) {
        console.error('降级复制方案也失败了:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const CopyButton: React.FC<{ text: string; section: string; disabled?: boolean }> = ({ 
    text, 
    section, 
    disabled = false 
  }) => (
    <button
      onClick={() => !disabled && copyToClipboard(text, section)}
      disabled={disabled || !text || text.trim() === ''}
      className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      title={disabled || !text ? "无内容可复制" : "复制内容"}
    >
      {copiedSection === section ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  // 处理可能的数据格式问题
  const safeRenderContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object' && content !== null) {
      // 如果是对象，尝试提取有用信息
      if (content.content) return content.content;
      if (content.text) return content.text;
      if (content.summary) return content.summary;
      // 最后尝试JSON序列化，但格式化输出
      try {
        return JSON.stringify(content, null, 2);
      } catch {
        return '数据格式错误';
      }
    }
    return String(content || '无内容');
  };

  // 安全获取数组数据
  const safeGetArray = (arr: any): any[] => {
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') {
      // 尝试解析可能的字符串数组
      try {
        const parsed = JSON.parse(arr);
        return Array.isArray(parsed) ? parsed : [arr];
      } catch {
        return [arr];
      }
    }
    if (arr && typeof arr === 'object') {
      // 如果是对象，尝试提取数组字段
      const values = Object.values(arr);
      return values.length > 0 ? values : [];
    }
    return [];
  };

  // 检查数据完整性
  const hasValidSummary = data.summary && safeRenderContent(data.summary).trim() !== '';
  const validKeyPoints = safeGetArray(data.keyPoints).filter(point => 
    point && safeRenderContent(point).trim() !== ''
  );
  const validKeywords = safeGetArray(data.keywords).filter(keyword => 
    keyword && safeRenderContent(keyword).trim() !== ''
  );

  return (
    <div className="space-y-6">
      {/* 标题和基本信息 */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
              {safeRenderContent(data.title) || '网页分析结果'}
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
              <span>{data.readingTime || '未知'}</span>
            </div>
            {data.createdAt && (
              <span>{new Date(data.createdAt).toLocaleDateString('zh-CN')}</span>
            )}
          </div>
        </div>
        
        {/* 快捷操作 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">快捷操作</h3>
          <QuickActions data={data} />
        </div>
      </div>

      {/* 摘要 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <span>内容摘要</span>
          </h2>
          <CopyButton 
            text={safeRenderContent(data.summary)} 
            section="summary" 
            disabled={!hasValidSummary}
          />
        </div>
        
        {hasValidSummary ? (
          <div className="prose prose-gray max-w-none">
            <MarkdownRenderer 
              content={safeRenderContent(data.summary)}
              className="text-gray-700"
            />
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">暂无有效摘要内容</span>
          </div>
        )}
      </div>

      {/* 关键要点 */}
      {validKeyPoints.length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>关键要点</span>
            </h2>
            <CopyButton 
              text={validKeyPoints.map((point, index) => 
                `${index + 1}. ${safeRenderContent(point)}`
              ).join('\n')} 
              section="keyPoints" 
            />
          </div>
          <div className="space-y-3">
            {validKeyPoints.map((point, index) => (
              <div 
                key={index} 
                className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-sm font-bold rounded-full flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <MarkdownRenderer 
                    content={safeRenderContent(point)}
                    className="text-gray-700 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card bg-gray-50">
          <div className="flex items-center space-x-2 text-gray-500">
            <Target className="w-5 h-5" />
            <span className="text-sm">未提取到关键要点</span>
          </div>
        </div>
      )}

      {/* 关键词 */}
      {validKeywords.length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-600" />
              <span>关键词</span>
            </h2>
            <CopyButton 
              text={validKeywords.map(keyword => safeRenderContent(keyword)).join(', ')} 
              section="keywords" 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {validKeywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors duration-200"
              >
                {safeRenderContent(keyword)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="card bg-gray-50">
          <div className="flex items-center space-x-2 text-gray-500">
            <Key className="w-5 h-5" />
            <span className="text-sm">未提取到关键词</span>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="card bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">分析统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {validKeyPoints.length}
            </div>
            <div className="text-gray-600">关键要点</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {validKeywords.length}
            </div>
            <div className="text-gray-600">关键词</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {safeGetArray(data.highlights).length}
            </div>
            <div className="text-gray-600">高亮片段</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.readingTime || '未知'}
            </div>
            <div className="text-gray-600">阅读时长</div>
          </div>
        </div>
      </div>

      {/* 数据质量提示 */}
      {(!hasValidSummary || validKeyPoints.length === 0) && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 mb-1">
                数据质量提示
              </h3>
              <p className="text-sm text-amber-700">
                部分分析结果可能不完整。这可能是由于：
              </p>
              <ul className="text-xs text-amber-600 mt-1 ml-4 list-disc">
                <li>网页内容复杂或受保护</li>
                <li>API返回数据格式异常</li>
                <li>网络连接不稳定</li>
              </ul>
              <p className="text-xs text-amber-600 mt-2">
                建议尝试重新分析或使用流式分析模式。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};