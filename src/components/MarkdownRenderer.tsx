import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = "" 
}) => {
  // 将 Markdown 转换为 HTML
  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    
    return text
      // 标题处理
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-6 mb-3 border-b border-gray-200 pb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-800 mt-8 mb-4 border-b-2 border-gray-300 pb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-6 border-b-2 border-gray-400 pb-3">$1</h1>')
      
      // 粗体和斜体
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold text-gray-900"><em class="italic">$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      
      // 代码块和行内代码
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 border border-gray-300 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-gray-800">$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // 无序列表
      .replace(/^[\s]*[-*+] (.*)$/gm, '<li class="flex items-start mb-2"><span class="text-blue-500 mr-2 mt-1">•</span><span class="flex-1">$1</span></li>')
      
      // 有序列表 - 使用简化的方法，用静态编号
      .replace(/^[\s]*\d+\. (.*)$/gm, '<li class="flex items-start mb-2"><span class="text-blue-600 font-semibold mr-2 mt-1 min-w-[1.5rem]">•</span><span class="flex-1">$1</span></li>')
      
      // 引用块
      .replace(/^> (.*)$/gm, '<blockquote class="border-l-4 border-blue-300 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">$1</blockquote>')
      
      // 水平分割线
      .replace(/^---$/gm, '<hr class="border-t border-gray-300 my-6">')
      
      // 段落处理（在最后进行，避免干扰其他格式）
      .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-gray-700">')
      
      // 换行处理
      .replace(/\n/g, '<br>');
  };

  // 包装列表项
  const wrapLists = (html: string): string => {
    // 包装无序列表
    html = html.replace(
      /(<li class="flex items-start mb-2"><span class="text-blue-500[^>]*>[^<]*<\/span>[\s\S]*?<\/li>(?:\s*<li class="flex items-start mb-2"><span class="text-blue-500[^>]*>[^<]*<\/span>[\s\S]*?<\/li>)*)/g,
      '<ul class="my-4 space-y-1">$1</ul>'
    );
    
    // 包装有序列表
    html = html.replace(
      /(<li class="flex items-start mb-2"><span class="text-blue-600[^>]*>[^<]*<\/span>[\s\S]*?<\/li>(?:\s*<li class="flex items-start mb-2"><span class="text-blue-600[^>]*>[^<]*<\/span>[\s\S]*?<\/li>)*)/g,
      '<ol class="my-4 space-y-1">$1</ol>'
    );
    
    return html;
  };

  const processedContent = () => {
    let html = renderMarkdown(content);
    html = wrapLists(html);
    
    // 如果没有段落标签，添加默认段落包装
    if (!html.includes('<p')) {
      html = `<p class="mb-4 leading-relaxed text-gray-700">${html}</p>`;
    } else {
      // 确保第一个段落有正确的类
      html = `<p class="mb-4 leading-relaxed text-gray-700">${html}</p>`;
    }
    
    return html;
  };

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent() }}
    />
  );
};

// 轻量级 Markdown 渲染器（用于流式显示）
export const StreamMarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = "" 
}) => {
  // 简化的 Markdown 处理，专门用于流式显示
  const renderStreamMarkdown = (text: string): string => {
    if (!text) return '';
    
    return text
      // 基本格式
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-1 rounded text-sm">$1</code>')
      
      // 简单的标题处理
      .replace(/^### (.*$)/gm, '<div class="text-lg font-semibold text-gray-800 mt-4 mb-2 border-b border-gray-200 pb-1">$1</div>')
      .replace(/^## (.*$)/gm, '<div class="text-xl font-semibold text-gray-800 mt-6 mb-3 border-b border-gray-300 pb-2">$1</div>')
      .replace(/^# (.*$)/gm, '<div class="text-2xl font-bold text-gray-900 mt-6 mb-4 border-b-2 border-gray-400 pb-2">$1</div>')
      
      // 列表处理（简化）
      .replace(/^[-*+] (.*)$/gm, '<div class="flex items-start my-1"><span class="text-blue-500 mr-2">•</span><span>$1</span></div>')
      .replace(/^\d+\. (.*)$/gm, '<div class="flex items-start my-1"><span class="text-blue-600 font-semibold mr-2">•</span><span>$1</span></div>')
      
      // 段落和换行
      .replace(/\n\n/g, '</div><div class="mb-3">')
      .replace(/\n/g, '<br>');
  };

  const processedContent = renderStreamMarkdown(content);
  const wrappedContent = processedContent ? `<div class="mb-3">${processedContent}</div>` : '';

  return (
    <div 
      className={`text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: wrappedContent }}
    />
  );
};