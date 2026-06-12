# SKILL.md - 数据分析与可视化

> 触发词：数据分析、数据处理、统计、图表、Excel、数据洞察、数据可视化

## 能力矩阵

| 能力 | 说明 | 优先级 |
|------|------|--------|
| 数据清洗 | 缺失值处理、重复删除、格式转换、数据类型校正 | ⭐⭐⭐ |
| 统计分析 | 描述性统计、相关性分析、分组聚合 | ⭐⭐⭐ |
| 图表生成 | 折线图、柱状图、饼图、散点图、热力图 | ⭐⭐⭐ |
| Excel处理 | 读取、写入、格式化、公式注入 | ⭐⭐⭐ |
| CSV处理 | 编码转换、分隔符调整、合并拆分 | ⭐⭐ |
| 数据洞察 | 异常检测、趋势分析、关键指标提取 | ⭐⭐ |

## 工具链

### 1. Python 数据处理（首选）

使用 `pandas` + `matplotlib` / `seaborn` / `plotly`：

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# 读取数据
df = pd.read_excel('data.xlsx')  # Excel
df = pd.read_csv('data.csv', encoding='utf-8')  # CSV

# 数据清洗
df.drop_duplicates()  # 去重
df.fillna(0)  # 缺失值填充
df['date'] = pd.to_datetime(df['date'])  # 日期转换

# 统计分析
df.describe()  # 描述性统计
df.corr()  # 相关性矩阵
df.groupby('category').sum()  # 分组聚合

# 图表生成
plt.figure(figsize=(10, 6))
plt.plot(df['date'], df['value'])
plt.savefig('chart.png')
```

### 2. Shell 命令（轻量级）

```bash
# CSV 处理
awk -F',' '{print $1}' file.csv  # 提取列
sort -t',' -k2 file.csv  # 按列排序
uniq -c file.csv  # 统计重复

# 编码转换
iconv -f GBK -t UTF-8 file.csv -o output.csv

# 文件合并
paste -d',' file1.csv file2.csv
```

### 3. 飞书多维表格（团队协作）

使用 `feishu_bitable_*` 工具：
- 读取团队数据
- 写入分析结果
- 创建可视化报表

## 最佳实践

### 数据质量检查清单

- [ ] 缺失值比例 < 5%？（否则警告）
- [ ] 数据类型正确？（日期、数字、文本）
- [ ] 异常值检测（3σ 原则）
- [ ] 重复记录清理

### 图表设计原则

- [ ] 标题清晰、标注完整
- [ ] 颜色对比度足够（考虑色盲友好）
- [ ] 坐标轴刻度合理
- [ ] 数据来源标注

### 性能优化

- 大文件（>100MB）使用 chunk 读取
- 避免循环遍历 DataFrame，用向量化操作
- 复杂图表先采样再全量渲染

## 典型场景

### 场景1：销售数据周报

```python
import pandas as pd
import matplotlib.pyplot as plt

# 读取
df = pd.read_excel('sales.xlsx')

# 清洗
df['日期'] = pd.to_datetime(df['日期'])
df = df.dropna(subset=['销售额'])

# 分析
weekly = df.groupby(df['日期'].dt.isocalendar().week)['销售额'].sum()
top_products = df.groupby('产品')['销售额'].sum().nlargest(10)

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
weekly.plot(kind='bar', ax=axes[0], title='周销售额趋势')
top_products.plot(kind='pie', ax=axes[1], title='Top 10 产品')
plt.tight_layout()
plt.savefig('weekly_report.png')
```

### 场景2：用户行为漏斗分析

```python
# 漏斗统计
funnel = df.groupby('步骤').agg({
    '用户数': 'sum',
    '转化率': 'mean'
}).cumsum()

funnel['流失率'] = 1 - funnel['转化率']
```

## 质量标准

> ⚠️ **生命线**：技能执行必须保证数据准确性，图表必须清晰可读

1. **数据准确性**：计算结果必须可复现，保留 2 位小数
2. **图表可读性**：字号 ≥ 12pt，关键数据标注
3. **处理透明性**：每步操作记录日志，异常值单独标记
4. **输出规范性**：文件名包含日期和版本，如 `analysis_20260315_v1.csv`

## 注意事项

- ❌ 禁止使用模拟数据或占位符
- ❌ 禁止假设数据格式（必须先验证）
- ❌ 禁止忽略缺失值和异常值
- ✅ 大文件分批处理并显示进度
- ✅ 处理前备份原始数据
- ✅ 敏感数据（手机号、身份证）必须脱敏

## 依赖环境

```bash
pip install pandas matplotlib seaborn plotly openpyxl xlrd
```

---

**评分目标**：≥ 92 分  
**适用场景**：工作报告、数据洞察、自动化报表、团队数据协作
