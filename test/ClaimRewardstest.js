// test/LiquidStaking.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidStaking", function () {
  let owner, user1, user2;
  let stakingToken, liquidStaking;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    console.log("start");
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    stakingToken = await ERC20Mock.deploy();

    const LiquidStaking = await ethers.getContractFactory("LiquidStaking");
    liquidStaking = await LiquidStaking.deploy(stakingToken.address, 1);

    await stakingToken.connect(owner).mint(user1.address, ethers.utils.parseEther("1000"));
    await stakingToken.connect(owner).mint(user2.address, ethers.utils.parseEther("1000"));
  });

  it("should stake, earn rewards, unstake, and claim rewards", async function () {
    // Stake
    await stakingToken.connect(user1).approve(liquidStaking.address, ethers.utils.parseEther("100"));
    await liquidStaking.connect(user1).stake(ethers.utils.parseEther("100"));

    // Check staking and staked token balances
    expect(await liquidStaking.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("100"));
    expect(await stakingToken.balanceOf(liquidStaking.address)).to.equal(ethers.utils.parseEther("100"));

    // Advance time
    await ethers.provider.send("evm_increaseTime", [86400]); // Move time forward by 1 day
    await ethers.provider.send("evm_mine"); // Mine a new block to update block.timestamp

    // Check rewards
    const earnedRewardsBefore = await liquidStaking.earned(user1.address);
    expect(earnedRewardsBefore).to.be.gt(0);

    // Unstake
    await liquidStaking.connect(user1).unstake(ethers.utils.parseEther("50"));

    // Check unstaking and staked token balances
    expect(await liquidStaking.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("50"));
    expect(await stakingToken.balanceOf(liquidStaking.address)).to.equal(ethers.utils.parseEther("50"));

    // Claim rewards
    const claimedRewardsBefore = await liquidStaking.rewards(user1.address);
    await liquidStaking.connect(user1).claimRewards();
    const claimedRewardsAfter = await liquidStaking.rewards(user1.address);
    console.log("rewards were claimed");

    // Check that rewards were claimed
    expect(claimedRewardsAfter).to.equal(0);
    console.log("equal to 0");

  //  expect(claimedRewardsAfter).to.be.gt(claimedRewardsBefore);
    console.log(claimedRewardsAfter, "claimedRewardsAfter greater than claimed reward claimedRewardsAfter",claimedRewardsBefore, );

  });

  // Add more test cases as needed

});
