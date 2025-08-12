# Web Summarizer Frontend

基于React+TypeScript+Vite构建的前端应用，用于调用HTML摘要Agent并以美观的界面展示摘要结果。

## 功能特性

- 🎨 **现代化UI**: 使用Tailwind CSS构建的响应式界面
- ⚡ **快速开发**: 基于Vite的快速构建和热重载
- 🔗 **Agent集成**: 通过Mastra Client调用Cloudflare Workers上的AI Agent
- 📱 **响应式设计**: 支持桌面端和移动端访问
- 💾 **历史记录**: 本地存储分析历史，方便回顾
- 🎯 **智能展示**: 左侧摘要卡片，右侧原文高亮显示

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **HTTP客户端**: @mastra/client-js
- **图标**: Lucide React
- **状态管理**: React Hooks

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

### 5. 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # React组件
│   ├── Header.tsx       # 顶部导航
│   ├── UrlInput.tsx     # URL输入组件
│   ├── SummaryCard.tsx  # 摘要卡片
│   ├── HighlightView.tsx# 高亮显示
│   └── HistoryPanel.tsx # 历史记录
├── hooks/              # 自定义Hook
│   └── useSummarizer.ts# 摘要逻辑Hook
├── types/              # TypeScript类型定义
│   └── index.ts
├── utils/              # 工具函数
│   └── storage.ts      # 本地存储
├── App.tsx             # 主应用组件
└── main.tsx           # 应用入口
```

## 许可证

MIT License
