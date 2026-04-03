# Jito 学习目录

这个目录用于系统学习 Solana 生态里的 Jito 相关知识，重点放在开发者最常接触的几个方向：

- Jito 是什么
- Jito 解决什么问题
- Jito 的核心组件
- Bundles / Block Engine / ShredStream 的基本工作方式
- Jito 与普通 Solana RPC 发送交易的区别
- 学习顺序与后续实战方向

建议按下面顺序阅读：

1. [01-overview.md](./01-overview.md)
2. [02-core-concepts.md](./02-core-concepts.md)
3. [03-api-notes.md](./03-api-notes.md)
4. [04-learning-path.md](./04-learning-path.md)

## 这份资料适合谁

- 想理解 Jito 在 Solana 里扮演什么角色的初学者
- 想写交易机器人、套利机器人、抢跑保护流程的开发者
- 想理解 bundles 和低延迟交易路径的 Solana 工程师

## 学习目标

读完这一组文档后，你应该能回答：

- 为什么很多 Solana 机器人或高频系统会接入 Jito
- 什么是 bundle，为什么它是原子执行
- Jito Block Engine、Jito-Solana validator、ShredStream 分别做什么
- 什么时候应该用 Jito 发单笔交易，什么时候应该用 bundle
- 使用 Jito 时要关注哪些风险和限制

## 官方资料

这些笔记主要基于官方资料整理，适合继续深挖：

- Jito Docs: https://docs.jito.wtf/
- Low Latency Transaction Send: https://docs.jito.wtf/lowlatencytxnsend/
- Jito Foundation MEV Docs: https://jito-foundation.gitbook.io/mev/
- Jito Network / JitoSOL Docs: https://www.jito.network/docs/jitosol/

## 备注

本目录是学习笔记，不是生产代码实现。
如果你后面要把这里扩展成代码项目，建议新增：

- `examples/`：放 Jito API 调用示例
- `glossary.md`：术语表
- `faq.md`：自己踩坑后的总结
