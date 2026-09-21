/* eslint-disable @typescript-eslint/no-require-imports */
// Metro replaces viem's own `utils/abi/decodeFunctionResult` module with this one
// (see metro.config.js), so the Rust-backed decode is what every caller gets —
// including viem's internals, which import that module by relative path and would
// keep the pure-JS version if only the `viem` package entry were redirected.
//
// The implementation this replaces is reached through the `@viem-original/*`
// specifier that metro.config.js maps back to the real file, which is what keeps
// the fallback path from resolving to this shim again.

import type { decodeFunctionResult as ViemDecodeFunctionResult } from 'viem'

import { makeNativeDecodeFunctionResult } from '@mobile/services/nativeAbi/nativeAbiDecode'

const { decodeFunctionResult: viemDecodeFunctionResult } =
  require('@viem-original/decodeFunctionResult') as {
    decodeFunctionResult: typeof ViemDecodeFunctionResult
  }

export const decodeFunctionResult = makeNativeDecodeFunctionResult(
  viemDecodeFunctionResult
) as typeof ViemDecodeFunctionResult
