# AI 处理系统

一个基于 Next.js 14 和智谱 AI API 构建的 AI 处理系统，支持 AI 图片解析、AI 生图和 AI 生视频功能。系统提供美观的用户界面，支持深色模式，并具有实时预览功能。

## 功能特点

- 🖼️ **AI 图片解析**：支持图片URL输入或本地图片上传，智能分析图片内容
- 🎨 **AI 文生图**：根据文本描述自动生成高质量图片
- 🎬 **AI 文生视频**：根据文本描述自动生成视频，支持实时状态查询
- 🎯 **实时预览**：支持图片和视频实时预览
- 🌈 **现代界面**：基于Tailwind CSS的简约美观用户界面
- 🌙 **深色模式**：自适应系统主题，支持明暗主题切换
- 📱 **响应式设计**：适配不同屏幕尺寸的设备

## 技术栈

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/ui
- 智谱 AI API

## 开始使用

### 前置要求

- Node.js 18+
- pnpm
- 智谱 AI API Key（[获取方式](https://open.bigmodel.cn/)）

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/Vergil-coder/AI-processing-system.git
cd AI-processing-system
```

2. 安装依赖

```bash
pnpm install
```

3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，添加你的智谱 AI API 密钥：

```bash
ZHIPU_API_KEY=your_api_key
```

4. 启动开发服务器

```bash
pnpm dev
```

现在可以访问 http://localhost:3000 查看应用。

## 使用说明

###AI 图片解析

1. 切换到"AI 图片解析"标签
2. 选择输入方式：
   - 输入图片URL并点击"预览"查看图片
   - 或点击"上传本地图片"选择本地图片文件
3. 确认图片预览正确显示
4. 点击"开始分析"获取AI分析结果

### AI 文生图

1. 切换到"AI 文生图"标签
2. 在文本框中输入详细的图片描述
   - 描述越详细，生成的图片效果越好
3. 点击"开始生成"按钮
4. 等待几秒钟，生成的图片将在右侧显示

### AI 文生视频

1. 切换到"AI 文生视频"标签
2. 在文本框中输入详细的视频描述
   - 可以描述视频场景、动作、风格等
3. 点击"开始生成"按钮
4. 系统会显示实时生成状态：
   - 创建任务中...
   - 正在生成视频，请耐心等待...
5. 生成过程通常需要几分钟，完成后视频将自动播放

## 环境变量说明

项目使用了以下环境变量：

- `ZHIPU_API_KEY`：智谱 AI 的 API 密钥，必需
  - 格式：`api_key.api_secret`
  - 获取方式：访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
  - 注册账号并创建API密钥后，将密钥填入`.env.local`文件

⚠️ 注意：请勿在公共环境中暴露您的 API 密钥。

## 开发说明

### 项目结构

```
├── app/                # Next.js 应用目录
│   ├── api/            # API 路由
│   │   ├── analyze/    # 图片解析API
│   │   ├── generate/   # 图片生成API
│   │   └── generate-video/ # 视频生成API
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 布局组件
│   └── page.tsx        # 主页面组件
├── components/         # UI组件
│   └── ui/             # 基础UI组件
├── lib/                # 工具库
└── public/             # 静态资源
```

### API 路由

- `/api/analyze`: 图片解析接口，支持URL和Base64格式图片
- `/api/generate`: 图片生成接口，返回生成图片的URL
- `/api/generate-video`: 视频生成接口，创建异步生成任务
- `/api/generate-video/status`: 视频生成状态查询接口，轮询获取生成结果

### 使用的模型

- 图片解析：`glm-4v-flash` - 智谱AI的多模态大模型，支持图像理解
- 图片生成：`cogview-3-flash` - 智谱AI的文生图模型，生成高质量图像
- 视频生成：`cogvideox-flash` - 智谱AI的文生视频模型，生成短视频

### 技术实现

- 使用Next.js 14的App Router架构
- 基于React Hooks实现状态管理
- 使用Tailwind CSS实现响应式设计
- 集成Shadcn UI组件库提升界面美观度
- 实现异步任务状态轮询机制

