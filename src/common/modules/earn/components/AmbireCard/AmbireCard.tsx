/* eslint-disable no-nested-ternary */
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import WalletStakingPoolABI from 'ambire-common/src/constants/abis/WalletStakingPoolABI.json'
import walletABI from 'ambire-common/src/constants/abis/walletTokenABI.json'
import AdexStakingPool from 'ambire-common/src/constants/AdexStakingPool.json'
import supplyControllerABI from 'ambire-common/src/constants/ADXSupplyController.json'
import networks, { NetworkId } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import { BigNumber, constants, Contract, utils } from 'ethers'
import { formatUnits, Interface, parseUnits } from 'ethers/lib/utils'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import isEqual from 'react-fast-compare'

import AmbireLogo from '@common/assets/images/Ambire.png'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useRewards from '@common/hooks/useRewards'
import Card from '@common/modules/earn/components/Card'
import { CARDS } from '@common/modules/earn/contexts/cardsVisibilityContext'
import { getTokenIcon } from '@common/services/icons'
import { rpcProviders } from '@common/services/providers'
import spacings from '@common/styles/spacings'

const ADX_TOKEN_ADDRESS = '0xade00c28244d5ce17d72e40330b1c318cd12b7c3'
const ADX_STAKING_TOKEN_ADDRESS = '0xb6456b57f03352be48bf101b46c1752a0813491a'
const ADX_STAKING_POOL_INTERFACE = new Interface(AdexStakingPool)
const ADDR_ADX_SUPPLY_CONTROLLER = '0x9B370599B2bf61806DDca1379257F26377472BEe'

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'

// polygon tests
// const WALLET_TOKEN_ADDRESS = '0xe9415e904143e42007865e6864f7f632bd054a08'
// const WALLET_STAKING_ADDRESS = '0xec3b10ce9cabab5dbf49f946a623e294963fbb4e'

const WALLET_STAKING_POOL_INTERFACE = new Interface(WalletStakingPoolABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)
const ZERO = BigNumber.from(0)

const secondsInYear = 60 * 60 * 24 * 365
// For some reason RN doesn't accept: 1_000_000_000_000 or '1_000_000_000_000'
// setting precision as number works just fine
const PRECISION = 1000000000000

const WALLET_LOCK_PERIOD_IN_DAYS = 30
const ADEX_LOCK_PERIOD_IN_DAYS = 20

const msToDaysHours = (ms: any) => {
  const day = 24 * 60 * 60 * 1000
  const days = Math.floor(ms / day)
  const hours = Math.floor((ms % day) / (60 * 60 * 1000))
  return days < 1 ? `${hours} hours` : `${days} days`
}

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  networkId?: NetworkId
  selectedAcc: UseAccountsReturnType['selectedAcc']
  addRequest: (req: any) => any
}

const attachMetaIfNeeded = (req: any, shareValue: any, rewards: any, leaveLog = null) => {
  let meta
  const shouldAttachMeta = [WALLET_TOKEN_ADDRESS, WALLET_STAKING_ADDRESS].includes(
    req.txn.to.toLowerCase()
  )
  if (shouldAttachMeta) {
    const { walletUsdPrice: walletTokenUsdPrice, xWALLETAPY: APY } = rewards
    let walletValue = null
    if (leaveLog && leaveLog.walletValue) walletValue = leaveLog.walletValue
    meta = { xWallet: { APY, shareValue, walletTokenUsdPrice, walletValue } }
  }
  return !meta ? req : { ...req, meta: { ...(req.meta && req.meta), ...meta } }
}

