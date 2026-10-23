// The ERC-20 methods the device shows as token transfers and approvals. One
// list, so every lookup agrees on which calls carry token metadata.

import { selectorMatches } from '../transport/bytes'

/** `transfer(address,uint256)` */
export const ERC20_TRANSFER_SELECTOR = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
/** `transferFrom(address,address,uint256)` */
export const ERC20_TRANSFER_FROM_SELECTOR = new Uint8Array([0x23, 0xb8, 0x72, 0xdd])
/** `approve(address,uint256)` */
export const ERC20_APPROVE_SELECTOR = new Uint8Array([0x09, 0x5e, 0xa7, 0xb3])

const ERC20_METHOD_SELECTORS: readonly Uint8Array[] = [
  ERC20_TRANSFER_SELECTOR,
  ERC20_TRANSFER_FROM_SELECTOR,
  ERC20_APPROVE_SELECTOR
]

/** Is `data` a call to one of those methods? */
export function isErc20MethodCall(data: Uint8Array): boolean {
  return ERC20_METHOD_SELECTORS.some((sel) => selectorMatches(data, sel))
}
