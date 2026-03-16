use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
};

// 设置入口
entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana!");
    msg!("Program ID: {}", program_id);

    // 打印所有传入账户的 pubkey
    for (i, account) in accounts.iter().enumerate() {
        msg!("Account[{}]: {}", i, account.key);
    }

    // 尝试将 instruction_data 当作 UTF-8 字符串打印
    if let Ok(s) = std::str::from_utf8(instruction_data) {
        msg!("Instruction data as string: {}", s);
    } else {
        msg!("Instruction data is not valid UTF-8: {:?}", instruction_data);
    }

    Ok(())
}
