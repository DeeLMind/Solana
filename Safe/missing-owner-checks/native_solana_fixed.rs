use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

// 这是一个纯 native Solana program 风格的例子。
// 不使用 Anchor，也不使用 Pinocchio，
// 直接展示最原始的账户校验流程。
//
// 这个例子最想说明的一点是：
// “能反序列化” 不等于 “账户可信”。
// 在 Solana 里，账户可信必须额外满足：
// profile_account.owner == program_id

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct UserProfile {
    pub authority: Pubkey,
    pub vault: Pubkey,
    pub bump: u8,
}

pub fn process_withdraw(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let authority = next_account_info(account_info_iter)?;
    let profile_account = next_account_info(account_info_iter)?;

    // 第一步：检查 signer。
    // 这只是权限校验的一部分，不足以防止伪造状态账户攻击。
    if !authority.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // 第二步：检查 owner。
    // 这是 Missing Owner Checks 的核心修复。
    //
    // 如果少了这一步：
    // - 攻击者可以自建一个账户
    // - 往里面写入 UserProfile 的同样布局
    // - 再把它传给当前指令
    // - 你的程序就可能把假账户当成真状态账户
    if profile_account.owner != program_id {
        msg!("profile account is not owned by this program");
        return Err(ProgramError::InvalidAccountOwner);
    }

    // 第三步：只有 owner 正确后，才去读取并反序列化数据。
    let profile_data = profile_account.try_borrow_data()?;
    let profile = UserProfile::try_from_slice(&profile_data)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // 第四步：再做业务字段校验。
    // 这类逻辑检查必须建立在“账户本身可信”之上。
    if profile.authority != *authority.key {
        msg!("authority does not match profile authority");
        return Err(ProgramError::InvalidArgument);
    }

    // 这里才应该进入真正的敏感业务逻辑。
    // 比如：
    // - 提款
    // - 更新 vault
    // - 修改状态
    msg!("safe native withdraw: {}", amount);

    Ok(())
}

// 下面给一个错误写法的对照版本：
//
// pub fn vulnerable_process_withdraw(
//     _program_id: &Pubkey,
//     accounts: &[AccountInfo],
//     amount: u64,
// ) -> ProgramResult {
//     let account_info_iter = &mut accounts.iter();
//     let authority = next_account_info(account_info_iter)?;
//     let profile_account = next_account_info(account_info_iter)?;
//
//     if !authority.is_signer {
//         return Err(ProgramError::MissingRequiredSignature);
//     }
//
//     // 漏洞点：这里直接反序列化，但没检查 owner
//     let profile_data = profile_account.try_borrow_data()?;
//     let profile = UserProfile::try_from_slice(&profile_data)
//         .map_err(|_| ProgramError::InvalidAccountData)?;
//
//     if profile.authority != *authority.key {
//         return Err(ProgramError::InvalidArgument);
//     }
//
//     msg!("vulnerable native withdraw: {}", amount);
//     Ok(())
// }
//
// 这段错误代码的问题在于：
// 它把“数据结构匹配”误当成了“账户可信”。
// 但攻击者完全可以伪造一个结构匹配、owner 却不正确的账户。
