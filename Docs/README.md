# Solana 文档总览

这套文档用于系统整理 Solana 区块链的核心知识，覆盖底层架构、共识、密码学、账户模型、交易执行、网络传播、验证者机制、代币经济学，以及虚拟机相关内容。

## 阅读顺序

如果你是第一次系统学习 Solana，建议按这个顺序看：

1. [架构总览](./architecture/README.md)
2. [共识算法](./consensus/README.md)
3. [加密算法](./cryptography/README.md)
4. [账户模型](./accounts/README.md)
5. [交易与执行](./execution/README.md)
6. [网络与数据传播](./networking/README.md)
7. [验证者与质押](./validators/README.md)
8. [代币经济模型](./tokenomics/README.md)
9. [eBPF / sBPF / SVM](./eBPF/README.md)

## 文档目录

### 基础原理

- [架构总览](./architecture/README.md)
  - Solana 的设计目标、核心组件和整体数据流。
- [共识算法](./consensus/README.md)
  - PoH、Tower BFT、PoS、leader schedule、finality。
- [加密算法](./cryptography/README.md)
  - Ed25519、SHA-256、Merkle、PDA、签名与密钥体系。

### 开发与运行时

- [账户模型](./accounts/README.md)
  - 账户、owner、rent、PDA、系统程序、SPL Token。
- [交易与执行](./execution/README.md)
  - transaction、instruction、CPI、compute units、SVM、Sealevel。
- [eBPF / sBPF / SVM](./eBPF/README.md)
  - Solana 程序执行虚拟机及相关运行时。

### 节点与网络

- [网络与数据传播](./networking/README.md)
  - Gulf Stream、Turbine、shred、QUIC、block propagation。
- [验证者与质押](./validators/README.md)
  - validator、vote account、stake、commission、slashing 语境。

### 经济与治理

- [代币经济模型](./tokenomics/README.md)
  - SOL、手续费、优先费、通胀、staking rewards、MEV 语境。

## 学习建议

- 想理解“为什么 Solana 快”，重点看：`PoH + Sealevel + Turbine + Gulf Stream`。
- 想理解“为什么 Solana 和 EVM 完全不一样”，重点看：`账户模型 + SVM + CPI + 并行执行`。
- 想做链上开发，优先看：`账户模型 + 交易与执行 + eBPF`。
- 想做安全审计，优先看：`账户模型 + CPI + 权限边界 + Loader + SVM`。
