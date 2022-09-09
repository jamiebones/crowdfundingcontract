//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

enum MilestoneStatus {
    Approved,
    Declined,
    Pending
}

contract CrowdFundingContract is Initializable {
    bool public campaignEnded;
    address payable private _campaignOwner;
    string public fundingCId;
    uint256 public targetAmount;
    uint256 public campaignDuration;
    uint256 private _amountDonated;
    uint256 private _numberOfDonors;
    uint32 private _milestoneCounter;
    uint256 private _approvedMilestone;
    uint256 private _numberOfWithdrawal;

    uint256 constant _baseNumber = 10**18;


    MilestoneStatus status;

    struct MilestoneVote {
        address donorAddress;
        bool vote;
    }

    struct Milestone {
        string milestoneCID;
        bool approved;
        uint256 votingPeriod;
        MilestoneStatus status;
        MilestoneVote[] votes;
    }

    mapping(address => uint256) public donors;
    mapping(uint256 => Milestone) public milestones;

    event fundsDonated(address indexed donor, uint256 amount, uint256 date);
    event fundsWithdrawn(address indexed owner, uint256 amount, uint256 date);
    event milestoneCreated(
        address indexed owner,
        uint256 datecreated,
        uint256 period
    );
    event milestoneRejected(uint yesvote, uint novote);

    function initialize(
        string calldata _fundingCId,
        uint256 _amount,
        uint256 _duration
    ) external initializer {
        _campaignOwner = payable(tx.origin);
        fundingCId = _fundingCId;
        targetAmount = _amount;
        campaignDuration = _duration;
    }

    function makeDonation() public payable {
        uint256 funds = msg.value;
        require(!campaignEnded, "campaign ended");
        require(funds > 0, "You did not donate");
        require(_numberOfWithdrawal != 3, "no longer taking donation");
        if (donors[msg.sender] == 0) {
            _numberOfDonors += 1;
        }

        donors[msg.sender] += funds;
        _amountDonated += funds;
        emit fundsDonated(msg.sender, funds, block.timestamp);
    }

    function creatNewMilestone(string memory milestoneCID, uint256 votingPeriod)
        public
    {
        require(msg.sender == _campaignOwner, "you not the owner");
        //check if we have a pending milestone
        //check if we have a pending milestone or no milestone at all
        require(
            milestones[_milestoneCounter].status != MilestoneStatus.Pending,
            "you have a pending milestone"
        );

        //check if all three milestone has been withdrawn
        require(_numberOfWithdrawal != 3, "no more milestone to create");

        //create a new milestone increment the milestonecounter
        _milestoneCounter++;

        //voting period for a minimum of 2 weeks before the proposal fails or passes
        Milestone storage newmilestone = milestones[_milestoneCounter];
        newmilestone.milestoneCID = milestoneCID;
        newmilestone.approved = false;
        newmilestone.votingPeriod = votingPeriod;
        newmilestone.status = MilestoneStatus.Pending;
        emit milestoneCreated(msg.sender, block.timestamp, votingPeriod);
    }

    function voteOnMilestone(bool vote) public {
        //check if the milestone is pending which means we can vote
        require(
            milestones[_milestoneCounter].status == MilestoneStatus.Pending,
            "can not vote on milestone"
        );
        //check if the person has voted already
        //milestone.votes

        //check if this person is a donor to the cause
        require(donors[msg.sender] != 0, "you are not a donor");

        uint256 counter = 0;
        uint256 milestoneVoteArrayLength = milestones[_milestoneCounter]
            .votes
            .length;
        bool voted = false;
        for (counter; counter < milestoneVoteArrayLength; ++counter) {
            MilestoneVote memory userVote = milestones[_milestoneCounter].votes[
                counter
            ];
            if (userVote.donorAddress == msg.sender) {
                //already voted
                voted = true;
                break;
            }
        }
        if (!voted) {
            //the user has not voted yet
            MilestoneVote memory userVote;
            //construct the user vote
            userVote.donorAddress = msg.sender;
            userVote.vote = vote;
            milestones[_milestoneCounter].votes.push(userVote);
            
        }
    }

    function etherBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawMilestone() public {
        require(payable(msg.sender) == _campaignOwner, "you not the owner");

        //check if the voting period is still on
        require(
            block.timestamp > milestones[_milestoneCounter].votingPeriod,
            "voting still on"
        );
        //check if milestone has ended
        require(
            milestones[_milestoneCounter].status == MilestoneStatus.Pending,
            "milestone ended"
        );

        //calculate the percentage
        (uint yesvote, uint256 novote) = _calculateTheVote(
            milestones[_milestoneCounter].votes
        );

        //calculate the vote percentage and make room for those that did not vote
        uint256 totalYesVote = _numberOfDonors - novote;

        //check if the yesVote is equal to 2/3 of the total votes
        uint256 twoThirdofTotal = (2 * _numberOfDonors * _baseNumber) / 3;
        uint256 yesVoteCalculation = totalYesVote * _baseNumber;

        //check if the milestone passed 2/3
        if (yesVoteCalculation >= twoThirdofTotal) {
            //the milestone succeds payout the money
            milestones[_milestoneCounter].approved = true;
            _numberOfWithdrawal++;
            milestones[_milestoneCounter].status = MilestoneStatus.Approved;
            //transfer 1/3 of the total balance of the contract
            uint256 contractBalance = address(this).balance;
            require(contractBalance > 0, "nothing to withdraw");
            uint256 amountToWithdraw;
            if (_numberOfWithdrawal == 1) {
                //divide by 3 1/3
                amountToWithdraw = contractBalance / 3;
            } else if (_numberOfWithdrawal == 2) {
                //second withdrawal 1/2
                amountToWithdraw = contractBalance / 2;
            } else {
                //final withdrawal
                amountToWithdraw = contractBalance;
                campaignEnded = true;
            }

            (bool success, ) = _campaignOwner.call{value: amountToWithdraw}("");
            require(success, "withdrawal failed");
            emit fundsWithdrawn(
                _campaignOwner,
                amountToWithdraw,
                block.timestamp
            );
            
        } else {
            //the milestone failed
            milestones[_milestoneCounter].status = MilestoneStatus.Declined;
            emit milestoneRejected(yesvote, novote);
        }
    }

    function _calculateTheVote(MilestoneVote[] memory votesArray)
        private
        pure
        returns (uint256, uint256)
    {
        uint256 yesNumber = 0;
        uint256 noNumber = 0;
        uint256 arrayLength = votesArray.length;
        uint256 counter = 0;

        for (counter; counter < arrayLength; ++counter) {
            if (votesArray[counter].vote == true) {
                ++yesNumber;
            } else {
                ++noNumber;
            }
        }

        return (yesNumber, noNumber);
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

    function showCurrentMillestone() public view returns (Milestone memory) {
        return milestones[_milestoneCounter];
    }

    receive() external payable {}
}
