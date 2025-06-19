# Kohaku Testnet Roadmap

<aside>
🚢

Each release includes a public tweet, a Kohaku extension update, open-source code, and documentation. The features and scope outlined in releases beyond v0.0.2 represent our current direction and priorities, but may evolve as development and integration efforts progress.

</aside>

### **v0.0.1: Interop Foundation**

**Scheduled for:** July, 2025

**Goal**: Enable interoperable addressing and basic cross-chain UX

### Main Features

1. **ERC-7828**: human-readable interoperable address resolution (via GitHub Cha no in List)
2. **ERC-7939**: binary serialization support for intent protocols
3. **Cross-chain sends**: via **OIF** + **Across**
4. **Universal balance view-only**: display aggregation of same-asset balances across chains.

---

### **v0.0.2: Private Sends & Cross-Chain Swaps**

**Scheduled for:** September, 2025

**Goal**: Introduce Privacy Pools and enable seamless cross-chain swaps

### Main Features

1. **Private send** natively through the wallet via Privacy Pools (ETH sepolia mainnet support only)
2. **Cross-chain swaps**
3. **Universal balance transactions:** support intents where sender holds assets on multiple chains and destination receives a unified amount (chain-agnostic sender)

---

### **v1.0.0: Private Payments & Abstraction Layer**

**Scheduled for:** November, 2025

**Goal**: Support unified payments and private receive

### Main Features

1. **Private receive** natively through the wallet via Privacy Pools and Stealth Addresses (ETH sepolia mainnet support only)
2. **Stablecoin aggregation**: combine DAI/USDC/USDT as a single spendable “cash” balance
3. **Payment request**
4. **Gas abstraction**

---

### **v1.0.1: Cross-Chain Privacy UX**

**Scheduled for:** January, 2026

**Goal**: Extend privacy operations across chains

### Main Features

1. **Cross-chain private sends**: shielded transfers between L2s/mainnet
2. **Private swaps**
3. **Private top-up automation**

---

### **v1.0.2: Wallet Infra & Privacy Extensions**

**Scheduled for:** TBD

**Goal**: Improve compatibility, dApp abstraction, and strengthen privacy infrastructure

### Main Features

1. **Add hardware wallet support** **for private transactions**
2. **Universal dApp calls:** execute dApp interactions regardless of asset location
3. **ERC-4337 Private Relayer**
4. **RPC Privacy Layer**