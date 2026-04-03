# 03. Pinocchio Hardening

这一部分在原文里被明确点名为 Pinocchio / Native 侧需要手动处理的风险。Anchor 的账户系统会自动兜住其中一部分，但手写程序必须自己补上。

## 10. Sysvar Spoofing

### 漏洞成因

程序把外部传入的账户直接当成 `Clock`、`Rent`、`SlotHashes` 等 sysvar 使用，却没有验证它是不是 canonical sysvar 地址。

### 攻击路径

攻击者伪造一个“数据布局像 Clock”的账户，让程序读取到假的时间、假的 rent 参数、假的 slot hash。

### 修补方案

- Anchor: 使用 `Sysvar<'info, Clock>` 等 typed sysvar
- Pinocchio: 使用 `Clock::get()`、`Rent::get()`
- Native: 比较 sysvar 地址是否等于标准地址

### Anchor 示例

```rust
#[derive(Accounts)]
pub struct UseClock<'info> {
    pub clock: Sysvar<'info, Clock>,
}
```

### Pinocchio 示例

```rust
use pinocchio::sysvars::{clock::Clock, rent::Rent, Sysvar};

let clock = Clock::get()?;
let rent = Rent::get()?;
```

### Native Solana 示例

```rust
use solana_program::sysvar::{clock, rent};

if clock_account.key != &clock::ID {
    return Err(ProgramError::InvalidArgument);
}

if rent_account.key != &rent::ID {
    return Err(ProgramError::InvalidArgument);
}
```

## 11. Bump Canonicalization

### 漏洞成因

程序直接信任用户提供的 bump，而不是使用 canonical bump。这样会允许程序接受“合法但不是预期的 PDA”。

### 攻击路径

攻击者把非 canonical bump 写进状态或交易参数，诱导程序在后续校验里接受另一条地址派生路径。

### 修补方案

- 初始化时只存 canonical bump
- 后续验证时用存储的 canonical bump 直接重新派生

### Anchor 示例

```rust
#[account]
pub struct VaultState {
    pub bump: u8,
}

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [b"vault", owner.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultState>,
    pub owner: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn init(ctx: Context<Init>) -> Result<()> {
    ctx.accounts.vault.bump = ctx.bumps.vault;
    Ok(())
}
```

### Pinocchio 示例

```rust
let (expected, canonical_bump) =
    Address::find_program_address(&[b"vault", owner.key().as_ref()], &crate::ID);

state.bump = canonical_bump;

let derived = Address::create_program_address(
    &[b"vault", owner.key().as_ref(), &[state.bump]],
    &crate::ID,
)?;

if vault.address() != &derived {
    return Err(ProgramError::InvalidSeeds);
}
```

### Native Solana 示例

```rust
let (expected, canonical_bump) =
    Pubkey::find_program_address(&[b"vault", owner.key.as_ref()], program_id);

if state.bump != canonical_bump {
    return Err(ProgramError::InvalidSeeds);
}

if vault.key != &expected {
    return Err(ProgramError::InvalidSeeds);
}
```

## 12. Lamport Griefing (Pre-funded PDA)

### 漏洞成因

初始化代码默认 PDA 余额一定是 0，于是直接转精确租金值。可一旦攻击者先往 PDA 打了一点 lamports，后续 `Allocate` / `Assign` 逻辑就可能失败或行为异常。

### 攻击路径

攻击者预先向尚未初始化的 PDA 地址打入 lamports，导致你的初始化路径出错。

### 修补方案

- 先读现有 lamports
- 只补足差额，不假设当前余额一定是 0

### Anchor 示例

```rust
// Anchor 常见做法是让 init 约束去处理账户创建。
// 如果你手写 create_account / allocate / assign 流程，
// 也应遵守“只补差额”的原则。
let required = Rent::get()?.minimum_balance(space);
let existing = pda.to_account_info().lamports();
let deficit = required.saturating_sub(existing);
```

### Pinocchio 示例

```rust
let required = Rent::get()?.minimum_balance(space);
let existing = account.lamports();

if existing < required {
    Transfer {
        from: payer,
        to: account,
        lamports: required - existing,
    }
    .invoke()?;
}
```

### Native Solana 示例

```rust
let required = Rent::get()?.minimum_balance(space);
let existing = pda.lamports();

if existing < required {
    let deficit = required - existing;
    // system_instruction::transfer only the deficit
}
```

## 13. Missing Writable / Read-Only Enforcement

### 漏洞成因

运行时会阻止真正的非法写入，但如果你从逻辑层不验证 mutability，很多授权与不变量假设会被削弱。

### 攻击路径

这通常不是单独致命漏洞，但和其他授权缺陷叠加时，很容易造成本不该可写的账户被纳入危险路径，或者本应可写的账户实际上不可写，导致流程出现不一致。

### 修补方案

- 明确要求只读账户不得 writable
- 明确要求被修改账户必须 writable

### Anchor 示例

```rust
#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub vault: Account<'info, VaultState>,

    // 如果 authority 不该被写，保持非 mut
    pub authority: Signer<'info>,
}
```

### Pinocchio 示例

```rust
if authority.is_writable() {
    return Err(ProgramError::InvalidArgument);
}

if !vault.is_writable() {
    return Err(ProgramError::InvalidArgument);
}
```

### Native Solana 示例

```rust
if authority.is_writable {
    return Err(ProgramError::InvalidArgument);
}

if !vault.is_writable {
    return Err(ProgramError::InvalidArgument);
}
```
