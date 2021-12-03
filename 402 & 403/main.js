// INITIALISE MORALIS
(async function(){
    const serverUrl = "SERVER_URL"
    const appId = "APP_ID"
    await Moralis.start({ serverUrl, appId })
})();

// -----------CONFIG--------------
// Have you renamed the index.html or dashboard.html file? 
// If yes, update these filenames:
const loginPage = `index.html`;
const dashboard = `dashboard.html`;
// --------------------------------

// REDIRECT USER BASED ON STATUS
(function(){
    // If the user is NOT authenticated and NOT on the login page:

    if (Moralis.User.current() == null && window.location.pathname.endsWith(dashboard)) {
        document.querySelector('body').style.display = 'none';
        window.location.href = "index.html";
    }
    if (Moralis.User.current() != null && window.location.pathname.endsWith(loginPage)) {
        window.location.href = "dashboard.html";
        _ethAddress = Moralis.User.current().get('ethAddress');
    }
})();

// Global Variables
let _ethAddress;
let network = '';

// Initialising OneInch
(async function(){
    await Moralis.initPlugins();
    dex = Moralis.Plugins.oneInch;
    
})();


// Reloading app onAccountsChanged and getting new signature
Moralis.onAccountsChanged(async function (accounts) {
    await Moralis.User.logOut();
    document.getElementById("web3apiTitle").click();
    await Moralis.Web3.authenticate();
    window.location.reload();
  });

// DISPLAY NETWORK and USER ADDRESS
(async function (){
    if (Moralis.User.current() != null && window.location.pathname.endsWith(dashboard)) {
            getNetwork();
            getAddress();
            await listAvailableTokens();
        }
        Moralis.onChainChanged(function(){
            getNetwork();
            // window.location.reload();
        })
})();

//HELPER FUNCTIONS
async function getNetwork(){
    let web3 = new Web3(window.ethereum)
    chainId = await web3.eth.net.getId();
    let _id = returnChainId(chainId);
    document.getElementById('currentNetwork').textContent = `Network: ${_id}`;
    network = document.getElementById('currentNetwork').textContent.substr(9, 100);
}

function getAddress(){
    let rawAddress = Moralis.User.current().get('ethAddress');
    let firstFive = rawAddress.substring(0, 6);
    let lastFive = rawAddress.slice(rawAddress.length - 4);
    let _address = `User: ${firstFive}...${lastFive}`;
    document.getElementById('userAddress').textContent = _address;
}

function returnChainId(chainId){
    switch (chainId) {
        case 1: return "Eth";
        case 3: return "Ropsten";
        case 4: return "Rinkeby";
        case 5: return "Goerli";
        case 42: return "Kovan";
        case 56: return "BSC";
        case 97: return "BSC Testnet";
        case 137: return "Matic";
        case 1337: return "Local Dev Chain";
        case 80001: return "Mumbai";
      }
}

login = async () => {
    await Moralis.Web3.authenticate()
    .then(async function (user) {
        let _email = document.getElementById('user-email').value;
        let _password = document.getElementById('user-password').value;
        if(_password != '' || _email != ''){
            if(_password != ''){user.set("password", _password);}
            if(_email != ''){user.set("email", _email);}
            await user.save();
        }
        window.location.href = "dashboard.html";
    })
}

logout = async () => {
    await Moralis.User.logOut();
    window.location.href = "index.html";
}

renderContent = (element) => {
    let elements = ['#transferETH','#transferERC20','#transferNFTs',
    "#transactionsSection", "#balancesSection", "#nftSection", 
    '#portfolioTracker', '#buyCrypto', '#swapTokens', '#webhooks', '#web3apiTokenSection']
    elements.forEach(e => {
        hideContent(e);
    })
    showContent(element);
    console.log(element);
}

hideContent = (el) => {
    let element = el;
    document.querySelector(element).style.display = 'none';
}

showContent = (el) => {
    let element = el;
    document.querySelector(element).style.display = 'block';
}

millisecondsToTime = (ms) => {
    let minutes = Math.floor(ms / (1000 * 60));
    let hours = Math.floor(ms / (1000 * 60 * 60));
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    if (days < 1) {
        if (hours < 1) {
            if (minutes < 1) {
                return `less than a minute ago`
            } else return `${minutes} minutes(s) ago`
        } else return `${hours} hours(s) ago`
    } else return `${days} days(s) ago`
}

