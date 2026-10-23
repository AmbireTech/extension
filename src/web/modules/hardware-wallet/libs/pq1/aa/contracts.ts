// Calls to the PQ1 wallet, its factory and the EntryPoint.

import { decodeFunctionResult, encodeFunctionData, parseAbi, type Address, type Hex } from 'viem'

// The execute functions an owner slot's signature may call. The wallet also
// has a plain `execute(address,uint256,bytes)`, which slot signatures can't
// use.
const executeAbi = parseAbi([
  'function executeWithOffchainCount(uint256 ownerIndex, uint256 newOffchainCount, address target, uint256 value, bytes data) returns (bytes)'
])
const executeBatchAbi = parseAbi([
  'function executeBatchWithOffchainCount(uint256 ownerIndex, uint256 newOffchainCount, address[] targets, uint256[] values, bytes[] datas)'
])
const entryPointAbi = parseAbi([
  'function getNonce(address sender, uint192 key) view returns (uint256)'
])
const walletAbi = parseAbi([
  'function nextOwnerIndex() view returns (uint256)',
  'function offchainSigCount(uint256 ownerIndex) view returns (uint256)'
])
// `c10Verifier()`, the SPHINCS+ verifier, is on both the factory and the
// wallet. It is read from the factory, which is deployed even before the
// wallet is (first-deployment gas estimation).
const factoryAbi = parseAbi([
  'function c10Verifier() view returns (address)',
  'function getAddress(bytes32 masterPkSeed, bytes32 masterPkRoot) view returns (address)'
])

/** `executeWithOffchainCount`: run one call. */
export function encodeExecute(
  ownerIndex: bigint,
  newOffchainCount: bigint,
  target: Address,
  value: bigint,
  data: Hex
): Hex {
  return encodeFunctionData({
    abi: executeAbi,
    functionName: 'executeWithOffchainCount',
    args: [ownerIndex, newOffchainCount, target, value, data]
  })
}

/** `executeBatchWithOffchainCount`: run several calls in one transaction. */
export function encodeExecuteBatch(
  ownerIndex: bigint,
  newOffchainCount: bigint,
  targets: Address[],
  values: bigint[],
  datas: Hex[]
): Hex {
  if (targets.length !== values.length || targets.length !== datas.length) {
    throw new Error('executeBatch: target/value/data length mismatch')
  }
  return encodeFunctionData({
    abi: executeBatchAbi,
    functionName: 'executeBatchWithOffchainCount',
    args: [ownerIndex, newOffchainCount, targets, values, datas]
  })
}

/** EntryPoint `getNonce` for the default key. */
export function encodeGetNonce(sender: Address, key = 0n): Hex {
  return encodeFunctionData({
    abi: entryPointAbi,
    functionName: 'getNonce',
    args: [sender, key]
  })
}

/** The wallet's next unused owner index (see `accountState.ts`). */
export function encodeNextOwnerIndex(): Hex {
  return encodeFunctionData({ abi: walletAbi, functionName: 'nextOwnerIndex' })
}

/** The wallet's count of off-chain signatures by `ownerIndex`. */
export function encodeOffchainSigCount(ownerIndex: bigint): Hex {
  return encodeFunctionData({
    abi: walletAbi,
    functionName: 'offchainSigCount',
    args: [ownerIndex]
  })
}

/** The factory's SPHINCS+ verifier address. */
export function encodeC10Verifier(): Hex {
  return encodeFunctionData({ abi: factoryAbi, functionName: 'c10Verifier' })
}

/** Decode `c10Verifier()`'s result. */
export function decodeC10Verifier(result: Hex): Address {
  return decodeFunctionResult({ abi: factoryAbi, functionName: 'c10Verifier', data: result })
}

/** `PQSmartWalletFactory.getAddress` — the CREATE2 wallet address for a
 *  bootstrap keypair, as the on-chain factory computes it. */
export function encodeGetAddress(masterPkSeed: Hex, masterPkRoot: Hex): Hex {
  return encodeFunctionData({
    abi: factoryAbi,
    functionName: 'getAddress',
    args: [masterPkSeed, masterPkRoot]
  })
}

/** Decode `getAddress(...)`'s result. */
export function decodeGetAddress(result: Hex): Address {
  return decodeFunctionResult({ abi: factoryAbi, functionName: 'getAddress', data: result })
}
