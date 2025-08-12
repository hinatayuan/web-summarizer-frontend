import { AnalysisHistory } from '../types';

const STORAGE_KEY = 'web-summarizer-history';
const MAX_HISTORY_ITEMS = 50;

export const storage = {
  // 获取历史记录
  getHistory(): AnalysisHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const history = JSON.parse(data) as AnalysisHistory[];
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('读取历史记录失败:', error);
      return [];
    }
  },

  // 保存到历史记录
  saveToHistory(item: AnalysisHistory): void {
    try {
      const history = this.getHistory();
      
      // 检查是否已存在相同URL的记录，如果存在则更新
      const existingIndex = history.findIndex(h => h.url === item.url);
      if (existingIndex !== -1) {
        history[existingIndex] = item;
      } else {
        // 添加新记录到开头
        history.unshift(item);
      }
      
      // 限制历史记录数量
      if (history.length > MAX_HISTORY_ITEMS) {
        history.splice(MAX_HISTORY_ITEMS);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  },

  // 从历史记录中删除指定项
  deleteFromHistory(id: string): void {
    try {
      const history = this.getHistory();
      const filteredHistory = history.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('删除历史记录失败:', error);
    }
  },

  // 清空所有历史记录
  clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('清空历史记录失败:', error);
    }
  },

  // 导出历史记录
  exportHistory(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  },

  // 导入历史记录
  importHistory(jsonData: string): boolean {
    try {
      const importedHistory = JSON.parse(jsonData) as AnalysisHistory[];
      
      if (!Array.isArray(importedHistory)) {
        throw new Error('导入数据格式不正确');
      }

      // 验证数据结构
      const validHistory = importedHistory.filter(item => {
        return item.id && item.url && item.title && item.createdAt && item.data;
      });

      if (validHistory.length === 0) {
        throw new Error('没有找到有效的历史记录');
      }

      // 与现有历史记录合并
      const currentHistory = this.getHistory();
      const mergedHistory = [...validHistory, ...currentHistory];
      
      // 去重（基于URL）
      const uniqueHistory = mergedHistory.filter((item, index, arr) => 
        arr.findIndex(h => h.url === item.url) === index
      );

      // 限制数量
      if (uniqueHistory.length > MAX_HISTORY_ITEMS) {
        uniqueHistory.splice(MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueHistory));
      return true;
    } catch (error) {
      console.error('导入历史记录失败:', error);
      return false;
    }
  }
};
