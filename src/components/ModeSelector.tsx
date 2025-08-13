import React from 'react';
import { FileText, Book, Zap, Code, Globe, Brain } from 'lucide-react';
import { SummaryMode } from '../types';

interface ModeSelectorProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
  className?: string;
}

const summaryModes: SummaryMode[] = [
  {
    id: 'standard',
    name: '标准模式',
    description: '150-200字核心摘要，适合一般文章',
    icon: 'FileText'
  },
  {
    id: 'detailed',
    name: '详细模式',
    description: '300-500字详细摘要，适合长文档或学术内容',
    icon: 'Book'
  },
  {
    id: 'concise',
    name: '简洁模式',
    description: '50-100字精简摘要，适合新闻或短内容',
    icon: 'Zap'
  },
  {
    id: 'technical',
    name: '技术模式',
    description: '技术要点提取，适合技术文档',
    icon: 'Code'
  },
  {
    id: 'multilingual',
    name: '多语言模式',
    description: '自动检测并翻译为中文',
    icon: 'Globe'
  },
  {
    id: 'rag',
    name: 'RAG增强模式',
    description: '结合历史相关内容生成更准确摘要',
    icon: 'Brain'
  }
];

const iconMap = {
  FileText,
  Book,
  Zap,
  Code,
  Globe,
  Brain
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        摘要模式
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {summaryModes.map((mode) => {
          const IconComponent = iconMap[mode.icon as keyof typeof iconMap];
          const isSelected = selectedMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-900' 
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }
                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              <div className="flex items-start space-x-3">
                <IconComponent 
                  className={`w-5 h-5 mt-0.5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-500'
                  }`} 
                />
                <div className="flex-1">
                  <div className={`font-medium text-sm ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {mode.name}
                  </div>
                  <div className={`text-xs mt-1 ${
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {mode.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};