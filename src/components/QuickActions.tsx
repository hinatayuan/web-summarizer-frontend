import React from 'react';
import { Copy, Download, Share2, BookOpen, Languages, Search } from 'lucide-react';
import { SummaryData } from '../types';

interface QuickActionsProps {
  data: SummaryData;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  data,
  className = ''
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加一个 toast 通知
      console.log('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const downloadAsMarkdown = () => {
    const markdown = `# ${data.title}

## 摘要
${data.summary}

## 关键要点
${data.keyPoints.map(point => `- ${point}`).join('\n')}

## 关键词
${data.keywords.join(', ')}

## 高亮内容
${data.highlights.map(h => `- **${h.importance}**: ${h.text}`).join('\n')}

---
预计阅读时间: ${data.readingTime}
${data.metadata ? `处理模式: ${data.metadata.mode}` : ''}
${data.sourceUrl ? `来源: ${data.sourceUrl}` : ''}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title || 'summary'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareContent = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.summary,
          url: data.sourceUrl
        });
      } catch (err) {
        console.error('分享失败:', err);
      }
    } else {
      // 回退到复制链接
      copyToClipboard(`${data.title}\n\n${data.summary}\n\n${data.sourceUrl || ''}`);
    }
  };

  const openOriginalUrl = () => {
    if (data.sourceUrl) {
      window.open(data.sourceUrl, '_blank');
    }
  };

  const searchRelated = () => {
    const searchQuery = data.keywords.slice(0, 3).join(' ');
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank');
  };

  const translateSummary = async () => {
    // 这里可以集成翻译API或使用浏览器的翻译功能
    console.log('翻译功能待实现');
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={() => copyToClipboard(data.summary)}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        title="复制摘要"
      >
        <Copy className="w-4 h-4" />
        <span>复制</span>
      </button>

      <button
        onClick={downloadAsMarkdown}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors"
        title="下载Markdown"
      >
        <Download className="w-4 h-4" />
        <span>下载</span>
      </button>

      <button
        onClick={shareContent}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg transition-colors"
        title="分享内容"
      >
        <Share2 className="w-4 h-4" />
        <span>分享</span>
      </button>

      {data.sourceUrl && (
        <button
          onClick={openOriginalUrl}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors"
          title="查看原文"
        >
          <BookOpen className="w-4 h-4" />
          <span>原文</span>
        </button>
      )}

      <button
        onClick={searchRelated}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg transition-colors"
        title="搜索相关内容"
      >
        <Search className="w-4 h-4" />
        <span>搜索</span>
      </button>

      <button
        onClick={translateSummary}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-colors"
        title="翻译摘要"
      >
        <Languages className="w-4 h-4" />
        <span>翻译</span>
      </button>
    </div>
  );
};