//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CrowdFundingContract.sol";

contract CrowdSourcingFactory is Ownable {
    //state variables;
    address immutable crowdFundingImplementation;
    address[] public deployedContracts;
    uint256 public fundingFee = 0.001 ether;

    //events
    event newCrowdFundingCreated(address indexed owner, uint256 amount);

    constructor() {
        crowdFundingImplementation = address(new CrowdFundingContract());
    }

    function createCrowdFundingContract(
        bytes32 _fundingId,
        uint256 _amount,
        uint256 _duration
    ) external payable returns (address) {
        require(msg.value >= fundingFee, "deposit too small");
        address clone = Clones.clone(crowdFundingImplementation);
        CrowdFundingContract(payable(clone)).initialize(
            _fundingId,
            _amount,
            _duration
        );
        deployedContracts.push(clone);
        emit newCrowdFundingCreated(msg.sender, fundingFee);
        return clone;
    }

    function withdrawFunds() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "withdrawal failed");
    }

    receive() external payable {}
}
