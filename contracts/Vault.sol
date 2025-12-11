// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Vault is ReentrancyGuard, Ownable, Pausable {
    mapping(address => uint256) public balances;
    struct WithdrawRequest {
        uint256 amount;
        uint256 unlockTime;
    }
    mapping(address => WithdrawRequest) public withdrawRequests;
    uint256 public withdrawDelay = 1 hours; 

    event Deposited(address indexed user, uint256 amount);
    event WithdrawRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount);
    event WithdrawDelayUpdated(uint256 newDelay);

    constructor() Ownable(msg.sender) {}

    function setWithdrawDelay(uint256 _delay) external onlyOwner {
        withdrawDelay = _delay;
        emit WithdrawDelayUpdated(_delay);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function deposit() external payable whenNotPaused  {
        require(msg.value > 0, "No ETH sent");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function requestWithdraw(uint256 amount) external whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(amount > 0, "Invalid amount");

        withdrawRequests[msg.sender] = WithdrawRequest({
            amount: amount,
            unlockTime: block.timestamp + withdrawDelay
        });

        emit WithdrawRequested(msg.sender, amount, block.timestamp + withdrawDelay);
    }

    function withdraw() external nonReentrant whenNotPaused {
        WithdrawRequest memory req = withdrawRequests[msg.sender];

        require(req.amount > 0, "No withdrawal requested");
        require(block.timestamp >= req.unlockTime, "Withdraw still locked");

        uint256 amount = req.amount;

        delete withdrawRequests[msg.sender];

        balances[msg.sender] -= amount;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "ETH transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function getWithdrawInfo(address user)
        external
        view
        returns (uint256 amount, uint256 unlockTime)
    {
        WithdrawRequest memory req = withdrawRequests[user];
        return (req.amount, req.unlockTime);
    }

}