fixURL = (url) => {
    if (url.startsWith("ipfs")) {
        return "https://ipfs.moralis.io:2053/ipfs/" + url.split("ipfs://").slice(-1)
    }
    else {
        return url + "?format=json"
    }
}

clearContent = (id) => {
    let _id = `#${id}`
    document.querySelector(_id).innerHTML = "";
}

getERC20Metadata = async () => {
    let _symbol = document.querySelector('#ERC20MetadataSymbol').value;
    let _chain = document.querySelector('#ERC20MetadataChain').value;
    let tokens = await Moralis.Web3API.account.getTokenBalances({chain:_chain})
    tokens.forEach((e,i) => {
        if(e.symbol == _symbol){
            document.querySelector('#ERC20TransferContract').value = e.token_address;
            document.querySelector('#ERC20TransferDecimals').value = e.decimals;
        }
    })   
}

getScanTx = (type, id) => {
    
    switch (id) {
        case 1: return `https://etherscan.io/${type}/`;
        case 3: return `https://ropsten.etherscan.io/${type}/`;
        case 4: return `https://rinkeby.etherscan.io/${type}/`;
        case 5: return `https://goerli.etherscan.io/${type}/`;
        case 42: return `https://kovan.etherscan.io/${type}/`;
        case 56: return `https://bscscan.com/block/${type}`;
        case 97: return `https://testnet.bscscan.com/block/${type}`;
        case 137: return `https://polygonscan.com/${type}`;
        case 80001: return `https://mumbai.polygonscan.com/${type}`;
        default: alert(`sorry but that chain is not available`);
    }
}

//WEB3API FUNCTIONS
getTransactions = async () => {
    let _chain = document.querySelector('#transactions-chain').value;
    const options = { chain: _chain, address: _ethAddress };
    const transactions = await Moralis.Web3API.account.getTransactions(options);
    let web3 = new Web3(window.ethereum);
    let chainId = await web3.eth.net.getId();
    const txUrl = getScanTx("tx", chainId)
    const blockUrl = getScanTx("block", chainId)

    if (transactions.total > 0) {
        let table = `
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Transaction</th>
                    <th scope="col">Block Number</th>
                    <th scope="col">Age</th>
                    <th scope="col">Type</th>
                    <th scope="col">Fee</th>
                    <th scope="col">Value</th>
                </tr>
            </thead>
            <tbody id="theTransactions">
            </tbody>
        </table>
        `
        document.querySelector('#tableOfTransactions').innerHTML = table;

        transactions.result.forEach(t => {
            let content = `
            <tr>
                <td data-label="Transaction"><a href='${txUrl}/${t.hash}' target="_blank" rel="noopener noreferrer">${shortAddress(t.hash)}</a></td>
                <td data-label="Block"><a href='${blockUrl}/${t.block_number}' target="_blank" rel="noopener noreferrer">${t.block_number}</a></td>
                <td data-label="Age">${millisecondsToTime(Date.parse(new Date()) - Date.parse(t.block_timestamp))}</td>
                <td data-label="Type">${t.from_address == Moralis.User.current().get('ethAddress') ? 'Outgoing' : 'Incoming'}</td>
                <td data-label="Fee">${((t.gas * t.gas_price) / 1e18).toFixed(5)} ETH</td>
                <td data-label="Value">${(t.value / 1e18).toFixed(5)} ETH</td>
            </tr>
            `
            theTransactions.innerHTML += content;
        })
    } else document.querySelector('#tableOfTransactions').innerHTML = `<div class="container h3 text-center my-3">You have no transactions from the ${_chain} chain</div>`;
}

