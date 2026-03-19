const hre = require("hardhat");

async function main() {
    const account = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const balance = await hre.ethers.provider.getBalance(account);
    console.log("Account:", account);
    console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
