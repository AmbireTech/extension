import {
  AbiCoder,
  getAddress,
  isAddress,
  keccak256,
  TransactionResponse,
  ZeroAddress
} from 'ethers'

import {
  RELAYER_EXECUTOR_ADDRESSES,
  STAGING_RELAYER_EXECUTOR_ADDRESSES
} from '@ambire-common/consts/addresses'
import { AMBIRE_PAYMASTER, ERC_4337_ENTRYPOINT } from '@ambire-common/consts/deploy'
import { Network } from '@ambire-common/interfaces/network'
import { Call } from '@ambire-common/libs/accountOp/types'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { getAddressVisualization, getLabel, getLink } from '@ambire-common/libs/humanizer/utils'
import {
  deployAndCallInterface,
  deployAndExecuteInterface,
  deployAndExecuteMultipleInterface,
  executeBatchInterface,
  executeBySenderInterface,
  executeCallInterface,
  executeInterface,
  executeMultipleInterface,
  executeUnknownWalletInterface,
  handleOps060,
  handleOps070,
  quickAccManagerCancelInterface,
  quickAccManagerExecScheduledInterface,
  quickAccManagerSendInterface
} from '@benzin/screens/BenzinScreen/constants/humanizerInterfaces'
import { UserOperation } from '@benzin/screens/BenzinScreen/interfaces/userOperation'

export const userOpSigHashes = {
  executeBySender: executeBySenderInterface.getFunction('executeBySender')!.selector,
  execute: executeInterface.getFunction('execute')!.selector,
  executeMultiple: executeMultipleInterface.getFunction('executeMultiple')!.selector,
  executeCall: executeCallInterface.getFunction('execute')!.selector,
  executeBatch: executeBatchInterface.getFunction('executeBatch')!.selector,
  executeUnknownWalletInterface: executeUnknownWalletInterface.getFunction('execute')!.selector,
  unknownWalletExecuteBatch: executeUnknownWalletInterface.getFunction('executeBatch')!.selector
}

const transformToAccOpCall = (call: any) => ({ to: call[0], value: BigInt(call[1]), data: call[2] })

const getExecuteCalls = (callData: string) => {
  const data = executeInterface.decodeFunctionData('execute', callData)
  return data[0].map((call: any) => transformToAccOpCall(call))
}

const getExecuteBySenderCalls = (callData: string) => {
  const data = executeBySenderInterface.decodeFunctionData('executeBySender', callData)
  return data[0].map((call: any) => transformToAccOpCall(call))
}

const getExecuteMultipleCalls = (callData: string) => {
  const data = executeMultipleInterface.decodeFunctionData('executeMultiple', callData)
  const calls = data[0].map((executeArgs: any) => executeArgs[0]).flat()
  return calls.map((call: any) => transformToAccOpCall(call))
}

const getExecuteCallCalls = (callData: string) => {
  const data = executeCallInterface.decodeFunctionData('execute', callData)
  return [transformToAccOpCall(data)]
}

const getExecuteUnknownWalletCalls = (callData: string) => {
  const data = executeUnknownWalletInterface.decodeFunctionData('execute', callData)
  return [transformToAccOpCall(data)]
}

const getExecuteBatchCalls = (callData: string) => {
  const batch = executeBatchInterface.decodeFunctionData('executeBatch', callData)
  const calls = []
  for (let i = 0; i < batch[0].length; i++) {
    const to = batch[0][i]
    const data = batch[1][i]
    calls.push(transformToAccOpCall([to, 0n, data]))
  }
  return calls
}

const getUnknownWalletExecuteBatch = (callData: string) => {
  const [rawCalls] = executeUnknownWalletInterface.decodeFunctionData('executeBatch', callData)
  return rawCalls.map(transformToAccOpCall)
}

