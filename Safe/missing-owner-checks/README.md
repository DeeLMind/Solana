# Missing Owner Checks

这个目录演示一个非常常见、也非常危险的 Solana 程序漏洞：

- `Missing Owner Checks`

核心问题是：

程序只校验了账户数据格式、长度、discriminator 或 PDA 外观，
却没有校验这个账户是否真的归当前程序所有。

这样攻击者就可以：

1. 自己创建一个“长得很像”的假账户
2. 往里面写入与你程序账户结构一致的数据布局
3. 把这个假账户传给你的指令
4. 让你的程序错误地把它当成真实状态账户使用

## 为什么这很危险

在 Solana 里，一个账户是否“可信”，不能只看：

- 数据结构像不像
- discriminator 对不对
- PDA 长得像不像
- 字段值合不合理

还必须看：

- `owner` 是否真的是你的程序 ID

如果缺少 owner check，程序就可能信任一个伪造账户。

## 一个具体攻击场景

假设你写了一个“用户配置账户”：

```rust
pub struct UserProfile {
    pub authority: Pubkey,
    pub vault: Pubkey,
    pub bump: u8,
}
```

正常情况下，这个账户应该由你的程序初始化，并且 `owner = crate::ID`。

但是如果你的指令中只是：

- 读取账户数据
- 手动反序列化
- 校验 `authority == signer`

却没有检查 `account.owner == crate::ID`

那攻击者就可以：

1. 在链上创建一个系统账户或其他程序拥有的账户
2. 手动把数据写成 `UserProfile` 的布局
3. 把 `authority` 字段填成自己
4. 把 `vault` 字段填成攻击者控制的地址
5. 调用你的提现、转账、配置更新等指令

结果是：

你的程序会把伪造账户当真，接着执行后续敏感逻辑。

## 本目录内容

- [anchor_vulnerable.rs](./anchor_vulnerable.rs)：Anchor 漏洞示例
- [anchor_fixed.rs](./anchor_fixed.rs)：Anchor 安全修复示例
- [pinocchio_fixed.rs](./pinocchio_fixed.rs)：Pinocchio / 原生风格安全修复示例
- [native_solana_fixed.rs](./native_solana_fixed.rs)：纯 `solana_program` 风格安全修复示例

## Anchor 里的安全做法

最稳妥的方法有两个：

### 1. 使用 typed accounts

```rust
pub profile: Account<'info, UserProfile>,
```

这样 Anchor 会自动帮你做：

- discriminator 校验
- owner 校验
- 账户反序列化

### 2. 如果必须用 `UncheckedAccount`

那就显式加：

```rust
#[account(owner = crate::ID)]
pub profile: UncheckedAccount<'info>,
```

## Pinocchio / Native 里的安全做法

如果你是手动处理账户，就必须显式写 owner 检查：

```rust
if !account.is_owned_by(&crate::ID) {
    return Err(ProgramError::InvalidAccountOwner);
}
```

## 一句话记忆

只验证“数据像”，不验证“owner 对”，就等于允许伪造账户混进来。
