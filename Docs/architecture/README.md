# Solana 架构总览

## 1. Solana 想解决什么问题

Solana 的核心目标是：在尽量不牺牲去中心化的前提下，提升公链的吞吐量、降低确认延迟和手续费。

它的基本思路不是把所有问题都丢给 Layer 2，而是尽可能把高性能执行放在单条高性能 Layer 1 上完成。

## 2. Solana 的核心设计

和很多链相比，Solana 的设计更像一套高性能分布式系统：

- 用 `Proof of History` 提供可验证时间顺序。
- 用 `Tower BFT` 在 PoH 时钟上做拜占庭容错投票。
- 用 `Proof of Stake` 决定验证者权重。
- 用 `Sealevel` 做并行交易执行。
- 用 `Turbine` 分片传播区块数据。
- 用 `Gulf Stream` 提前把交易转发给未来 leader。
- 用 `Accounts Model` 避免全局共享状态带来的严重串行化。

## 3. Solana 的整体工作流

可以把一笔交易的大致生命周期理解成下面这条链：

```text
用户签名交易
    |
    v
RPC 节点接收交易
    |
    v
交易被转发给当前或未来 leader（Gulf Stream）
    |
    v
leader 执行交易并打包区块
    |
    v
区块拆成 shred 广播到网络（Turbine）
    |
    v
验证者重放区块、执行程序、投票
    |
    v
Tower BFT 累积确认并最终定稿
```

## 4. Solana 的几个关键组件

### PoH

PoH 不是单独的最终共识，而是一个可验证时钟，用于给事件排序，减少节点之间反复协调时间顺序的成本。

### Tower BFT

Tower BFT 是 Solana 的 BFT 共识机制，建立在 PoH 提供的时序基础上，通过投票和锁定规则逐步形成 finality。

### Sealevel

Sealevel 是 Solana 的并行运行时。它能根据交易声明的账户读写集合，尽量并行执行不冲突交易。

### SVM

SVM 是 Solana 的链上执行环境，负责账户语义、程序调用、CU 计量、syscall、CPI 等。

### Turbine

Turbine 用树状传播方式把区块数据拆成小块后扩散到网络，降低 leader 的广播压力。

### Gulf Stream

Gulf Stream 让交易在正式打包前就能提前流向未来的 leader，减少 mempool 风格的等待开销。

## 5. Solana 与 EVM 链最根本的区别

### 状态模型不同

- EVM 更接近“合约持有状态”。
- Solana 更接近“账户持有状态，程序只负责解释状态变化”。

### 执行模型不同

- EVM 大量交易天然串行。
- Solana 借助账户读写集合，能对很多交易并行执行。

### 费用模型不同

- EVM 常见 gas market 竞争。
- Solana 也有费用竞争，但基础费结构、CU 限额和优先费机制更接近资源定价模型。

## 6. 为什么 Solana 能快

通常不是靠某一个单点技术，而是多种设计共同叠加：

- PoH 降低时间排序协调成本。
- Sealevel 提升执行并行度。
- Turbine 提升数据传播效率。
- Gulf Stream 缩短交易等待路径。
- 账户模型减少全局状态锁竞争。
- 硬件友好的执行方式允许节点利用更强计算能力。

## 7. 学习 Solana 时最该建立的心智模型

理解 Solana 最好的方式不是把它看成“更快的以太坊”，而是看成：

- 一个以账户为中心的高性能状态机
- 一个把时间排序前置的共识系统
- 一个支持并行程序执行的运行时平台

只要这个总模型建立起来，后面的 PoH、Tower BFT、SVM、Sealevel、Turbine 就都能串起来。
