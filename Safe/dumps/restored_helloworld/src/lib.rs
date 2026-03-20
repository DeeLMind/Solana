use anchor_lang::prelude::*;

declare_id!("HW4XaYfXcT8afnzunbKJR71zKjkTvQGbqbjtjGSPBq7h");

#[program]
pub mod helloworld {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {}", crate::ID);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
