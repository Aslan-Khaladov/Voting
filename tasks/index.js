require("dotenv").config();

const { task } = require('hardhat/config');
require("@nomiclabs/hardhat-ethers");


const ADDRESS = process.env.ADDRESS

task("addVoting", "Add new voting")
    .addParam("name", "name of the voting")
    .addParam("candidates", "space-separated string of candidates' addresses")
    .setAction(async (taskArgs) => {
        const candidates = taskArgs.candidates.split(" ")
        const Voting = await ethers.getvotingFactory("Voting")
        const voting = await Voting.attach(ADDRESS);
        await voting.addVoting(candidates, taskArgs.name)
            .then(async () => {
                const Filter = voting.filters.newVoting()
                const event = (voting.queryFilter(Filter)).pop()
                console.log(`Voting with '${event.args.name}' name and ${event.args.endTime} end time was successfully created`)
            }, (error) => {
                console.log(error.message)
            })
    });

task("vote", "Choice your candidate")
    .addParam("name", "name of the voting")
    .addParam("candidate", "choose your candidate")
    .setAction(async (taskArgs) => {
        const Voting = await ethers.getvotingFactory("Voting")
        const voting = await Voting.attach(ADDRESS2)
        await voting.vote(taskArgs.name, taskArgs.candidate, {value:ethers.utils.parseEther("0.01")})
            .then(async () => {
                console.log(`Your vote has been accepted!`)
            }, (error) => {
                console.log(error.message)
            })
    });

task("finish", "finish voting")
    .addParam("name", "name of the voting")
    .setAction(async ({name}) => {
        const [signer] = await ethers.getSigners()
        const Voting = await ethers.getvotingFactory("Voting")
        const voting = await Voting.attach(ADDRESS)
        await voting.finish(name)
            .then(async () => {
                const Filter = voting.filters.finishVoting()
                const event = (voting.queryFilter(Filter)).pop()
                console.log(`Voting with '${event.args.name}' name was succesfully finished`)
                console.log(`Winner: '${event.args.winner}'`)
                console.log(`Pool: '${event.args.pool}'`)
            }, (error) => {
                console.log(error.message)
            })
        
    });    

task("wdc", "WithDraw Comission")
    .setAction(async () => {
        const Voting = await ethers.getvotingFactory("Voting")
        const voting = await Voting.attach(ADDRESS)
        await voting.withdrawComission()
            .then( () => {
                console.log(`Your comission has been succesfully withdrawn`)
            }, (error) => {
                console.log(error.message)
            })
    });

   

task("showVoting", "Show voting data")
    .addParam("name", "name of the voting")
    .setAction(async ({name}) => {
        const Voting = await ethers.getvotingFactory("Voting")
        const voting = await Voting.attach(ADDRESS)

        async function candidatesData(candidates) {
            let cdata = ''
            for(let i = 0; i<candidates.length; i++) {
                cdata +=
                "\taddress: " + candidates[i] +
                "\n\tamount of votes: " + await voting.showVotes(name, candidates[i]) + "\n"
            }
            return cdata
        }

        await voting.showVoting(name)
            .then(async (result) => {
                const data =
                `Name: ${result.name}
                Winner: ${data.currentWinner}
                Pool: ${ether.utils.formatEther(result.pool)} ether
                End time: ${new Date(data.endTime*1000)}
                Candidates: 
                ${candidatesData(data.candidates)}
                `
                console.log(data)
            }, (error) => {
                console.log(error.message)
            })
    })

  