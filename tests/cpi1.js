const assert = require("assert");
const anchor = require("@project-serum/anchor");

describe("basic-3", () => {
  process.env.ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
  process.env.ANCHOR_WALLET="/home/unix/.config/solana/id.json"
  const provider = anchor.Provider.env();

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  it("Performs CPI from puppet master to puppet", async () => {
    const cross2 = anchor.workspace.PuppetMaster;
    const cross1 = anchor.workspace.Puppet;

    // Initialize a new puppet account.
    const newPuppetAccount = anchor.web3.Keypair.generate();
    const tx = await cross1.rpc.initialize({
      accounts: {
        puppet: newPuppetAccount.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [newPuppetAccount],
      instructions: [await cross1.account.puppet.createInstruction(newPuppetAccount)],
    });

    // Invoke the puppet master to perform a CPI to the puppet.
    await cross2.rpc.pullStrings(new anchor.BN(111), {
        accounts: {
            puppet: newPuppetAccount.publicKey,
            puppetProgram: cross1.programId,
        },
    });

    // Check the state updated.
    puppetAccount = await cross1.account.puppet.fetch(newPuppetAccount.publicKey);
    assert.ok(puppetAccount.data.eq(new anchor.BN(111)));
  });
});
