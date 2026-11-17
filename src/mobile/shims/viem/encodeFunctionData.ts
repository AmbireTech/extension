/* eslint-disable @typescript-eslint/no-require-imports */
// Metro replaces viem's own `utils/abi/encodeFunctionData` module with this one
// (see metro.config.js). Same reasoning as the decodeFunctionResult shim next to
// this file: redirecting the module rather than the `viem` package entry is what
// reaches viem's internal callers too.

import type { encodeFunctionData as ViemEncodeFunctionData } from 'viem'

import { makeNativeEncodeFunctionData } from '@mobile/services/nativeAbi/nativeAbiDecode'

const { encodeFunctionData: viemEncodeFunctionData } =
  require('@viem-original/encodeFunctionData') as {
    encodeFunctionData: typeof ViemEncodeFunctionData
  }

export const encodeFunctionData = makeNativeEncodeFunctionData(
  viemEncodeFunctionData
) as typeof ViemEncodeFunctionData
