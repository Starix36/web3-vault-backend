const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  user: { type: String, required: true, index: true }, // Store lowercase addresses
  amount: { type: String, required: true }, // Store as String to avoid JS number precision issues
  txHash: { type: String, required: true },
  blockNumber: { type: Number, required: true },
  timestamp: { type: Number, required: true },
}, { timestamps: true });

// Compound index to ensure a specific event is never saved twice
DepositSchema.index({ txHash: 1, logIndex: 1 }, { unique: true });

const WithdrawRequestSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true }, // One active request per user
  amount: { type: String, required: true },
  unlockTime: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' }
});

module.exports = {
  Deposit: mongoose.model('Deposit', DepositSchema),
  WithdrawRequest: mongoose.model('WithdrawRequest', WithdrawRequestSchema)
  // ... define Withdrawal and AdminLog similarly
};
