export interface SummaryData {
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  highlights: HighlightItem[];
  readingTime: string;
  sourceUrl?: string;
  createdAt?: string;
  contentStats?: ContentStats;
  metadata?: SummaryMetadata;
  relatedContent?: string[];
  translations?: Record<string, any>;
}

export interface HighlightItem {
  id?: string;
  text: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
  context?: string;
  startIndex?: number;
  endIndex?: number;
  // 兼容旧格式
  type?: 'important' | 'quote' | 'statistic' | 'conclusion';
}

export interface ContentStats {
  totalWords: number;
  highlightCount: number;
  importantHighlights: number;
}

// 新增：摘要元数据类型
export interface SummaryMetadata {
  mode: 'standard' | 'detailed' | 'concise' | 'technical' | 'multilingual' | 'rag';
  language: string;
  contentType: 'article' | 'pdf' | 'rss' | 'webpage' | 'technical';
  processingTime: number;
  cached: boolean;
  ragEnhanced: boolean;
  similarity: number;
}

// 新增：摘要模式选择
export interface SummaryMode {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 新增：内容类型
export interface ContentType {
  type: 'url' | 'pdf' | 'rss' | 'text';
  label: string;
  icon: string;
}

export interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: 'fetching' | 'extracting' | 'analyzing' | 'complete';
}

export interface AnalysisHistory {
  id: string;
  url: string;
  title: string;
  summary: string;
  createdAt: string;
  data: SummaryData;
}

export interface ApiStatus {
  status: 'online' | 'offline' | 'unknown';
  lastChecked?: string;
  latency?: number;
}

export interface StreamChunk {
  type: 'chunk' | 'complete' | 'error';
  content: string;
  timestamp: number;
}

// Mastra Agent相关类型
export interface MastraMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MastraGenerateOptions {
  messages: MastraMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface MastraAgent {
  generate(options: MastraGenerateOptions): Promise<any>;
  stream(options: MastraGenerateOptions): AsyncIterable<string>;
}
