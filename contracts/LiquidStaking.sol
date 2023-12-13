// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Liquid Staking Contract
 * @dev A smart contract for staking ERC20 tokens, earning rewards, and unstaking with a penalty mechanism.
 */
contract LiquidStaking is ERC20, Ownable, ReentrancyGuard {
    ERC20 public stakingToken;
    uint256 public rewardRate; // Reward rate per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userStakedAmounts;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid; // Added mapping
    mapping(address => uint256) public unstakeTime; // New mapping for unstake time

    uint256 public unstakeLockDuration = 1 days; // Adjust the lock duration as needed
    uint256 public penaltyPercentage = 5; // 5% penalty for early withdrawal

    constructor(address _stakingToken, uint256 _rewardRate) ERC20("Staked Token", "stETH") Ownable(_msgSender()) {
        stakingToken = ERC20(_stakingToken);
        rewardRate = _rewardRate;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
        }
        _;
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
        userStakedAmounts[msg.sender] = userStakedAmounts[msg.sender]+amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= userStakedAmounts[msg.sender], "Insufficient staked amount");

        // Ensure the unstaking lock period has passed
        require(block.timestamp >= unstakeTime[msg.sender], "Unstaking is currently locked");

        // Calculate the penalty for early withdrawal
        uint256 penaltyAmount = (amount * penaltyPercentage) / 100;
        uint256 netAmount = amount-(penaltyAmount);

        // Update User Balances
        userStakedAmounts[msg.sender] = userStakedAmounts[msg.sender]-(amount);
        _burn(msg.sender, amount);

        // Transfer Tokens and penalty
        stakingToken.transfer(msg.sender, netAmount);
        stakingToken.transfer(owner(), penaltyAmount);

        emit Unstaked(msg.sender, amount, penaltyAmount);
    }

    function claimRewards() public nonReentrant updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            stakingToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function exit() external {
        unstake(userStakedAmounts[msg.sender]);
        claimRewards();
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < lastUpdateTime ? lastUpdateTime : block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored+(
            lastTimeRewardApplicable()-(lastUpdateTime)*(rewardRate)*(1e18)/(totalSupply())
        );
    }

    function earned(address account) public view returns (uint256) {
        return (userStakedAmounts[account]*(rewardPerToken()-(userRewardPerTokenPaid[account])))/(1e18)+(rewards[account]);
    }

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 penalty);
    event RewardPaid(address indexed user, uint256 reward);
}
