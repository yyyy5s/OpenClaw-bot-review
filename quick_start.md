#快速启动办法（中文）
## 1.通过prompt安装
```
在openclaw输入如下提示词，让openclaw帮启动：
请帮我安装并运行这个github项目，并把服务访问地址发给我：https://github.com/xmanrui/OpenClaw-bot-review
```

## 2.通过git安装
```
git clone https://github.com/xmanrui/OpenClaw-bot-review.git
cd OpenClaw-bot-review
npm install
npm run dev
```

## 2.1 HTTPS 反代 / 子路径部署
如果你的公网反代不是直接挂在站点根路径，而是类似：
```text
https://example.com/openclaw
```
请在构建时传入子路径，避免 Next 静态资源、`/api/*` 和像素办公室图片音频全部错到根路径：

```bash
NEXT_BASE_PATH=/openclaw npm run build
NEXT_BASE_PATH=/openclaw npm run start
```

Docker 构建时同样传入：

```bash
docker build --build-arg NEXT_BASE_PATH=/openclaw -t openclaw-dashboard .
docker run -d -p 3000:3000 openclaw-dashboard
```

## 3.通过skill安装
```
npx clawhub install openclaw-bot-dashboard
或者：npx skills add xmanrui/openclaw-bot-dashboard

安装后通过这些关键词触发启动服务：
- "打开 OpenClaw-bot-review"
- "打开 Openclaw dashboard"
- "打开 bot review"
- "打开机器人大盘"
- "打开 bot-review"
- "打开openclaw机器人大盘"
- "open openclaw dashboard"
- "open OpenClaw-bot-review"
- "open openclaw dashsboard"
- "launch bot review"
- "start dashboard"

```

---

# Quick Start (English)
## 1. Install via Prompt
```
In OpenClaw, send the prompt below and let OpenClaw set it up:
Please help me install and run this GitHub project, and send me the service URL: https://github.com/xmanrui/OpenClaw-bot-review
```

## 2. Install via Git
```
git clone https://github.com/xmanrui/OpenClaw-bot-review.git
cd OpenClaw-bot-review
npm install
npm run dev
```

## 2.1 HTTPS Reverse Proxy / Subpath Deploy
If the public app is exposed under a subpath such as:
```text
https://example.com/openclaw
```
build with the same base path so Next chunks, `/api/*`, and Pixel Office media all resolve correctly:

```bash
NEXT_BASE_PATH=/openclaw npm run build
NEXT_BASE_PATH=/openclaw npm run start
```

For Docker:

```bash
docker build --build-arg NEXT_BASE_PATH=/openclaw -t openclaw-dashboard .
docker run -d -p 3000:3000 openclaw-dashboard
```

## 3. Install via Skill
```
npx clawhub install openclaw-bot-dashboard
or: npx skills add xmanrui/openclaw-bot-dashboard

After installation, use these trigger phrases to start the service:
- "打开 OpenClaw-bot-review"
- "打开 Openclaw dashboard"
- "打开 bot review"
- "打开机器人大盘"
- "打开 bot-review"
- "打开openclaw机器人大盘"
- "open openclaw dashboard"
- "open OpenClaw-bot-review"
- "open openclaw dashsboard"
- "launch bot review"
- "start dashboard"
```
