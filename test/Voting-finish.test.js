const {ethers} = require("hardhat");
const {expect} = require("chai");



describe("Voting-finish", function() {
    const DURATION = 259200 //3 days
    const fee = ethers.utils.parseEther("0.01")

    let owner,
        Voting,
        voting, 
        Candidate, //Contract-candidate
        candidate,
        addr1,
        addr2,
        addr3,
        addr4,
        _candidates,
        av    // addVoting
        
    beforeEach(async function() {
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners() 
        Voting = await ethers.getContractFactory("Voting", owner)
        voting = await Voting.deploy()
        await voting.deployed()

        Candidate = await ethers.getContractFactory("Candidate", owner)
        candidate = await Candidate.deploy()
        await candidate.deployed()
    })

    beforeEach(async function() {
        _candidates = [candidate.address, addr2.address, addr3.address, addr4.address]
        av = await voting.addVoting("test", _candidates)
    })

    it ("will be reverted with 3 causes", async function() {
        await expect(voting.finish("test"))
            .to.be.revertedWith("The voting isn't over")
        
        //it will be reverted because winner("candidate") cannot receive money
        await voting.vote("test", candidate.address, {value: fee})
        await ethers.provider.send('evm_increaseTime', [DURATION])
        await expect(voting.finish("test"))
            .to.be.revertedWith("Transfer failed!")
        

        await voting.addVoting("test2", _candidates)
        await voting.vote("test2", addr2.address, {value:fee})
        await ethers.provider.send('evm_increaseTime', [DURATION])
        await voting.finish("test2")
        await expect(voting.finish("test2"))
            .to.be.revertedWith("The voting has already finished")
    })
    it ("will emit an event about the end of voting ", async function() {
        await voting.vote("test", addr2.address, {value:fee})
        await ethers.provider.send('evm_increaseTime', [DURATION])
        const tx = await voting.finish("test")
        await expect(tx)
            .to.emit(voting, "finishVoting")
            .withArgs("test", addr2.address, fee)
    })
})