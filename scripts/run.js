const hre = require("hardhat");

async function main() {
  //deploy the crowd funding contract implementation

  const [deployer, address1, address2, address3, address4] = await hre.ethers.getSigners();

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

  txn = await cloneFundingContractInstanceTwo
  .connect(address2)
  .makeDonation({ value: amountToDepositTwo });

  wait = await txn.wait();
  console.log(
    "Funds donated by address2:",
    wait.events[0].event,
    wait.events[0].args
  );

  txn = await cloneFundingContractInstanceTwo
  .connect(address3)
  .makeDonation({ value: amountToDepositTwo });

  wait = await txn.wait();
  console.log(
    "Funds donated by address3:",
    wait.events[0].event,
    wait.events[0].args
  );



  //

  txn = await cloneFundingContractInstanceTwo
        .connect(address2)
        .creatNewMilestone("hello from space", timestamp);

  wait = await txn.wait();

  console.log("milestone created ", wait.events[0].event, wait.events[0].args);

  await cloneFundingContractInstanceTwo.connect(address1).voteOnMilestone(true);
  await cloneFundingContractInstanceTwo.connect(address2).voteOnMilestone(true);
  await cloneFundingContractInstanceTwo.connect(address3).voteOnMilestone(false);

  console.log("finish voting on the milestone");

  // wait 10 years
  await hre.network.provider.send("evm_increaseTime", [15778800000000]);


  //withdraw the milestone

  txn  = await cloneFundingContractInstanceTwo.connect(address2).withdrawMilestone();
  wait = await txn.wait();

  console.log(
    "Milestone withdrawn",
    wait.events[0].event,
    wait.events[0].args
  );

  txn = await cloneFundingContractInstanceTwo
  .connect(address2)
  .creatNewMilestone("hello from space again", timestamp);

  wait = await txn.wait();
  console.log("second milestone created");


  await cloneFundingContractInstanceTwo.connect(address1).voteOnMilestone(true);
  await cloneFundingContractInstanceTwo.connect(address2).voteOnMilestone(false);
  await cloneFundingContractInstanceTwo.connect(address3).voteOnMilestone(false);
  
  console.log("voting ended on second milestone");

   // wait 10 years
   await hre.network.provider.send("evm_increaseTime", [16778800000000]);
  //withdraw the second milestone
  txn  = await cloneFundingContractInstanceTwo.connect(address2).withdrawMilestone();
  wait = await txn.wait();

  console.log(
    "Milestone declined event",
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