getNativeBalances = async () => {
    const ethBalance = await Moralis.Web3API.account.getNativeBalance();
    const ropstenBalance = await Moralis.Web3API.account.getNativeBalance({ chain: "ropsten" });
    const rinkebyBalance = await Moralis.Web3API.account.getNativeBalance({ chain: "rinkeby" });
    const goerliBalance = await Moralis.Web3API.account.getNativeBalance({ chain: "goerli" });
    const kovanBalance = await Moralis.Web3API.account.getNativeBalance({ chain: "kovan" });
    const maticBalance = await Moralis.Web3API.account.getNativeBalance({ chain: "matic" });
    const mumbaiBalance = await Moralis.Web3API.account.getNativeBalance({ chain: "mumbai" });
    const bscBalance = await Moralis.Web3API.account.getNativeBalance({ chain: "bsc" });

    
    
    // case 1: return "Eth";
    // case 3: return "Ropsten";
    // case 4: return "Rinkeby";
    // case 5: return "Goerli";
    // case 42: return "Kovan";
    // case 56: return "BSC";
    // case 97: return "BSC Testnet";
    // case 137: return "Matic";
    // case 1337: return "Local Dev Chain";
    // case 80001: return "Mumbai";

    let content = document.querySelector('#userBalances').innerHTML = `
    <table class="table">
        <thead>
            <tr>
                <th scope="col">Chain</th>
                <th scope="col">Balance</th>
                <th scope="col">Transfer</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Ether</th>
                <td>${(ethBalance.balance / 1e18).toFixed(5)} ETH</td>
                <td><button 
                    class="${network==="Eth" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                    id="btn-send-eth" data-token="eth"}>Transfer Eth
                    </button>
                </td>
            </tr>
            <tr>
                <th>Ropsten</th>
                <td>${(ropstenBalance.balance / 1e18).toFixed(5)} ETH</td>
                <td><button 
                    class="${network==="Ropsten" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                    id="btn-send-eth" data-token="ropsten">Transfer Ropsten}
                    </button>
                </td>
            </tr>
            <tr>
                <th>Rinkeby</th>
                <td>${(rinkebyBalance.balance / 1e18).toFixed(5)} ETH</td>
                <td><button 
                    class="${network==="Rinkeby" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                    id="btn-send-eth" data-token="rinkeby">Transfer Rinkeby}
                    </button>
                </td>
            </tr>
            <tr>
                <th>Goerli</th>
                <td>${(goerliBalance.balance / 1e18).toFixed(5)} ETH</td>
                <td><button 
                    class="${network==="Goerli" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                    id="btn-send-eth" data-token="goerli">Transfer Goerli}
                    </button>
                </td>
            </tr>
            <tr>
                <th>Kovan</th>
                <td>${(kovanBalance.balance / 1e18).toFixed(5)} ETH</td>
                <td><button 
                    class="${network==="Kovan" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                    id="btn-send-eth" data-token="kovan">Transfer Kovan}
                    </button>
                </td>
            </tr>
            <tr>
                <th>Matic / Polygon</th>
                <td>${(maticBalance.balance / 1e18).toFixed(5)} MATIC</td>
                <td><button 
                class="${network==="Matic" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                id="btn-send-eth" data-token="matic">Transfer Matic}
                </button>
            </td>
            </tr>
            <tr>
                <th>Matic / Polygon (test)</th>
                <td>${(mumbaiBalance.balance / 1e18).toFixed(5)} MATIC</td>
                <td><button 
                class="${network==="Mumbai" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                id="btn-send-eth" data-token="mumbai">Transfer Mumbai}
                </button>
            </tr>
            <tr>
                <th>BNB (BSC)</th>
                <td>${(bscBalance.balance / 1e18).toFixed(5)} BNB</td>
                <td><button 
                class="${network==="BSC" ? "btn btn-primary" : "btn btn-secondary disabled"}" 
                id="btn-send-eth" data-token="bsc">Transfer BSC}
                </button>
            </tr>
        </tbody>
    </table>
    `
}
getERC20Balances = async () => {
    let ethAddress;
    let chainChoice = await getNetworkText();
    const search = document.getElementById('search-bar').value;
    if(search == ''){ethAddress = _ethAddress;} else{ethAddress = search;}
    let tokens = await Moralis.Web3API.account.getTokenBalances({chain: chainChoice, address: ethAddress });

    
    let otherBalancesContent = document.querySelector('#otherBalances');
    otherBalancesContent.innerHTML ='';
    
    console.log(chainChoice);
    if(tokens.length > 0){
        let tokenBalanceContent = '';
        tokens.forEach((e,i) => {
                console.log(e);
                let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${(e.balance / ('1e' + e.decimals))} ETH</td>
                <td>${e.decimals}</td>
                <td>${e.token_address}</td>
                </tr>
                `
                tokenBalanceContent += content
        });
        otherBalancesContent.innerHTML += tokenBalanceContent; 
    } else{otherBalancesContent.innerHTML = `<p class="h6 mt-3 mb-3">You have no ERC20 tokens on ${chainChoice}</p>`}
}

 getNetworkText = async () => {
    let web3 = new Web3(window.ethereum);
    chainId = await web3.eth.net.getId();
    let _id = returnChainId(chainId);
    return (_id.toLowerCase());
}


getTransferERC20Balances = async () => {
    let ethTokens = await Moralis.Web3API.account.getTokenBalances();
    let ropstenTokens = await Moralis.Web3API.account.getTokenBalances({chain: 'ropsten'});
    let rinkebyTokens = await Moralis.Web3API.account.getTokenBalances({chain: 'rinkeby'});
    
    let balancesContent = document.querySelector('#transferERC20Balances');
    balancesContent.innerHTML ='';
    
    if(ethTokens.length > 0){

    }
    if(ropstenTokens.length > 0){

    }
    if(rinkebyTokens.length > 0){
        let tokenBalanceContent = '';

        rinkebyTokens.forEach((e,i) => {
                let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${(e.balance / ('1e' + e.decimals))} ETH</td>
                <td>${e.decimals}</td>
                <td>${e.token_address}</td>
                <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${e.decimals}" data-address="${e.token_address}">Transfer ${e.symbol}</button></td>
                </tr>
    
                `
                tokenBalanceContent += content
        });
        balancesContent.innerHTML += tokenBalanceContent; 

        setTimeout(function(){
            let theBalances = document.getElementsByClassName('transfer-button');

            for (let i = 0; i <= theBalances.length - 1; i ++) {
                theBalances[i].onclick = function() {
                    document.querySelector('#ERC20TransferDecimals').value = theBalances[i].attributes[1].value;
                    document.querySelector('#ERC20TransferContract').value = theBalances[i].attributes[2].value;
                };
            }
        }, 1000);
    }
}

