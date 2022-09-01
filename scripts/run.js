const hre = require("hardhat");

async function main() {
  //deploy the crowd funding contract implementation

  const [deployer, address1, address2] = await hre.ethers.getSigners();

  console.log(
    `deployer:${deployer.address} : address1:${address1.address} : address2:${address2.address}`
  );

  const CrowdFundingImplementation = await hre.ethers.getContractFactory(
    "CrowdFundingContract"
  );
  console.log("deploying the implementation contract");
  const crowdFundingImplementation = await CrowdFundingImplementation.deploy();
  await crowdFundingImplementation.deployed();
  console.log(
    "deployed the implementation contract with address : ",
    crowdFundingImplementation.address
  );
  //create the factory contract
  const CrowdFundingFactory = await hre.ethers.getContractFactory(
    "CrowdSourcingFactory",
    deployer
  );

  const crowdFundingFactory = await CrowdFundingFactory.deploy(
    crowdFundingImplementation.address
  );

  await crowdFundingFactory.deployed();
  console.log(
    "factory contract deployed to address ",
    crowdFundingFactory.address
  );

  let deposit = hre.ethers.utils.parseEther("0.001");
  let amountToDeposit = hre.ethers.utils.parseEther("0.1");
  let amountToDepositTwo = hre.ethers.utils.parseEther("0.00005");

  let timestamp = 1693554621;
  let fundingId = "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";
  let txn = await crowdFundingFactory
    .connect(address1)
    .createCrowdFundingContract(fundingId, deposit, timestamp, {
      value: deposit,
    });
  let wait = await txn.wait();

  console.log(
    "NEW Funding CREATED:",
    wait.events[1].event,
    wait.events[1].args
  );

  let cloneAddress = wait.events[1].args.cloneAddress;
  console.log("retrieving the clone of the contract");
  const cloneFundingContractInstance = await hre.ethers.getContractAt(
    "CrowdFundingContract",
    cloneAddress,
    address1
  );

  txn = await crowdFundingFactory
    .connect(address2)
    .createCrowdFundingContract(fundingId, deposit, timestamp, {
      value: deposit,
    });
  wait = await txn.wait();

  let cloneAddressTwo = wait.events[1].args.cloneAddress;

  const cloneFundingContractInstanceTwo = await hre.ethers.getContractAt(
    "CrowdFundingContract",
    cloneAddressTwo,
    address2
  );
  console.log("contract clone retrieved");

  console.log("making donation to the contract");
  txn = await cloneFundingContractInstance
    .connect(address2)
    .makeDonation({ value: amountToDeposit });
  console.log("donation made to the contract");
  wait = await txn.wait();
  console.log(
    "Funds donated first campaign:",
    wait.events[0].event,
    wait.events[0].args
  );

  txn = await cloneFundingContractInstanceTwo
    .connect(address1)
    .makeDonation({ value: amountToDepositTwo });

  wait = await txn.wait();
  console.log(
    "Funds donated second campaign:",
    wait.events[0].event,
    wait.events[0].args
  );

  // wait 10 years
  await hre.network.provider.send("evm_increaseTime", [15778800000000]);

  //withdraw the donation made:
  console.log("attempting to withdraw campaign funds");
  txn = await cloneFundingContractInstance
    .connect(address1)
    .withdrawCampaignFunds();
  wait = await txn.wait();
  console.log(
    "Funding Withdrawn from instance one:",
    wait.events[0].event,
    wait.events[0].args
  );

  txn = await cloneFundingContractInstanceTwo
    .connect(address2)
    .withdrawCampaignFunds();
  wait = await txn.wait();

  console.log(
    "Funding Withdrawn from instance two :",
    wait.events[0].event,
    wait.events[0].args
  );

  //owner of factory withdrawing his money
  txn = await crowdFundingFactory.connect(deployer).withdrawFunds();
  wait = await txn.wait();

  console.log("End");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
