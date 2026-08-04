---
title: 基础了解 Magisk（面具）
date: 2025-07-09
updated: 2025-07-09
category: Android
brand: Magisk（面具）
tags: [Android, Magisk（面具）]
---

# Magisk（面具）
当前主流的Root权限管理工具及模块化框架，通过无系统修改（systemless）方式实现Root，即在init_boot或boot分区挂载模块，保持系统分区原始状态，规避部分系统完整性检测（如SafetyNet）。

# 功能：

管理Root授权，对请求Root权限的应用进行授予或拒绝；加载Magisk模块，可修改系统行为（如隐藏Root、调整性能参数、启用系统级功能），无需改动系统文件。

# 与Fastboot的关系：

Fastboot负责刷入修补后的init_boot/boot镜像，Magisk运行于系统启动阶段，将模块挂载至系统，两者为串行关系：Fastboot写入 → Magisk生效。