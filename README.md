#  RebelDogeLaunchpad Smart Contract 

This smart contract is designed for the **RebelDoge Launchpad**, a token presale platform. It allows users to purchase the **RebelDoge** token using either **ETH** or **USDT**, and participate in a presale that offers a 50% bonus for early purchases. The contract also supports vesting, meaning users can claim their tokens over a period of time.

This README provides a detailed explanation of the contract, its components, and how it works.

---

## 📑 Table of Contents
1. [Overview](#overview)  
2. [Contract Structure](#contract-structure)  
    1. [State Variables](#state-variables)  
    2. [Events](#events)  
    3. [Modifiers](#modifiers)  
3. [Functions](#functions)  
    1. [Constructor](#constructor)  
    2. [Presale Management](#presale-management)  
    3. [Buying Functions](#buying-functions)  
    4. [Vesting and Claiming](#vesting-and-claiming)  
    5. [Helper Functions](#helper-functions)  
    6. [Administrative Functions](#administrative-functions)  
4. [How to Use](#how-to-use)  
    1. [Starting the Presale](#starting-the-presale)  
    2. [Purchasing Tokens](#purchasing-tokens)  
    3. [Claiming Tokens](#claiming-tokens)  
    4. [Withdraw Funds](#withdraw-funds)  
5. [Security Considerations](#security-considerations)  
6. [Conclusion](#conclusion)

---

## 🚀 Overview

The **RebelDogeLaunchpad** smart contract is used for launching the **RebelDoge** token presale. Users can purchase tokens using either **ETH** or **USDT**. The contract features the following key components:
- **Presale Period**: Users can participate in the presale and buy tokens at a discounted price.
- **Bonus Scheme**: 50% bonus tokens for the first 60 million tokens sold 🎉.
- **Vesting Period**: Token purchasers will claim their tokens over a 12-month vesting period ⏳.
- **Token and USDT Integration**: The contract interacts with both the **ERC20 RebelDoge token** and **USDT** (Tether) for payments 💰.

---

## 🏗️ Contract Structure

### 🛠️ State Variables

1. **IERC20 public token**: Represents the RebelDoge token (ERC20) with 18 decimals 🪙.
2. **IERC20 public usdt**: Represents the USDT token (ERC20) with 6 decimals 💵.
3. **AggregatorV3Interface internal priceFeed**: Chainlink price feed interface for ETH/USD 📊.
4. **address public owner**: The address of the contract owner who can control presale parameters 👑.
5. **uint256 public totalTokensSold**: Tracks the total number of tokens sold during the presale 🛍️.
6. **bool public presaleStarted**: Indicates if the presale has started ⏰.
7. **bool public presaleEnded**: Indicates if the presale has ended ❌.
8. **mapping(address => uint256) public purchasedTokens**: Tracks the amount of tokens purchased by each user 🧾.
9. **mapping(address => uint256) public claimedTokens**: Tracks the amount of tokens claimed by each user 🎁.
10. **mapping(address => uint256) public lastClaimed**: Tracks the last time tokens were claimed by a user ⏳.

### 🔔 Events

1. **event TokensPurchased(address indexed buyer, uint256 amount, bool bonus)**: Emitted when a user purchases tokens, indicating the buyer, amount, and whether a bonus was applied 🎉.
2. **event PresaleStarted()**: Emitted when the presale is started 🚀.
3. **event PresaleEnded()**: Emitted when the presale ends 🛑.

### ⚙️ Modifiers

1. **onlyOwner**: Ensures that only the owner of the contract can execute certain functions 🏠.
2. **presaleActive**: Ensures that a function can only be called during an active presale 🔥.

---

## 🧑‍💻 Functions

### 🛠️ Constructor

The constructor initializes the contract with the following parameters:
- **IERC20 _token**: The ERC20 RebelDoge token address 🪙.
- **IERC20 _usdt**: The ERC20 USDT token address 💵.
- **address _priceFeed**: The Chainlink price feed address for ETH/USD 📊.

The owner of the contract is set to the sender (`msg.sender`) during contract deployment 👑.

### 🛒 Presale Management

1. **startPresale()**: Allows the contract owner to start the presale. Once started, users can begin purchasing tokens 🎯.
2. **endPresale()**: Allows the contract owner to end the presale early 🚫.

### 💰 Buying Functions

1. **buyWithETH()**: Allows users to purchase RebelDoge tokens with ETH. The value of ETH is converted to USD using Chainlink’s price feed 💵.
2. **buyWithUSDT(uint256 usdtAmount)**: Allows users to purchase RebelDoge tokens using USDT 💰.
3. **getETHPriceInUSD(uint256 ethAmount)**: A helper function that retrieves the current price of ETH in USD using the Chainlink price feed 📊.
4. **getWRTeth(uint256 ethAmountInWEI)**: Calculates the number of RebelDoge tokens that can be bought for a given amount of ETH, including bonus tokens if applicable 🎉.
5. **getWRTUSD(uint256 usdtAmount)**: Calculates the number of RebelDoge tokens that can be bought for a given amount of USDT, including bonus tokens if applicable 🪙.

### 🕰️ Vesting and Claiming

1. **claimTokens()**: Allows users to claim their vested RebelDoge tokens after the presale ends 🎁. The first 50% of the tokens are released immediately, and the remaining tokens are distributed monthly based on the vesting period ⏳.
2. **_calculateClaimable(address buyer)**: A helper function that calculates how many tokens a buyer is eligible to claim based on the vesting schedule 📅.

### 🛠️ Administrative Functions

1. **withdrawFunds()**: Allows the contract owner to withdraw any ETH or USDT collected during the presale 💸.

---

## 🛠️ How to Use

### 🎉 Starting the Presale

The presale can be started by calling the `startPresale()` function, which only the contract owner can execute 👑. This function emits the `PresaleStarted` event to notify participants that the presale is live 🚀.

### 🛍️ Purchasing Tokens

Users can participate in the presale by either sending **ETH** to the contract or transferring **USDT**:
- **buyWithETH()**: The user can send ETH directly to the contract to purchase tokens. The amount of tokens purchased depends on the current ETH price in USD and the set **TOKEN_PRICE** 💵.
- **buyWithUSDT(uint256 usdtAmount)**: The user can call this function to buy tokens with USDT, providing the amount of USDT they wish to spend 💰.

Both purchasing methods calculate the number of tokens a user can buy and apply a bonus if they are among the first buyers (within the first 60 million tokens) 🎉.

### 🎁 Claiming Tokens

Once the presale ends, users can claim their tokens over a 12-month vesting period using the `claimTokens()` function ⏳. The first 50% of the tokens are released immediately, and the remaining tokens are distributed monthly based on the vesting period 📅.

### 💸 Withdraw Funds

The contract owner can withdraw the collected ETH and USDT using the `withdrawFunds()` function 💰.

---

## 🔐 Security Considerations

- **Access Control**: Functions such as `startPresale()`, `endPresale()`, and `withdrawFunds()` are restricted to the owner only 👑. This ensures that only the contract owner can manage important aspects of the presale.
- **Reentrancy**: The contract uses the standard pattern of transferring tokens to users after all logic has been executed, minimizing the risks of reentrancy attacks 🛡️.
- **Chainlink Price Feed**: The price feed used to determine the ETH/USD price is trusted, but it is essential to monitor the price feed for any potential issues or delays ⛔.

---

## 🏁 Conclusion

This **RebelDogeLaunchpad** contract provides a decentralized presale platform where users can purchase tokens and claim them over a vesting period. The bonus structure for early buyers and the vesting mechanism ensures that the token distribution is done fairly over time ⏳. The contract is designed to be user-friendly while providing flexibility for both buyers and the contract owner 🏠.

By following the instructions in this README, you can deploy and use the **RebelDogeLaunchpad** smart contract for your own token presale 💥.
