# Outdoor Style Atlas · 室外设计风格图册

私人室外设计风格导航 — 10 大体系 / 50+ 风格,审美与文化的视觉档案。

## 项目结构

```
.
├── index.html               首页 · 6 库入口 + 10 体系列表
├── system-*.html            10 个体系页(横向滚动风格列)
├── style-*.html             51 个风格详情页(7 段:印象图/简介/识别点/特征/适配/案例/相关)
├── library-plant.html       植物专题库总览
├── library-space.html       空间类型库
├── library-scene.html       生活场景库
├── style-preference.html    设计风格偏好分析(室内/室外/综合 3 tab)
├── compare.html             横向并列对比表
├── style-page.css           风格详情页样式
├── style-page.js            个人标记交互(localStorage 持久化)
├── system-page.css          体系页样式
├── system-page.js           体系页交互 + 自选对比
└── images/                  全部风格印象图(约 38 MB)
```

## 本地浏览

```bash
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

也可直接双击 `index.html`(file:// 协议)— 因为 system 页的 detail 数据已内嵌,
不需要 http 服务也能看到完整对比内容。

## Personal Marker 持久化

每个风格详情页右上有 5 档标记(核心/偏好/借鉴/待定/排除),点击后通过
浏览器 `localStorage` 保存。再次点击同档取消。

## 自选对比

体系页右上角 ✓ 勾选 2-4 个风格 → 底部「查看对比 →」按钮 → 跳 `compare.html`
显示横向并列对比表(识别点 + 核心特征)。

## 部署

静态站,可直接部署到 Vercel / Cloudflare Pages / GitHub Pages。
无需构建步骤。

## License

私人项目,未授权。