export const decodeUserOp = (
  userOp: UserOperation
): { calls: Call[]; feeCall: Call | null; from: string } => {
  const { callData, paymaster, sender } = userOp

  const callDataSigHash = callData.slice(0, 10)
  const matcher = {
    [userOpSigHashes.executeBySender]: getExecuteBySenderCalls,
    [userOpSigHashes.execute]: getExecuteCalls,
    [userOpSigHashes.executeMultiple]: getExecuteMultipleCalls,
    [userOpSigHashes.executeCall]: getExecuteCallCalls,
    [userOpSigHashes.executeUnknownWalletInterface]: getExecuteUnknownWalletCalls,
    [userOpSigHashes.executeBatch]: getExecuteBatchCalls,
    [userOpSigHashes.unknownWalletExecuteBatch]: getUnknownWalletExecuteBatch
  }
  let feeCall: Call | null = null
  let decodedCalls = [{ to: userOp.sender, data: userOp.callData, value: 0n }]
  if (matcher[callDataSigHash]) decodedCalls = matcher[callDataSigHash](callData)

  if (isAddress(paymaster) && getAddress(paymaster) === AMBIRE_PAYMASTER) {
    feeCall = decodedCalls.pop() ?? null
  }

  return { calls: decodedCalls, from: sender, feeCall }
}

export const reproduceCallsFromTxn = (txn: TransactionResponse) => {
  const non4337Matcher: {
    [sigHash: string]: (data: string) => { to: string; data: string; value: bigint }[]
  } = {
    [executeInterface.getFunction('execute')!.selector]: getExecuteCalls,
    [executeBySenderInterface.getFunction('executeBySender')!.selector]: getExecuteBySenderCalls,
    [executeMultipleInterface.getFunction('executeMultiple')!.selector]: getExecuteMultipleCalls,
    [deployAndExecuteInterface.getFunction('deployAndExecute')!.selector]: (txData: string) => {
      const data = deployAndExecuteInterface.decodeFunctionData('deployAndExecute', txData)
      return data[2].map((call: any) => transformToAccOpCall(call))
    },
    [deployAndExecuteMultipleInterface.getFunction('deployAndExecuteMultiple')!.selector]: (
      txData: string
    ) => {
      const data = deployAndExecuteMultipleInterface.decodeFunctionData(
        'deployAndExecuteMultiple',
        txData
      )
      const calls: any = data[2].map((executeArgs: any) => executeArgs[0]).flat()
      return calls.map((call: any) => transformToAccOpCall(call))
    },
    // v1
    [deployAndCallInterface.getFunction('deployAndCall')!.selector]: (txData: string) => {
      const data = deployAndCallInterface.decodeFunctionData('deployAndCall', txData)
      return non4337Matcher[data[3].slice(0, 10)](data[3])
    },
    // v1
    [quickAccManagerSendInterface.getFunction('send')!.selector]: (txData: string) => {
      const data = quickAccManagerSendInterface.decodeFunctionData('send', txData)
      return data[3].map((call: any) => transformToAccOpCall(call))
    },
    // v1
    [quickAccManagerCancelInterface.getFunction('cancel')!.selector]: (txData: string) => {
      const data = quickAccManagerCancelInterface.decodeFunctionData('cancel', txData)
      return data[4].map((call: any) => transformToAccOpCall(call))
    },
    // v1
    [quickAccManagerExecScheduledInterface.getFunction('execScheduled')!.selector]: (
      txData: string
    ) => {
      const data = quickAccManagerExecScheduledInterface.decodeFunctionData('execScheduled', txData)
      return data[3].map((call: any) => transformToAccOpCall(call))
    },
    // @non-ambire executeBatch
    [executeBatchInterface.getFunction('executeBatch')!.selector]: getExecuteBatchCalls
  }

  const sigHash = txn.data.slice(0, 10)
  let calls = [transformToAccOpCall([txn.to ? txn.to : ZeroAddress, txn.value, txn.data])]
  let from

  let feeCall: Call | null = null
  if (non4337Matcher[sigHash]) {
    calls = non4337Matcher[sigHash](txn.data)
    if (txn.to) from = txn.to
    if ([...RELAYER_EXECUTOR_ADDRESSES, ...STAGING_RELAYER_EXECUTOR_ADDRESSES].includes(txn.from)) {
      feeCall = calls.pop() ?? null
    }
  }

  return { calls, from, feeCall }
}

