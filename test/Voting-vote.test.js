const {ethers} = require("hardhat");
const {expect} = require("chai");

function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

describe("Voting-vote", function() {
    const DURATION = 259200;
    const fee = ethers.utils.parseEther("0.01")
    
    let owner,
        Voting,
        voting,
        participant,
        addr1,
        addr2,
        addr3,
        addr4,
        _candidates, //list of candidates
        av // addVoting
    
    beforeEach(async function() {
        [owner, participant, addr1, addr2, addr3, addr4] = await ethers.getSigners()
        _candidates = [addr1.address, addr2.address, addr3.address, addr4.address] 
        Voting = await ethers.getContractFactory("Voting", owner)
        voting = await Voting.deploy()
        await voting.deployed()
    })

    beforeEach(async function() {
        av = await voting.addVoting("test", _candidates)
    })
    
    it ("will be reverted with 5 causes", async function() {
        await expect(voting.vote("test", addr1.address, {value: fee - ethers.utils.parseEther('0.005')}))
            .to.be.revertedWith("The fee must be equal to 0.01 ether")
        //it will be reverted because the participant tried to vote twice
        await voting.connect(participant).vote("test", addr1.address, {value:fee})
        await expect(voting.connect(participant).vote("test", addr1.address, {value:fee}))
            .to.be.revertedWith("You already used your vote")
        //it will be reverted because  the perticipant tried to vote for a non-existent candidate
        await expect(voting.connect(addr1).vote("test", owner.address, {value:fee}))
            .to.be.revertedWith("Candidate with this address doesn't exist")
        
        await ethers.provider.send('evm_increaseTime', [DURATION])
        await expect(voting.connect(addr1).vote("test", addr1.address, {value:fee}))
            .to.be.revertedWith("The voting is over")

        await expect(voting.vote("test2", addr1.address, {value:fee}))
            .to.be.revertedWith("This votig doesn't exist")
    })
    it ("will be to transfer fee from addr1 to Voting smart-contract", async function() {
        const tx = await voting.connect(addr1).vote("test", addr2.address, {value:fee})
        await expect(() => tx)
            .to.changeEtherBalances([addr1, voting], [ethers.utils.parseEther('-0.01'), fee])
    })
    it("will be to receive money", async function() { 
        await expect(() => addr3.sendTransaction({
            to: voting.address,
            value: ethers.utils.parseEther('1'),
        }))
        .changeEtherBalances([addr3, voting], [ethers.utils.parseEther('-1'), ethers.utils.parseEther('1')])
    })
    it ("will be to do a correctly vote", async function() {
        const counter = 12;

        // we need list of participants because we can't to vote from one address twice
        const participants = (await ethers.getSigners()).slice(5, 5 + counter);
        let votingResult = new Array(_candidates.length).fill(0);

        for (const participant of participants) {
            const candiateID = getRandInt(0, _candidates.length);
            await voting.connect(participant).vote("test", _candidates[candiateID], {value: fee});
            votingResult[candiateID]++;
        }

        const data = await voting.showVoting("test")

        expect(data.pool).to.eq(fee.mul(counter));

        // it will be checking that votes were recorded currectly
        for(let i = 0; i < _candidates.length; i++) {
            expect(await voting.showVotes("test", _candidates[i])).to.eq(votingResult[i]);
        }
    })
})