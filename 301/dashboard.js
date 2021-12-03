// MORALIS CODE
(async function(){
  const serverUrl = "https://gdj8rkg4b4cz.usemoralis.com:2053/server"
  const appId = "LOYAMIVCC2ZrKdeKJee3hWzuRuMzIim1lbe9VLd8"
  await Moralis.start({serverUrl, appId})
})()

async function login() {
  await Moralis.authenticate();
}

async function logout() {
  await Moralis.User.logOut();
}

async function transferNative(){
  const address = document.getElementById('native-address').value;
  const amount = document.getElementById('native-amount').value;

  // sending 0.5 ETH
  const options = {
    type: "native", 
    amount: Moralis.Units.ETH(amount), 
    receiver: address
  }
  let result = await Moralis.transfer(options)
}

async function transferERC20(){
  const address = document.getElementById('erc20-address').value;
  const amount = document.getElementById('erc20-amount').value;
  const contract = document.getElementById('erc20-contract').value;
  const decimals = document.getElementById('erc20-decimals').value;
  
  // sending 0.5 ETH
  const options = {
    type: "erc20", 
    amount: Moralis.Units.Token(amount, decimals), 
    receiver: address,
    contractAddress: contract
  }
  let result = await Moralis.transfer(options)
}

// CHAINLINK ADDRESS RINKEBY
// 0x01be23585060835e02b77ef475b0cc51aa1e0709
// Decimals: 18

document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logout;

// FUNCTION CLICK LISTENER
document.getElementById("transfer-native").onclick = transferNative;
document.getElementById("transfer-erc20").onclick = transferERC20;

// OLD BOOTSTRAP CODE
(function () {
  'use strict'

  feather.replace({ 'aria-hidden': 'true' })

  // Graphs
  var ctx = document.getElementById('myChart')
  // eslint-disable-next-line no-unused-vars

})()
