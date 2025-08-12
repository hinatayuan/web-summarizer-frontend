import { useState, useCallback } from 'react';
import { MastraClient } from '@mastra/client-js';
import { SummaryData, LoadingState, AnalysisHistory } from '../types';
import { storage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_MASTRA_API_URL || 'http://localhost:3000';
const AGENT_ID = import.meta.env.VITE_AGENT_ID || 'htmlSummarizer';

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
      console.log('正在调用Mastra Agent，URL:', API_BASE_URL, 'Agent ID:', AGENT_ID);
      
      const result = await client.getAgent(AGENT_ID).generate({
        messages: [
          {
            role: 'user',
            content: `请分析这个网页并返回JSON格式的摘要：${url}`
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
        } catch (parseError) {
          console.error('JSON解析失败:', parseError);
          // 如果解析失败，创建基本结构
          summaryData = {
            title: '网页分析结果',
            summary: result,
            keyPoints: [],
            keywords: [],
            highlights: [],
            readingTime: '未知',
            sourceUrl: url
          };
        }
      } else if (result && typeof result === 'object') {
        // 如果返回的是对象，直接使用并确保包含sourceUrl
        summaryData = { ...result, sourceUrl: url } as SummaryData;
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
      if (!summaryData.sourceUrl) summaryData.sourceUrl = url;
      if (!summaryData.createdAt) summaryData.createdAt = new Date().toISOString();

      // 为highlights添加ID（如果没有的话）
      summaryData.highlights = summaryData.highlights.map((highlight, index) => ({
        ...highlight,
        id: highlight.id || `highlight-${index}`,
        type: highlight.type || 'important'
      }));

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
      let errorMessage = '分析失败，请稍后重试';
      
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = '无法连接到服务器，请检查网络连接';
        } else if (err.message.includes('timeout')) {
          errorMessage = '请求超时，请稍后重试';
        } else {
          errorMessage = err.message;
        }
      }
      
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

      console.log('正在进行流式分析，URL:', API_BASE_URL, 'Agent ID:', AGENT_ID);

      // 尝试使用流式API
      const stream = await client.getAgent(AGENT_ID).stream({
        messages: [
          {
            role: 'user',
            content: `请分析这个网页并以流式方式返回摘要：${url}`
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
          readingTime: '未知',
          sourceUrl: url,
          createdAt: new Date().toISOString()
        };
      }

      // 确保数据完整性
      if (!summaryData.sourceUrl) summaryData.sourceUrl = url;
      if (!summaryData.createdAt) summaryData.createdAt = new Date().toISOString();

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
