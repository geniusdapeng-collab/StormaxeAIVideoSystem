# Seedance Project Configuration
# 
# 本文件为 Seedance v9.2 的项目级配置，在每次 session 开始时读取。
# 设计原则：如果内容每月变化超过一次，则它不属于本文件。
#
# 四级层次结构（从全局到局部，后者覆盖前者）：
# - Managed: /etc/seedance/        — 企业全局
# - User:    ~/.seedance/          — 用户级别
# - Project: PROJECT.md            — 项目级别（本文件）
# - Local:   PROJECT.local.md     — 本地覆盖（gitignored）