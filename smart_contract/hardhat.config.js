require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/iggoUa0KYniZy6qPkmxqVpY2kEekwLuY',
      accounts: [ '5dcb1fe6eba0bdb7fc1458de6628ae7ae76702de73032b28646a931d57286b82' ]
    }
  }
}