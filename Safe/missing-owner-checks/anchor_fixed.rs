use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod owner_check_fixed_demo {
    use super::*;

    // 修复方案 1：直接用 typed account。
    // 这是 Anchor 里最推荐的方式，因为它会自动帮你做：
    // - owner 校验
    // - discriminator 校验
    // - 反序列化
    pub fn withdraw_safe(ctx: Context<WithdrawSafe>, amount: u64) -> Result<()> {
        let profile = &ctx.accounts.profile;

        require_keys_eq!(
            profile.authority,
            ctx.accounts.authority.key(),
            DemoError::InvalidAuthority
        );

        msg!("safe withdraw {} lamports", amount);
        Ok(())
    }

    // 修复方案 2：如果你真的必须使用 UncheckedAccount，
    // 那就至少显式加 owner 约束。
    pub fn withdraw_safe_unchecked(
        ctx: Context<WithdrawSafeUnchecked>,
        amount: u64,
    ) -> Result<()> {
        let profile_info = &ctx.accounts.profile;
        let mut data: &[u8] = &profile_info.try_borrow_data()?;
        let profile = UserProfile::try_deserialize(&mut data)?;

        require_keys_eq!(
            profile.authority,
            ctx.accounts.authority.key(),
            DemoError::InvalidAuthority
        );

        msg!("safe unchecked withdraw {} lamports", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct WithdrawSafe<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // Anchor 会自动检查：
    // profile.owner == crate::ID
    pub profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct WithdrawSafeUnchecked<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // 显式 owner 约束。
    // 这种写法适合你暂时还不能直接换成 Account<'info, T> 的情况。
    #[account(owner = crate::ID)]
    pub profile: UncheckedAccount<'info>,
}

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub vault: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum DemoError {
    #[msg("Authority does not match profile authority")]
    InvalidAuthority,
}

// 这里为什么安全：
//
// 1. typed account 或 owner 约束先挡住了伪造账户
// 2. 就算攻击者手工构造同样的数据布局
// 3. 只要那个账户不是本程序拥有的
// 4. Anchor 就会在你的业务逻辑之前直接拒绝它
