import erc20Abi from 'adex-protocol-eth/abi/ERC20.json'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UseToastsReturnType } from 'ambire-common/src/hooks/useToasts'
import { validateSendTransferAmount } from 'ambire-common/src/services/validations'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import InputSendToken from '@common/components/InputSendToken'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useConstants from '@common/hooks/useConstants'
import useNetwork from '@common/hooks/useNetwork'
import spacings from '@common/styles/spacings'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

const ERC20 = new Interface(erc20Abi)

type DepositTokenBottomSheetContextProps = {
  children: any
  networkId?: NetworkId
  chainId?: NetworkType['chainId']
  selectedAcc: UseAccountsReturnType['selectedAcc']
  addRequest: any
  addToast: UseToastsReturnType['addToast']
  closeBottomSheetTopUp: () => any
}

type DepositTokenBottomSheetContextData = {
  openDepositToken: (tokenToDeposit: any) => void
}

const DepositTokenBottomSheetContext = React.createContext<DepositTokenBottomSheetContextData>({
  openDepositToken: () => {}
})

const DepositTokenBottomSheetProvider = ({
  children,
  selectedAcc,
  networkId,
  chainId,
  addRequest,
  addToast,
  closeBottomSheetTopUp
}: DepositTokenBottomSheetContextProps) => {
  const { t } = useTranslation()
  const { constants } = useConstants()
  const { network } = useNetwork()

  const [token, setToken] = useState<any>(null)
  const [amount, setAmount] = useState<number | string>('')
  const [bigNumberHexAmount, setBigNumberHexAmount] = useState('')

  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const onAmountChange = useCallback(
    (value: any) => {
      if (value) {
        const bigNumberAmount = ethers.utils.parseUnits(value, token.decimals).toHexString()
        setBigNumberHexAmount(bigNumberAmount)
      }

      setAmount(value)
    },
    [token]
  )

  const openDepositToken = useCallback(
    (tokenToDeposit) => {
      setToken(tokenToDeposit)
      openBottomSheet()
    },
    [openBottomSheet]
  )

  const maxAmount = useMemo(() => {
    if (!token) return 0

    return ethers.utils.formatUnits(token.balanceRaw, token.decimals)
  }, [token])

  const setMaxAmount = useCallback(() => onAmountChange(maxAmount), [onAmountChange, maxAmount])

  const isValidSendTransferAmount = useMemo(
    () => validateSendTransferAmount(amount, token),
    [token, amount]
  )

  const handleDepositToken = useCallback(() => {
    try {
      const recipientAddress = accountPresets.feeCollector

      const txn = {
        to: token.address,
        value: '0',
        data: ERC20.encodeFunctionData('transfer', [recipientAddress, bigNumberHexAmount])
      }

      if (Number(token.address) === 0) {
        txn.to = recipientAddress
        txn.value = bigNumberHexAmount
        txn.data = '0x'
      }

      const isNativeTopUp = Number(token.address) === 0

      if (isNativeTopUp) {
        const WETHAbi = constants?.humanizerInfo?.abis?.WETH

        if (!WETHAbi) {
          addToast('Error during top up (Wrapped Native ABI not found)', { error: true })
          return
        }
        
        const WETHInterface = new Interface(WETHAbi)
        const wrappedNativeAddress = network.nativeAsset.wrappedAddr
        
        if (!wrappedNativeAddress) {
          addToast('Error during top up (Wrapped Native address not found for this network)', { error: true })
          return
        }

        const deposit = WETHInterface.encodeFunctionData('deposit')
        const now = Date.now()
        const wrapRequest = {
          id: `transfer_${now}`,
          dateAdded: new Date().valueOf(),
          type: 'eth_sendTransaction',
          chainId: network.chainId,
          account: selectedAcc,
          txn: {
            to: wrappedNativeAddress,
            value: bigNumberHexAmount,
            data: deposit
          },

          meta: null
        }
        const topUpRequest = {
          id: `transfer_${now + 1}`,
          dateAdded: new Date().valueOf(),
          type: 'eth_sendTransaction',
          chainId: network.chainId,
          account: selectedAcc,
          txn: {
            to: wrappedNativeAddress,
            value: '0',
            data: ERC20.encodeFunctionData('transfer', [recipientAddress, bigNumberHexAmount])
          },
          meta: null
        }

        addRequest(wrapRequest)
        addRequest(topUpRequest)
        setAmount(0)

        // return
      } else {
        const req: any = {
          id: `transfer_${Date.now()}`,
          dateAdded: new Date().valueOf(),
          type: 'eth_sendTransaction',
          chainId,
          account: selectedAcc,
          txn,
          meta: null
        }
        
        addRequest(req)
      }
      

      // Timeout of 400ms because of the animated transition between screens (addRequest opens PendingTransactions screen)
      setTimeout(() => {
        closeBottomSheet()
        closeBottomSheetTopUp()
      }, 400)
    } catch (e: any) {
      console.error(e)
      addToast(`Error: ${e.message || e}`, { error: true })
    }
  }, [
    selectedAcc,
    token,
    bigNumberHexAmount,
    chainId,
    addRequest,
    addToast,
    closeBottomSheet,
    closeBottomSheetTopUp
  ])

  return (
    <DepositTokenBottomSheetContext.Provider
      value={useMemo(
        () => ({
          openDepositToken
        }),
        [openDepositToken]
      )}
    >
      {children}
      <BottomSheet
        id="deposit-token-bottom-sheet"
        sheetRef={sheetRef}
        withOverlay
        closeBottomSheet={() => {
          closeBottomSheet()
          setToken(null)
          setAmount('')
          setBigNumberHexAmount('')
        }}
      >
        <Title style={textStyles.center}>{t('Top up Gas Tank')}</Title>
        {!!token && (
          <>
            <View style={styles.tokenContainer}>
              <View style={spacings.prTy}>
                <TokenIcon
                  withContainer
                  uri={token.img || token.tokenImageUrl}
                  networkId={networkId}
                  address={token.address}
                />
              </View>
              <Text fontSize={16} numberOfLines={1}>
                {token.symbol.toUpperCase()}
              </Text>
            </View>
            <InputSendToken
              selectedAssetBalance={token.balance}
              selectedAssetBalanceUSD={token.balanceUSD}
              selectedAssetDecimals={token.decimals}
              selectedAssetSymbol={token.symbol}
              onAmountChange={onAmountChange}
              setMaxAmount={setMaxAmount}
              amount={amount}
              maxAmount={maxAmount}
              errorMessage={isValidSendTransferAmount.message}
            />
            <Button
              style={spacings.mt}
              text={t('Send')}
              disabled={!amount || !isValidSendTransferAmount.success}
              onPress={handleDepositToken}
            />
          </>
        )}
      </BottomSheet>
    </DepositTokenBottomSheetContext.Provider>
  )
}

export { DepositTokenBottomSheetContext, DepositTokenBottomSheetProvider }
