import React from 'react';
import { Link, FileText, Rss, Type } from 'lucide-react';
import { ContentType } from '../types';

interface ContentTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  className?: string;
}

const contentTypes: ContentType[] = [
  {
    type: 'url',
    label: '网页链接',
    icon: 'Link'
  },
  {
    type: 'pdf',
    label: 'PDF文档',
    icon: 'FileText'
  },
  {
    type: 'rss',
    label: 'RSS订阅',
    icon: 'Rss'
  },
  {
    type: 'text',
    label: '纯文本',
    icon: 'Type'
  }
];

const iconMap = {
  Link,
  FileText,
  Rss,
  Type
};

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        内容类型
      </label>
      <div className="flex flex-wrap gap-2">
        {contentTypes.map((type) => {
          const IconComponent = iconMap[type.icon as keyof typeof iconMap];
          const isSelected = selectedType === type.type;
          
          return (
            <button
              key={type.type}
              onClick={() => onTypeChange(type.type)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-900' 
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }
                hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              <IconComponent 
                className={`w-4 h-4 ${
                  isSelected ? 'text-blue-600' : 'text-gray-500'
                }`} 
              />
              <span className={`text-sm font-medium ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};