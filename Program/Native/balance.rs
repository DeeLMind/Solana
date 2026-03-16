use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program_error::ProgramError,
};

// 设置程序入口
entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana!");
    msg!("Our program's Program ID: {}", program_id);

    if accounts.is_empty() {
        msg!("No accounts passed in.");
        return Ok(());
    }

    // 1️⃣ 调用者（通常是第一个 signer）余额
    let caller_account = &accounts[0];
    msg!(
        "Caller (Account[0]) pubkey: {}, lamports: {}",
        caller_account.key,
        caller_account.lamports()
    );

    // 2️⃣ 程序账户余额
    // 程序账户一般不是传入的，需要自己检查 Owner / Program Account
    // 这里假设程序账户在 accounts 中（如 Account[1]）
    if accounts.len() > 1 {
        let program_account = &accounts[1];
        msg!(
            "Program account pubkey: {}, lamports: {}",
            program_account.key,
            program_account.lamports()
        );
    }

    // 3️⃣ 遍历所有传入的账户
    for (i, account) in accounts.iter().enumerate() {
        msg!(
            "Account[{}] pubkey: {}, lamports: {}",
            i,
            account.key,
            account.lamports()
        );
    }

    Ok(())
}
