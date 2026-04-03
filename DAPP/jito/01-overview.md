# 01. Jito 总览

## 1. Jito 是什么

Jito 可以理解为围绕 Solana 低延迟交易、MEV 执行和收益分发构建的一套基础设施与产品集合。

从开发者视角看，Jito 最重要的价值是：

- 低延迟发送交易
- 支持 bundle 提交
- 提供一定的 MEV 保护能力
- 给高频交易、搜索者、机器人、dApp 提供更强的交易落地能力

根据 Jito 官方文档，Jito 主要面向：

- Validators
- Telegram Bots
- High Frequency Traders / Searchers
- dApps

## 2. Jito 想解决什么问题

在标准 Solana 交易路径里，开发者通常直接向 RPC 发送交易。这个方式足够通用，但在以下场景中可能不够强：

- 你希望交易更快进入 leader 视角
- 你希望多笔交易必须一起成功或一起失败
- 你希望减少被抢跑、夹子或意图泄漏的风险
- 你在竞争激烈的 MEV 场景中需要更低延迟的数据和更强的执行路径

这时 Jito 提供的交易发送与 bundle 基础设施就很有价值。

## 3. 从学习角度，Jito 可以拆成两条线

### A. 交易基础设施线

这一条线更偏开发者与交易系统：

- Fast Transaction Sending
- Block Engine
- Bundles
- ShredStream

如果你以后想做：

- 套利
- 清算
- Telegram Bot
- 抢开盘 / 抢新池
- MEV 保护发送

那这条线最重要。

### B. 质押与收益线

这一条线更偏产品和协议理解：

- JitoSOL
- Liquid Staking
- MEV rewards
- Validator / staker 收益分发

如果你更关心 Jito 作为生态协议与收益模型，这条线更重要。

## 4. 最核心的四个名词

### Jito-Solana

Jito 官方文档把它描述为一个修改版的 Solana validator client。
它让 validator 能更高效地处理交易、处理 bundle，并参与 MEV 收益相关流程。

### Block Engine

可以把它理解为交易与 bundle 进入 validator 之前的高性能调度层。
开发者、搜索者、bot 会把交易或 bundles 发给 Block Engine，再由它进行模拟、排序、选择和转发。

### Bundle

Bundle 是一组交易。
在 Jito 里，bundle 的关键特性是：

- 多笔交易打包提交
- 顺序执行
- 原子性执行
- 一笔失败则整组回滚

这特别适合需要“多步动作必须同时成立”的场景。

### ShredStream

ShredStream 用于更低延迟地接收区块更新数据。
对于依赖速度的机器人来说，提前感知链上变化往往就是优势来源。

## 5. 为什么开发者会用 Jito

最常见的原因有：

- 提高交易落地速度
- 对多笔交易做原子打包
- 提升套利、清算、抢跑竞争中的成功率
- 在某些路径下获得更好的 MEV 保护
- 获取更低延迟的链上数据

## 6. 学习时要保持的边界感

Jito 不等于“自动赚钱”。

它本质上是基础设施增强层，提供的是：

- 更快的路径
- 更灵活的交易组织方式
- 更适合高竞争场景的工具

是否真的有收益，仍然取决于：

- 策略本身
- 风控能力
- 交易成本
- 失败率
- 与其他搜索者的竞争
