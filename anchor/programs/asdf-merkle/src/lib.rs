use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;
use solana_sha256_hasher::hashv;

declare_id!("9VNpXtrW4gVqSuS8LHieN6R78WzU9d815DzrcdmqFDN");

/// asdf-brain Merkle Root Storage Program
///
/// "Don't trust, verify" - Every piece of knowledge has cryptographic proof
///
/// This program stores weekly Merkle roots from asdf-brain, enabling:
/// - On-chain verification of knowledge inclusion
/// - Tamper-proof history of brain state
/// - Trustless validation of patterns and decisions

#[program]
pub mod asdf_merkle {
    use super::*;

    /// Initialize the brain config account
    /// Only called once by the authority
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.total_snapshots = 0;
        config.last_snapshot_slot = 0;
        config.bump = ctx.bumps.config;

        msg!("asdf-brain Merkle storage initialized");
        msg!("Authority: {}", config.authority);

        Ok(())
    }

    /// Store a new weekly Merkle root snapshot
    ///
    /// # Arguments
    /// * `root` - The 32-byte Merkle root hash
    /// * `week_number` - Week number (e.g., 2026-W02)
    /// * `pattern_count` - Number of patterns included in this root
    /// * `decision_count` - Number of decisions included
    /// * `contributor_count` - Number of contributors who contributed
    pub fn store_snapshot(
        ctx: Context<StoreSnapshot>,
        root: [u8; 32],
        week_number: u16,
        pattern_count: u32,
        decision_count: u32,
        contributor_count: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let snapshot = &mut ctx.accounts.snapshot;

        // Verify authority
        require!(
            ctx.accounts.authority.key() == config.authority,
            ErrorCode::Unauthorized
        );

        // Store snapshot data
        snapshot.root = root;
        snapshot.week_number = week_number;
        snapshot.slot = Clock::get()?.slot;
        snapshot.timestamp = Clock::get()?.unix_timestamp;
        snapshot.pattern_count = pattern_count;
        snapshot.decision_count = decision_count;
        snapshot.contributor_count = contributor_count;
        snapshot.snapshot_index = config.total_snapshots;
        snapshot.bump = ctx.bumps.snapshot;

        // Update config
        config.total_snapshots += 1;
        config.last_snapshot_slot = snapshot.slot;
        config.current_root = root;

        msg!("Snapshot stored for week {}", week_number);
        msg!("Root: {:?}", root);
        msg!("Patterns: {}, Decisions: {}, Contributors: {}",
             pattern_count, decision_count, contributor_count);

        emit!(SnapshotStored {
            week_number,
            root,
            pattern_count,
            decision_count,
            timestamp: snapshot.timestamp,
        });

        Ok(())
    }

    /// Verify a Merkle proof for inclusion
    ///
    /// # Arguments
    /// * `leaf` - The leaf hash to verify
    /// * `proof` - Array of proof hashes (max 20 levels)
    /// * `proof_len` - Actual length of proof
    /// * `leaf_index` - Index of the leaf in the tree
    pub fn verify_proof(
        ctx: Context<VerifyProof>,
        leaf: [u8; 32],
        proof: [[u8; 32]; 20],
        proof_len: u8,
        leaf_index: u32,
    ) -> Result<()> {
        let snapshot = &ctx.accounts.snapshot;

        // Compute root from proof
        let computed_root = compute_merkle_root(leaf, &proof[..proof_len as usize], leaf_index);

        // Verify against stored root
        require!(
            computed_root == snapshot.root,
            ErrorCode::InvalidProof
        );

        msg!("Proof verified successfully!");
        msg!("Leaf: {:?}", leaf);
        msg!("Root: {:?}", snapshot.root);

        emit!(ProofVerified {
            week_number: snapshot.week_number,
            leaf,
            verified: true,
        });

        Ok(())
    }

    /// Transfer authority to a new address
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;

        require!(
            ctx.accounts.authority.key() == config.authority,
            ErrorCode::Unauthorized
        );

        let old_authority = config.authority;
        config.authority = new_authority;

        msg!("Authority transferred from {} to {}", old_authority, new_authority);

        emit!(AuthorityTransferred {
            old_authority,
            new_authority,
        });

        Ok(())
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Compute Merkle root from leaf and proof
fn compute_merkle_root(leaf: [u8; 32], proof: &[[u8; 32]], leaf_index: u32) -> [u8; 32] {
    let mut current = leaf;
    let mut index = leaf_index;

    for sibling in proof {
        current = if index % 2 == 0 {
            hash_pair(&current, sibling)
        } else {
            hash_pair(sibling, &current)
        };
        index /= 2;
    }

    current
}

/// Hash two nodes together (using sha256 for Solana compatibility)
fn hash_pair(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    hashv(&[left, right]).to_bytes()
}

// ============================================================================
// Accounts
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + BrainConfig::INIT_SPACE,
        seeds = [b"brain-config"],
        bump
    )]
    pub config: Account<'info, BrainConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(root: [u8; 32], week_number: u16)]
pub struct StoreSnapshot<'info> {
    #[account(
        mut,
        seeds = [b"brain-config"],
        bump = config.bump
    )]
    pub config: Account<'info, BrainConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + Snapshot::INIT_SPACE,
        seeds = [b"snapshot", week_number.to_le_bytes().as_ref()],
        bump
    )]
    pub snapshot: Account<'info, Snapshot>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyProof<'info> {
    pub snapshot: Account<'info, Snapshot>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"brain-config"],
        bump = config.bump
    )]
    pub config: Account<'info, BrainConfig>,

    pub authority: Signer<'info>,
}

// ============================================================================
// State
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct BrainConfig {
    /// Authority who can store snapshots
    pub authority: Pubkey,
    /// Total number of snapshots stored
    pub total_snapshots: u64,
    /// Slot of last snapshot
    pub last_snapshot_slot: u64,
    /// Current (latest) Merkle root
    pub current_root: [u8; 32],
    /// PDA bump
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Snapshot {
    /// The Merkle root hash
    pub root: [u8; 32],
    /// Week number (e.g., 202602 for 2026 week 2)
    pub week_number: u16,
    /// Solana slot when stored
    pub slot: u64,
    /// Unix timestamp
    pub timestamp: i64,
    /// Number of patterns in this snapshot
    pub pattern_count: u32,
    /// Number of decisions in this snapshot
    pub decision_count: u32,
    /// Number of contributors
    pub contributor_count: u16,
    /// Sequential index
    pub snapshot_index: u64,
    /// PDA bump
    pub bump: u8,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct SnapshotStored {
    pub week_number: u16,
    pub root: [u8; 32],
    pub pattern_count: u32,
    pub decision_count: u32,
    pub timestamp: i64,
}

#[event]
pub struct ProofVerified {
    pub week_number: u16,
    pub leaf: [u8; 32],
    pub verified: bool,
}

#[event]
pub struct AuthorityTransferred {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: caller is not the authority")]
    Unauthorized,
    #[msg("Invalid Merkle proof")]
    InvalidProof,
    #[msg("Snapshot already exists for this week")]
    SnapshotExists,
}
