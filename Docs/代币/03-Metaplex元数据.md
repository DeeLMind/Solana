# Metaplex 元数据

来源：

- https://solana.com/zh/docs/tokens/metaplex

## 为什么需要元数据

标准 SPL 代币本身不保存这些常见展示信息：

- 名称
- 符号
- 图片
- 描述

所以如果你只看基础 mint，通常拿不到一个用户友好的“资产卡片”。

## Metaplex 的思路

Metaplex 元数据程序会为某个 mint 创建一个关联的元数据账户（通常是 PDA）。

这个元数据账户里通常会保存：

- 名称
- 符号
- URI
- 版税等附加信息

其中：

- 链上只放核心字段和 URI
- 更大的图片、描述、属性通常放在链外 JSON

## 一张关系图的理解

```text
Mint Account
  -> 表示“这个代币本身”

Metadata Account (PDA)
  -> 表示“这个代币该如何展示”

URI
  -> 指向链外 JSON / 图片 / 描述
```

## 例子：发行一个 NFT

假设你发行一个 NFT：

- mint account：记录供应量、authority 等
- metadata account：记录名称、符号、URI
- URI 指向：图片、属性、描述

钱包之所以能显示漂亮卡片，依赖的主要就是这条元数据链路。

## 例子：普通 FT 也可以用元数据

很多人以为 Metaplex 只给 NFT 用。  
其实文档里明确说明，这套方案也可以用于标准 SPL token 和 Token-2022。

比如一个平台积分币，也可以通过元数据补上：

- 名称：Platform Point
- 符号：POINT
- 图标 URL

## 链上元数据 vs Token-2022 元数据扩展

这里容易混淆：

- `Metaplex`：通过单独的元数据账户（PDA）存储
- `Token-2022 元数据扩展`：直接把元数据放在 mint 上

如何选：

- 生态兼容性优先：先看 Metaplex
- 希望更紧凑、直接挂在 mint 上：再看 Token-2022 元数据扩展

## 开发时的坑

- URI 指向的 JSON 不规范，钱包展示会异常
- 链上名字和链外 JSON 不一致
- 只创建了 mint，没有创建 metadata account
- 把“代币余额逻辑”和“展示逻辑”混在一起理解
