const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");

describe("CrowdFunding", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  async function setUpContractUtils() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_ETH = 1_000_000_000_000_000_000;

    const deposit = ONE_ETH * 0.001;
    const amountToDeposit = ONE_ETH * 0.0000002;
    const futureTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    let fundingId =
      "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, someOtherAccount] = await ethers.getSigners();

    //deploy the contracts here
    const CrowdFundingImplementation = await hre.ethers.getContractFactory(
      "CrowdFundingContract"
    );
    const crowdFundingImplementation =
      await CrowdFundingImplementation.deploy();
    await crowdFundingImplementation.deployed();

    //deploy the factory contract
    const CrowdFundingFactory = await hre.ethers.getContractFactory(
      "CrowdSourcingFactory"
    );

    const crowdFundingFactory = await CrowdFundingFactory.deploy(
      crowdFundingImplementation.address
    );
    await crowdFundingFactory.deployed();

    let txn = await crowdFundingFactory
      .connect(otherAccount)
      .createCrowdFundingContract(fundingId, deposit, futureTime, {
        value: deposit,
      });

    let wait = await txn.wait();
    const cloneAddress = wait.events[1].args.cloneAddress;

    //load the clone
    let instanceOne = await hre.ethers.getContractAt(
      "CrowdFundingContract",
      cloneAddress,
      otherAccount
    );

    let txnTwo = await crowdFundingFactory
      .connect(otherAccount)
      .createCrowdFundingContract(fundingId, deposit, futureTime, {
        value: deposit,
      });

    let waitTwo = await txn.wait();
    const cloneAddressTwo = waitTwo.events[1].args.cloneAddress;

    //load the clone
    let instanceTwo = await hre.ethers.getContractAt(
      "CrowdFundingContract",
      cloneAddressTwo,
      someOtherAccount
    );

    return {
      futureTime,
      deposit,
      owner,
      otherAccount,
      someOtherAccount,
      contractFactory: crowdFundingFactory,
      fundingId,
      amountToDeposit,
      instanceOne,
      instanceTwo,
    };
  }

  describe("Deployment", function () {
    beforeEach(async () => {});

    it("Should create a clone contract and create a new campaign", async function () {
      const { contractFactory, otherAccount, deposit, futureTime, fundingId } =
        await loadFixture(setUpContractUtils);

      const txn = await contractFactory
        .connect(otherAccount)
        .createCrowdFundingContract(fundingId, deposit, futureTime, {
          value: deposit,
        });

      let wait = await txn.wait();

      expect(wait.events[1].args.cloneAddress).to.exist;
    });

    it("Should be able to make donation to a campaign", async function () {
      const { amountToDeposit, someOtherAccount, instanceOne } =
        await loadFixture(setUpContractUtils);
      await instanceOne
        .connect(someOtherAccount)
        .makeDonation({ value: amountToDeposit });

      const amount = await instanceOne.getDonation();

      expect(amount.toString()).to.be.equal(amountToDeposit.toString());
    });

    it("Should be able to deposit to the other campaign", async function () {
      const { amountToDeposit, someOtherAccount, instanceTwo } =
        await loadFixture(setUpContractUtils);
      await instanceTwo
        .connect(someOtherAccount)
        .makeDonation({ value: amountToDeposit });

      const amount = await instanceTwo.getDonation();

      expect(amount.toString()).to.be.equal(amountToDeposit.toString());
    });

    it("Should be able to retrieve the campaign owner", async function () {
      const { otherAccount, instanceOne } = await loadFixture(
        setUpContractUtils
      );
      const owner = await instanceOne.campaignOwner();
      expect(owner).to.be.equal(otherAccount.address);
    });

    it("Should show deployed contracts as two", async function () {
      const { contractFactory } = await loadFixture(setUpContractUtils);
      const deployedContracts = await contractFactory.deployedContracts();
      expect(+deployedContracts.length).to.be.equal(2);
    });

    it("Should only allow the owner to withdraw", async function () {
      const { contractFactory, owner } = await loadFixture(setUpContractUtils);

      const balanceBefore = await hre.ethers.provider.getBalance(owner.address);
      await contractFactory.connect(owner).withdrawFunds();
      const balanceAfter = await hre.ethers.provider.getBalance(owner.address);
      expect(+balanceAfter.toString()).to.be.greaterThan(
        +balanceBefore.toString()
      );
    });
  });
});
