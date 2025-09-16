// scripts/newWallet.js
const { ethers } = require('ethers');
const w = ethers.Wallet.createRandom();
console.log('ADDRESS:', w.address);
console.log('PRIVATE_KEY:', w.privateKey);