getNFTs = async () => {
    let _chain = document.querySelector('#nft-chain').value;
    let nfts = await Moralis.Web3API.account.getNFTs({ chain: _chain });
    let tableOfNFTs = document.querySelector('#tableOfNFTs');
    tableOfNFTs.innerHTML = "";

    if (nfts.result.length > 0) {
        nfts.result.forEach(nft => {
            let url = nft.token_uri;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    let content = `
                <div class="card col-md-4" 
                            data-id="${nft.token_id}" 
                            data-address="${nft.token_address}" 
                            data-type="${nft.contract_type}">
                    <img src="${fixURL(data.image_url)}" class="card-img-top" height=300>
                        <div class="card-body">
                        <h5 class="card-title">${data.name}</h5>
                        <p class="card-text">${data.description}</p>
                        <h6 class="card-title">Contract Address</h6>
                        <p class="card-text">${nft.token_address}</p>
                        <h6 class="card-title">Token ID</h6>
                        <p class="card-text">${nft.token_id}</p>
                        <h6 class="card-title">Type</h6>
                        <p class="card-text">${nft.contract_type}</p>
                    </div>
                </div>
                `
                tableOfNFTs.innerHTML += content;
            });
        });
    } else tableOfNFTs.innerHTML += `<div class="container text-center my-3 h3">You have no public NFTs on the ${_chain} chain.</div>`;
}

getTransferNFTs = async () => {
    let _chain = document.querySelector('#nft-chain2').value;
    await Moralis.Web3API.account.getNFTs({ chain: _chain })
    .then((nfts) => getNFTs2(nfts));

}

