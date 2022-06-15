const {ethers} = require("hardhat");
const {expect} = require("chai");



describe("Other things", function() {
    const DURATION = 259200 //3 days
    const fee = ethers.utils.parseEther("0.01")

    let owner,
        Voting,
        voting,
        addr1,
        addr2,
        addr3,
        addr4,
        _candidates,
        av // addVoting

    beforeEach(async function() {
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners() 
        _candidates = [addr1.address, addr2.address, addr3.address, addr4.address]
        Voting = await ethers.getContractFactory("Voting", owner)
        voting = await Voting.deploy()
        await voting.deployed()

        av = await voting.addVoting("test", _candidates)
    })
    it ("will be reverted because there aren't no comission", async function() {
        await ethers.provider.send('evm_increaseTime', [DURATION])
        await voting.finish("test")
        await expect(voting.withdrawComission())
            .to.be.revertedWith("No comission")
    })
    it ("will transfer comission from Voting to owner correctly", async function() {
        await voting.vote("test", addr1.address, {value:fee})
        await ethers.provider.send('evm_increaseTime', [DURATION])
        await voting.finish("test")
        const wc = await voting.withdrawComission()
        await expect(() => wc)
        .to.changeEtherBalances([voting, owner], [ethers.utils.parseEther('-0.001'), ethers.utils.parseEther('0.001')])
    })
    it ("will do other things correctly", async function() {
        await voting.addVoting("test2", _candidates)
        
        expect(await voting.showBallots() + " ").to.equal(["test", "test2"] + " ")
        await voting.vote("test", addr1.address, {value:fee})
        expect(await voting.showVotes("test", addr1.address) + " ").to.deep.equal(1 + " ")
        
        await ethers.provider.send('evm_increaseTime', [DURATION])
        await voting.finish("test")
        
        const data = await voting.showVoting("test")
        expect(data.candidates).to.deep.equal(_candidates)
        expect(data.pool).to.eq(fee)
        expect(data.isFinished).to.eq(true)
        expect(data.currentWinner).to.eq(addr1.address)
        
    })
    it("will receive money", async function() {
            
        await expect(() => addr1.sendTransaction({
            to: voting.address,
            value: ethers.utils.parseEther('1'),
        }))
        .changeEtherBalances([addr1, voting], [ethers.utils.parseEther('-1'), ethers.utils.parseEther('1')])
    })
})