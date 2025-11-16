use anchor_lang::prelude::*;

declare_id!("Cc375VeukGtm6PawGFJ9ZU9ELwwNtbAHHAB7fxFSUySy");

#[program]
pub mod anchor_project {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>, display_name: String) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        require!(
            display_name.as_bytes().len() <= 50,
            ErrorCode::DisplayNameTooLong
        );
        user_profile.authority = ctx.accounts.authority.key();
        user_profile.display_name = display_name;
        user_profile.bump = ctx.bumps.user_profile;
        user_profile.links = Vec::new(); 
        Ok(())
    }

    pub fn add_link(ctx: Context<AddLink>, label: String, url: String) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        
        require!(user_profile.links.len() < 10, ErrorCode::LinkLimitReached);

        let new_link = Link {
            label,
            url,
        };
        user_profile.links.push(new_link);
        Ok(())
    }

    pub fn update_link(ctx: Context<UpdateLink>, index: u8, label: String, url: String) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        
        require!(index < user_profile.links.len() as u8, ErrorCode::IndexOutOfBounds);

        let new_link = Link {
            label,
            url,
        };
        
        user_profile.links[index as usize] = new_link;
        Ok(())
    }

    pub fn remove_link(ctx: Context<RemoveLink>, index: u8) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;

        require!(index < user_profile.links.len() as u8, ErrorCode::IndexOutOfBounds);

        user_profile.links.remove(index as usize);
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Link {
    #[max_len(50)]
    pub label: String,
    #[max_len(100)]
    pub url: String,
}

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,
    pub bump: u8,
    #[max_len(50)]
    pub display_name: String,
    #[max_len(10)]
    pub links: Vec<Link>,
}


#[derive(Accounts)]
#[instruction(display_name: String)]
pub struct CreateProfile<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + UserProfile::INIT_SPACE, 
        seeds = [b"profile", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddLink<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"profile", authority.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateLink<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"profile", authority.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveLink<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"profile", authority.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    #[account(mut)]
    pub authority: Signer<'info>,
}


#[error_code]
pub enum ErrorCode {
    #[msg("The provided index is out of bounds.")]
    IndexOutOfBounds,
    #[msg("Cannot add more links. The limit is 10.")]
    LinkLimitReached,
    #[msg("Display name is too long.")]
    DisplayNameTooLong,
}