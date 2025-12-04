import {
  AbiCoder,
  Block,
  formatUnits,
  getAddress,
  isAddress,
  JsonRpcProvider,
  keccak256,
  TransactionReceipt,
  TransactionResponse,
  ZeroAddress
} from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { EIP7702Auth } from '@ambire-common/consts/7702'
import { AMBIRE_PAYMASTER, ERC_4337_ENTRYPOINT } from '@ambire-common/consts/deploy'
import { Fetch } from '@ambire-common/interfaces/fetch'
import { Network } from '@ambire-common/interfaces/network'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import {
  AccountOpIdentifiedBy,
  fetchFrontRanTxnId,
  fetchTxnId,
  SubmittedAccountOp
} from '@ambire-common/libs/accountOp/submittedAccountOp'
import { Call } from '@ambire-common/libs/accountOp/types'
import { decodeFeeCall } from '@ambire-common/libs/calls/calls'
import { humanizeAccountOp } from '@ambire-common/libs/humanizer'
import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { parseLogs } from '@ambire-common/libs/userOperation/userOperation'
import { resolveAssetInfo } from '@ambire-common/services/assetInfo'
import { BundlerSwitcher } from '@ambire-common/services/bundlers/bundlerSwitcher'
import { BundlerTransactionReceipt } from '@ambire-common/services/bundlers/types'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import {
  handleOps060,
  handleOps070
} from '@benzin/screens/BenzinScreen/constants/humanizerInterfaces'
import { ActiveStepType, FinalizedStatusType } from '@benzin/screens/BenzinScreen/interfaces/steps'
import { UserOperation } from '@benzin/screens/BenzinScreen/interfaces/userOperation'

import { decodeUserOp, entryPointTxnSplit, reproduceCallsFromTxn } from './utils/reproduceCalls'

const REFETCH_TIME = 3000 // 4 seconds
const REFETCH_TIME_ETHEREUM = 6000 // 4 seconds

export type FeePaidWith = {
  address: string
  amount: string
  symbol: string
  usdValue: string
  isErc20: boolean
  isSponsored: boolean
  chainId: bigint
}

interface Props {
  txnId: string | null
  userOpHash: string | null
  relayerId: string | null
  network: Network | null
  standardOptions: {
    fetch: Fetch
    callRelayer: any
  }
  setActiveStep: (step: ActiveStepType) => void
  provider: JsonRpcProvider | null
  extensionAccOp?: SubmittedAccountOp // only for in-app benzina
  networks: Network[]
  switcher: BundlerSwitcher | null
}

export interface StepsData {
  blockData: null | Block
  finalizedStatus: FinalizedStatusType
  feePaidWith: FeePaidWith | null
  calls: IrCall[] | null
  txnId: string | null
  from: string | null
  originatedFrom: string | null
  userOp: UserOperation | null
  delegation?: EIP7702Auth
}

// if the transaction hash is found, we make the top url the real txn id
// because user operation hashes are not reliable long term
const setUrlToTxnId = (
  transactionHash: string,
  userOpHash: string | null,
  relayerId: string | null,
  chainId: bigint,
  switcher: BundlerSwitcher
) => {
  const splitUrl = (window.location.href || '').split('?')
  const search = splitUrl[1]
  const searchParams = new URLSearchParams(search)
  const isInternal = typeof searchParams.get('isInternal') === 'string'

  const getIdentifiedBy = (): AccountOpIdentifiedBy => {
    if (relayerId) return { type: 'Relayer', identifier: relayerId }
    if (userOpHash)
      return {
        type: 'UserOperation',
        identifier: userOpHash,
        bundler: switcher.getBundler().getName()
      }
    return { type: 'Transaction', identifier: transactionHash }
  }

  window.history.pushState(
    null,
    '',
    `${splitUrl[0]}${getBenzinUrlParams({
      chainId,
      txnId: transactionHash,
      identifiedBy: getIdentifiedBy(),
      isInternal
    })}`
  )
}

