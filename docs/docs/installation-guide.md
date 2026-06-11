# AI短线美股交易系统 — 安装部署指南

## 系统概述

本系统是基于《AI短线美股交易系统理论（1-15天波段版）》构建的多Agent协作自动化交易系统，包含28个专业Agent，覆盖从市场扫描到交易复盘的全生命周期。

## 系统要求

### 硬件
- **最低**: 4核CPU, 8GB RAM, 50GB存储
- **推荐**: 8核CPU, 16GB RAM, 100GB SSD
- **网络**: 稳定互联网连接（低延迟连接券商API）

### 软件
- **操作系统**: Linux (Ubuntu 20.04+), macOS 12+, Windows 10+ (WSL2)
- **Python**: 3.10+
- **Node.js**: 18+ (用于Agent调度器)
- **数据库**: SQLite (默认) / PostgreSQL (生产推荐)

## 安装步骤

### 步骤1：环境准备

```bash
# 创建项目目录
mkdir -p ~/ai-trading-system
cd ~/ai-trading-system

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装基础依赖
pip install --upgrade pip
pip install pandas numpy scipy yfinance
pip install requests websockets aiohttp
pip install schedule APScheduler
```

### 步骤2：安装系统核心

```bash
# 克隆/复制系统文件
cp -r /path/to/agents ./agents
cp -r /path/to/templates ./templates
cp -r /path/to/docs ./docs

# 创建数据目录
mkdir -p data/{market,signals,trades,risk,postmortem,backtests,behavior,logs}

# 创建配置文件目录
mkdir -p config
```

### 步骤3：配置系统

创建 `config/system.yaml`:

```yaml
# 系统核心配置
system:
  name: "AI-ShortTerm-US-Trading-System"
  version: "1.0.0"
  timezone: "America/New_York"
  trading_hours:
    pre_market: "04:00-09:30"
    regular: "09:30-16:00"
    after_hours: "16:00-20:00"
  
# 账户配置（模拟/实盘）
account:
  mode: "paper"  # paper / live
  initial_capital: 100000
  currency: "USD"
  max_leverage: 2.0
  
# 风险限额（默认）
risk_limits:
  max_intraday_drawdown: 0.05
  max_consecutive_drawdown: 0.12
  max_single_ticker_exposure: 0.20
  max_sector_exposure: 0.30
  max_total_delta: 0.80
  max_total_vega: 0.08
  max_leverage: 3.0
  max_vix_level: 45.0
  max_single_trade_loss: 0.02
  
# 交易参数（默认）
trading_params:
  default_stop_atr_mult: 1.0
  default_kelly_fraction: 0.25
  min_risk_reward_ratio: 1.5
  max_hold_days: 15
  default_order_tif: "DAY"
  max_slippage_pct: 0.003
  
# Agent权重（初始）
agent_weights:
  ma_trend: 0.25
  macd_momentum: 0.20
  rsi_overbought: 0.15
  kdj_stochastic: 0.10
  volume_profile: 0.20
  pattern_recognition: 0.10

# API配置（用户需自行申请）
api_keys:
  yahoo_finance: "YOUR_YAHOO_API_KEY"
  # 券商API配置（实盘时填写）
  broker:
    name: "alpaca"  # alpaca / interactive_brokers / td_ameritrade
    api_key: "YOUR_BROKER_API_KEY"
    api_secret: "YOUR_BROKER_API_SECRET"
    paper_trading: true
```

### 步骤4：安装Agent依赖

每个Agent可能需要特定的Python包。创建 `requirements-agents.txt`:

