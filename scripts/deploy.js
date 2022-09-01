
const hre = require("hardhat");

async function main() {
  //deploy the crowd funding contract implementation 
  const CrowdFundingImplementation = await hre.ethers.getContractFactory("CrowdFundingContract");
  console.log("deploying the implementation contract")
  const crowdFundingImplementation = await CrowdFundingImplementation.deploy();
  await crowdFundingImplementation.deployed();
  console.log("deployed the implementation contract with address : ", crowdFundingImplementation.address);
  //create the factory contract
  const CrowdFundingFactory = await hre.ethers.getContractFactory("CrowdSourcingFactory");
  
  const crowdFundingFactory = await CrowdFundingFactory.deploy(crowdFundingImplementation.address);
  console.log("deployed the factory contract");
  await crowdFundingFactory.deployed();
  console.log("deployed the factory contract with address ", crowdFundingFactory.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