export const entryPointTxnSplit: {
  [sigHash: string]: (txn: TransactionResponse, network: Network, txId: string) => IrCall[]
} = {
  [handleOps070.getFunction('handleOps')!.selector]: (
    txn: TransactionResponse,
    network: Network,
    txId: string
  ) => {
    const [ops] = handleOps070.decodeFunctionData('handleOps', txn.data)
    const abiCoder = new AbiCoder()

    return ops.map((opArray: any): IrCall => {
      const sender = opArray[0]
      const nonce = opArray[1]
      const hashInitCode = keccak256(opArray[2])
      const hashCallData = keccak256(opArray[3])

      const accountGasLimits = opArray[4]
      const preVerificationGas = opArray[5]
      const gasFees = opArray[6]
      const paymasterAndData = opArray[7]
      const hashPaymasterAndData = keccak256(paymasterAndData)

      const packed = abiCoder.encode(
        ['address', 'uint256', 'bytes32', 'bytes32', 'bytes32', 'uint256', 'bytes32', 'bytes32'],
        [
          sender,
          nonce,
          hashInitCode,
          hashCallData,
          accountGasLimits,
          preVerificationGas,
          gasFees,
          hashPaymasterAndData
        ]
      )
      const hash = keccak256(packed)

      const finalHash = keccak256(
        abiCoder.encode(
          ['bytes32', 'address', 'uint256'],
          [hash, ERC_4337_ENTRYPOINT, network.chainId]
        )
      )

      const url: string = `https://explorer.ambire.com/?chainId=${network.chainId}&txnId=${txId}&userOpHash=${finalHash}`
      return {
        to: sender,
        data: '0x',
        value: 0n,
        fullVisualization: [
          getLink(url, '4337 operation'),
          getLabel('from'),
          getAddressVisualization(sender)
        ]
      }
    })
  },

  [handleOps060.getFunction('handleOps')!.selector]: (
    txn: TransactionResponse,
    network: Network,
    txId: string
  ) => {
    const [ops] = handleOps060.decodeFunctionData('handleOps', txn.data)
    const abiCoder = new AbiCoder()

    return ops.map((opArray: any): IrCall => {
      const sender = opArray[0]
      const nonce = opArray[1]
      const hashInitCode = keccak256(opArray[2])
      const hashCallData = keccak256(opArray[3])

      const callGasLimit = opArray[4]
      const verificationGasLimit = opArray[5]
      const preVerificationGas = opArray[6]
      const maxFeePerGas = opArray[7]
      const maxPriorityFeePerGas = opArray[8]
      const paymasterAndData = opArray[9]
      const hashPaymasterAndData = keccak256(paymasterAndData)

      const packed = abiCoder.encode(
        [
          'address',
          'uint256',
          'bytes32',
          'bytes32',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'bytes32'
        ],
        [
          sender,
          nonce,
          hashInitCode,
          hashCallData,
          callGasLimit,
          verificationGasLimit,
          preVerificationGas,
          maxFeePerGas,
          maxPriorityFeePerGas,
          hashPaymasterAndData
        ]
      )

      const hash = keccak256(packed)

      const finalHash = keccak256(
        abiCoder.encode(
          ['bytes32', 'address', 'uint256'],
          [hash, '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', network.chainId]
        )
      )

      const url: string = `https://explorer.ambire.com/?chainId=${network.chainId}&txnId=${txId}&userOpHash=${finalHash}`
      return {
        to: sender,
        data: '0x',
        value: 0n,
        fullVisualization: [
          getLink(url, '4337 operation'),
          getLabel('from'),
          getAddressVisualization(sender)
        ]
      }
    })
  }
}
