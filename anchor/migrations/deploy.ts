// Migrations are an early feature. Currently, they're nothing more than this
// temporary script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  console.log("Deploying asdf-merkle...");
  console.log("Provider:", provider.connection.rpcEndpoint);
  console.log("Wallet:", provider.wallet.publicKey.toString());

  // Add your deploy script here if needed
  // For example, initialize the program after deployment:
  //
  // const program = anchor.workspace.AsdfMerkle;
  // const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
  //   [Buffer.from("brain-config")],
  //   program.programId
  // );
  // await program.methods.initialize().accounts({
  //   config: configPda,
  //   authority: provider.wallet.publicKey,
  //   systemProgram: anchor.web3.SystemProgram.programId,
  // }).rpc();

  console.log("Deployment complete!");
};
