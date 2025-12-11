const { ethers } = require('ethers');
const { Deposit, WithdrawRequest } = require('../models/Transaction');
const contractService = require('./contract.service');
const logger = require('../utils/logger');

class ListenerService {
    constructor() {
        this.contract = contractService.contract;
    }

    async start() {
        logger.info("🚀 Starting Blockchain Listener...");

        // --- Listen for Deposits ---
        this.contract.on("Deposited", async (user, amount, event) => {
            await this.handleDeposit(user, amount, event);
        });

        // --- Listen for Withdraw Requests ---
        this.contract.on("WithdrawRequested", async (user, amount, unlockTime, event) => {
            await this.handleWithdrawRequest(user, amount, unlockTime, event);
        });
        
        logger.info("👂 Listening for new Vault events (Real-time)...");
    }

    async handleDeposit(user, amount, event) {
        try {
            // Get timestamp from the block
            const block = await event.getBlock();
            
            await Deposit.create({
                user: user.toLowerCase(),
                amount: amount.toString(), // Store BigInt as string
                txHash: event.log.transactionHash,
                blockNumber: event.log.blockNumber,
                timestamp: block.timestamp
            });
            
            // Log readable amount (Wei -> ETH)
            logger.info(`✅ Deposit saved: ${ethers.formatEther(amount)} ETH from ${user}`);
        } catch (error) {
            // Error code 11000 means "Duplicate Key" (we already saved this event)
            if (error.code === 11000) return; 
            
            logger.error(`❌ Error saving deposit: ${error.message}`);
        }
    }

    async handleWithdrawRequest(user, amount, unlockTime, event) {
        try {
            await WithdrawRequest.create({
                user: user.toLowerCase(),
                amount: amount.toString(),
                unlockTime: Number(unlockTime),
                active: true
            });
            logger.info(`✅ Withdraw Request saved for ${user}`);
        } catch (error) {
             if (error.code === 11000) return;
            logger.error(`❌ Error saving request: ${error.message}`);
        }
    }
}

module.exports = new ListenerService();