//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract CrowdFundingContract is Initializable, Ownable {
    bool public campaignEnded;
    address payable public campaignOwner;
    bytes32 public fundingId;
    uint256 public targetAmount;
    uint256 public campaignDuration;
    uint256 public amountDonated;

    mapping(address => uint256) public donors;

    event createNewFundingContract(
        bytes32 indexed fundingId,
        uint256 targetAmount,
        address indexed owner,
        uint256 duration
    );

    event fundsDonated(address indexed donor, uint256 amount, uint256 date);

    function initialize(
        bytes32 _fundingId,
        uint256 _amount,
        uint256 _duration
    ) external initializer {
        campaignOwner = payable(msg.sender);
        fundingId = _fundingId;
        targetAmount = _amount;
        campaignDuration = _duration;
        emit createNewFundingContract(
            fundingId,
            targetAmount,
            msg.sender,
            campaignDuration
        );
    }

    function makeDonation() public payable {
        uint256 funds = msg.value;
        require(!campaignEnded, "campaign ended");
        require(funds > 0, "You did not donate");
        donors[msg.sender] += funds;
        amountDonated += funds;
        emit fundsDonated(msg.sender, funds, block.timestamp);
    }

    function withdrawCampaignFunds() public onlyOwner {
        require(block.timestamp > campaignDuration, "campaign still running");
        require(address(this).balance > 0, "nothing to withdraw");
        require(!campaignEnded, "campaign ended");
        campaignEnded = true;
        (bool success, ) = campaignOwner.call{value: address(this).balance}("");
        require(success, "withdrawal failed");
    }

    receive() external payable {}
}