getNFTs2 = async (nfts) => {
    console.log(nfts);
    let tableOfNFTs = document.querySelector('#NFTtable2');
    tableOfNFTs.innerHTML = "<div class='col-md-12'><p>Click on an NFT below to get the metadata into the search above.</p></div>";
        if (nfts.result.length > 0) {
            nfts.result.forEach(nft => {
                let url = nft.token_uri;
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        // console.log(data);
                        let content = `
                    <div class="card col-md-4 nfts" data-id="${nft.token_id}" data-address="${nft.token_address}" data-type="${nft.contract_type}">
                        <img src="${fixURL(data.image_url)}" class="card-img-top" height=200>
                            <div class="card-body">
                            <h5 class="card-title">${data.name}</h5>
                            <p class="card-text">${data.description}</p>
                            <h6 class="card-title">Contract Address</h6>
                            <p class="card-text">${nft.token_address}</p>
                            <h6 class="card-title">Token ID</h6>
                            <p class="card-text">${nft.token_id}</p>
                            <h6 class="card-title">Type</h6>
                            <p class="card-text">${nft.contract_type}</p>
                        </div>
                    </div>
                    `
                    tableOfNFTs.innerHTML += content;
                    });
            });
        }

        setTimeout(function(){
            let theNFTs = document.getElementsByClassName('nfts');

            for (let i = 0; i <= theNFTs.length - 1; i ++) {
                theNFTs[i].onclick = function() {
                    document.querySelector('#nft-transfer-token-id').value = theNFTs[i].attributes[1].value;
                    document.querySelector('#nft-transfer-type').value = (theNFTs[i].attributes[3].value).toLowerCase();
                    document.querySelector('#nft-transfer-contract-address').value = theNFTs[i].attributes[2].value;
                };
            }
        }, 1000);
}

// DISPLAY FUNCTIONS
tokenBalanceLoop = (tokens) => {
    let tokenBalanceContent = '';

    tokens.forEach((e,i) => {
            let content = `

            <tr>
            <td>Token: ${e.name}</td>
            <td>Symbol: ${e.symbol}</td>
            <td>Balance: ${(e.balance / '1e'+ e.decimals)} ETH</td>
            <td>Decimals: ${e.decimals}</td>
            <td>Contract Address: ${e.token_address}</td>
            </tr>

            `
            tokenBalanceContent += content
    });
    return tokenBalanceContent; 
}

displayTransactions = () => renderContent('#transactionsSection');
displayTransactions2 = () => renderContent('#tableOfNFTs2');
displayBalances = () => renderContent('#balancesSection');
displayNFTs = () => renderContent('#nftSection');
displayWeb3API = () => renderContent('#web3apiTokenSection');
displayTransferETH = () => renderContent('#transferETH');
displaytransferERC20 = () => renderContent('#transferERC20');
displaytransferNFTs = () => renderContent('#transferNFTs');
displayPortfolioTracker = () => renderContent('#portfolioTracker');
displayBuyCrypto = () => {renderContent('#buyCrypto');}
displaySwapTokens = () => renderContent('#swapTokens');
displayAlerts = () => renderContent('#webhooks')

// PART 2: TRANSFER FUNCTIONS
transferETH = async () => {
    let _amount = String(document.querySelector('#amountOfETH').value);
    let _address = document.querySelector('#addressToReceive').value;

    const options = {type: "native", amount: Moralis.Units.ETH(_amount), receiver: _address}
    let result = await Moralis.transfer(options)
    alert(`transferring ${_amount} ETH to your requested address. Please allow some time to process your transaction.`);
}

transferERC20 = async () => {
    let _amount = String(document.querySelector('#ERC20TransferAmount').value);
    let _decimals = String(document.querySelector('#ERC20TransferDecimals').value);
    let _address = String(document.querySelector('#ERC20TransferAddress').value);
    let _contract = String(document.querySelector('#ERC20TransferContract').value);

    const options = {type: "erc20", 
                    amount: Moralis.Units.Token(_amount, _decimals), 
                    receiver: _address,
                    contract_address: _contract}
    let result = await Moralis.transfer(options)    
    console.log(result);
}

transferNFTs = async () => {
    console.log('transferring NFTs');
   
    let _type = document.querySelector('#nft-transfer-type').value
    let _receiver = document.querySelector('#nft-transfer-receiver').value
    let _address = document.querySelector('#nft-transfer-contract-address').value
    let _id = document.querySelector('#nft-transfer-token-id').value
    let _amount =  document.querySelector('#nft-transfer-amount').value

    const options = {type: _type,  
                 receiver: _receiver,
                 contract_address: _address,
                 token_id: _id,
                 amount: _amount}
    let result = await Moralis.transfer(options)
    console.log('NFT Transferred');
}

// PART 3: FUNCTIONS