```
# 核心Agent依赖
pandas>=2.0.0
numpy>=1.24.0
scipy>=1.10.0

# 数据获取
yfinance>=0.2.0
requests>=2.31.0
aiohttp>=3.8.0
websockets>=11.0

# 技术分析
TA-Lib>=0.4.0  # 或 pandas-ta

# 期权分析（Options-Driver）
# 需要访问期权链数据的API

# 调度与消息
APScheduler>=3.10.0
schedule>=1.2.0
pydantic>=2.0.0

# 日志与监控
loguru>=0.7.0
prometheus-client>=0.17.0  # 可选

# 数据库
sqlalchemy>=2.0.0
sqlite3  # 内置

# 回测（Backtest-Optimizer）
backtrader>=1.9.0  # 可选
vectorbt>=0.25.0  # 可选

# 其他
python-dotenv>=1.0.0
pyyaml>=6.0
tqdm>=4.65.0
```

安装:
```bash
pip install -r requirements-agents.txt
```

### 步骤5：配置Agent启动器

创建 `main.py` (系统主入口):

```python
#!/usr/bin/env python3
"""
AI短线美股交易系统主入口
启动所有Agent并初始化消息总线
"""

import asyncio
import yaml
from pathlib import Path
from loguru import logger

from core.orchestrator import Orchestrator
from core.message_bus import MessageBus
from core.config_loader import ConfigLoader

# Agent导入
from agents.market_core import MarketCoreAgents
from agents.options_driver import OptionsDriverAgent
from agents.tss_aggregator import TSSAggregatorAgent
from agents.tos_calculator import TOSCalculatorAgent
from agents.risk_manager import RiskManagerAgent
from agents.execution_agent import ExecutionAgent
from agents.killswitch import KillSwitchAgent
from agents.position_monitor import PositionMonitorAgent
from agents.postmortem import PostmortemAgent
from agents.backtest_optimizer import BacktestOptimizerAgent

class TradingSystem:
    def __init__(self, config_path: str):
        self.config = ConfigLoader.load(config_path)
        self.message_bus = MessageBus()
        self.orchestrator = Orchestrator(self.config, self.message_bus)
        
        # 初始化所有Agent
        self.agents = {}
        self._init_agents()
        
    def _init_agents(self):
        """初始化所有28个Agent"""
        agent_classes = {
            '01-09': MarketCoreAgents,
            '20': OptionsDriverAgent,
            '21': TSSAggregatorAgent,
            '22': TOSCalculatorAgent,
            '23': RiskManagerAgent,
            '24': ExecutionAgent,
            '25': KillSwitchAgent,
            '26': PositionMonitorAgent,
            '27': PostmortemAgent,
            '28': BacktestOptimizerAgent,
        }
        
        for agent_id, agent_class in agent_classes.items():
            try:
                self.agents[agent_id] = agent_class(
                    config=self.config,
                    message_bus=self.message_bus
                )
                logger.info(f"Agent {agent_id} initialized")
            except Exception as e:
                logger.error(f"Failed to init Agent {agent_id}: {e}")
                
    async def start(self):
        """启动系统"""
        logger.info("=" * 50)
        logger.info("AI短线美股交易系统启动")
        logger.info(f"模式: {self.config['account']['mode']}")
        logger.info(f"初始资金: ${self.config['account']['initial_capital']:,}")
        logger.info("=" * 50)
        
        # 启动Orchestrator调度
        await self.orchestrator.start()
        
        # 启动持续监控Agent
        await asyncio.gather(
            self.agents['25'].monitor(),  # KillSwitch
            self.agents['26'].monitor(),  # Position Monitor
            self.agents['23'].monitor(),  # Risk Manager
        )
        
    async def shutdown(self):
        """优雅关闭"""
        logger.info("系统关闭中...")
        for agent in self.agents.values():
            await agent.shutdown()
        await self.orchestrator.shutdown()
        logger.info("系统已安全关闭")

async def main():
    system = TradingSystem("config/system.yaml")
    
    try:
        await system.start()
        # 保持运行
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await system.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
```

### 步骤6：设置定时任务

创建 `scheduler.py`:

