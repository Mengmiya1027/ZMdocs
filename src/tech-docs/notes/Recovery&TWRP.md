---
title: 基础了解 Recovery/TWRP
author: SB5133
tags: [Android, Recovery/TWRP]
---

# Recovery/TWRP（恢复模式）
第三方定制的安卓恢复环境，用于替代官方Recovery，实现第三方ROM刷入、Root权限获取、数据清除及系统备份等高级刷机操作。<br>

## 与Fastboot的关系：{ .compact-left }
Fastboot属于Bootloader阶段的线刷协议，烧录对象为分区镜像（如boot.img、system.img）；Recovery属于系统恢复阶段的交互式环境，刷入对象为完整ROM包（.zip格式），两者为互补关系，非取代关系。

## 条件：{ .compact-left }

刷入TWRP须先通过Fastboot执行fastboot flash recovery twrp.img命令，前提为Bootloader处于解锁（Unlocked）状态。<br>

## 功能：{ .compact-left }

TWRP支持触屏交互，可执行文件管理、分区备份与还原、格式化特定分区（如Data、Cache）等操作；官方Recovery通常仅支持OTA更新及基础数据清除，功能受限。<br>

## 提示：{ .compact-left }

TWRP刷入错误版本或操作不当将导致设备无法进入系统（变砖）；格式化Data分区将清空用户数据，须提前备份。