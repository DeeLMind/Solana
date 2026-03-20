use anchor_lang::prelude::*;

declare_id!("HW4XaYfXcT8afnzunbKJR71zKjkTvQGbqbjtjGSPBq7h");

#[program]
pub mod helloworld {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
