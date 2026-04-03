# 04. Token-2022 Risks

这一部分来自原文中的 Token-2022 Extension Security。它和前面的通用账户校验漏洞不同，核心是“旧 SPL Token 心智模型在 Token-2022 下失效”。

## 10. Transfer Fee Accounting

### 漏洞成因

协议假设“发送多少，接收多少”，但 Token-2022 的 transfer fee 会导致接收端到账金额变少。

### 攻击路径

协议按用户声明或发送数量记账，却没有按真实到账 delta 记账。结果是用户可以按被高估的余额提取，协议长期吃亏。

### 修补方案

- 不要做 1:1 假设
- 入账前后读 vault balance，按 delta 记账
- 或明确使用支持 fee 的接口，并传入预期 fee

### Anchor 示例

```rust
pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let before = ctx.accounts.vault.amount;

    // 执行 Token-2022 转账后重新读取
    token_interface::transfer_checked(/* ... */)?;

    let after = ctx.accounts.vault.reload()?.amount;
    let received = after.checked_sub(before).ok_or(ProgramError::InvalidArgument)?;

    // 安全点：按真实到账 received 记账，而不是按 amount 记账
    ctx.accounts.position.deposit_amount = ctx.accounts.position.deposit_amount
        .checked_add(received)
        .ok_or(ProgramError::InvalidArgument)?;

    Ok(())
}
```

### Pinocchio 示例

```rust
let before = vault_token.amount();
pinocchio_token_2022::transfer_checked_with_fee(/* ... */)?;
let after = vault_token.reload()?.amount();
let received = after.checked_sub(before).ok_or(ProgramError::InvalidArgument)?;
state.user_shares = state.user_shares.checked_add(received).ok_or(ProgramError::InvalidArgument)?;
```

### Native Solana 示例

```rust
let before = read_token_amount(vault_token_account)?;
invoke(/* token-2022 transfer */)?;
let after = read_token_amount(vault_token_account)?;
let received = after.checked_sub(before).ok_or(ProgramError::InvalidArgument)?;
state.deposited = state.deposited.checked_add(received).ok_or(ProgramError::InvalidArgument)?;
```

## 11. `calculate_fee` vs `calculate_inverse_fee`

### 漏洞成因

开发者把这两个函数当成互逆，但它们在舍入语义上并不完全对称。

### 攻击路径

协议一处按发送额推 fee，另一处按接收额反推 fee。每次只差 1 个单位看似无害，但高频或大规模协议会慢慢积累成会计损失。

### 修补方案

- 不要混用两者来回推导
- 对账时坚持单一口径
- 更稳妥的是使用 `transfer_checked_with_fee` 并显式给出预期 fee

### Anchor 示例

```rust
// 错误：入账用 calculate_fee，出账又用 inverse_fee 反推
// 正确：统一一条口径，或直接让指令带 expected_fee
let expected_fee = extension.calculate_fee(amount)?;
token_interface::transfer_checked_with_fee(/* amount, expected_fee */)?;
```

### Pinocchio 示例

```rust
let expected_fee = fee_config.calculate_fee(send_amount)?;
pinocchio_token_2022::transfer_checked_with_fee(
    /* amount = send_amount, expected_fee */
)?;
```

### Native Solana 示例

```rust
let expected_fee = fee_config.calculate_fee(send_amount)?;
invoke(
    &spl_token_2022::instruction::transfer_checked_with_fee(
        &spl_token_2022::ID,
        source.key,
        mint.key,
        destination.key,
        authority.key,
        &[],
        send_amount,
        decimals,
        expected_fee,
    )?,
    accounts,
)?;
```

## 12. Permanent Delegate Authority

### 漏洞成因

协议接收了某个 Token-2022 mint 的资产，但没有检查这个 mint 是否设置了 Permanent Delegate。这样 vault 虽然表面由协议控制，实际上还有一个永久代理可以随时转走或销毁代币。

### 攻击路径

用户把带 Permanent Delegate 的 token 存进协议。协议把它视为普通资产。之后 delegate 直接转走或 burn 掉协议 vault 中的代币，造成 TVL 蒸发。

### 修补方案

- 接受存款前检查 mint 扩展
- 若发现 Permanent Delegate，必须建立明确的信任模型
- 不可信则拒绝该 mint

### Anchor 示例

```rust
pub fn validate_mint(ctx: Context<ValidateMint>) -> Result<()> {
    let mint_info = ctx.accounts.mint.to_account_info();
    let data = mint_info.try_borrow_data()?;

    let extensions = parse_token_2022_extensions(&data)?;
    if let Some(delegate) = extensions.permanent_delegate {
        require!(
            ctx.accounts.allowed_delegates.contains(&delegate),
            CustomError::UntrustedPermanentDelegate
        );
    }

    Ok(())
}
```

### Pinocchio 示例

```rust
let mint = pinocchio_token_2022::state::Mint::from_bytes(&mint_account.try_borrow_data()?)?;

if let Some(delegate) = mint.permanent_delegate() {
    if !trusted_delegate_list.contains(delegate) {
        return Err(ProgramError::InvalidAccountData);
    }
}
```

### Native Solana 示例

```rust
let mint_data = mint_account.try_borrow_data()?;
let mint = StateWithExtensions::<spl_token_2022::state::Mint>::unpack(&mint_data)
    .map_err(|_| ProgramError::InvalidAccountData)?;

if let Ok(extension) = mint.get_extension::<PermanentDelegate>() {
    if !trusted_delegate_list.contains(&extension.delegate) {
        return Err(ProgramError::InvalidAccountData);
    }
}
```
