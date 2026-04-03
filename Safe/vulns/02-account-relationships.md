# 02. Account Relationships

## 5. PDA Sharing Vulnerabilities

### 漏洞成因

PDA seeds 只包含公共维度，没有绑定到具体用户或具体 vault，导致多个实体共享同一个 PDA。

### 攻击路径

如果多个用户的权限控制都落在同一个 PDA 上，这个 PDA 就会变成“主钥匙”。一旦某个路径能合法使用它，就可能影响其他用户资产。

### 修补方案

- PDA seeds 中纳入 user / vault / authority 等专属标识
- 不要只用 mint、pool id 这种共享维度

### Anchor 示例

```rust
// 脆弱：所有同 mint 的 vault 都共享 authority PDA
#[account(
    seeds = [b"pool", mint.key().as_ref()],
    bump
)]
pub pool_authority: UncheckedAccount<'info>,

// 修复：把 vault 和 owner 都纳入 seeds
#[account(
    seeds = [b"pool", vault.key().as_ref(), owner.key().as_ref()],
    bump
)]
pub pool_authority: UncheckedAccount<'info>,
```

### Pinocchio 示例

```rust
let expected = Address::create_program_address(
    &[b"pool", vault.key().as_ref(), owner.key().as_ref(), &[state.bump]],
    &crate::ID,
)?;

if authority.address() != &expected {
    return Err(ProgramError::InvalidSeeds);
}
```

### Native Solana 示例

```rust
let (expected, _bump) = Pubkey::find_program_address(
    &[b"pool", vault.key.as_ref(), owner.key.as_ref()],
    program_id,
);

if authority.key != &expected {
    return Err(ProgramError::InvalidSeeds);
}
```

## 6. Type Cosplay Attacks

### 漏洞成因

两个账户结构字段布局完全相同，但业务语义不同。程序如果只按布局读数据，不校验类型标识，就可能把一种账户错当成另一种账户。

### 攻击路径

攻击者把“自己可控的账户 A”伪装成“受限账户 B”，绕过授权路径。

### 修补方案

- Anchor: 使用 `#[account]` 自动 discriminator
- Pinocchio / Native: 显式检查 discriminator / tag / enum variant

### Anchor 示例

```rust
#[account]
pub struct AdminConfig {
    pub authority: Pubkey,
}

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
}

// Anchor typed account 会自动校验对应 discriminator
pub admin_config: Account<'info, AdminConfig>,
```

### Pinocchio 示例

```rust
let data = account.try_borrow_data()?;

if data[0] != ADMIN_CONFIG_DISCRIMINATOR {
    return Err(ProgramError::InvalidAccountData);
}

let config = AdminConfig::from_bytes(&data)?;
```

### Native Solana 示例

```rust
let data = account.try_borrow_data()?;

if data.first().copied() != Some(ACCOUNT_TAG_ADMIN) {
    return Err(ProgramError::InvalidAccountData);
}

let config = AdminConfig::try_from_slice(&data[1..])
    .map_err(|_| ProgramError::InvalidAccountData)?;
```

## 7. Duplicate Mutable Accounts

### 漏洞成因

同一个账户被作为两个可变账户参数同时传入，程序却默认它们一定不同。

### 攻击路径

业务逻辑可能先对 `from` 扣减，再对 `to` 增加。如果两个其实是同一个账户，就会导致状态错乱、检查失效，甚至覆盖掉之前的写入。

### 修补方案

- 对所有“逻辑上必须不同”的 `mut` 账户做 key 比较

### Anchor 示例

```rust
pub fn transfer_between_vaults(ctx: Context<TransferBetweenVaults>) -> Result<()> {
    if ctx.accounts.vault_a.key() == ctx.accounts.vault_b.key() {
        return Err(ProgramError::InvalidArgument.into());
    }

    Ok(())
}
```

### Pinocchio 示例

```rust
if accounts.vault_a.key() == accounts.vault_b.key() {
    return Err(ProgramError::InvalidArgument);
}
```

### Native Solana 示例

```rust
if vault_a.key == vault_b.key {
    return Err(ProgramError::InvalidArgument);
}
```

## 8. Revival Attacks

### 漏洞成因

程序以为“把 lamports 清空 + 标记关闭”就足够了，但同一笔交易里，攻击者可能又把 rent 打回这个账户，让它“复活”。

### 攻击路径

多指令交易中，先 close，后 refund lamports，再利用复活账户执行后续逻辑。

### 修补方案

- Anchor: 用 `close = destination`
- Pinocchio / Native: 正确转走 lamports，并使用运行时提供的安全关闭逻辑或彻底清理账户状态

### Anchor 示例

```rust
#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut, close = receiver)]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub receiver: Signer<'info>,
}
```

### Pinocchio 示例

```rust
pub fn close(account: &AccountInfo, destination: &AccountInfo) -> ProgramResult {
    destination.set_lamports(destination.lamports() + account.lamports())?;
    account.close()
}
```

### Native Solana 示例

```rust
// 教学重点：
// 关闭不仅仅是改一个 flag，还要把 lamports 安全转出并彻底失效化状态。
**Pseudo**:
1. transfer all lamports to destination
2. zero data or mark closed discriminator
3. ensure later instructions cannot reuse it as a live state account
```

## 9. Data Matching Vulnerabilities

### 漏洞成因

程序验证了账户 owner、类型甚至 signer，但没有验证“这些账户之间的数据关系”。

### 攻击路径

例如 signer 是真的签了名，但它并不是该 config 里存的 authority。只要程序没比对存储字段，就会误授权。

### 修补方案

- Anchor: `has_one`
- Pinocchio / Native: 手动比较存储字段和传入账户 key

### Anchor 示例

```rust
#[derive(Accounts)]
pub struct Update<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub config: Account<'info, Config>,
}
```

### Pinocchio 示例

```rust
let config = Config::from_bytes(&accounts.config.try_borrow_data()?)?;
if config.authority != *accounts.authority.key() {
    return Err(ProgramError::InvalidAccountData);
}
```

### Native Solana 示例

```rust
let config = Config::try_from_slice(&config_account.try_borrow_data()?)
    .map_err(|_| ProgramError::InvalidAccountData)?;

if config.authority != *authority.key {
    return Err(ProgramError::InvalidArgument);
}
```
