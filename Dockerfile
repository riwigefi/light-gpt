# 使用Node.js官方提供的Node.js 16.14.2版本作为基础镜像
FROM node:16.14.2

# 设置工作目录为/app
WORKDIR /app

# 创建node_modules目录
RUN mkdir -p /app/node_modules

# 复制当前目录下的package.json和pnpm-lock.yaml到/app目录下
COPY package.json .
COPY pnpm-lock.yaml .

# 安装pnpm包管理器
RUN npm install -g pnpm

# 安装依赖包
RUN pnpm install

# 复制当前目录下的所有文件到/app目录下
COPY . .

# 构建Next.js应用
RUN npm run build

# 设置环境变量
ENV NODE_ENV=production
ENV PORT 3000

# 暴露端口
EXPOSE 3000

# 设置启动命令
CMD ["npm", "start"]
