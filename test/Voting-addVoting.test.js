const {ethers} = require("hardhat");
const {expect} = require("chai");


const DURATION = 259200;

async function getTimestamp(bn) {
    return (
        await ethers.provider.getBlock(bn)
    ).timestamp;
}

describe("Voting-addVoting", function() {
    let owner,
        Voting,
        voting,
        addr1,
        addr2,
        addr3,
        addr4,
        _candidates //list of candidates

    beforeEach(async function() {
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners()
        _candidates = [addr1.address, addr2.address, addr3.address, addr4.address] 
        Voting = await ethers.getContractFactory("Voting", owner)
        voting = await Voting.deploy()
        await voting.deployed()
    })
    it ("will be reverted because not owner is trying to create a voting", async function() {
        await expect(voting.connect(addr1).addVoting("test", _candidates))
                .to.be.revertedWith("You are not an owner!");
    })
    it ("will be reverted because amount of candidates less than 2 and the name of Voting is empty",
        async function() 
    {
        await expect(voting.addVoting("test", [addr1.address]))
            .to.revertedWith("candidates must be more than 1") 
        await expect(voting.addVoting("", _candidates))
            .to.revertedWith("The voting name can't be empty")
    })
    it ("will be reverted because there weren't unique addresses", async function() {
        await expect(voting.addVoting("test", [addr1.address, owner.address, addr1.address]))
            .to.revertedWith("Candidates must have unique addresses")
    })
    it ("will emit an event about a new voting", async function() {
        const tx = await voting.addVoting("test", _candidates)
        await expect(tx)
            .to.emit(voting, "newVoting")
            .withArgs("test", await getTimestamp(tx.blockNumber))
    })
    it ("will be to create a correctly voting", async function() {
        const tx = await voting.addVoting("test", _candidates)
        // showVoting - returns all voting information
        const data = await voting.showVoting("test")
        expect(data.endTime + " ").to.equal(await getTimestamp(tx.blockNumber) + DURATION + " ")
        for(let i; i < _candidates.length; i++) {
            // "candidates" - a list of candidates who took part in the voting.
            expect(data.candidates[i]).to.eq(_candidates[i])
            //showVotes - returns the number of votes for the given candidate
            expect(await voting.showVotes("test", _candidates[i])).to.eq(0)
        }
        expect(data.candidates).to.deep.equal(_candidates)
        expect(data.pool).to.eq(0)
        
        expect(data.isFinished).to.eq(false)
        expect(data.currentWinner).to.eq(ethers.constants.AddressZero)
    })
})