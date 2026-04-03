# 04. 学习路线

## 第一阶段：建立正确认知

目标：先搞清楚 Jito 是“基础设施增强层”，不是“神秘套利插件”。

你应该先理解：

- Jito 的主要产品线
- Block Engine、Bundle、ShredStream 的关系
- Jito 和普通 RPC 的差异
- Priority Fee 与 Tip 的区别

建议动作：

1. 读完本目录前 3 份文档
2. 打开官方文档看一遍接口目录
3. 记住 bundle 的三个词：顺序、原子、全成全败

## 第二阶段：交易发送基础

目标：会构造一笔标准 Solana 交易，并理解它如何被 Jito 路径发送。

你需要先掌握：

- `@solana/web3.js`
- `Connection`
- `VersionedTransaction`
- recent blockhash
- fee payer
- compute budget

如果这些基础还不稳，先不要急着学 Jito bundle。

## 第三阶段：理解 bundle

目标：理解 bundle 适合什么场景，不适合什么场景。

适合：

- 原子套利
- 多步策略
- 清算链路
- 需要防止中间状态暴露的动作

不一定适合：

- 非竞争型普通转账
- 简单查询场景
- 不需要原子性的单步操作

## 第四阶段：理解竞争与风险

目标：接受现实，明白“技术路径更强”不等于“稳定盈利”。

要重点理解：

- 你在参与拍卖
- 你会和其他搜索者竞争
- 你会遇到落地失败
- 你会遇到费率和 tip 调优问题
- 低延迟基础设施本身就是门槛

## 第五阶段：进入实战编码

建议按这个顺序做 demo：

1. 写一个普通 Solana 交易发送脚本
2. 写一个 Jito 单笔交易发送脚本
3. 写一个查询 tip / bundle 状态的脚本
4. 写一个最小 bundle 示例
5. 最后再考虑策略程序

## 推荐的后续目录结构

当你准备开始写代码时，可以把 `DAPP/jito` 扩展成：

```text
DAPP/jito
├── README.md
├── 01-overview.md
├── 02-core-concepts.md
├── 03-api-notes.md
├── 04-learning-path.md
├── examples
│   ├── send_transaction.js
│   ├── send_bundle.js
│   └── get_bundle_status.js
└── notes
    ├── glossary.md
    └── pitfalls.md
```

## 你后面可以继续学什么

如果你要继续往深处走，建议下一步学习：

- Jito JSON-RPC / gRPC 的实际请求格式
- tip 策略
- sandwich mitigation
- ShredStream 数据接入
- Solana leader schedule
- 本地模拟与失败重试
- 搜索者系统架构

## 一句话总结

Jito 最值得学的不是某个接口本身，而是它背后的执行思路：

- 更快获取信息
- 更快提交交易
- 更好组织多笔交易
- 在竞争中用基础设施提升成功率
