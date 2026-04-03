// src/lib.rs
//
// Pinocchio helloworld — 演示 pinocchio 框架的常用模式
//
// 指令格式（instruction_data[0] 为指令类型）：
//   0x00 => Hello: 打印 Hello 日志
//   0x01 => LogAccounts: 遍历账户并打印基本信息
//   0x02 => EchoData: 将 instruction_data[1..] 的字节打印出来
//   0x03 => TransferLamports: 从 accounts[0] 向 accounts[1] 转移 lamports

use pinocchio::{
    AccountView,
    Address,
    entrypoint,
    ProgramResult,
};
use pinocchio::error::ProgramError;
use pinocchio_log::log;

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Address,
    accounts: &[AccountView],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = instruction_data
        .first()
        .ok_or(ProgramError::InvalidInstructionData)?;

    match instruction {
        0x00 => hello(),
        0x01 => log_accounts(accounts),
        0x02 => echo_data(&instruction_data[1..]),
        0x03 => transfer_lamports(accounts, &instruction_data[1..]),
        _ => {
            log!("unknown instruction: {}", *instruction as u64);
            Err(ProgramError::InvalidInstructionData)
        }
    }
}

// ── 指令 0x00: Hello ──────────────────────────────────────────────────────────
fn hello() -> ProgramResult {
    log!("Hello from Pinocchio!");
    Ok(())
}

// ── 指令 0x01: LogAccounts ────────────────────────────────────────────────────
// 遍历所有传入账户，打印其基本信息（零拷贝读取）
fn log_accounts(accounts: &[AccountView]) -> ProgramResult {
    log!("accounts count: {}", accounts.len() as u64);

    for (i, account) in accounts.iter().enumerate() {
        log!("account[{}] signer={} writable={} lamports={} data_len={}",
            i as u64,
            account.is_signer() as u64,
            account.is_writable() as u64,
            account.lamports(),
            account.data_len() as u64
        );
    }

    Ok(())
}

// ── 指令 0x02: EchoData ───────────────────────────────────────────────────────
// 将 instruction_data 中的字节以十进制打印出来
fn echo_data(data: &[u8]) -> ProgramResult {
    if data.is_empty() {
        log!("echo: (empty)");
        return Ok(());
    }

    // 使用 pinocchio-log 的 Logger 高效拼接，避免堆分配
    use pinocchio_log::logger::Logger;
    let mut logger = Logger::<128>::default();
    logger.append("echo bytes:");
    for byte in data {
        logger.append(" ");
        logger.append(*byte as u64);
    }
    logger.log();

    Ok(())
}

// ── 指令 0x03: TransferLamports ───────────────────────────────────────────────
// 演示直接操作账户 lamports（无需 CPI，节省大量 CU）
// instruction_data[1..9] = u64 little-endian 转移金额
// accounts[0] = from (signer, writable)
// accounts[1] = to   (writable)
fn transfer_lamports(accounts: &[AccountView], data: &[u8]) -> ProgramResult {
    if accounts.len() < 2 {
        return Err(ProgramError::NotEnoughAccountKeys);
    }
    if data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let from = &accounts[0];
    let to = &accounts[1];

    if !from.is_signer() {
        log!("from account must be signer");
        return Err(ProgramError::MissingRequiredSignature);
    }
    if !from.is_writable() || !to.is_writable() {
        log!("both accounts must be writable");
        return Err(ProgramError::InvalidAccountData);
    }

    let amount = u64::from_le_bytes(data[..8].try_into().unwrap());

    if from.lamports() < amount {
        log!("insufficient lamports");
        return Err(ProgramError::InsufficientFunds);
    }

    // pinocchio AccountView 直接 set_lamports，零拷贝写入
    from.set_lamports(from.lamports() - amount);
    to.set_lamports(to.lamports() + amount);

    log!("transferred {} lamports", amount);
    Ok(())
}
