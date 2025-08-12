import { useState, useCallback } from 'react';
import { MastraClient } from '@mastra/client-js';
import { SummaryData, LoadingState, AnalysisHistory } from '../types';
import { storage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_MASTRA_API_URL || 'http://localhost:3000';

export const useSummarizer = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    stage: 'fetching'
  });
  const [currentData, setCurrentData] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>(() => storage.getHistory());
  const [isStreaming, setIsStreaming] = useState(false);

  // 初始化MastraClient
  const client = new MastraClient({
    baseUrl: API_BASE_URL
  });

  // 模拟进度更新
  const simulateProgress = useCallback((stage: LoadingState['stage'], duration: number) => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const increment = 100 / (duration / 100);
      
      const timer = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          resolve();
        }
        
        setLoadingState(prev => ({
          ...prev,
          progress: Math.min(progress, 100),
          stage
        }));
      }, 100);
    });
  }, []);

  // 使用MastraClient调用Agent
  const analyzePage = useCallback(async (url: string): Promise<SummaryData | null> => {
    if (!url.trim()) {
      setError('请输入有效的URL');
      return null;
    }

    try {
      setError(null);
      setLoadingState({ isLoading: true, progress: 0, stage: 'fetching' });

      // 模拟进度
      await simulateProgress('fetching', 1000);
      setLoadingState(prev => ({ ...prev, stage: 'extracting' }));
      await simulateProgress('extracting', 1000);
      setLoadingState(prev => ({ ...prev, stage: 'analyzing' }));

      // 调用MastraClient的Agent
      console.log('正在调用Mastra Agent，URL:', API_BASE_URL);
      
      const result = await client.getAgent('summarizerAgent').generate({
        messages: [
          {
            role: 'user',
            content: `请分析这个网页：${url}`
          }
        ]
      });

      await simulateProgress('complete', 500);

      // 解析返回结果
      let summaryData: SummaryData;
      
      if (typeof result === 'string') {
        try {
          // 尝试解析JSON字符串
          summaryData = JSON.parse(result);
        } catch {
          // 如果解析失败，创建基本结构
          summaryData = {
            title: '网页分析结果',
            summary: result,
            keyPoints: [],
            keywords: [],
            highlights: [],
            readingTime: '未知'
          };
        }
      } else if (result && typeof result === 'object') {
        // 如果返回的是对象，直接使用
        summaryData = result as SummaryData;
      } else {
        throw new Error('API返回格式不正确');
      }

      // 确保数据结构完整
      if (!summaryData.title) summaryData.title = '网页分析结果';
      if (!summaryData.summary) summaryData.summary = '无法获取摘要';
      if (!Array.isArray(summaryData.keyPoints)) summaryData.keyPoints = [];
      if (!Array.isArray(summaryData.keywords)) summaryData.keywords = [];
      if (!Array.isArray(summaryData.highlights)) summaryData.highlights = [];
      if (!summaryData.readingTime) summaryData.readingTime = '未知';

      // 保存到历史记录
      const historyItem: AnalysisHistory = {
        id: Date.now().toString(),
        url,
        title: summaryData.title,
        summary: summaryData.summary,
        createdAt: new Date().toISOString(),
        data: summaryData
      };

      storage.saveToHistory(historyItem);
      setHistory(storage.getHistory());
      setCurrentData(summaryData);
      
      return summaryData;

    } catch (err) {
      console.error('分析失败:', err);
      const errorMessage = err instanceof Error ? err.message : '分析失败，请稍后重试';
      setError(errorMessage);
      return null;
    } finally {
      setLoadingState({ isLoading: false, progress: 100, stage: 'complete' });
    }
  }, [client, simulateProgress]);

  // 流式调用Agent（如果支持）
  const analyzePageStream = useCallback(async (url: string, onChunk?: (chunk: string) => void): Promise<SummaryData | null> => {
    if (!url.trim()) {
      setError('请输入有效的URL');
      return null;
    }

    try {
      setError(null);
      setIsStreaming(true);
      setLoadingState({ isLoading: true, progress: 0, stage: 'fetching' });

      console.log('正在进行流式分析，URL:', API_BASE_URL);

      // 尝试使用流式API
      const stream = await client.getAgent('summarizerAgent').stream({
        messages: [
          {
            role: 'user',
            content: `请分析这个网页：${url}`
          }
        ]
      });

      let fullResponse = '';
      
      // 处理流式响应
      for await (const chunk of stream) {
        if (chunk) {
          fullResponse += chunk;
          onChunk?.(chunk);
        }
      }

      // 解析最终结果
      let summaryData: SummaryData;
      try {
        summaryData = JSON.parse(fullResponse);
      } catch {
        summaryData = {
          title: '流式分析结果',
          summary: fullResponse,
          keyPoints: [],
          keywords: [],
          highlights: [],
          readingTime: '未知'
        };
      }

      setCurrentData(summaryData);
      return summaryData;

    } catch (err) {
      console.error('流式分析失败:', err);
      // 回退到普通分析
      return await analyzePage(url);
    } finally {
      setIsStreaming(false);
      setLoadingState({ isLoading: false, progress: 100, stage: 'complete' });
    }
  }, [client, analyzePage]);

  const loadFromHistory = useCallback((item: AnalysisHistory) => {
    setCurrentData(item.data);
    setError(null);
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    storage.deleteFromHistory(id);
    setHistory(storage.getHistory());
  }, []);

  const clearAllHistory = useCallback(() => {
    storage.clearHistory();
    setHistory([]);
  }, []);

  return {
    loadingState,
    currentData,
    error,
    history,
    isStreaming,
    analyzePage,
    analyzePageStream,
    loadFromHistory,
    deleteHistoryItem,
    clearAllHistory
  };
};
