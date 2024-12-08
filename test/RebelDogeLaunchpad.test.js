const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RebelDogeLaunchpad", function () {
  let Token;
  let USDT;
  let PriceFeed;
  let launchpad;
  let owner, buyer1, buyer2, otherAccount;

  const TOKEN_PRICE = 100; // 0.0001 USDT in 6 decimals (100 represents 0.0001 USDT)
  const TOTAL_TOKENS_FOR_SALE = 120_000_000 * 10**18; // 120 million tokens
  const BONUS_LIMIT = 60_000_000 * 10**18; // 50% bonus for first 60 million tokens
  const WALLET_LIMIT = 20_000_000 * 10**18; // 20 million tokens per wallet
  const VESTING_PERIOD = 1 * 60; // 1 minute vesting period (for testing)
  const VESTING_DURATION = 12; // 12 months vesting duration

  beforeEach(async function () {
    // Get the ContractFactories and Signers
    [owner, buyer1, buyer2, otherAccount] = await ethers.getSigners();

    // Deploy Mock Token and USDT Contracts (ERC20)
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    Token = await ERC20.deploy("RebelDoge", "RDOGE", 18);
    USDT = await ERC20.deploy("Tether", "USDT", 6);

    // Deploy Mock Chainlink Price Feed Contract
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    PriceFeed = await MockPriceFeed.deploy();

    // Deploy the RebelDogeLaunchpad contract
    const Launchpad = await ethers.getContractFactory("RebelDogeLaunchpad");
    launchpad = await Launchpad.deploy(Token.address, USDT.address, PriceFeed.address);
    
    // Transfer some tokens to the presale contract (simulate a real environment)
    await Token.transfer(launchpad.address, TOTAL_TOKENS_FOR_SALE);
    await USDT.transfer(buyer1.address, 1000000);
    await USDT.transfer(buyer2.address, 1000000);
  });

  describe("Presale Functionality", function () {
    it("should allow the owner to start the presale", async function () {
      await launchpad.startPresale();
      expect(await launchpad.presaleStarted()).to.be.true;
      expect(await launchpad.presaleEnded()).to.be.false;
    });

    it("should not allow non-owner to start the presale", async function () {
      await expect(launchpad.connect(otherAccount).startPresale())
        .to.be.revertedWith("Not the contract owner");
    });

    it("should allow buying with USDT during presale", async function () {
      await launchpad.startPresale();
      const usdtAmount = 10000; // 10000 USDT
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);

      await expect(launchpad.connect(buyer1).buyWithUSDT(usdtAmount))
        .to.emit(launchpad, "TokensPurchased")
        .withArgs(buyer1.address, 1000000, true); // 50% bonus for first 60 million tokens
    });

    it("should allow buying with ETH during presale", async function () {
      await launchpad.startPresale();
      const ethAmount = ethers.utils.parseEther("0.1"); // Buying 0.1 ETH worth of tokens
      
      await expect(() => launchpad.connect(buyer1).buyWithETH({ value: ethAmount }))
        .to.changeEtherBalances([buyer1, launchpad], [-ethAmount, ethAmount]);

      const buyerBalance = await Token.balanceOf(buyer1.address);
      expect(buyerBalance).to.be.greaterThan(0);
    });

    it("should correctly calculate bonus tokens when tokens are within the bonus limit", async function () {
      await launchpad.startPresale();
      const usdtAmount = 500000; // Buy USDT worth of tokens that will trigger bonus
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);

      await launchpad.connect(buyer1).buyWithUSDT(usdtAmount);

      const buyerBalance = await Token.balanceOf(buyer1.address);
      const expectedBonus = usdtAmount / 10000; // Example of expected bonus calculation
      expect(buyerBalance).to.be.greaterThan(expectedBonus);
    });

    it("should prevent buying if exceeding wallet limit", async function () {
      await launchpad.startPresale();
      const usdtAmount = WALLET_LIMIT + 1; // Exceeding wallet limit
      
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);

      await expect(launchpad.connect(buyer1).buyWithUSDT(usdtAmount))
        .to.be.revertedWith("Exceeds wallet limit");
    });

    it("should stop buying when all tokens are sold", async function () {
      await launchpad.startPresale();
      
      // Simulate buying all tokens
      const usdtAmount = TOTAL_TOKENS_FOR_SALE / (TOKEN_PRICE * 10); // Buy all tokens
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);

      await expect(launchpad.connect(buyer1).buyWithUSDT(usdtAmount))
        .to.emit(launchpad, "TokensPurchased")
        .withArgs(buyer1.address, TOTAL_TOKENS_FOR_SALE, true);

      await expect(launchpad.connect(buyer2).buyWithUSDT(100000))
        .to.be.revertedWith("Exceeds total tokens for sale");
    });

    it("should apply the correct bonus when the bonus limit is reached", async function () {
      await launchpad.startPresale();
      
      const usdtAmount = 500000; // Buying tokens that will trigger bonus

      // Buyer 1 buys within bonus range
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);
      await launchpad.connect(buyer1).buyWithUSDT(usdtAmount);

      // Buyer 2 buys after bonus limit is hit
      await USDT.connect(buyer2).approve(launchpad.address, usdtAmount);
      await expect(launchpad.connect(buyer2).buyWithUSDT(usdtAmount))
        .to.emit(launchpad, "TokensPurchased")
        .withArgs(buyer2.address, usdtAmount, false); // No bonus
    });
  });

  describe("Vesting & Claiming Tokens", function () {
    beforeEach(async function () {
      await launchpad.startPresale();
      const usdtAmount = 10000;
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);
      await launchpad.connect(buyer1).buyWithUSDT(usdtAmount);
      await launchpad.endPresale(); // End the presale to start claiming
    });

    it("should allow users to claim tokens after presale ends", async function () {
      // Assume user bought 10000 USDT worth of tokens with bonus
      const claimableBefore = await launchpad._calculateClaimable(buyer1.address);
      
      await expect(launchpad.connect(buyer1).claimTokens())
        .to.emit(launchpad, "TokensClaimed")
        .withArgs(buyer1.address, claimableBefore);

      const buyerBalanceAfter = await Token.balanceOf(buyer1.address);
      expect(buyerBalanceAfter).to.be.greaterThan(0);
    });

    it("should allow the buyer to claim tokens gradually according to vesting schedule", async function () {
      const usdtAmount = 50000;
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);
      await launchpad.connect(buyer1).buyWithUSDT(usdtAmount);

      const totalClaimable = await launchpad._calculateClaimable(buyer1.address);

      // Wait for 1 vesting period
      await ethers.provider.send("evm_increaseTime", [VESTING_PERIOD]); // Increment time by vesting period
      await ethers.provider.send("evm_mine", []); // Mine block to apply the time change

      // Claim tokens after vesting period
      await expect(launchpad.connect(buyer1).claimTokens())
        .to.emit(launchpad, "TokensClaimed")
        .withArgs(buyer1.address, totalClaimable);

      const buyerBalanceAfter = await Token.balanceOf(buyer1.address);
      expect(buyerBalanceAfter).to.be.greaterThan(totalClaimable);
    });

    it("should calculate claimable tokens correctly", async function () {
      const usdtAmount = 20000; // Total purchase amount
      await USDT.connect(buyer1).approve(launchpad.address, usdtAmount);
      await launchpad.connect(buyer1).buyWithUSDT(usdtAmount);

      // Claim 50% immediately after presale ends
      const claimable = await launchpad._calculateClaimable(buyer1.address);
      expect(claimable).to.be.greaterThan(0);
    });
  });

  describe("Owner Withdrawals", function () {
    it("should allow the owner to withdraw funds", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Withdraw funds
      await launchpad.withdrawFunds();

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("should allow the owner to withdraw USDT", async function () {
      const balanceBefore = await USDT.balanceOf(owner.address);
      await launchpad.withdrawFunds();

      const balanceAfter = await USDT.balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Final Cleanup", function () {
    it("should end the presale", async function () {
      await launchpad.endPresale();
      expect(await launchpad.presaleEnded()).to.be.true;
    });

    it("should not allow users to buy after presale ends", async function () {
      await launchpad.endPresale();
      await expect(launchpad.connect(buyer1).buyWithUSDT(10000))
        .to.be.revertedWith("Presale is not active");
    });
  });
});
