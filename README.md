# Backend Engineer Test Requirements

## Overview

You are given a **Vault smart contract** deployed on Sepolia.
Your task is to build a backend service that:

1. **Monitors smart contract events**
2. **Stores deposit/withdrawal activity**
3. **Exposes REST API endpoints** for both admins and users
4. **Runs as a production-ready backend (Node.js preferred)**
5. **Uses ABI + contract address saved in `backend/src/contracts/`**

You may use:

* **Node.js (Express / Fastify)**
* **Ethers.js or Viem**
* **MongoDB or PostgreSQL** (choose one)
* **TypeScript** (recommended)

---

# 1. Contract Details

The Vault contract includes:

### **User Functions**

* `deposit()`
* `requestWithdraw(uint256 amount)`
* `withdraw(uint256 amount)`
* `getBalance(address user)`
* `getWithdrawInfo(address user)`

### **Admin Functions**

* `setWithdrawDelay(uint256 newDelay)`
* `pause()`
* `unpause()`
* `owner()`
* `withdrawDelay()`
* `paused()`

### **Events** (example names; may differ)

You must listen to all relevant events:

* `Deposited(address user, uint256 amount)`
* `WithdrawRequested(address user, uint256 amount)`
* `Withdrawn(address user, uint256 amount)`
* `WithdrawDelayUpdated(uint256 newDelay)`
* `Paused(address account)`
* `Unpaused(address account)`

---

# 2. Contract Deployment

### **Steps**

1. Install project dependencies:

   ```bash
   npm install
   ```
2. Configure your **Sepolia RPC** and **private key** in `.env`
   Example:

   ```
   SEPOLIA_RPC_URL=https://...
   PRIVATE_KEY=0x...
   ETHERSCAN_KEY="..."
   ```
3. Deploy contract:

   ```bash
   npm run deploy:sepolia
   ```
4. Save the deployed **contract address** at backend/src/contracts/.
   The deployment script already outputs:
    * `ABI (Vault-abi.json)`
    * `Contract address (Vault-address.json)`
    
---

# 3. Back-End Requirements

Your backend must include:

---

# 🚀 1. Event Listener (Blockchain → Database)

Create a blockchain listener that:

* Connects to Sepolia RPC
* Watches all contract events in real-time
* Saves them to a database
* Re-indexes missing events if the server restarts
* Handles chain reorgs (simple: verify block confirmations)

### Store at least:

#### Deposit Events

* user address
* amount
* tx hash
* timestamp
* block number

#### Withdraw Request Events

* user
* amount
* requestTime (from block timestamp)

#### Withdraw Events

* user
* amount
* tx hash
* timestamp

#### Admin Actions

* newWithdrawDelay
* paused / unpaused status

---

# 🚀 2. API Endpoints

Create a REST API server (Express/Fastify).

### **Base URL**

```
/api
```

---

# 2.1 User APIs

### **GET /api/user/:address/balance**

* Calls `getBalance(address)`
* Returns `{ balance }`

### **GET /api/user/:address/info**

Returns:

* balance
* active withdraw request info
* available withdraw time
* history (from DB)

### **GET /api/user/:address/history**

Returns:

* deposits
* withdraw requests
* withdrawals
  (from DB)

---

# 2.2 Transaction Summary APIs

### **GET /api/summary/deposits**

Return all deposits (latest first)

### **GET /api/summary/withdrawals**

Return all withdrawals (latest first)

### **GET /api/summary/stats**

Return:

* total deposited
* total withdrawn
* total unique users
* last 10 actions

---

# 2.3 Admin APIs

Admin routes must be protected (simple hardcoded API key is enough).

### **GET /api/admin/withdraw-delay**

Calls:

```
withdrawDelay()
```

### **POST /api/admin/withdraw-delay**

Body:

```json
{
  "newDelay": 3600
}
```

Calls contract function using admin private key.

### **POST /api/admin/pause**

Calls:

```
pause()
```

### **POST /api/admin/unpause**

Calls:

```
unpause()
```

### **GET /api/admin/status**

Returns:

* paused or not
* withdrawDelay
* total users
* total deposits and withdrawals

---

# 🚀 3. Database Schema Requirements

Use **MongoDB** or **PostgreSQL**.

### **deposit_records**

* `_id`
* `user`
* `amount`
* `txHash`
* `blockNumber`
* `timestamp`

### **withdraw_requests**

* `_id`
* `user`
* `amount`
* `requestTimestamp`
* `availableAt`

### **withdraw_records**

* `_id`
* `user`
* `amount`
* `txHash`
* `timestamp`

### **admin_logs**

* `_id`
* `action` (updateDelay, pause, unpause)
* `value`
* `timestamp`

---

# 🚀 4. Services to Implement

### **1. ContractService**

* Load ABI from `backend/src/contracts/Vault.json`
* Load address from `Vault-address.json`
* Create Ethers provider
* Expose methods like `getBalance`, `getWithdrawInfo`, etc.

### **2. ListenerService**

* Listen to events
* Save them in DB
* Log new events to console

### **3. AdminService**

* Uses owner private key
* Sends admin transactions
* Handles gas settings

### **4. UserService**

* Fetches info + history from DB + chain
* Computes withdraw availability

---

# 🚀 5. Optional (Bonus Points)

* Use Docker + docker-compose
* Use environment variables (`dotenv`)
* Add automatic retry if RPC connection drops
* Add pagination to API
* Unit tests with Jest
* Swagger API documentation

---

# 6. Evaluation Criteria

* Can they listen to blockchain events properly?
* Can they structure a clean backend project?
* API correctness & stability
* Database design
* Error handling
* Real-time event monitoring
* Admin action handling
* Production readiness

