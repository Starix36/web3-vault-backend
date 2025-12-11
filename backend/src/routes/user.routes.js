const express = require('express');
const router = express.Router();
const contractService = require('../services/contract.service');
const { Deposit } = require('../models/Transaction');

router.get('/:address/balance', async (req, res) => {
    try {
        const { address } = req.params;
        // Fetch real-time balance from chain (source of truth)
        const balanceBigInt = await contractService.getBalance(address);
        res.json({ balance: balanceBigInt.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:address/history', async (req, res) => {
    try {
        const { address } = req.params;
        // Fetch history from DB (indexed query)
        const deposits = await Deposit.find({ user: address.toLowerCase() })
                                      .sort({ timestamp: -1 });
        res.json({ deposits });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;