```python
"""
系统定时任务调度器
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

class TradingScheduler:
    def __init__(self, system):
        self.system = system
        self.scheduler = AsyncIOScheduler(timezone='America/New_York')
        
    def setup_jobs(self):
        # 每日08:00 - 盘前扫描
        self.scheduler.add_job(
            self.system.agents['01-09'].pre_market_scan,
            CronTrigger(hour=8, minute=0),
            id='pre_market_scan'
        )
        
        # 每日09:00 - 生成交易计划
        self.scheduler.add_job(
            self.system.orchestrator.generate_daily_plan,
            CronTrigger(hour=9, minute=0),
            id='daily_plan'
        )
        
        # 每2小时 - 技术信号扫描 (09:30, 11:30, 13:30, 15:30)
        self.scheduler.add_job(
            self.system.agents['21'].scan_signals,
            CronTrigger(hour='9,11,13,15', minute=30),
            id='signal_scan'
        )
        
        # 每5分钟 - 持仓监控
        self.scheduler.add_job(
            self.system.agents['26'].check_positions,
            'interval', minutes=5,
            id='position_monitor'
        )
        
        # 每小时 - 风险报告
        self.scheduler.add_job(
            self.system.agents['23'].generate_risk_report,
            'interval', hours=1,
            id='risk_report'
        )
        
        # 每日16:05 - 收盘复盘
        self.scheduler.add_job(
            self.system.agents['27'].daily_postmortem,
            CronTrigger(hour=16, minute=5),
            id='daily_postmortem'
        )
        
        # 每周日00:00 - 全系统回测
        self.scheduler.add_job(
            self.system.agents['28'].weekly_backtest,
            CronTrigger(day_of_week='sun', hour=0, minute=0),
            id='weekly_backtest'
        )
        
    def start(self):
        self.setup_jobs()
        self.scheduler.start()
        
    def shutdown(self):
        self.scheduler.shutdown()
```

### 步骤7：运行系统

```bash
# 激活环境
source venv/bin/activate

# 运行系统（模拟模式）
python main.py

# 后台运行（生产环境）
nohup python main.py > logs/system.log 2>&1 &
```

## 目录结构

```
ai-trading-system/
├── agents/                    # Agent定义文件
│   ├── 20-options-driver.md
│   ├── 21-tss-aggregator.md
│   ├── 22-tos-calculator.md
│   ├── 23-risk-manager.md
│   ├── 24-execution.md
│   ├── 25-killswitch.md
│   ├── 26-position-monitor.md
│   ├── 27-postmortem.md
│   └── 28-backtest-optimizer.md
│
├── templates/                 # 模板文件
│   └── common_agent_template.md
│
├── docs/                      # 文档
│   └── end-to-end-workflow.md
│
├── config/                    # 配置文件
│   └── system.yaml
│
├── core/                      # 核心系统代码
│   ├── __init__.py
│   ├── orchestrator.py
│   ├── message_bus.py
│   ├── config_loader.py
│   └── state_machine.py
│
├── agents_impl/               # Agent实现代码
│   ├── __init__.py
│   ├── market_core.py
│   ├── options_driver.py
│   ├── tss_aggregator.py
│   ├── tos_calculator.py
│   ├── risk_manager.py
│   ├── execution_agent.py
│   ├── killswitch.py
│   ├── position_monitor.py
│   ├── postmortem.py
│   └── backtest_optimizer.py
│
├── data/                      # 数据存储
│   ├── market/                # 行情数据
│   ├── signals/               # Agent信号
│   ├── trades/                # 交易记录
│   ├── risk/                  # 风险日志
│   ├── postmortem/            # 复盘报告
│   ├── backtests/             # 回测结果
│   └── behavior/              # 用户行为
│
├── logs/                      # 系统日志
│
├── main.py                    # 系统主入口
├── scheduler.py               # 定时任务调度
├── requirements.txt           # Python依赖
└── README.md                  # 项目说明
```

## 配置说明

