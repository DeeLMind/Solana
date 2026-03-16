use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana!");
    msg!("Program ID: {}", program_id);

    msg!("Accounts count: {}", accounts.len());

    for (i, account) in accounts.iter().enumerate() {
        msg!("--- Account {} ---", i);
        msg!("Key: {}", account.key);
        msg!("Owner: {}", account.owner);
        msg!("Is signer: {}", account.is_signer);
        msg!("Is writable: {}", account.is_writable);
        msg!("Is executable: {}", account.executable);

        // lamports
        let lamports = **account.lamports.borrow();
        msg!("Lamports: {}", lamports);

        // data
        let data_len = account.data.borrow().len();
        msg!("Data length: {}", data_len);
    }

    Ok(())
}
