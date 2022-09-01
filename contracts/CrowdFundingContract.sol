//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "hardhat/console.sol";

contract CrowdFundingContract is Initializable {
    bool public campaignEnded;
    address payable private _campaignOwner;
    string public fundingId;
    uint256 public targetAmount;
    uint256 public campaignDuration;
    uint256 private _amountDonated;
    uint256 private _numberOfDonors;

    mapping(address => uint256) public donors;
    event fundsDonated(address indexed donor, uint256 amount, uint256 date);
    event fundsWithdrawn(address indexed owner, uint256 amount, uint256 date);

    function initialize(
        string calldata _fundingId,
        uint256 _amount,
        uint256 _duration
    ) external initializer {
        _campaignOwner = payable(tx.origin);
        fundingId = _fundingId;
        targetAmount = _amount;
        campaignDuration = _duration;
    }

    function makeDonation() public payable {
        uint256 funds = msg.value;
        require(!campaignEnded, "campaign ended");
        require(funds > 0, "You did not donate");
        if (donors[msg.sender] == 0) {
            _numberOfDonors += 1;
        }

        donors[msg.sender] += funds;
        _amountDonated += funds;
        emit fundsDonated(msg.sender, funds, block.timestamp);
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawCampaignFunds() public {
        uint256 amountToWithdraw = address(this).balance;
        require(block.timestamp > campaignDuration, "campaign still running");
        require(amountToWithdraw > 0, "nothing to withdraw");
        require(payable(msg.sender) == _campaignOwner, "you not the owner");
        require(!campaignEnded, "campaign ended");

        campaignEnded = true;
        (bool success, ) = _campaignOwner.call{value: amountToWithdraw}("");
        require(success, "withdrawal failed");
        emit fundsWithdrawn(msg.sender, amountToWithdraw, block.timestamp);
    }

    function getDonation() public view returns (uint256) {
        return _amountDonated;
    }

    function campaignOwner() public view returns (address payable) {
        return _campaignOwner;
    }

    function numberOfDonors() public view returns (uint256) {
        return _numberOfDonors;
    }

    receive() external payable {}
}
