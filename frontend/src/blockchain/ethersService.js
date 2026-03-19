import { ethers } from "ethers";
import { contractABI } from "./contractABI";


export const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";


export const getProvider = () => {
    if (!window.ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask.");
    }
    return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
    const provider = getProvider();
    return await provider.getSigner();
};

export const getContract = async (withSigner = false) => {
    const provider = getProvider();
    if (withSigner) {
        const signer = await provider.getSigner();
        return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
    }
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
};

export const connectWallet = async () => {
    if (!window.ethereum) {
        throw new Error("No crypto wallet found. Please install MetaMask.");
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
};

export const formatEther = (amount) => ethers.formatEther(amount);
export const parseEther = (amount) => ethers.parseEther(amount.toString());
