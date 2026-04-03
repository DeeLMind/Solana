# 01. Core Validation

## 1. Missing Owner Checks

### 漏洞成因

程序只验证了账户数据“长得像”，却没有验证这个账户是不是由当前程序拥有。

### 攻击路径

攻击者创建一个数据布局相同、字段内容看起来也合理的假账户，然后把它传给程序。只要程序缺少 owner check，就可能把伪造账户当成真实状态账户。

### 修补方案

- Anchor: 优先使用 `Account<'info, T>`
- Anchor: 如必须用 `UncheckedAccount`，显式加 `#[account(owner = crate::ID)]`
- Pinocchio / Native: 手动检查 `account.owner == program_id`

### Anchor 示例

```rust
#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub authority: Signer<'info>,

    // 安全写法：Anchor 自动做 owner + discriminator 校验
    pub profile: Account<'info, UserProfile>,
}

pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
    let profile = &ctx.accounts.profile;

    // 这里的 authority 检查已经建立在 profile 可信之上
    require_keys_eq!(profile.authority, ctx.accounts.authority.key());
    Ok(())
}
```

### Pinocchio 示例

```rust
pub fn process(accounts: Accounts) -> Result<(), ProgramError> {
    // 先做 owner check，再读数据
    if !accounts.profile.is_owned_by(&crate::ID) {
        return Err(ProgramError::InvalidAccountOwner);
    }

    let data = accounts.profile.try_borrow_data()?;
    let profile = UserProfile::from_bytes(&data)?;

    if profile.authority != *accounts.authority.key() {
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}
```

### Native Solana 示例

```rust
pub fn process(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let authority = next_account_info(account_info_iter)?;
    let profile = next_account_info(account_info_iter)?;

    if profile.owner != program_id {
        return Err(ProgramError::InvalidAccountOwner);
    }

    let profile_data = UserProfile::try_from_slice(&profile.try_borrow_data()?)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if profile_data.authority != *authority.key {
        return Err(ProgramError::InvalidArgument);
    }

    Ok(())
}
```

## 2. Missing Signer Checks

### 漏洞成因

程序验证了“authority 这个 pubkey 应该是谁”，但没有验证这个 authority 是否真的签了名。

### 攻击路径

攻击者把受害者的公钥直接传进交易作为 authority 账户，但不给受害者签名。如果程序只比较 pubkey，不比较 signer 位，攻击者就能越权操作。

### 修补方案

- Anchor: `Signer<'info>`
- Anchor: `#[account(signer)]`
- Pinocchio / Native: `if !authority.is_signer { ... }`

### Anchor 示例

```rust
#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    // 安全点：Signer 类型要求这个账户必须签名
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub config: Account<'info, Config>,
}

pub fn update_config(ctx: Context<UpdateConfig>, new_fee: u64) -> Result<()> {
    ctx.accounts.config.fee = new_fee;
    Ok(())
}
```

### Pinocchio 示例

```rust
pub fn process(accounts: Accounts) -> Result<(), ProgramError> {
    if !accounts.authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let config = Config::from_bytes(&accounts.config.try_borrow_data()?)?;
    if config.authority != *accounts.authority.key() {
        return Err(ProgramError::InvalidAccountData);
    }

    Ok(())
}
```

### Native Solana 示例

```rust
pub fn process(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let authority = next_account_info(account_info_iter)?;
    let config = next_account_info(account_info_iter)?;

    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let state = Config::try_from_slice(&config.try_borrow_data()?)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    if state.authority != *authority.key {
        return Err(ProgramError::InvalidArgument);
    }

    Ok(())
}
```

## 3. Arbitrary CPI Attacks

### 漏洞成因

程序相信调用者传入的 program account，并直接对它做 CPI，没有确认它是不是预期的目标程序。

### 攻击路径

攻击者传入一个假程序地址。这个恶意程序伪装成目标接口，但内部逻辑可以做完全不同的事情，例如窃取授权、反向转账或改变状态。

### 修补方案

- Anchor: 用 `Program<'info, Token>` 这种 typed program
- Pinocchio / Native: 显式比较 `program_id`

### Anchor 示例

```rust
#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,

    // 安全点：typed program 约束它必须是 SPL Token Program
    pub token_program: Program<'info, Token>,
}

pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;
    Ok(())
}
```

### Pinocchio 示例

```rust
pub fn process(accounts: Accounts) -> Result<(), ProgramError> {
    if accounts.token_program.key() != &pinocchio_token::ID {
        return Err(ProgramError::IncorrectProgramId);
    }

    // 只有确认 program id 正确后，才进行 CPI
    pinocchio_token::instructions::transfer(
        accounts.token_program,
        accounts.from,
        accounts.to,
        accounts.authority,
        100,
    )?;

    Ok(())
}
```

### Native Solana 示例

```rust
pub fn process(_program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let token_program = next_account_info(account_info_iter)?;

    if token_program.key != &spl_token::ID {
        return Err(ProgramError::IncorrectProgramId);
    }

    // 现在才可以安全构造 invoke
    Ok(())
}
```

## 4. Reinitialization Attacks

### 漏洞成因

初始化逻辑没有区分“首次初始化”和“已初始化账户”，导致已存在的状态可能被再次写入。

### 攻击路径

攻击者把一个已有账户重新传给 initialize 指令，把 authority 改成自己，之后接管资金或配置。

### 修补方案

- Anchor: 优先用 `init`
- 避免滥用 `init_if_needed`
- Pinocchio / Native: 初始化前先检查 discriminator、magic byte 或 `is_initialized`

### Anchor 示例

```rust
#[account]
pub struct VaultState {
    pub authority: Pubkey,
    pub is_initialized: bool,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 32 + 1)]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.payer.key();
    vault.is_initialized = true;
    Ok(())
}
```

### Pinocchio 示例

```rust
pub fn initialize(accounts: Accounts) -> Result<(), ProgramError> {
    let data = accounts.vault.try_borrow_data()?;

    // 安全点：如果 discriminator / flag 已存在，直接拒绝
    if data[0] == VAULT_DISCRIMINATOR {
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    drop(data);
    // 然后再写入初始化数据
    Ok(())
}
```

### Native Solana 示例

```rust
pub fn initialize(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let vault = next_account_info(account_info_iter)?;

    if vault.owner != program_id {
        return Err(ProgramError::InvalidAccountOwner);
    }

    let mut data = vault.try_borrow_mut_data()?;
    let existing = VaultState::try_from_slice(&data).ok();

    if let Some(state) = existing {
        if state.is_initialized {
            return Err(ProgramError::AccountAlreadyInitialized);
        }
    }

    Ok(())
}
```
