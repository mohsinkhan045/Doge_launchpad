const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Load addresses from .env
  const rebelDogeTokenAddress = process.env.REBELDOGE_TOKEN_ADDRESS;
  const usdtTokenAddress = process.env.USDT_TOKEN_ADDRESS;
  const priceFeedAddress = process.env.CHAINLINK_PRICE_FEED_ADDRESS;

  // Ensure the addresses are defined in .env
  if (!rebelDogeTokenAddress || !usdtTokenAddress || !priceFeedAddress) {
    console.error("Missing one or more contract addresses in .env file");
    process.exit(1);
  }

  // Deploy RebelDogeLaunchpad contract
  const Token = await ethers.getContractFactory("RebelDogeLaunchpad");

  const launchpad = await Token.deploy(
    rebelDogeTokenAddress,  // RebelDoge Token Address
    usdtTokenAddress,       // USDT Token Address
    priceFeedAddress        // Chainlink Price Feed Address
  );

  console.log("RebelDogeLaunchpad contract deployed to:", launchpad.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
