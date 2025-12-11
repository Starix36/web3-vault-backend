const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", () => {
    let vault, owner, user1;

    beforeEach(async () => {
        [owner, user1] = await ethers.getSigners();

        const Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.deploy();
        await vault.waitForDeployment();
    });

    // ------------------------------------------------------------------------------------
    it("should accept deposits", async () => {
        await expect(
            vault.connect(user1).deposit({ value: ethers.parseEther("1") })
        ).to.changeEtherBalances(
            [user1, vault],
            [ethers.parseEther("-1"), ethers.parseEther("1")]
        );

        expect(await vault.balances(user1.address)).to.equal(ethers.parseEther("1"));
    });

    // ------------------------------------------------------------------------------------
    it("should create a withdrawal request", async () => {
        await vault.connect(user1).deposit({ value: ethers.parseEther("1") });

        await vault.connect(user1).requestWithdraw(ethers.parseEther("0.5"));

        const req = await vault.withdrawRequests(user1.address);

        expect(req.amount).to.equal(ethers.parseEther("0.5"));
        expect(req.unlockTime).to.be.gt(0);
    });

    // ------------------------------------------------------------------------------------
    it("should NOT withdraw before unlock time", async () => {
        await vault.connect(user1).deposit({ value: ethers.parseEther("1") });

        await vault.connect(user1).requestWithdraw(ethers.parseEther("0.5"));

        await expect(
            vault.connect(user1).withdraw()
        ).to.be.revertedWith("Withdraw still locked");
    });

    // ------------------------------------------------------------------------------------
    it("should allow withdrawal after timelock", async () => {
        await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
        await vault.connect(user1).requestWithdraw(ethers.parseEther("0.5"));

        // ⏱️ Move time forward 1 hour
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);

        await expect(
            vault.connect(user1).withdraw()
        ).to.changeEtherBalances(
            [vault, user1],
            [ethers.parseEther("-0.5"), ethers.parseEther("0.5")]
        );

        expect(await vault.balances(user1.address)).to.equal(ethers.parseEther("0.5"));
    });

    // ------------------------------------------------------------------------------------
    it("should block deposits when paused", async () => {
        await vault.connect(owner).pause();

        await expect(
            vault.connect(user1).deposit({ value: 1 })
        ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });

    // ------------------------------------------------------------------------------------
    it("only owner can pause/unpause", async () => {
        await expect(
            vault.connect(user1).pause()
        ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");

        await vault.connect(owner).pause();
        await vault.connect(owner).unpause();
    });

    // ------------------------------------------------------------------------------------
    it("should update withdraw delay by owner", async () => {
        await vault.connect(owner).setWithdrawDelay(7200);
        expect(await vault.withdrawDelay()).to.equal(7200);

        await expect(
            vault.connect(user1).setWithdrawDelay(500)
        ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    // ------------------------------------------------------------------------------------
    it("should prevent withdrawing without a request", async () => {
        await vault.connect(user1).deposit({ value: ethers.parseEther("1") });

        await expect(
            vault.connect(user1).withdraw()
        ).to.be.revertedWith("No withdrawal requested");
    });

    // ------------------------------------------------------------------------------------
    it("should clear request after withdrawal", async () => {
        await vault.connect(user1).deposit({ value: ethers.parseEther("1") });
        await vault.connect(user1).requestWithdraw(ethers.parseEther("0.5"));

        // fast forward time
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send("evm_mine", []);

        await vault.connect(user1).withdraw();

        const req = await vault.withdrawRequests(user1.address);
        expect(req.amount).to.equal(0);
        expect(req.unlockTime).to.equal(0);
    });
});
