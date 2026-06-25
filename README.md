# 📊 B站 UP 稿件播放量查询 · bili-up-monitor

一个**人人可用**的网页：输入任意 B 站 UP 的 UID，查 TA 近 N 条稿件的播放量，自动标记**低于均值的低播稿件**，并一键导出「投流申请」表格（TSV，可直接粘进飞书多维表格）。

**无需登录、无需安装、无需 cookie** —— 任何人打开网页输 UID 就能用。

> 在线体验：https://hiamberhuang.github.io/bili-up-monitor/ （需先按下方部署好中转）

## 🧩 它是怎么做到"无需登录"的

浏览器直接调 B 站接口会被**跨域**挡死，而且 B 站接口要 **wbi 签名**。所以这里用一个**极小的免费中转**（Cloudflare Worker）在服务器端完成签名+抓取，网页只管显示：

```
访客 → 网页(输UID) → 你的 Cloudflare Worker(签名+抓数据) → B站接口 → 返回 → 网页显示
```

中转**不需要任何登录信息**，纯抓公开数据。

## 🚀 部署（一次性，约 5 分钟，全程复制粘贴，不用命令行）

### 第 1 步：建中转（Cloudflare Worker）
1. 注册免费账号 👉 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 左侧 **Workers & Pages** → **Create** → **Create Worker** → 起个名（如 `bili-monitor`）→ **Deploy**
3. 点 **Edit code**，把本仓库 [`worker.js`](./worker.js) 的**全部内容**粘进去覆盖 → 右上 **Deploy**
4. 复制这个 Worker 的网址（形如 `https://bili-monitor.你的名字.workers.dev`）

### 第 2 步：让网页连上中转
- 打开网页，点「**⚙️ 设置中转地址**」，把上面复制的 Worker 网址填进去、保存即可（存在你浏览器本地）。
- 想让**所有访客**都免设置：把 `index.html` 里 `DEFAULT_API = "PASTE_YOUR_WORKER_URL_HERE"` 换成你的 Worker 网址，再提交即可。

### 第 3 步：发布网页（可选）
- 仓库 **Settings → Pages → Branch 选 main → Save**，几分钟后 `https://你的用户名.github.io/bili-up-monitor/` 就是公开网址。

## 📖 用法
1. 输入 UP 的 UID（主页地址 `space.bilibili.com/数字` 里的数字）
2. 点查询 → 看近 N 条播放 + 低播标记（低于均值标红 ⚠️）
3. 点复制 → 去飞书多维表格直接粘贴「投流申请」行

## ⚠️ 说明
- 免费额度：Cloudflare Worker 10 万次/天，够用。
- 中转自带 **3 分钟缓存**，同一 UID 短时间重复查走缓存，省额度 + 降被限频概率。
- B 站偶尔限频（返回 -799），等几秒重试即可。
- 判定阈值 = 低于"近 N 条播放均值"，可在 `index.html` 改。

## 📄 License
MIT © 2026 Amber Huang
