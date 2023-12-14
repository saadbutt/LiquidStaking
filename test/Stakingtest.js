// test/LiquidStaking.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidStaking Staking Testcases", function () {
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

  it("should stake rewards", async function () {
    // Stake
    await stakingToken.connect(user1).approve(liquidStaking.address, ethers.utils.parseEther("100"));
    await liquidStaking.connect(user1).stake(ethers.utils.parseEther("100"));

    // Check staking and staked token balances
    expect(await liquidStaking.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("100"));
    expect(await stakingToken.balanceOf(liquidStaking.address)).to.equal(ethers.utils.parseEther("100"));


  });

  // Add more test cases as needed

});
