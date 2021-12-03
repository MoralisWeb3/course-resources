// NEW FUNCTIONALITY
const checkUserLoggedIn = () => {
  let content = document.querySelector('.appContent');
  let msg = document.querySelector('#userMsg');
  const user = Moralis.User.current();
  if (user) {
    content.style.display = 'block'
    document.querySelectorAll('.button-group').forEach(e=>e.style.display = 'block')
    
  } else {
    content.style.display = 'none'
    document.querySelectorAll('.button-group').forEach(e=>e.style.display = 'none')
  }
}

checkUserLoggedIn();

async function login() {
  let user = Moralis.User.current();
  if (!user) {
    user = await Moralis.Web3.authenticate();
  }
  console.log("logged in user:", user);
  checkUserLoggedIn();
}

function clearData(){
  document.getElementById('values').innerHTML = '';
  document.getElementById('portfolio-value').style.display = "none";
  document.querySelector('.appContentHeader').style.display = "none";
}

async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
  document.querySelector('.appContent').innerHTML = ``;
  checkUserLoggedIn();
  clearData();
}

function dropdown() {
  let select = document.createElement('select');
  for (let i = 0; i < tokens.length; i++) {
    let opt = tokens[i];
    let el = document.createElement("option");
    el.textContent = opt;
    el.id = opt;
    el.value = opt;
    select.appendChild(el);
  }
  return select;
}

let addTokenDiv = () => {
  let counter = 0;
  counter = document.querySelectorAll('.token').length + 1;
  let content = document.querySelector('.appContent');
  let div = document.createElement('div');
  div.className = "token"
  div.id = `token-${counter}`
  // let token = document.createElement('select');
  let token = dropdown();
  token.id = `tokenSelect-${counter}`;
  token.className = 'tokenName col-md-3';
  let name = document.createElement('input');
  name.className = 'tokenQuantity col-md-3';
  let value = document.createElement('span');
  value.id = `value-${counter}`
  value.className = 'tokenRemove col-md-3';
  value.innerHTML = ` delete`
  value.onclick = function () { this.parentNode.parentNode.removeChild(this.parentNode) }
  div.appendChild(token);
  div.appendChild(name);
  div.appendChild(value);
  content.appendChild(div);
}

function prepData() {
  let testData = document.querySelectorAll('.token');
  let children = [];
  testData.forEach(e => {
    children.push({ coin: e.childNodes[0].value, amount: e.childNodes[1].value });
  });
  _data = { tokenData: children, currentBalance: currentBalance() }
  saveData(_data);
}

let saveData = async (data) => {
  let address = Moralis.User.current().get('ethAddress');
  const Portfolio = Moralis.Object.extend("Portfolio");
  const portfolio = new Portfolio();
  
  portfolio.set("tokenData", data)
  portfolio.set("address", address)
  portfolio.set("Current Balance", data.currentBalance)
  await portfolio.save()
  .then((portfolio) => {
    console.log(portfolio)
  }, (error) => {
    alert('Failed to create new object, with error code: ' + error.message);
  });
  recallTokens();
}

let recallTokens = async () => {
  if (!Moralis.User.current()) return;
  let _address = Moralis.User.current().get('ethAddress')
  const Portfolio = Moralis.Object.extend("Portfolio");
  const query = new Moralis.Query(Portfolio);
  query.equalTo("address", _address);
  query.descending("createdAt");
  query.limit(1);
  const results = await query.find();
  console.log(results);
  if (results[0].attributes.tokenData.tokenData.length > 0) {
    let data = results[0].attributes.tokenData.tokenData;
    let contentParent = document.querySelector('.appContent');
    contentParent.innerHTML='';
    let contentHeader = document.querySelector('.appContentHeader');
    let headers = `    <div class="d-flex">
      <div class="col-md-3"><h3>Asset</h3></div>
      <div class="col-md-3"><h3>How many?</h3></div>
      <div class="col-md-3"><h3>Price</h3></div>
      <div class="col-md-3"></div>
      </div>`
      contentHeader.innerHTML = headers;
    let counter = 0;
    data.forEach(e => {
      let div = document.createElement('div');
      div.className = "token"
      div.id = `token-${counter + 1}`
      let token = document.createElement('input');
      token.className = 'tokenName col-md-3';
      token.value = e.coin;
      let quantity = document.createElement('input');
      quantity.className = 'tokenQuantity col-md-3';
      quantity.value = e.amount;
      let price = document.createElement('input');
      price.className = 'tokenPrice col-md-3';
      price.id = `price-${counter + 1}`;
      let value = document.createElement('span');
      value.id = `value-${counter}`
      value.className = 'tokenRemove col-md-3';
      value.innerHTML = ` delete`
      value.onclick = function () { this.parentNode.parentNode.removeChild(this.parentNode) }
      div.appendChild(token);
      div.appendChild(quantity);
      div.appendChild(price);
      div.appendChild(value);
      contentParent.appendChild(div);
      counter++;
    })
    let tokenCall = await getTokens();
    
    data.forEach((e, i) => {
      let price = document.querySelector(`#price-${i + 1}`)
      price.value = tokenCall[i].price;
    })
    document.getElementById('portfolio-value').style.display = 'block';
    calculateValues();
  }else {
    document.getElementById('portfolio-value').style.display = 'block';
    document.getElementById('portfolio-value').innerHTML = `
    <h2 class="text-center">You have no tokens, so click 'add token'</h2>`;

  }
}

let recallPreviousTen = async () => {
  let _address = Moralis.User.current().get('ethAddress')
  const Portfolio = Moralis.Object.extend("Portfolio");
  const query = new Moralis.Query(Portfolio);
  query.equalTo("address", _address);
  query.descending("createdAt");
  query.limit(10);
  const results = await query.find();
  console.log(results);
  for(result of results){
    console.log(result.attributes.tokenData.currentBalance);
  }
}

let currentBalance = () => {
  let _sum =0;
  let _tokens = document.querySelectorAll('.token');
  _tokens.forEach(e => { _sum += (e.childNodes[1].value * e.childNodes[2].value) });
  return _sum.toFixed(2)
}

async function getPrices() {
  let x = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=1000&page=1&sparkline=false')
  .then(response => response.json())
  .then(result => result.data);
}

async function getTokens() {
  let x;
  await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=1000&page=1&sparkline=false')
  .then(response => response.json())
  .then(data => { x = data; });
  
  let search = document.querySelectorAll('.token');
  let token = []
  search.forEach(e => {
    let coin = {
      name: e.childNodes[0].value,
      quantity: e.childNodes[1].value,
      price: x.find(element => element.id == e.childNodes[0].value).current_price
    }
    token.push(coin);
  });
  return token;
}



function getAmounts() {
  let search = document.querySelectorAll('.token');
  let amountArray = []
  search.forEach(e => amountArray.push(e.childNodes[1].value));
  return amountArray;
}

async function calculateValues() {
  let _sum = 0;
  let content = document.querySelector('#values');
  content.innerHTML = '';
  let _tokens = document.querySelectorAll('.token');

  _tokens.forEach(e => { _sum += (e.childNodes[1].value * e.childNodes[2].value) });
  
  content.innerHTML += `<h1>Total Portfolio Value: $${_sum.toFixed(2)}</h1>`;
}

// Listeners
document.getElementById("btn-add").onclick = addTokenDiv;
document.getElementById("btn-save").onclick = prepData;
document.getElementById("btn-recall").onclick = recallTokens;