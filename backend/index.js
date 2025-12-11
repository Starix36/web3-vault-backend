require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import our services
const listenerService = require('./src/services/listener.service');
const contractService = require('./src/services/contract.service');
const { Deposit } = require('./src/models/Transaction');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("📦 Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// --- Start the Blockchain Listener ---
listenerService.start();

// --- API Routes ---

// 1. Get user balance (Live from Blockchain)
app.get('/api/user/:address/balance', async (req, res) => {
    try {
        const balance = await contractService.getBalance(req.params.address);
        res.json({ address: req.params.address, balance: balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Get user deposit history (From Database)
app.get('/api/user/:address/history', async (req, res) => {
    try {
        const history = await Deposit.find({ user: req.params.address.toLowerCase() });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Health Check
app.get('/', (req, res) => {
    res.send('Vault Backend is Running 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// --- CRASH PREVENTION ---
// Prevent the server from crashing on temporary network errors
process.on('uncaughtException', (err) => {
    console.error('⚠️  Uncaught Exception:', err.message);
    // Optional: Restart listener logic here if critical
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection:', reason.message || reason);
});