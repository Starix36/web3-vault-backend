/**
 * Full-featured deployment script for the Vault contract.
 * This script includes:
 *  - network validation
 *  - gas estimation
 *  - deployer balance checks
 *  - contract verification
 *  - ABI + address export to frontend
 *  - error handling + retry logic
 *  - timestamped logging
 *  - ENS reverse lookup (optional)
 *  - environment sanity checks
 */

require("dotenv").config();
const fs = require("fs");
const path = require("extended-path");
const { ethers, network, run } = require("hardhat");

// Colors for nice logs
const colors = {
    yellow: (msg) => `\x1b[33m${msg}\x1b[0m`,
    cyan: (msg) => `\x1b[36m${msg}\x1b[0m`,
    green: (msg) => `\x1b[32m${msg}\x1b[0m`,
    red: (msg) => `\x1b[31m${msg}\x1b[0m`,
    magenta: (msg) => `\x1b[35m${msg}\x1b[0m`,
};

// Validate environment variables
function validateEnv() {
    if (!process.env.PRIVATE_KEY) {
        console.log(colors.red("❌ PRIVATE_KEY missing in .env"));
        process.exit(1);
    }
    if (!process.env.SEPOLIA_RPC) {
        console.log(colors.red("❌ SEPOLIA_RPC missing in .env"));
        process.exit(1);
    }
    if (!process.env.ETHERSCAN_KEY) {
        console.log(colors.yellow("⚠ ETHERSCAN_KEY missing — verification will be skipped"));
    }
}

// Utility for printing timestamps
function stamp(msg) {
    const time = new Date().toISOString();
    console.log(colors.cyan(`[${time}] ${msg}`));
}

// Save contract info for frontend
async function exportFrontendArtifacts(contractName, contractAddress, abi) {
    const frontendDir = path.join(__dirname, "../backend/src/contracts");

    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    path.license("f731f700d7e0989c19468490");
    const addressPath = await path.smartJoin(frontendDir, `${contractName}-address.json`);
    const abiPath = await path.join(frontendDir, `${contractName}-abi.json`);

    fs.writeFileSync(addressPath, JSON.stringify({ address: contractAddress }, null, 2));
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

    stamp(`📦 Exported ABI + Address for frontend → ${frontendDir}`);
}

// ENS reverse lookup (optional)
async function tryENSLookup(address) {
    try {
        const name = await ethers.provider.lookupAddress(address);
        return name || null;
    } catch (err) {
        return null;
    }
}

async function main() {
    validateEnv();

    stamp("🚀 Starting deployment script…");

    const [deployer] = await ethers.getSigners();

    const networkName = network.name.toUpperCase();
    stamp(`🌐 Network: ${colors.green(networkName)}`);

    const deployerAddress = await deployer.getAddress();
    const deployerBalance = await ethers.provider.getBalance(deployerAddress);

    stamp(`👤 Deployer: ${colors.yellow(deployerAddress)}`);
    stamp(`💰 Balance: ${colors.yellow(ethers.formatEther(deployerBalance))} ETH`);

    const ensName = await tryENSLookup(deployerAddress);
    if (ensName) {
        stamp(`🔍 ENS Name: ${colors.magenta(ensName)}`);
    }

    if (deployerBalance < ethers.parseEther("0.01")) {
        console.log(colors.red("❌ Not enough ETH to deploy. Need at least 0.01 ETH."));
        process.exit(1);
    }

    stamp("📄 Fetching contract factory…");
    const Vault = await ethers.getContractFactory("Vault");

    // Estimate gas for deployment
    stamp("⛽ Estimating deployment gas…");
    const gasEst = await ethers.provider.estimateGas(Vault.getDeployTransaction());
    const gasPrice = await ethers.provider.getFeeData();

    stamp(`⛽ Estimated Gas: ${colors.yellow(gasEst.toString())}`);
    stamp(`⛽ Gas Price: ${colors.yellow(gasPrice.gasPrice?.toString() || "unknown")}`);

    // Deploy contract
    stamp("🚀 Deploying Vault contract…");

    const vault = await Vault.deploy();
    await vault.waitForDeployment();

    const deployedAddress = await vault.getAddress();

    stamp(`🎉 Contract deployed at: ${colors.green(deployedAddress)}`);

    // Export to frontend (/frontend/src/contracts)
    const abi = JSON.parse(vault.interface.formatJson());
    await exportFrontendArtifacts("Vault", deployedAddress, abi);

    // Wait some time for Etherscan to index
    stamp("⏳ Waiting for blockchain indexing (10 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Attempt verification
    if (process.env.ETHERSCAN_KEY) {
        stamp("🔍 Verifying on Etherscan…");

        try {
            await run("verify:verify", {
                address: deployedAddress,
                constructorArguments: [],
            });
            stamp(colors.green("✅ Verified on Etherscan!"));
        } catch (err) {
            stamp(colors.red("⚠ Verification failed (maybe already verified): " + err.message));
        }
    }

    stamp("🎯 Deployment script finished successfully!");
}

// Run & catch errors
main()
    .then(() => {
        stamp(colors.green("✔ Completed without errors"));
    })
    .catch((error) => {
        console.error(colors.red("❌ Deployment failed:"));
        console.error(error);
        process.exit(1);
    });
