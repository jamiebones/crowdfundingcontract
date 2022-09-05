require("@nomicfoundation/hardhat-toolbox");
//require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.8.2",
      },
      {
        version: "0.8.1",
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    mumbai: {
      url: process.env.INFURA_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 80001,
      gas: 2100000,
      gasPrice: 8000000000,
    },
  },
  etherscan: {
    apiKey: process.env.POLY_SCAN,
  },
};