async function swapTokens() {
    const NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    const ONEINCH_ADDRESS = "0x111111111117dC0aa78b770fA6A738034120C302";

    const options = {
        chain:"bsc",
        fromTokenAddress:NATIVE_ADDRESS,
        toTokenAddress:ONEINCH_ADDRESS,
        amount: Number(Moralis.Units.ETH("0.01")),
        fromAddress: Moralis.User.current().get("ethAddress"),
        slippage: 1
    }

    let receipt = await dex.swap(options);
    console.log(receipt);
}

async function buycrypto(){
    let result = await Moralis.Plugins.fiat.buy();
    // let result = await Moralis.Plugins.fiat.buy({}, {disableTriggers: true});
    // document.getElementById('fiat-iframe').style.display = 'block';
    // document.getElementById('fiat-iframe').src = result.data;
}

function shortAddress(address){
    let firstFive = address.substring(0, 10);
    let lastFive = address.slice(address.length - 6);
    let newAddress = `${firstFive}...${lastFive}`;
    return newAddress;
}

function returnAddress(e){
    const address = Moralis.User.current().get('ethAddress');
    const element = document.querySelector(`${e.target.dataset.address}`)
    element.value = address;
}

// SHOW HIDE PASSWORD - add class to 

function ShowHidePass() {
    console.log('clicked');
    var x = document.getElementById("user-password");
    var z = document.getElementById("the-eye");
    if (x.type === "password") {
      x.type = "text";
      z.className = "bi bi-eye-slash";
    } else {
      x.type = "password";
      z.className = "bi bi-eye";
    }
  }


if(window.location.pathname.endsWith(loginPage)){
    document.querySelector('#the-eye').onclick = function(){ShowHidePass()};
}
// DASHBOARD LISTENERS
if (window.location.pathname.endsWith(dashboard)){
    document.querySelector('#btn-logout').onclick = logout;

    // Side Menu Part 1
    document.querySelector('#get-transactions-link').onclick = displayTransactions;
    document.querySelector('#btn-get-transactions').onclick = getTransactions;
    document.querySelector('#get-balances-link').onclick = displayBalances;
    document.querySelector('#btn-get-native-balances').onclick = getNativeBalances;
    document.querySelector('#btn-get-erc20-balances').onclick = getERC20Balances;
    document.querySelector('#ERC20MetadataSearch').onclick = getERC20Metadata;
    document.querySelector('#get-nfts-link').onclick = displayNFTs;
    document.querySelector('#btn-get-nfts').onclick = getNFTs;

    document.querySelector('#get-web3apiTokenSection').onclick = displayWeb3API;

    // "Get Address" will need to be refactored
    document.querySelector('#getAddress-getTransactions').onclick = returnAddress
    document.querySelector('#getAddress-getNFTs').onclick = returnAddress
    document.querySelector('#getNFTsForContract_getEthAddress').onclick = returnAddress
    document.querySelector('#getNFTTransfers_getEthAddress').onclick = returnAddress
    
    


    // Side Menu Part 2
    document.querySelector('#transfer-ETH').onclick = displayTransferETH;
    document.querySelector('#transfer-ERC20').onclick = displaytransferERC20;
    document.querySelector('#transfer-nfts').onclick = displaytransferNFTs;
    document.querySelector('#ETHTransferButton').onclick = transferETH;
    document.querySelector('#ERC20TransferButton').onclick = transferERC20;
    document.querySelector('#btn-get-transactions2').onclick = getTransferNFTs;   
    document.querySelector('#btn-transfer-selected-nft').onclick = transferNFTs;
    document.querySelector('#transferERC20GetBalances').onclick = getTransferERC20Balances;
    
    // Side Menu Part 3
    document.querySelector('#portfolio-tracker').onclick = displayPortfolioTracker;
    document.querySelector('#buy-crypto').onclick = displayBuyCrypto;
    document.querySelector('#swap-tokens').onclick = displaySwapTokens;
    document.querySelector('#webhook-alerts').onclick = displayAlerts;
    document.querySelector('#launch-onramper').onclick = buycrypto;
    


    // For Loop 
    let buttons = document.getElementsByClassName('clearButton')
    for (var i = 0; i <= buttons.length - 1; i += 1) {
        buttons[i].onclick = function(e) {
            clearContent(this.name);
        };
    }
}



// LOGIN LISTENERS
if (document.querySelector('#btn-login')){
    document.querySelector('#btn-login').onclick = login;
}

