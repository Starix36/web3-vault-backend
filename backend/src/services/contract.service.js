const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load artifacts dynamically
const addressPath = path.join(__dirname, '../contracts/Vault-address.json');
const abiPath = path.join(__dirname, '../contracts/Vault-abi.json');

const address = JSON.parse(fs.readFileSync(addressPath)).address;
const abi = JSON.parse(fs.readFileSync(abiPath));

class ContractService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC);
        // Wallet for Admin write operations
        this.adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        
        // Read-only contract instance
        this.contract = new ethers.Contract(address, abi, this.provider);
        // Write-access contract instance
        this.adminContract = this.contract.connect(this.adminWallet);
    }

    async getBalance(userAddress) {
        return await this.contract.balances(userAddress);
    }
    
    // ... expose other contract read methods
}

module.exports = new ContractService();