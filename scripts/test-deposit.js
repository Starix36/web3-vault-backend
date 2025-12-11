const hre = require("hardhat");

async function main() {
    // 1. Setup
    const VAULT_ADDR = "0x5031187e8dF41348F92DE7BF06004786d962817b";
    const [signer] = await hre.ethers.getSigners();
    
    console.log(`👤 Sending transaction from: ${signer.address}`);

    // 2. Connect to Contract
    const Vault = await hre.ethers.getContractFactory("Vault");
    const vault = Vault.attach(VAULT_ADDR).connect(signer);

    // 3. Send Money (0.001 ETH)
    console.log("💸 Sending 0.001 ETH...");
    const tx = await vault.deposit({ value: hre.ethers.parseEther("0.001") });
    
    console.log(`⏳ Transaction sent! Hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");
    
    await tx.wait();
    console.log("✅ Transaction Confirmed on Blockchain!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});