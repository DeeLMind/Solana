use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

// 这是一个“故意写错”的示例，用来说明 Missing Owner Checks。
// 问题不在于业务本身，而在于 profile 使用了 UncheckedAccount，
// 后面又手动反序列化数据，但没有验证 profile.owner 是否等于本程序 ID。

#[program]
pub mod owner_check_bug_demo {
    use super::*;

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let profile_info = &ctx.accounts.profile;

        // 漏洞点 1：
        // 这里直接从账户数据里读取并反序列化。
        // 只要账户数据布局长得像 UserProfile，就有机会解析成功。
        let mut data: &[u8] = &profile_info.try_borrow_data()?;
        let profile = UserProfile::try_deserialize(&mut data)?;

        // 漏洞点 2：
        // 程序只检查 authority 字段，却没有检查这个 profile
        // 是不是本程序真正创建和拥有的账户。
        require_keys_eq!(
            profile.authority,
            ctx.accounts.authority.key(),
            DemoError::InvalidAuthority
        );

        // 假设这里本来会继续执行敏感逻辑，比如：
        // - 从 vault 提款
        // - 修改用户权限
        // - 更新关键配置
        //
        // 那么攻击者只要伪造一个同结构账户，就可能绕过真实状态约束。
        msg!("withdrawing {} lamports to authority", amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // 漏洞根源：
    // 这里没有 owner 约束，也没有 typed account。
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

// 攻击过程示意：
//
// 1. 攻击者新建一个假账户 fake_profile
// 2. 往 fake_profile 写入与 UserProfile 相同的数据布局
// 3. 设置 fake_profile.authority = 攻击者钱包
// 4. 调用 withdraw，并把 fake_profile 传给 profile
// 5. 因为程序没检查 profile.owner == crate::ID，
//    所以它把 fake_profile 当成了合法配置账户
