use pinocchio::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
};

// 这里假设 crate::ID 是当前程序 ID。
// 这个例子展示的是 Pinocchio / Native 风格下，
// 你必须自己手动做 owner check。

pub const ID: Pubkey = Pubkey::new_from_array([1u8; 32]);

#[repr(C)]
pub struct UserProfile {
    pub authority: Pubkey,
    pub vault: Pubkey,
    pub bump: u8,
}

pub fn process_withdraw(
    authority: &AccountInfo,
    profile: &AccountInfo,
    amount: u64,
) -> Result<(), ProgramError> {
    // 安全点 1：
    // 在任何反序列化、业务判断、字段读取之前，
    // 先检查这个账户是不是当前程序拥有的。
    if !profile.is_owned_by(&ID) {
        return Err(ProgramError::InvalidAccountOwner);
    }

    // 安全点 2：
    // 再去做 signer 校验、数据长度校验、反序列化等后续动作。
    if !authority.is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // 下面是假设性的手动解析流程。
    // 实际项目里你可能还会做：
    // - discriminator 校验
    // - data length 校验
    // - PDA seeds 校验
    let data = profile.try_borrow_data()?;

    if data.len() < core::mem::size_of::<UserProfile>() {
        return Err(ProgramError::InvalidAccountData);
    }

    // 这里只是示意“后面你才应该去相信这份数据”。
    let _ = amount;

    Ok(())
}

// 如果没有 owner check，会发生什么：
//
// 1. 攻击者传入一个不是本程序拥有的账户
// 2. 但这个账户的数据恰好伪造得像 UserProfile
// 3. 你的程序手动解析后，会误以为这是合法状态账户
// 4. 于是后面的权限判断、资产流转、配置更新都可能建立在假状态上
