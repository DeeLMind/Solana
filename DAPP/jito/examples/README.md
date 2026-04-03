# Jito 示例

## 1. send_jito_transaction.js

这是一个带详细中文注释的实际示例，演示如何：

1. 用 `@solana/web3.js` 构造主网交易
2. 给交易添加 `priority fee`
3. 给 Jito tip account 添加 `tip`
4. 用 Jito Block Engine 的 `sendTransaction` 接口发送

文件：

- [send_jito_transaction.js](/Users/deelmind/Documents/Solana/DAPP/jito/examples/send_jito_transaction.js)

## 2. 运行前准备

这个例子会真实发送主网交易，所以请先准备：

- 一个可用的主网钱包
- 钱包私钥文件，例如 `id.json`
- 一个目标收款地址
- 足够支付转账、priority fee 和 tip 的 SOL

## 3. 示例环境变量

```bash
export KEYPAIR_PATH=/Users/yourname/id.json
export RECIPIENT=YourRecipientPublicKey
export TRANSFER_SOL=0.001
export JITO_TIP_LAMPORTS=1000
export PRIORITY_FEE_MICRO_LAMPORTS=5000
```

如果你有专用 RPC 或 Jito 鉴权信息，也可以加：

```bash
export SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
export JITO_BASE_URL=https://mainnet.block-engine.jito.wtf
export JITO_UUID=your_uuid_if_needed
```

## 4. 运行方式

```bash
cd /Users/deelmind/Documents/Solana/DAPP
node jito/examples/send_jito_transaction.js
```

## 5. 这个例子学到什么

你会实际接触到 Jito 最关键的几个点：

- `getTipAccounts`
- `sendTransaction`
- `bundleOnly=true`
- `priority fee`
- `Jito tip`
- `base64` 序列化交易

## 6. 重要提醒

- 这是主网示例，不是 devnet 示例
- `sendTransaction` 这条 Jito 路径会跳过普通 RPC preflight
- 请先确认地址和金额，再执行
- 如果你要更安全，下一步应先加 `simulateTransaction` 检查
