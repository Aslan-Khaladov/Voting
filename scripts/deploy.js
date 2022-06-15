const hre = require("hardhat");
const ethers = hre.ethers;
require("dotenv").config();
const ADDRESS = process.env.ADDRESS

async function main() {
    const [signer] = await ethers.getSigners()
    const Voting = await ethers.getContractFactory("Voting");
    const voting = await Voting.deploy();
    await voting.deployed();

    console.log("Voting deployed to: ", signer.address);
    console.log("Contract address", voting.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });