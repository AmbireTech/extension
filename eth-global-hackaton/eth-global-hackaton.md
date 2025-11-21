# Ambire Wallet Hackaton Build

WARNING: This build is made only for the purpose of using it during the ETH Global hackaton, Devconnect 2025, Buenos Aires. Do not use it with your personal accounts or your personal funds.

Four main networks have been modified to a virtual fork: Ethereum, Optimism, Base and Arbitrum. Transactions signed for this networks won't be mined on the original chains. However, signed transactions are replayable on the original chains. Therefore you shouldn't use your own personal accounts with this build.

# EIL supported networks

This build supportd the EIL on the following test networks:

- ethereum sepolia
- optimism sepolia
- arbitrum sepolia

It is recommended to use the above test networks for hacking with the EIL.

In addition, the following four virtual forks of the original networks are also supported:

- ethereum
- optimism
- arbitrum
- base

# Build

Please download the ambire-eil.zip from this folder. Then:

- export the contents
- load them in the chrome browser (or brave) by opening the extensions tab -> Developer mode -> Load unpacked -> choose the exported folder. Firefox / Safari are not supported
- import a hot (seed phrase or private key) EOA account. Hardware wallets and smart accounts are not supported. Please make sure to import an EOA account
- hack
