import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorProject } from "../target/types/anchor_project";
import { assert } from "chai";

describe("anchor_project", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.AnchorProject as Program<AnchorProject>;

  const findProfilePda = (authority: anchor.web3.PublicKey) => {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), authority.toBuffer()],
      program.programId
    )[0];
  };

  const profilePda = findProfilePda(wallet.publicKey);
  const displayName = "Gautam";

  it("Creates a profile!", async () => {
    const tx = await program.methods
      .createProfile(displayName)
      .accounts(accountsAny({
        userProfile: profilePda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const profileAccount = await program.account.userProfile.fetch(profilePda);
    assert.ok(profileAccount.authority.equals(wallet.publicKey));
    assert.equal(profileAccount.displayName, displayName);
    assert.isEmpty(profileAccount.links);
  });

  it("Adds 9 links!", async () => {
    for (let i = 0; i < 9; i++) {
      await program.methods
        .addLink(`Link #${i}`, "https.google.com")
        .accounts({
          userProfile: profilePda,
          authority: wallet.publicKey,
        })
        .rpc();
    }
    const profileAccount = await program.account.userProfile.fetch(profilePda);
    assert.lengthOf(profileAccount.links, 9);
  });

  it("Updates an existing link!", async () => {
    const newLabel = "My X Account";
    const newUrl = "https.x.com/solana";

    await program.methods
      .updateLink(0, newLabel, newUrl)
      .accounts({
        userProfile: profilePda,
        authority: wallet.publicKey,
      })
      .rpc();

    const profileAccount = await program.account.userProfile.fetch(profilePda);
    assert.equal(profileAccount.links[0].label, newLabel);
  });

  it("Removes a link!", async () => {
    await program.methods
      .removeLink(8) 
      .accounts({
        userProfile: profilePda,
        authority: wallet.publicKey,
      })
      .rpc();

    const profileAccount = await program.account.userProfile.fetch(profilePda);
    assert.lengthOf(profileAccount.links, 8);
  });

  it("Fails to create a duplicate profile!", async () => {
    try {
      await program.methods
        .createProfile("Another Name")
        .accounts({
          userProfile: profilePda,
          authority: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have failed to create duplicate profile");
    } catch (error) {
      assert.include(error.message, "already in use");
    }
  });

  it("Fails to add a link when full!", async () => {
    await program.methods
      .addLink("Link #9", "https.bing.com")
      .accounts({ userProfile: profilePda, authority: wallet.publicKey })
      .rpc();
    await program.methods
      .addLink("Link #10", "https.bing.com")
      .accounts({ userProfile: profilePda, authority: wallet.publicKey })
      .rpc();
    
    const profileAccount = await program.account.userProfile.fetch(profilePda);
    assert.lengthOf(profileAccount.links, 10); 

    try {
      await program.methods
        .addLink("The 11th Link", "https.fail.com")
        .accounts({
          userProfile: profilePda,
          authority: wallet.publicKey,
        })
        .rpc();
      assert.fail("The transaction should have failed!");
    } catch (error) {
      assert.include(error.message, "6001"); 
    }
  });

  it("Fails to add a link for an unauthorized user!", async () => {
    const attacker = anchor.web3.Keypair.generate();

    const airdropSignature = await provider.connection.requestAirdrop(
      attacker.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: airdropSignature,
    });

    try {
      await program.methods
        .addLink("Attacker Link", "https.hacker.com")
        .accounts({
          userProfile: profilePda, 
          authority: attacker.publicKey,
        })
        .signers([attacker]) 
        .rpc();
      assert.fail("The transaction should have failed!");
    } catch (error) {
      assert.include(error.message, "A has_one constraint was violated");
    }
  });

  it("Fails to remove a link at an invalid index!", async () => {
    try {
      await program.methods
        .removeLink(99) // Invalid index
        .accounts({
          userProfile: profilePda,
          authority: wallet.publicKey,
        })
        .rpc();
      assert.fail("The transaction should have failed!");
    } catch (error) {
      assert.include(error.message, "6000"); 
    }
  });
});
