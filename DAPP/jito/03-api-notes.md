# 03. API 与工程笔记

## 1. 你最先需要知道的接口路径

根据官方文档，Jito 的 Block Engine 提供了面向交易发送的接口。

常见入口包括：

- `/api/v1/transactions`
- `/api/v1`

从学习角度，先记住它们分别对应：

- 单笔交易发送
- bundle 相关方法

## 2. 常见方法

### sendTransaction

适合发送单笔交易。

学习重点：

- 它可以把交易更直接地转发到 validator 路径
- 文档提到默认带有一定的 MEV protection 语义
- 可以配合 `bundleOnly=true` 走单笔 bundle 路径
- 文档里明确提到 `skip_preflight=true`

这意味着：

- 它不是普通 RPC 的完全等价替代
- 你要自己更重视本地签名前模拟和参数检查

### sendBundle

适合发送多笔原子交易。

学习重点：

- bundle 最多 5 笔交易
- 顺序执行
- 全部成功才会落地
- 需要考虑 tip 策略

### getBundleStatuses

用于查询 bundle 状态。

### getInflightBundleStatuses

用于观察 bundle 在提交过程中的状态。

### getTipAccounts

用于获取 tip 相关账户信息。

## 3. 官方文档里值得特别注意的点

### 交易编码

文档里推荐使用 base64。
base58 被认为更慢，并且属于不推荐方向。

### Tip 下限

官方文档提到 bundle 有最小 tip 要求。
但在竞争激烈时，仅满足最低值通常不够。

工程上不要把“最小值”理解为“足够值”。

### 优先费和 Jito Tip 不是同一个东西

很多新手会把这两个混在一起。
你需要同时理解：

- Solana priority fee
- Jito bundle tip

它们都可能影响最终落地表现。

### 限流

Jito 文档有单独的 Rate Limits 章节。
这意味着你的程序需要：

- 做重试
- 做指数退避
- 做并发控制
- 最好支持多个 endpoint 或区域路由

## 4. 主网区域化 endpoint 的意义

官方文档列出了多个区域的 mainnet Block Engine endpoint，例如：

- Amsterdam
- Dublin
- Frankfurt
- London
- New York
- Salt Lake City
- Singapore
- Tokyo

这对交易系统很重要，因为：

- 物理距离会影响延迟
- 你的服务器部署位置会影响最优 endpoint 选择
- 低延迟系统通常会做区域优化

## 5. 学习时应关注的工程问题

如果你将来要真的调用 Jito API，至少要关注这些点：

- 如何构造和签名 VersionedTransaction
- 如何做本地 simulate
- 如何估算 compute unit 与 priority fee
- 如何设置 tip
- 如何判断 bundle 是否 landed
- 如何处理 rate limit
- 如何处理 leader 轮转和时机选择
- 如何避免只依赖单一区域 endpoint

## 6. 一个很实用的学习心法

不要一开始就追求“写套利机器人”。

更稳的顺序是：

1. 先理解单笔交易发送
2. 再理解 bundle
3. 再理解 tip / fee / auction
4. 最后再研究策略和盈利模型
