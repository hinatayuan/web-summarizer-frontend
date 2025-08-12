# Web Summarizer Frontend

基于React+TypeScript+Vite的前端应用，用于调用Mastra HTML摘要Agent并展示结果。

## 🚀 主要特性

- **智能摘要**: 使用Mastra客户端调用Worker中的HTML摘要Agent
- **流式处理**: 支持实时流式分析，提供更好的用户体验
- **内容高亮**: 智能识别并高亮显示重要内容片段
- **历史记录**: 本地存储分析历史，支持搜索和管理
- **响应式设计**: 完全响应式UI，支持移动设备
- **实时状态**: 实时显示API连接状态和分析进度

## 🏗️ 技术栈

- **Frontend**: React 18 + TypeScript + Vite
- **样式**: Tailwind CSS + 自定义动画
- **图标**: Lucide React
- **客户端**: @mastra/client-js
- **状态管理**: React Hooks + LocalStorage
- **构建工具**: Vite + ESLint

## 🛠️ 开发环境设置

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- 运行中的Mastra Worker API (端口3000)

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/hinatayuan/web-summarizer-frontend.git
   cd web-summarizer-frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

3. **环境配置**
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件：
   ```env
   # Mastra API 基础URL
   VITE_MASTRA_API_URL=http://localhost:3000
   
   # Agent ID (对应Worker中注册的Agent名称)
   VITE_AGENT_ID=htmlSummarizer
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. **访问应用**
   打开浏览器访问 http://localhost:5173

## 📦 构建和部署

### 本地构建

```bash
npm run build
npm run preview
```

### 部署到静态托管

1. **构建生产版本**
   ```bash
   npm run build
   ```

2. **部署 `dist` 目录到你的托管平台**
   - Vercel: `vercel --prod`
   - Netlify: 拖拽 `dist` 目录到 Netlify
   - GitHub Pages: 使用 GitHub Actions
   - Cloudflare Pages: 连接 Git 仓库

### 环境变量配置

确保在部署平台设置正确的环境变量：

- `VITE_MASTRA_API_URL`: Mastra Worker API的完整URL
- `VITE_AGENT_ID`: HTML摘要Agent的ID

## 🔧 配置说明

### Mastra Client 配置

项目使用 `@mastra/client-js` 连接到Worker暴露的Mastra Server API：

```typescript
const client = new MastraClient({
  baseUrl: process.env.VITE_MASTRA_API_URL || 'http://localhost:3000'
});

// 调用Agent
const result = await client.getAgent('htmlSummarizer').generate({
  messages: [
    {
      role: 'user', 
      content: `请分析这个网页：${url}`
    }
  ]
});
```

### Agent 要求

Worker中的Agent应该：

1. **Agent ID**: 使用环境变量 `VITE_AGENT_ID` 指定的名称注册
2. **输入格式**: 接受包含URL的消息
3. **输出格式**: 返回JSON格式的摘要数据：

```typescript
interface SummaryData {
  title: string;           // 页面标题
  summary: string;         // 内容摘要
  keyPoints: string[];     // 关键要点
  keywords: string[];      // 关键词
  highlights: HighlightItem[]; // 高亮片段
  readingTime: string;     // 预估阅读时间
  sourceUrl?: string;      // 源URL
  createdAt?: string;      // 创建时间
}
```

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── Header.tsx      # 头部导航组件
│   ├── UrlInput.tsx    # URL输入组件
│   ├── SummaryCard.tsx # 摘要展示组件
│   ├── HighlightView.tsx # 高亮内容组件
│   └── HistoryPanel.tsx # 历史记录面板
├── hooks/              # 自定义Hooks
│   └── useSummarizer.ts # 摘要功能Hook
├── types/              # TypeScript类型定义
│   └── index.ts
├── utils/              # 工具函数
│   └── storage.ts      # 本地存储工具
├── App.tsx             # 主应用组件
├── main.tsx           # 应用入口
└── index.css          # 全局样式
```

## 🎨 UI/UX 特性

### 响应式设计
- 移动优先的设计方法
- 灵活的网格布局
- 自适应组件尺寸

### 交互动画
- 平滑的加载动画
- 页面切换过渡效果
- 实时状态指示器

### 用户体验
- 实时API状态监控
- 智能错误处理和重试
- 离线状态提示
- 快捷操作和键盘支持

## 🔍 功能详情

### 网页分析
1. **URL验证**: 自动验证输入的URL格式
2. **内容提取**: 通过Mastra Agent智能提取网页内容
3. **AI分析**: 使用DeepSeek等LLM生成摘要和关键信息
4. **结果展示**: 结构化展示分析结果

### 流式处理
- 支持实时流式分析
- 逐步显示分析进度
- 提供更好的用户反馈

### 历史管理
- 本地存储分析历史
- 支持搜索和过滤
- 一键加载历史结果
- 批量清理功能

### 内容高亮
- 智能识别重要内容
- 分类显示不同类型的信息
- 支持复制和分享

## 🤝 与后端集成

### API 通信
项目通过 `@mastra/client-js` 与Worker中的Mastra Server进行通信：

```typescript
// 普通调用
const result = await client.getAgent(AGENT_ID).generate(options);

// 流式调用  
const stream = await client.getAgent(AGENT_ID).stream(options);
for await (const chunk of stream) {
  // 处理流式数据
}
```

### 错误处理
- 网络连接错误
- API响应错误
- 数据解析错误
- 超时处理

### 状态管理
- 实时API连接状态
- 分析进度追踪
- 错误状态展示

## 🛠️ 开发工具

### 代码质量
- ESLint + TypeScript规则
- Prettier代码格式化
- Git hooks (推荐使用 husky)

### 调试
- React DevTools
- Vite开发服务器
- Source Map支持

### 性能优化
- 代码分割
- 懒加载组件
- 图片优化
- Bundle分析

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Mastra](https://mastra.ai/) - AI Agent框架
- [React](https://reactjs.org/) - UI框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Lucide](https://lucide.dev/) - 图标库
- [Vite](https://vitejs.dev/) - 构建工具

---

如有问题或建议，请提交 [Issue](https://github.com/hinatayuan/web-summarizer-frontend/issues) 或 [Pull Request](https://github.com/hinatayuan/web-summarizer-frontend/pulls)。
