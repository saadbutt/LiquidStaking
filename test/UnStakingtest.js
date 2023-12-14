// test/LiquidStaking.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidStaking UnStaking Testcases", function () {
  let owner, user1, user2;
  let stakingToken, liquidStaking;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    stakingToken = await ERC20Mock.deploy();

    const LiquidStaking = await ethers.getContractFactory("LiquidStaking");
    liquidStaking = await LiquidStaking.deploy(stakingToken.address, 1);

    await stakingToken.connect(owner).mint(user1.address, ethers.utils.parseEther("1000"));
    await stakingToken.connect(owner).mint(user2.address, ethers.utils.parseEther("1000"));
  });

  it("should stake and Unstake rewards", async function () {
    // Stake
    await stakingToken.connect(user1).approve(liquidStaking.address, ethers.utils.parseEther("100"));
    await liquidStaking.connect(user1).stake(ethers.utils.parseEther("100"));

    // Check staking and staked token balances
    expect(await liquidStaking.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("100"));
    expect(await stakingToken.balanceOf(liquidStaking.address)).to.equal(ethers.utils.parseEther("100"));

    // Advance time
    await ethers.provider.send("evm_increaseTime", [86400]); // Move time forward by 1 day
    await ethers.provider.send("evm_mine"); // Mine a new block to update block.timestamp

    // Unstake
    await liquidStaking.connect(user1).unstake(ethers.utils.parseEther("50"));

    // Check unstaking and staked token balances
    expect(await liquidStaking.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("50"));
    expect(await stakingToken.balanceOf(liquidStaking.address)).to.equal(ethers.utils.parseEther("50"));

  });

  // Add more test cases as needed

});
