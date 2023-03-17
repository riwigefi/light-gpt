# light-gpt

Light-GPT is an interactive website project based on the GPT-3.5-Turbo Model.

This is a small application built using the Next.js framework and deployed on the Vercel platform.

Application experience address: https://light-gpt.vercel.app Repository address: https://github.com/riwigefi/light-gpt

## Features

1. This is a pure front-end application based on the gpt-3.5-turbo model that supports context-based conversations and API key access to the OpenAI service.
2. Users can set avatars for both parties in the conversation (user avatar and robot avatar).
3. Users can set their own OpenAI API key to ensure fast access. The API key set by the user will be saved on the client side and will not be leaked. **Due to limited personal funds and the fact that this project is purely a front-end application without any back-end services, there is currently no built-in api_key for testing purposes. If you are still concerned about security, you can deploy this project locally and then access it.**
4. GPT replies support syntax highlighting and one-click code copying (PC only).
   Conversations support exporting images and PDF documents.
5. The application has been adapted for both PC and mobile devices for easy use.
6. Now it supports starting a new themed conversation and reviewing historical themed conversations. All of these conversation data is stored in IndexedDB on your local device.**There is no risk of any data leakage!**

It took one week from idea to implementation, and everyone is welcome to experience and use it. Any feedback and suggestions for improvement are also welcome.

If this application sharing can inspire and help others, it would be the greatest significance of my project. If it's not too much trouble, I would also be very grateful if you could give my project a star.

## how to deploy locally

To deploy this application locally, you need to follow the following steps(**Node version 16 or above is required**):

1. Clone the project to your local machine:

```bash
git clone https://github.com/riwigefi/light-gpt.git
```

2. Navigate to the project directory and install the dependencies:

```bash
cd light-gpt
pnpm install
```

1. Start the application:

```bash
pnpm run dev
```

The application will start at http://localhost:3000. Now, you can access the application locally and test it，enter your API key，and start to chat.

# Light-GPT

Light-GPT 是一个基于 GPT-3.5-Turbo 模型的交互式网站项目。

这是一个使用 Next.js 框架构建并部署在 Vercel 平台上的小型应用程序。

应用体验地址：https://light-gpt.vercel.app 仓库地址：https://github.com/riwigefi/light-gpt

## 功能

1. 这是一个纯前端应用程序，基于 gpt-3.5-turbo 模型，支持基于上下文的对话和 OpenAI 服务的 API 密钥访问。
2. 用户可以为对话中的双方设置头像（用户头像和机器人头像）。
3. 用户可以设置自己的 OpenAI API 密钥，以确保快速访问。用户设置的 API 密钥将保存在客户端，并且不会泄漏。由于个人资金有限，而且这个项目纯粹是一个前端应用程序，没有后端服务，因此目前没有内置的、用来体验的 api_key。如果您仍然担心安全问题，可以在本地部署此项目，然后访问它。
4. GPT 的回复支持语法高亮和一键复制代码（仅限 PC）。对话支持导出图片和 PDF 文档。
5. 应用程序已经适配了 PC 和移动设备，方便使用。
6. 现在支持开始新的主题对话和查看历史主题对话。所有这些对话数据都存储在 IndexedDB 中，不会有任何数据泄漏风险！

从构思到实现，这个项目花费了一周的时间，欢迎大家体验和使用。任何反馈和改进建议也都受欢迎。

如果这个应用程序分享可以启发和帮助他人，那将是我项目最大的意义。如果可以的话，我也会非常感谢您能给我的项目点个赞。

## 如何在本地部署

要在本地部署此应用程序，您需要按照以下步骤操作(**需要 node16 及以上版本**)：

1. 将项目克隆到本地计算机：

```bash
git clone https://github.com/riwigefi/light-gpt.git
```

2. 进入项目目录并安装依赖项：

```bash
cd light-gpt
pnpm install
```

3. 启动应用程序：

```bash
pnpm run dev
```

应用程序将在 http://localhost:3000 上启动。现在，您可以在本地访问应用程序并进行测试，输入您的 API 密钥，然后开始聊天。
