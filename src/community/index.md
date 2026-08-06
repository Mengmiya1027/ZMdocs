---
SideBarTitle: 共建
GroupOrder: 3
title: 关于这个站点……
Order: 1
---

# 关于这个站点……

#### ——愿wish建站时的小记 { .compact-right }

这个站点是我和稚梦没事的时候弄出来的😅刚开始那一会bug贼多。站点基于简易而轻量的Vitepress（绝对不是我写不来React）。
如果你想，也可以复用这里的代码。[Github](https://github.com/Mengmiya1027/ZMdocs)

## 主题 { .compact-left }

主题文件统一放在`src/.vitepress/theme/styles`下。除了`dynamic`中的文件由`theme/utils`中的ts组件动态注入以外，
剩下的文件全部由`styles/index.css`导入至`theme/index.ts`。

液态玻璃效果由`styles/global/liquid-glass.css`统一控制。其余的部分已经分开，由文件命名代表控制区域。
例如，`styles/home/hero.css`控制主页面中间的大面板。