 // quick check.js
const { ethers } = require('ethers');
const RPC = 'https://eth-sepolia.g.alchemy.com/v2/_KhTmbv8ij8s5R0SUHN1V';
const provider = new ethers.providers.JsonRpcProvider(RPC);
(async()=>{
  const balance = await provider.getBalance('0x8d6C2921993193A6E191BDF4cdF4Ea0bFA37C58A');
  console.log('Sepolia balance (wei):', balance.toString());
  console.log('ETH:', ethers.utils.formatEther(balance));
})();