### 模拟交易 vs 实盘交易

```yaml
# 模拟交易配置（默认）
account:
  mode: "paper"
  initial_capital: 100000

# 实盘交易配置（谨慎！）
account:
  mode: "live"
  initial_capital: 50000  # 建议从小资金开始
  
risk_limits:
  max_single_trade_loss: 0.01  # 实盘建议1%（更保守）
  max_leverage: 1.5            # 实盘建议1.5x
```

### Agent权重调整

在 `config/system.yaml` 中调整：

```yaml
agent_weights:
  ma_trend: 0.30        # 增加趋势权重（趋势市场）
  macd_momentum: 0.15   # 降低动量权重
  rsi_overbought: 0.10  # 降低反转权重
  volume_profile: 0.25   # 增加量价权重
  pattern_recognition: 0.20
```

**注意**: 权重变更需通过28 Backtest-Optimizer的Walk-Forward验证后方可生效。

### 风险限额调整

```yaml
risk_limits:
  # 保守型（建议新手）
  max_intraday_drawdown: 0.03
  max_single_ticker_exposure: 0.15
  max_leverage: 1.5
  
  # 激进型（有经验者）
  max_intraday_drawdown: 0.08
  max_single_ticker_exposure: 0.25
  max_leverage: 2.5
```

## 监控与维护

### 查看系统状态

```bash
# 查看运行日志
tail -f logs/system.log

# 查看Agent状态
python scripts/check_agent_status.py

# 查看风险仪表盘
python scripts/show_risk_dashboard.py
```

### 备份数据

```bash
# 每日自动备份脚本
crontab -e
# 添加：0 2 * * * /path/to/backup.sh

# backup.sh
#!/bin/bash
tar -czf backups/data_$(date +%Y%m%d).tar.gz data/
cp config/system.yaml backups/config_$(date +%Y%m%d).yaml
```

### 系统升级

```bash
# 1. 备份当前配置和数据
./scripts/backup.sh

# 2. 拉取新版本
git pull origin main

# 3. 更新依赖
pip install -r requirements.txt --upgrade

# 4. 运行回测验证
python scripts/validate_upgrade.py

# 5. 重启系统
./scripts/restart.sh
```

## 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| Agent无法启动 | 依赖缺失 | `pip install -r requirements.txt` |
| 信号延迟 | API限流 | 检查API配额，增加缓存 |
| 回测结果过好 | 前视偏差 | 检查数据对齐，使用Walk-Forward |
| 模拟与实盘差异大 | 滑点低估 | 调整`max_slippage_pct`参数 |
| KillSwitch频繁触发 | 止损过紧 | 放宽`default_stop_atr_mult` |
| 持仓监控卡顿 | 持仓过多 | 限制最大持仓数量 |

### 紧急操作

```bash
# 立即暂停所有交易
python scripts/emergency_stop.py

# 查看KillSwitch日志
python scripts/show_killswitch_history.py

# 手动平仓（紧急）
python scripts/manual_liquidate.py --ticker ALL
```

## 安全警告

⚠️ **重要提示**:

1. **实盘交易风险**: 本系统不保证盈利，过往回测不代表未来表现
2. **杠杆危险**: 杠杆会放大亏损，建议使用1.5x以下
3. **黑天鹅事件**: 系统无法预测所有极端事件，保持充足现金缓冲
4. **API安全**: 不要将API密钥提交到代码仓库，使用环境变量
5. **模拟先行**: 强烈建议至少模拟交易3个月后再考虑实盘

## 支持与更新

- 系统版本: 1.0.0
- 更新日志: `docs/CHANGELOG.md`
- 问题反馈: 通过系统日志和复盘报告持续优化
- Agent进化: 每月通过28 Backtest-Optimizer自动优化参数

---

**免责声明**: 本系统仅供教育和研究目的。所有交易决策风险自负。在投入实盘资金前，请咨询专业金融顾问。