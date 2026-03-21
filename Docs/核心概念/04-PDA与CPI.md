# PDA 与 CPI

来源：

- https://solana.com/zh/docs/core/pda/index
- https://solana.com/zh/docs/core/cpi/index

## 什么是 PDA

PDA（Program Derived Address）是程序根据：

- 程序 ID
- 一组 seeds

确定性推导出来的地址。

它的关键性质：

- 没有对应私钥
- 不在 Ed25519 曲线上
- 只能由对应程序通过 `invoke_signed` 代表它“签名”

## 为什么 PDA 很重要

因为它让程序可以拥有“稳定、可预测、可重复推导”的地址空间。

常见用途：

- 用户资料账户
- 配置账户
- 金库账户
- 订单账户
- 关联映射账户

## 例子：用户资料 PDA

假设你要给每个用户创建一个资料账户，可以用：

```text
seeds = ["profile", user_pubkey]
program_id = 你的程序 ID
```

这样推导后：

- 同一个用户永远能得到同一个 PDA
- 客户端和链上程序都能算出这个地址

## 什么是 CPI

CPI（Cross Program Invocation）就是：

- 一个程序在执行时
- 再去调用另一个程序的指令

这正是 Solana 可组合性的核心。

## 例子：你的程序调用 System Program

你写了一个程序，需要在执行时替用户创建一个账户。  
这时你不会自己重新实现“创建账户”，而是会：

- 从你的程序里
- CPI 调用 `System Program`

## 例子：PDA + CPI 一起使用

最经典的组合是：

1. 你的程序推导一个 PDA 作为金库地址
2. 用户把资产转进这个 PDA 控制的账户
3. 你的程序在需要时通过 `invoke_signed`
4. 以 PDA 身份调用别的程序转出资产

## 为什么“PDA 可以签名”

准确说法不是 PDA 有私钥，而是：

- Runtime 验证 seeds + bump + program_id
- 验证成功后，允许此次 CPI 把该 PDA 视为签名者

## CPI 时权限怎么传递

官方文档强调，CPI 涉及权限传递：

- 签名者权限可能被传递
- 可写权限可能被传递

所以开发时必须非常谨慎：

- 只传必要账户
- 只给必要的可写权限
- 不要把高权限账户随便透传给下游程序

## 常见误区

- 误区 1：PDA 就是普通钱包  
  不是。PDA 没有私钥，不能像钱包那样离线签名。

- 误区 2：任何程序都能替 PDA 签名  
  不是。只有用于推导这个 PDA 的那个程序可以。

- 误区 3：CPI 可以无限递归  
  不行。调用深度有限，官方文档给出了指令栈深度上限。
