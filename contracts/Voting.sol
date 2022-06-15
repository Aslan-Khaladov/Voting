// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Voting {
    address payable immutable owner;
    uint constant fee = 0.01 ether;
    uint constant DURATION = 3 days;
    uint totalComission;
    string[] allBallots; 
    
    //the name of the vote is used as a pointer to the vote
    mapping(string => Ballot) ballots;
    
    event newVoting(string name, uint time);
    event finishVoting(string name, address winner, uint pool);

    struct Ballot {
        address[] candidates;
        address currentWinner;
        bool isFinished;
        mapping(address=>bool) voted;
        uint pool;
        uint endTime;  //
        mapping(address=>uint) votes;  //
        mapping(address=>uint) indexOfCandidate; //
    }


    constructor() {
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender==owner, "You are not an owner!");
        _;
    }
    modifier isExist(string calldata name) {
        require(ballots[name].endTime != 0, "This votig doesn't exist");
        _;
    }
    /**
        FUNCTION   addVoting:

     @dev creates a new voting with 'name' as name and 'candidates'  
     as a voting candidate list addresses
     Also, the function doesn't check unickueness of the voting name
    */
    function addVoting(
        string calldata name,
        address[] calldata _candidates
        ) 
        external 
        onlyOwner 
    {
        require(_candidates.length > 1, "candidates must be more than 1");
        require(bytes(name).length > 0, "The voting name can't be empty");
        //
        //Here you set the end time for voting
        ballots[name].endTime = block.timestamp + DURATION;
        //This is where you set the voting candidates
        ballots[name].candidates = _candidates;
        allBallots.push(name);
        /* loop checks candidate addresses for uniqueness
         if there are 2 identical addresses function will be reverted */
        for(uint i; i < _candidates.length;) {
            address _candidate = _candidates[i];
            if (i>0) {
                require(_candidates[0] != _candidate &&
                ballots[name].indexOfCandidate[_candidate] == 0,
                "Candidates must have unique addresses");
            }
            ballots[name].indexOfCandidate[_candidate] = i;
            unchecked { i++; }
        }  
        emit newVoting(name, block.timestamp);
    }
    /**
            FUNCTION    vote:
        Requirements:
        -Voting shouldn't have ended
        -msg.value must be equal to 0.01 ether 
        -You mustn't vote twice
        -Candidate must exist
    
     */
    function vote(
        string calldata name,
        address candidate
        ) 
        external 
        payable
        isExist(name) 
    {
        require(ballots[name].endTime > block.timestamp, "The voting is over");
        require(msg.value == fee, "The fee must be equal to 0.01 ether");
        require(ballots[name].voted[msg.sender] == false, "You already used your vote");
        // The default value for uint is 0, so if its value is 0 
        //and it is not equal to candidate [0], that candidate does not exist.
        if (ballots[name].indexOfCandidate[candidate] == 0) { 
            require(candidate == ballots[name].candidates[0], 
            "Candidate with this address doesn't exist");
        }
        
        ballots[name].voted[msg.sender] = true;
        ballots[name].pool += msg.value;
        ballots[name].votes[candidate]++;
        if (ballots[name].votes[candidate] >
            ballots[name].votes[ballots[name].currentWinner] &&
            candidate != ballots[name].currentWinner)
        {
            ballots[name].currentWinner = candidate;
        }
    }

    receive() external payable {
        totalComission += msg.value;
    }

    function finish(string calldata name) external isExist(name) {
        require(ballots[name].endTime <= block.timestamp,
             "The voting isn't over");
        require(ballots[name].isFinished == false,
             "The voting has already finished");
        ballots[name].isFinished = true;
        totalComission += ballots[name].pool/10;
        (bool success, ) = ballots[name].currentWinner.call{value: ballots[name].pool*9/10}("");
        require(success, "Transfer failed!");
        emit finishVoting(name, ballots[name].currentWinner, ballots[name].pool);
    }

    function withdrawComission() external payable onlyOwner {
        require(totalComission > 0, "No comission");
        owner.transfer(totalComission);
        totalComission = 0;
    }

    /**
        This function returns all voting information
     */
    function showVoting(string calldata name) 
        external 
        view 
        returns(
            address[] memory candidates, 
            address currentWinner,
            uint pool,
            uint endTime,
            bool isFinished) 
    {
        return (ballots[name].candidates, ballots[name].currentWinner, 
                ballots[name].pool, ballots[name].endTime, ballots[name].isFinished);
    }

    function showVotes(string calldata name, address candidate) 
        external view returns(uint)
    {
        return ballots[name].votes[candidate];
    }

    //this function returns the names of all votes
    function showBallots() external view returns(string[] memory) {
        return allBallots;
    }

}
