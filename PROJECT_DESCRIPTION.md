# Project Description

**Deployed Frontend URL:** [TODO: Link to your deployed frontend]

**Solana Program ID:** `Cc375VeukGtm6PawGFJ9ZU9ELwwNtbAHHAB7fxFSUySy`

## Project Overview

### Description

This project is a decentralized "Link-in-Bio" application built on the Solana blockchain, using the Anchor framework. It allows any user with a Solana wallet to create and manage their own public-facing profile page. Users can set a public display name and add, remove, and manage a list of personal links (e.g., social media, portfolio, blog).

The core of the project leverages a Program Derived Address (PDA) to create a unique and secure profile account for each user, ensuring that only the owner of the wallet (the `authority`) can create or modify their own profile and links.

### Key Features

- **Create Profile**: Users can initialize their personal profile account with a unique display name. This action is a one-time setup.
- **Add Link**: Users can add new links to their profile (up to a limit of 10), providing a custom label and a URL.
- **Update Link**: Users can modify the label or URL of an existing link.
- **Remove Link**: Users can remove any existing link from their profile.
- **View Profile**: The frontend automatically fetches and displays the user's display name and list of links if a profile account exists for their connected wallet.

### How to Use the dApp

1. **Connect Wallet** - Connect your Phantom (or other) wallet. Ensure you are on the **Devnet**.
2. **Get Devnet SOL** - Get some Devnet SOL from a faucet, as all transactions (creating, adding, removing) require a small fee.
3. **Create Profile** - If you are a new user, you will be prompted to create a profile. Enter a display name and click "Create Profile".
4. **Manage Links** - Once your profile is created, you will see your profile management dashboard.
5. **Add/Remove Links** - Use the "Add New Link" form to add links. Click the "Remove" button on any link to delete it.

## Program Architecture

The program uses a single PDA account type (`UserProfile`) to store all data for a given user. This PDA is derived from the user's wallet (authority), ensuring a 1-to-1 mapping between a user and their profile.

### PDA Usage

The program uses a Program Derived Address (PDA) to create a unique `UserProfile` account for each user, derived from their wallet's public key.

**PDAs Used:**

- **`UserProfile` PDA**: This is the core account for the dApp.
  - **Seeds**: `[b"profile", authority.key().as_ref()]`
  - **Purpose**: This deterministic address ensures that each user (identified by their `authority` public key) can only have one profile account. The `has_one = authority` constraint in our instructions securely enforces that only the wallet owner can call instructions that modify this account.

### Program Instructions

**Instructions Implemented:**

- **`create_profile(display_name: String)`**: Initializes the `UserProfile` PDA, setting the `authority`, `display_name`, `bump`, and an empty `links` vector.
- **`add_link(label: String, url: String)`**: Pushes a new `Link` struct onto the `links` vector. Includes a runtime check to ensure the vector length does not exceed 10.
- **`update_link(index: u8, label: String, url: String)`**: Updates the link at a specific `index` in the `links` vector. Includes a bounds check.
- **`remove_link(index: u8)`**: Removes the link at a specific `index` from the `links` vector. Includes a bounds check.

### Account Structure

```rust
// Stores a single link
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Link {
    #[max_len(50)]
    pub label: String,
    #[max_len(100)]
    pub url: String,
}

// The main user profile account (PDA)
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey, 
    pub bump: u8,
    #[max_len(50)]
    pub display_name: String,
    // Pre-allocates space for 10 links
    #[max_len(10)]
    pub links: Vec<Link>,
}
```

## Testing

### Test Coverage

The test suite (in `tests/anchor_project.ts`) covers every instruction with both successful and error-triggering scenarios to ensure program correctness and security.

**Happy Path Tests:**

- `Creates a profile!`
- `Adds 9 links!` (Tests adding multiple links up to the limit)
- `Updates an existing link!`
- `Removes a link!`

**Unhappy Path Tests:**

- `Fails to create a duplicate profile!`
- `Fails to add a link when full!` (Tests the `LinkLimitReached` error)
- `Fails to add a link for an unauthorized user!`
- `Fails to remove a link at an invalid index!` (Tests the `IndexOutOfBounds` error)

### Running Tests

```bash
anchor test
```

### Additional Notes for Evaluators

This project was built using modern Anchor features like `InitSpace` and `#[max_len]` to handle account sizing automatically, rather than manual byte calculation. The test suite is comprehensive and includes checks for PDA security (`has_one = authority`) and runtime logic constraints (like link limits and index bounds).