---
title: 基础了解 Bootloader
author: SB5133
brand: Bootloader
tags: [Android, Bootloader]
---

# Bootloader（启动引导程序）

设备开机后最先运行的底层引导程序，负责初始化硬件、校验系统完整性，并决定加载哪个系统镜像启动。

与Fastboot的关系：

Bootloader处于Fastboot上游，Fastboot的运行依赖于Bootloader的底层支持。<br>
Bootloader处于锁定（Locked）状态时，仅允许加载官方签名的系统镜像，禁止对系统分区进行写入操作；处于解锁（Unlocked）状态时，允许通过Fastboot协议向系统分区写入镜像，是获取Root权限及安装第三方系统的前置条件。