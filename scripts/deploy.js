
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
  console.log("deployed the factory contract with to : ", crowdFundingFactory.address);

}

main().catch((error) => {
  console.error("There was an error",error);
  process.exitCode = 1;
});


//deployed the implementation contract with address :  0xd6591cFb3F6FF39DeF4aaA994b47e8a8883723b1
//deployed the factory contract with to :  0xf8421c8a8Db350134c3FaB7Ab3eF1F1F1147425F
