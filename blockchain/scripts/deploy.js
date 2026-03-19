const hre = require("hardhat");

async function main() {
    const BlockLend = await hre.ethers.getContractFactory("BlockLend");
    const blockLend = await BlockLend.deploy();

    await blockLend.waitForDeployment();

    console.log(`BlockLend deployed to: ${await blockLend.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