const parseHumanizer = (humanizedCalls: IrCall[]): IrCall[] => {
  // remove deadlines from humanizer
  const finalParsedCalls = humanizedCalls.map((call) => {
    const localCall: IrCall = { ...call }
    localCall.fullVisualization = call.fullVisualization?.filter(
      (visual) => visual.type !== 'deadline' && !visual.isHidden
    )
    localCall.warnings = call.warnings?.filter((warn) => warn.content !== 'Unknown address')
    return localCall
  })
  return finalParsedCalls
}

/**
 * When enabling the entry point, hide the activator call from benzina
 * to reduce the panic caused to the user as this is an internal, routine call
 * we need to make, not one the user has requested
 */
const filterEntryPointAuthCall = (call: IrCall) =>
  !call.data.endsWith('0000000000000000000000000000000000000000000000000000000000007171')

const useSteps = ({
  txnId,
  userOpHash,
  relayerId,
  network,
  standardOptions,
  setActiveStep,
  provider,
  switcher,
  extensionAccOp,
  networks
}: Props): StepsData => {
  const [txn, setTxn] = useState<null | TransactionResponse>(null)
  const [txnReceipt, setTxnReceipt] = useState<{
    actualGasCost: null | bigint
    originatedFrom: null | string
    blockNumber: null | bigint
  }>({ actualGasCost: null, originatedFrom: null, blockNumber: null })
  const [blockData, setBlockData] = useState<null | Block>(null)
  const [finalizedStatus, setFinalizedStatus] = useState<FinalizedStatusType>({
    status: 'fetching'
  })
  const [refetchTxnIdCounter, setRefetchTxnIdCounter] = useState<number>(0)
  const [refetchTxnCounter, setRefetchTxnCounter] = useState<number>(0)
  const [refetchReceiptCounter, setRefetchReceiptCounter] = useState<number>(0)
  const [feePaidWith, setFeePaidWith] = useState<FeePaidWith | null>(null)
  const [userOp, setUserOp] = useState<null | UserOperation>(null)
  const [foundTxnId, setFoundTxnId] = useState<null | string>(txnId)
  const [hasCheckedFrontRun, setHasCheckedFrontRun] = useState<boolean>(false)
  const [calls, setCalls] = useState<IrCall[]>([])
  const [feeCall, setFeeCall] = useState<Call | null>(null)
  const [from, setFrom] = useState<null | string>(null)
  const [isFrontRan, setIsFrontRan] = useState<boolean>(false)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [shouldTryBlockFetch, setShouldTryBlockFetch] = useState<boolean>(true)

  const getIdentifiedBy = useCallback((): AccountOpIdentifiedBy => {
    if (relayerId) return { type: 'Relayer', identifier: relayerId }
    if (userOpHash)
      return {
        type: 'UserOperation',
        identifier: userOpHash,
        bundler: switcher ? switcher.getBundler().getName() : undefined
      }
    return { type: 'Transaction', identifier: txnId as string }
  }, [relayerId, userOpHash, switcher, txnId])

  const receiptAlreadyFetched = useMemo(() => !!txnReceipt.blockNumber, [txnReceipt.blockNumber])
  const fetchingConcluded = useMemo(
    () => finalizedStatus && finalizedStatus.status !== 'fetching',
    [finalizedStatus]
  )

  const refetchTime = useMemo(() => {
    if (!network) return REFETCH_TIME
    return network.chainId === 1n ? REFETCH_TIME_ETHEREUM : REFETCH_TIME
  }, [network])

  useEffect(() => {
    let timeout: any

    // do not use fetchTxnId when having an userOpHash
    // rely on getReceipt instead
    if (userOpHash) return

    if (!network || !relayerId || txn || fetchingConcluded || !switcher) return

    fetchTxnId(getIdentifiedBy(), network, standardOptions.callRelayer)
      .then((result) => {
        if (result.status === 'rejected') {
          setFinalizedStatus({
            status: 'rejected',
            reason: 'Bundler has rejected the user operation'
          })
          setActiveStep('finalized')
          return
        }

        if (result.status === 'not_found') {
          timeout = setTimeout(() => {
            setRefetchTxnIdCounter((prev) => prev + 1)
          }, refetchTime)
          return
        }

        const resultTxnId = result.txnId as string
        if (resultTxnId !== foundTxnId) {
          setFoundTxnId(resultTxnId)
          setActiveStep('in-progress')
          setUrlToTxnId(resultTxnId, userOpHash, relayerId, network.chainId, switcher)
        }

        // if there's no txn and receipt, keep searching
        if (!txn && !receiptAlreadyFetched) {
          timeout = setTimeout(() => {
            setRefetchTxnIdCounter((prev) => prev + 1)
          }, refetchTime)
        }
      })
      .catch((e) => e)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [
    network,
    standardOptions.fetch,
    standardOptions.callRelayer,
    txnId,
    setActiveStep,
    foundTxnId,
    relayerId,
    userOpHash,
    fetchingConcluded,
    txn,
    receiptAlreadyFetched,
    refetchTxnIdCounter,
    getIdentifiedBy,
    switcher,
    refetchTime
  ])

  // find the transaction
  useEffect(() => {
    let timeout: any

    if (txn || !foundTxnId || !provider || refetchTxnCounter > 10) return

    if (refetchTxnCounter === 10) {
      setRefetchTxnCounter((prev) => prev + 1)
      setFinalizedStatus({ status: 'not-found' })
      setActiveStep('finalized')
      return
    }

    provider
      .getTransaction(foundTxnId)
      .then((fetchedTxn: null | TransactionResponse) => {
        if (!fetchedTxn) {
          // start a refetch
          timeout = setTimeout(() => {
            setRefetchTxnCounter((prev) => prev + 1)
          }, refetchTime)
          return
        }

        setTxn(fetchedTxn)
        if (!finalizedStatus) {
          setFinalizedStatus({ status: 'fetching' })
          setActiveStep('in-progress')
        }
      })
      .catch(() => null)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [
    foundTxnId,
    txn,
    setActiveStep,
    provider,
    getIdentifiedBy,
    refetchTxnCounter,
    finalizedStatus,
    refetchTime
  ])

  // always query the bundler for the userOpReceipt
  useEffect(() => {
    let timeout: any
    if (!userOpHash || !provider || !network || !switcher || fetchingConcluded || isFetching) return

    if (refetchReceiptCounter >= 10) {
      setFinalizedStatus({ status: 'not-found' })
      setActiveStep('finalized')
      return
    }

    setIsFetching(true)
    const bundlerProvider = switcher.getBundler()
    bundlerProvider
      .getReceipt(userOpHash, network)
      .then((receipt: BundlerTransactionReceipt | null) => {
        if (!receipt) {
          timeout = setTimeout(() => {
            setRefetchReceiptCounter((prev) => prev + 1)
            setIsFetching(false)
          }, refetchTime)
          if (refetchReceiptCounter > 1) switcher.forceSwitch()
          return
        }

        if (!foundTxnId) {
          setFoundTxnId(receipt.receipt.transactionHash)
        }

        const opTxnReceipt = receipt.receipt
        const hasUserOpSucceeded = !!receipt.success
        const hasTxnFailedOrNoInfo =
          opTxnReceipt.status === undefined || BigInt(opTxnReceipt.status) === 0n
        if (!hasUserOpSucceeded && hasTxnFailedOrNoInfo && !hasCheckedFrontRun) {
          setIsFrontRan(true)
          return
        }

        setUrlToTxnId(
          receipt.receipt.transactionHash,
          userOpHash,
          relayerId,
          network.chainId,
          switcher
        )
        setTxnReceipt({
          originatedFrom: receipt.sender,
          actualGasCost: BigInt(receipt.actualGasUsed) * BigInt(receipt.actualGasCost),
          blockNumber: BigInt(receipt.receipt.blockNumber)
        })

        const userOpLog = parseLogs(receipt.logs, userOpHash, 1)
        if (userOpLog && !userOpLog.success) {
          setFinalizedStatus({
            status: 'failed',
            reason: 'Inner calls failed'
          })
        } else {
          setFinalizedStatus(receipt.success ? { status: 'confirmed' } : { status: 'failed' })
        }
        setActiveStep('finalized')
      })
      .catch(() => null)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [
    foundTxnId,
    network,
    provider,
    setActiveStep,
    relayerId,
    userOpHash,
    refetchReceiptCounter,
    hasCheckedFrontRun,
    switcher,
    isFetching,
    fetchingConcluded,
    refetchTime
  ])

  useEffect(() => {
    let timeout: any
    if (!!userOpHash || !foundTxnId || !provider || fetchingConcluded) return

    if (refetchReceiptCounter >= 10) {
      if (txn) {
        setFinalizedStatus({ status: 'dropped' })
        setActiveStep('finalized')
        return
      }

      setFinalizedStatus({ status: 'not-found' })
      setActiveStep('finalized')
      return
    }

    setIsFetching(true)
    provider
      .getTransactionReceipt(foundTxnId)
      .then((receipt: null | TransactionReceipt) => {
        if (!receipt) {
          // if there is a txn but no receipt, it means it is pending
          timeout = setTimeout(() => {
            setRefetchReceiptCounter((prev) => prev + 1)
            setIsFetching(false)
          }, refetchTime)
          return
        }

        setTxnReceipt({
          originatedFrom: receipt.from,
          actualGasCost: receipt.gasUsed * receipt.gasPrice,
          blockNumber: BigInt(receipt.blockNumber)
        })
        setFinalizedStatus(receipt.status ? { status: 'confirmed' } : { status: 'failed' })
        setActiveStep('finalized')
      })
      .catch(() => null)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [
    foundTxnId,
    provider,
    setActiveStep,
    userOpHash,
    refetchReceiptCounter,
    fetchingConcluded,
    txn,
    refetchTime
  ])

  // fix: front running
  useEffect(() => {
    if (!isFrontRan || !foundTxnId || !network || !switcher) return

    fetchFrontRanTxnId(getIdentifiedBy(), foundTxnId, network)
      .then((frontRanTxnId) => {
        setFoundTxnId(frontRanTxnId)
        setActiveStep('in-progress')
        setUrlToTxnId(frontRanTxnId, userOpHash, relayerId, network.chainId, switcher)
        setIsFrontRan(false)
        setHasCheckedFrontRun(true)
        setIsFetching(false)
      })
      .catch(() => null)
  }, [
    isFrontRan,
    getIdentifiedBy,
    foundTxnId,
    network,
    relayerId,
    userOpHash,
    setActiveStep,
    switcher
  ])

  // check for error reason
  useEffect(() => {
    if (
      !txn ||
      !txnReceipt ||
      (finalizedStatus && finalizedStatus.status !== 'failed') ||
      (finalizedStatus && finalizedStatus.reason) ||
      !provider
    )
      return

    provider
      .call({
        to: txn.to,
        from: txn.from,
        nonce: txn.nonce,
        gasLimit: txn.gasLimit,
        gasPrice: txn.gasPrice,
        data: txn.data,
        value: txn.value,
        chainId: txn.chainId,
        type: txn.type ?? undefined,
        accessList: txn.accessList
      })
      .then(() => null)
      .catch((error: Error) => {
        if (error.message.includes('missing revert data')) {
          setFinalizedStatus({
            status: 'failed',
            reason: 'Contract execution reverted'
          })
          return
        }

        setFinalizedStatus({
          status: 'failed',
          reason:
            error.message.length > 20
              ? `${error.message.substring(0, 25)}... (open explorer for further details)`
              : error.message
        })
      })
  }, [provider, txn, finalizedStatus, userOpHash, txnReceipt])

  // get block
  useEffect(() => {
    let timeout: any
    if (!txnReceipt.blockNumber || blockData !== null || !provider || !shouldTryBlockFetch) return

    setShouldTryBlockFetch(false)
    provider
      .getBlock(Number(txnReceipt.blockNumber))
      .then((fetchedBlockData) => {
        // we have to retry the req if the block data is not found initially
        if (!fetchedBlockData) {
          timeout = setTimeout(() => {
            setShouldTryBlockFetch(true)
          }, 1000)
          return
        }

        setBlockData(fetchedBlockData)
      })
      .catch(() => null)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [provider, txnReceipt, blockData, shouldTryBlockFetch])

  // if it's an user op,
  // we need to call the entry point to fetch the hashes
  // and find the matching hash
  // only after pass to reproduce calls
  useEffect(() => {
    if (!userOpHash || !network || !txn || userOp) return

    const sigHash = txn.data.slice(0, 10)
    const is060 = sigHash === handleOps060.getFunction('handleOps')!.selector
    let handleOpsData = null
    try {
      handleOpsData = is060
        ? handleOps060.decodeFunctionData('handleOps', txn.data)
        : handleOps070.decodeFunctionData('handleOps', txn.data)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('this txn is an userOp but does not call handleOps')
      setUserOp({
        sender: '',
        callData: '',
        hashStatus: 'not_found'
      })
    }

    if (!handleOpsData) return

    const userOperations = handleOpsData[0]
    const abiCoder = new AbiCoder()

    let hashFound = false
    userOperations.forEach((opArray: any) => {
      const sender = opArray[0]
      const nonce = opArray[1]
      const hashInitCode = keccak256(opArray[2])
      const hashCallData = keccak256(opArray[3])

      let hash
      let paymasterAndData
      if (!is060) {
        const accountGasLimits = opArray[4]
        const preVerificationGas = opArray[5]
        const gasFees = opArray[6]
        paymasterAndData = opArray[7]
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
        hash = keccak256(packed)
      } else {
        const callGasLimit = opArray[4]
        const verificationGasLimit = opArray[5]
        const preVerificationGas = opArray[6]
        const maxFeePerGas = opArray[7]
        const maxPriorityFeePerGas = opArray[8]
        paymasterAndData = opArray[9]
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

        hash = keccak256(packed)
      }
      const finalHash = keccak256(
        abiCoder.encode(
          ['bytes32', 'address', 'uint256'],
          [
            hash,
            is060 ? '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' : ERC_4337_ENTRYPOINT,
            network.chainId
          ]
        )
      )
      const paymaster = isAddress(paymasterAndData.slice(0, 42))
        ? getAddress(paymasterAndData.slice(0, 42))
        : ''

      if (finalHash.toLowerCase() === userOpHash.toLowerCase()) {
        hashFound = true
        setUserOp({
          sender,
          callData: opArray[3],
          hashStatus: 'found',
          paymaster
        })
      }
    })
    if (!hashFound) {
      setUserOp({
        sender: '',
        callData: '',
        hashStatus: 'not_found'
      })
    }
  }, [network, txn, userOpHash, userOp])

  // update the gas feePaidWith
  useEffect(() => {
    if (feePaidWith || !network) return

    let isMounted = true
    let address: string | undefined
    let amount = 0n
    let isGasTank = false
    let tokenChainId = network.chainId

    // Smart account
    // Decode the fee call and get the token address and amount
    // that was used to cover the gas feePaidWith
    if (feeCall) {
      try {
        const {
          address: addr,
          amount: tokenAmount,
          isGasTank: isTokenGasTank,
          chainId
        } = decodeFeeCall(feeCall, network)

        address = addr
        amount = tokenAmount
        isGasTank = isTokenGasTank
        tokenChainId = chainId
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error decoding fee call', e)
      }
    }

    // If the feeCall humanization failed or there isn't a feeCall
    // we should use the gas feePaidWith from the transaction receipt
    if (!address && txnReceipt.actualGasCost) {
      amount = txnReceipt.actualGasCost
      address = ZeroAddress
    }

    const isSponsored =
      (amount === 0n && isGasTank) ||
      (!!userOp && !!userOp.paymaster && userOp.paymaster !== AMBIRE_PAYMASTER)
    if (!address || (!amount && !isSponsored)) return

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    resolveAssetInfo(
      address,
      networks.find((net: Network) => net.chainId === tokenChainId)!,
      ({ tokenInfo }) => {
        if (!tokenInfo || (!amount && !isSponsored)) return
        const { decimals, priceIn } = tokenInfo
        const price = priceIn.length && priceIn[0] ? priceIn[0].price : null

        const fee = parseFloat(formatUnits(amount, decimals))

        if (!isMounted) return

        setFeePaidWith({
          amount: formatDecimals(fee),
          symbol: tokenInfo.symbol,
          usdValue: price ? formatDecimals(fee * price, 'value') : '-$',
          isErc20: address !== ZeroAddress,
          address: address as string,
          isSponsored,
          chainId: tokenChainId
        })
      }
    ).catch(() => {
      if (!isMounted) return
      setFeePaidWith({
        amount: address === ZeroAddress ? formatDecimals(parseFloat(formatUnits(amount, 18))) : '-',
        symbol: address === ZeroAddress ? network.nativeAssetSymbol : '',
        usdValue: '-$',
        isErc20: false,
        address: address as string,
        isSponsored,
        chainId: network.chainId
      })
    })

    return () => {
      isMounted = false
    }
  }, [txnReceipt.actualGasCost, feePaidWith, feeCall, network, userOp, networks])

  useEffect(() => {
    if (!network) return

    // if we have the extension account op passed, we do not need to
    // wait to show the calls
    if (extensionAccOp) {
      const humanizedCalls = humanizeAccountOp(extensionAccOp).filter(filterEntryPointAuthCall)
      setCalls(parseHumanizer(humanizedCalls))
      setFrom(extensionAccOp.accountAddr)
      if (extensionAccOp.feeCall) setFeeCall(extensionAccOp.feeCall)
      return
    }

    if (userOpHash && userOp?.hashStatus !== 'found') return
    if (
      userOp?.hashStatus !== 'found' &&
      txn &&
      txnId &&
      entryPointTxnSplit[txn.data.slice(0, 10)]
    ) {
      // typescript fixes
      const getCalls = entryPointTxnSplit[txn.data.slice(0, 10)]
      if (getCalls) setCalls(getCalls(txn, network, txnId))
      return
    }

    if (txn) {
      const {
        calls: decodedCalls,
        from: account,
        feeCall: decodedFeeCall
      } = userOp ? decodeUserOp(userOp) : reproduceCallsFromTxn(txn)
      const accountOp: AccountOp = {
        accountAddr: userOp?.sender || account || txnReceipt.originatedFrom || 'Loading...',
        chainId: network.chainId,
        signingKeyAddr: txnReceipt.originatedFrom, // irrelevant
        signingKeyType: 'internal', // irrelevant
        nonce: BigInt(0), // irrelevant
        calls: decodedCalls,
        gasLimit: Number(txn.gasLimit),
        signature: '0x', // irrelevant
        gasFeePayment: null
      }
      const humanizedCalls = humanizeAccountOp(accountOp).filter(filterEntryPointAuthCall)
      setCalls(parseHumanizer(humanizedCalls))
      setFrom(accountOp.accountAddr)
      if (decodedFeeCall) {
        setFeeCall(decodedFeeCall)
      }
    }
  }, [network, txnReceipt, txn, userOpHash, userOp, txnId, extensionAccOp])

  return {
    blockData,
    finalizedStatus,
    feePaidWith,
    calls: calls || null,
    txnId: foundTxnId,
    from: from || null,
    originatedFrom: txnReceipt.originatedFrom,
    userOp,
    delegation:
      extensionAccOp && extensionAccOp.meta && extensionAccOp.meta.setDelegation !== undefined
        ? extensionAccOp.meta.delegation
        : undefined
  }
}

export default useSteps
