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
