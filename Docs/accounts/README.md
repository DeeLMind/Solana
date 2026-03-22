# Solana 账户模型

## 1. 账户是 Solana 的核心

理解 Solana，最重要的一步就是理解账户模型。

在 Solana 中：

- 程序通常是无状态或少状态逻辑
- 业务数据主要存放在账户里
- 程序通过读取和修改账户来完成状态转换

这和很多“合约自己持有状态”的直觉不同。

## 2. 账户里有什么

一个账户通常包含：

- lamports 余额
- owner
- data
- executable 标志
- rent 相关状态

你可以把它理解为：一个链上的通用状态容器。

## 3. owner 是什么

`owner` 表示哪个程序有权解释和修改这个账户的数据。

关键点：

- 系统账户通常归 `System Program` 管理。
- SPL Token 账户归 Token Program 管理。
- 你的自定义程序账户归你的 program id 管理。

审计里最常见的原则之一就是：

- **一定要检查 owner**

## 4. signer 是什么

`signer` 说明这个账户对应的私钥是否对当前交易完成了授权签名。

要区分：

- `owner` 是“谁管理这个账户数据”
- `signer` 是“谁授权了当前这笔交易”

这两个概念完全不同，但非常容易混淆。

## 5. 可执行账户

程序本身也存放在账户里。

这种账户通常：

- `executable = true`
- 由 loader 管理
- 数据部分保存程序字节码或相关部署状态

因此在 Solana 里，程序也是账户，只是特殊类型账户。

## 6. Rent 与租金豁免

Solana 历史上采用账户 rent 模型，用于约束链上状态存储成本。

开发者最常接触的是：

- `rent-exempt`
- `minimum balance for rent exemption`

直觉理解：

- 如果账户余额达到一定门槛，就能长期存在而不被 rent 机制逐步消耗掉。

## 7. PDA

PDA 是 Solana 账户模型里最关键的开发工具之一。

它允许：

- 程序以确定性方式生成地址
- 程序安全持有状态
- 程序控制某些权限对象而无需真实私钥

常见用途：

- 用户资料账户
- 订单账户
- vault 账户
- config 账户
- token authority

## 8. 系统程序

很多基础账户操作都由 `System Program` 负责，比如：

- 创建账户
- 分配空间
- 转账 lamports
- 分配 owner

也就是说，你的程序经常不是凭空“造账户”，而是通过系统程序完成底层账户创建。

## 9. SPL Token 账户体系

Token 体系又在普通账户模型上叠了一层标准化抽象：

- mint account
- token account
- associated token account
- token authority

理解 SPL Token 的关键是：

- token 余额不是直接存在钱包主账户里
- 而是存在特定 token account 里

## 10. 为什么账户模型有利于并行执行

Solana 交易会显式声明要读写哪些账户。

这意味着运行时能够提前知道：

- 哪些交易会冲突
- 哪些交易可以并行

如果两个交易写的是完全不同的账户集合，就更容易并行执行。

这也是 Solana 高性能的重要基础之一。

## 11. 开发和审计最常见的账户错误

- 忘记检查 owner
- 忘记检查 signer
- PDA seed 设计错误
- 账户类型混淆
- 误把任意外部账户当成可信账户
- CPI 后错误假设账户状态没被改变

## 12. 一句话记忆

Solana 不是“程序拥有一切状态”，而是：

- **程序定义规则，账户承载状态，交易驱动状态变化。**