const AmbireCard = ({ tokens, networkId, selectedAcc, addRequest }: Props) => {
  const [isLoading, setLoading] = useState<any>(true)
  const [details, setDetails] = useState<any>([])
  const [customInfo, setCustomInfo] = useState<any>(null)
  const [stakingTokenContract, setStakingTokenContract] = useState<any>(null)
  const [shareValue, setShareValue] = useState<any>(ZERO)
  const [stakingTokenBalanceRaw, SetStakingTokenBalanceRaw] = useState<any>(null)
  const [leaveLog, setLeaveLog] = useState<any>(null)
  const [lockedRemainingTime, setLockedRemainingTime] = useState<any>(0)
  const [addresses, setAddresses] = useState<any>({
    tokenAddress: '',
    stakingTokenAddress: '',
    stakingPoolInterface: '',
    stakingPoolAbi: '',
    tokenAbi: ''
  })
  const [selectedToken, setSelectedToken] = useState<any>({ label: '' })
  const [adxCurrentAPY, setAdxCurrentAPY] = useState<any>(null)

  const unavailable = networkId !== 'ethereum'

  const networkDetails: any = networks.find(({ id }) => id === networkId)

  const { isLoading: isLoadingRewards, rewards } = useRewards()

  const addRequestTxn = useCallback(
    (id, txn, extraGas = 0) => {
      const request = attachMetaIfNeeded(
        {
          id,
          dateAdded: new Date().valueOf(),
          type: 'eth_sendTransaction',
          chainId: networkDetails.chainId,
          account: selectedAcc,
          txn,
          extraGas
        },
        shareValue,
        rewards,
        leaveLog
      )
      addRequest(request)
    },
    [networkDetails.chainId, rewards, shareValue, leaveLog, selectedAcc, addRequest]
  )

  const balanceRaw = useMemo(
    () =>
      stakingTokenBalanceRaw
        ? BigNumber.from(stakingTokenBalanceRaw)
            .mul(shareValue)
            .div(BigNumber.from((1e18).toString()))
            .toString()
        : 0,
    [stakingTokenBalanceRaw, shareValue]
  )

  const walletToken = useMemo(
    () => tokens.find(({ address }: any) => address === WALLET_TOKEN_ADDRESS),
    [tokens]
  )
  const xWalletToken = useMemo(
    () => tokens.find(({ address }: any) => address === WALLET_STAKING_ADDRESS),
    [tokens]
  )
  const adexToken = useMemo(
    () => tokens.find(({ address }: any) => address === ADX_TOKEN_ADDRESS),
    [tokens]
  )
  const adexStakingToken = useMemo(
    () => tokens.find(({ address }: any) => address === ADX_STAKING_TOKEN_ADDRESS),
    [tokens]
  )

  const depositTokenItems = useMemo(
    () => [
      {
        type: 'deposit',
        icon: getTokenIcon(networkId, WALLET_TOKEN_ADDRESS),
        label: 'WALLET',
        value: WALLET_TOKEN_ADDRESS,
        symbol: 'WALLET',
        balance:
          walletToken?.balanceRaw && walletToken?.decimals
            ? formatUnits(walletToken?.balanceRaw, walletToken?.decimals)
            : 0,
        balanceRaw: walletToken?.balanceRaw || 0
      },
      {
        type: 'deposit',
        icon: getTokenIcon(networkId, ADX_TOKEN_ADDRESS),
        label: 'ADX',
        value: ADX_TOKEN_ADDRESS,
        symbol: 'ADX',
        balance:
          adexToken?.balanceRaw && adexToken?.decimals
            ? formatUnits(adexToken?.balanceRaw, adexToken?.decimals)
            : 0,
        balanceRaw: adexToken?.balanceRaw || 0
      }
    ],
    [
      adexToken?.balanceRaw,
      adexToken?.decimals,
      networkId,
      walletToken?.balanceRaw,
      walletToken?.decimals
    ]
  )

  const withdrawTokenItems = useMemo(
    () => [
      {
        type: 'withdraw',
        icon: getTokenIcon(networkId, WALLET_TOKEN_ADDRESS),
        label: 'WALLET',
        value: WALLET_STAKING_ADDRESS,
        symbol: 'WALLET',
        balance: formatUnits(balanceRaw, xWalletToken?.decimals),
        balanceRaw
      },
      {
        type: 'withdraw',
        icon: getTokenIcon(networkId, ADX_TOKEN_ADDRESS),
        label: 'ADX',
        value: ADX_STAKING_TOKEN_ADDRESS,
        symbol: 'ADX',
        balance: formatUnits(balanceRaw, adexStakingToken?.decimals),
        balanceRaw
      }
    ],
    [adexStakingToken?.decimals, balanceRaw, networkId, xWalletToken?.decimals]
  )

  const tokensItems = useMemo(
    () => [
      ...depositTokenItems.sort((x, y) =>
        // eslint-disable-next-line no-nested-ternary
        x.value === addresses.tokenAddress ? -1 : y.value === addresses.tokenAddress ? 1 : 0
      ),
      ...withdrawTokenItems.sort((x, y) =>
        // eslint-disable-next-line no-nested-ternary
        x.value === addresses.stakingTokenAddress
          ? -1
          : y.value === addresses.stakingTokenAddress
          ? 1
          : 0
      )
    ],
    [addresses.stakingTokenAddress, addresses.tokenAddress, depositTokenItems, withdrawTokenItems]
  )

  const onWithdraw = useCallback(() => {
    const { shares, unlocksAt }: any = leaveLog
    addRequestTxn(`withdraw_staking_pool_${Date.now()}`, {
      to: addresses.stakingTokenAddress,
      value: '0x0',
      data: addresses.stakingPoolInterface.encodeFunctionData('withdraw', [
        shares.toHexString(),
        unlocksAt.toHexString(),
        false
      ])
    })
  }, [leaveLog, addRequestTxn])

  const lockDays = useMemo(() => {
    if (selectedToken.label === 'WALLET') return WALLET_LOCK_PERIOD_IN_DAYS
    return ADEX_LOCK_PERIOD_IN_DAYS
  }, [selectedToken.label])

  const onTokenSelect = useCallback(
    (tokenAddress) => {
      setCustomInfo(null)

      const token = tokensItems.find(({ value }) => value === tokenAddress)

      setSelectedToken({ label: token?.label })
      if (token && token.type === 'withdraw' && leaveLog && parseFloat(leaveLog.walletValue) > 0) {
        setCustomInfo(
          <>
            <Text weight="medium" style={spacings.mbSm}>
              {msToDaysHours(lockedRemainingTime)}
              <Text weight="medium">{' until '}</Text>
              <Text weight="medium">
                {parseFloat(leaveLog.walletValue).toFixed(4)} {selectedToken.label}
              </Text>
              <Text weight="medium">{' becomes available for withdraw.'}</Text>
            </Text>
            <Text
              style={spacings.mbSm}
            >{`* Because of funds that are pending withdrawal, you are not able to unstake more ${selectedToken.label} tokens until the unbond period is over.`}</Text>

            <Button
              type="outline"
              disabled={lockedRemainingTime > 0}
              onPress={() => onWithdraw()}
              text="Withdraw"
            />
          </>
        )
      }
      setDetails([
        [
          'APY',
          selectedToken.label === 'ADX'
            ? adxCurrentAPY
              ? `${adxCurrentAPY.toFixed(2)}%`
              : '...'
            : isLoadingRewards
            ? '...'
            : rewards?.xWALLETAPYPercentage
        ],
        ['Lock', `${lockDays} day unbond period`],
        ['Type', 'Variable Rate']
      ])
    },
    [
      adxCurrentAPY,
      leaveLog,
      lockedRemainingTime,
      onWithdraw,
      isLoadingRewards,
      selectedToken.label,
      tokensItems,
      lockDays,
      rewards?.xWALLETAPYPercentage
    ]
  )

  const onValidate = async (type: any, tokenAddress: any, amount: any, isMaxAmount: any) => {
    const bigNumberAmount = parseUnits(amount, 18)

    if (type === 'Deposit') {
      const allowance = await stakingTokenContract.allowance(
        selectedAcc,
        addresses.stakingTokenAddress
      )

      if (allowance.lt(constants.MaxUint256)) {
        addRequestTxn(`approve_staking_pool_${Date.now()}`, {
          to: addresses.tokenAddress,
          value: '0x0',
          data: ERC20_INTERFACE.encodeFunctionData('approve', [
            addresses.stakingTokenAddress,
            constants.MaxUint256
          ])
        })
      }

      addRequestTxn(`enter_staking_pool_${Date.now()}`, {
        to: addresses.stakingTokenAddress,
        value: '0x0',
        data: addresses.stakingPoolInterface.encodeFunctionData('enter', [
          bigNumberAmount.toHexString()
        ])
      })
    }

    if (type === 'Withdraw') {
      let xWalletAmount
      // In case of withdrawing the max amount of xWallet tokens, get the latest balance of xWallet.
      // Otherwise, `stakingTokenBalanceRaw` may be outdated.
      if (isMaxAmount) {
        xWalletAmount = await stakingTokenContract.balanceOf(selectedAcc)
      } else {
        xWalletAmount = bigNumberAmount.mul(BigNumber.from((1e18).toString())).div(shareValue)
      }

      addRequestTxn(`leave_staking_pool_${Date.now()}`, {
        to: addresses.stakingTokenAddress,
        value: '0x0',
        data: addresses.stakingPoolInterface.encodeFunctionData('leave', [
          xWalletAmount.toHexString(),
          false
        ])
      })
    }
  }

  useEffect(() => {
    async function init() {
      try {
        // Prevent init if the card is unavailable for current network
        if (networkId !== 'ethereum') return

        const provider = rpcProviders['ethereum-ambire-earn']

        const tokenAddress =
          selectedToken.label === 'ADX' ? ADX_TOKEN_ADDRESS : WALLET_TOKEN_ADDRESS
        const stakingTokenAddress =
          selectedToken.label === 'ADX' ? ADX_STAKING_TOKEN_ADDRESS : WALLET_STAKING_ADDRESS
        const stakingPoolInterface =
          selectedToken.label === 'ADX' ? ADX_STAKING_POOL_INTERFACE : WALLET_STAKING_POOL_INTERFACE
        const stakingPoolAbi =
          selectedToken.label === 'ADX' ? AdexStakingPool : WalletStakingPoolABI
        const tokenAbi = selectedToken.label === 'ADX' ? ERC20ABI : walletABI
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const stakingTokenContract = new Contract(
          stakingTokenAddress,
          stakingPoolInterface,
          provider
        )
        const tokenContract = new Contract(tokenAddress, tokenAbi, provider)
        const supplyController = new Contract(
          ADDR_ADX_SUPPLY_CONTROLLER,
          supplyControllerABI,
          provider
        )
        setStakingTokenContract(stakingTokenContract)

        setAddresses({
          tokenAddress,
          stakingTokenAddress,
          stakingPoolInterface,
          stakingPoolAbi,
          tokenAbi
        })

        const [timeToUnbond, shareValue, sharesTotalSupply, stakingTokenBalanceRaw] =
          await Promise.all([
            stakingTokenContract.timeToUnbond(),
            stakingTokenContract.shareValue(),
            stakingTokenContract.totalSupply(),
            stakingTokenContract.balanceOf(selectedAcc)
          ])

        if (selectedToken.label === 'ADX') {
          const [incentivePerSecond, poolTotalStaked] = await Promise.all([
            supplyController.incentivePerSecond(ADX_STAKING_TOKEN_ADDRESS),
            tokenContract.balanceOf(stakingTokenAddress)
          ])

          const currentAPY =
            incentivePerSecond.mul(PRECISION).mul(secondsInYear).div(poolTotalStaked).toNumber() /
            +PRECISION

          setAdxCurrentAPY(currentAPY * 100)
        }

        setShareValue(shareValue)
        SetStakingTokenBalanceRaw(stakingTokenBalanceRaw)

        const [leaveLogs, withdrawLogs] = await Promise.all([
          provider.getLogs({
            fromBlock: 0,
            ...stakingTokenContract.filters.LogLeave(selectedAcc, null, null, null)
          }),
          provider.getLogs({
            fromBlock: 0,
            ...stakingTokenContract.filters.LogWithdraw(selectedAcc, null, null, null, null)
          })
        ])

        const userWithdraws = withdrawLogs.map((log: any) => {
          const parsedWithdrawLog = stakingTokenContract.interface.parseLog(log)
          const { shares, unlocksAt, maxTokens, receivedTokens } = parsedWithdrawLog.args

          return {
            transactionHash: log.transactionHash,
            type: 'withdraw',
            shares,
            unlocksAt,
            maxTokens,
            receivedTokens,
            blockNumber: log.blockNumber
          }
        })

        const now: any = new Date() / 1000
        const userLeaves = await Promise.all(
          leaveLogs.map(async (log: any) => {
            const parsedLog = stakingTokenContract.interface.parseLog(log)
            const { maxTokens, shares, unlocksAt } = parsedLog.args

            const withdrawTx = userWithdraws.find(
              (event: any) =>
                event.unlocksAt.toString() === unlocksAt.toString() &&
                event.shares.toString() === shares.toString() &&
                event.maxTokens.toString() === maxTokens.toString()
            )

            const walletValue = sharesTotalSupply.isZero()
              ? ZERO
              : await stakingTokenContract.unbondingCommitmentWorth(selectedAcc, shares, unlocksAt)

            return {
              transactionHash: log.transactionHash,
              type: 'leave',
              maxTokens,
              shares,
              unlocksAt,
              blockNumber: log.blockNumber,
              walletValue,
              withdrawTx
            }
          })
        )
        const leavesPendingToUnlock = [...userLeaves].filter((event: any) => event.unlocksAt > now)

        const leavesReadyToWithdraw = [...userLeaves].filter(
          (event: any) => event.unlocksAt < now && !event.withdrawTx
        )

        let leavePendingToUnlockOrReadyToWithdraw = null
        if (leavesReadyToWithdraw.length)
          leavePendingToUnlockOrReadyToWithdraw = leavesReadyToWithdraw[0]
        else if (leavesPendingToUnlock.length)
          leavePendingToUnlockOrReadyToWithdraw = leavesPendingToUnlock[0]

        if (leavePendingToUnlockOrReadyToWithdraw) {
          const { maxTokens, shares, unlocksAt, blockNumber, walletValue }: any =
            leavePendingToUnlockOrReadyToWithdraw

          setLeaveLog({
            tokens: maxTokens,
            shares,
            unlocksAt,
            walletValue: utils.formatUnits(walletValue.toString(), 18)
          })

          const { timestamp } = await provider.getBlock(blockNumber)
          let remainingTime = timeToUnbond.toString() * 1000 - (Date.now() - timestamp * 1000)
          if (remainingTime <= 0) remainingTime = 0
          setLockedRemainingTime(remainingTime)
        } else {
          setLeaveLog(null)
        }
      } catch (e) {
        console.error(e)
      }
    }
    init()
    return () => {
      setShareValue(ZERO)
    }
  }, [networkId, selectedAcc, selectedToken.label])

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <Card
      name={CARDS.Ambire}
      icon={AmbireLogo}
      iconStyle={{ width: 126, height: 59 }}
      loading={isLoading}
      unavailable={unavailable}
      customInfo={customInfo}
      details={details}
      tokensItems={tokensItems}
      onTokenSelect={onTokenSelect}
      onValidate={onValidate}
    />
  )
}

export default React.memo(AmbireCard, isEqual)
