import erc20Abi from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'ambire-common/src/constants/networks'
import { isKnownTokenOrContract, isValidAddress } from 'ambire-common/src/services/address'
import { getBip44Items, resolveENSDomain } from 'ambire-common/src/services/ensDomains'
import { resolveUDomain } from 'ambire-common/src/services/unstoppableDomains'
import {
  validateSendTransferAddress,
  validateSendTransferAmount
} from 'ambire-common/src/services/validations'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import TokenIcon from '@common/components/TokenIcon'
import { isWeb } from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useAddressBook from '@common/hooks/useAddressBook'
import useConstants from '@common/hooks/useConstants'
import useIsScreenFocused from '@common/hooks/useIsScreenFocused/useIsScreenFocused'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import usePortfolio from '@common/hooks/usePortfolio'
import useRequests from '@common/hooks/useRequests'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'

const ERC20 = new Interface(erc20Abi)

export default function useRequestTransaction() {
  const isFocused = useIsScreenFocused()
  const { tokens, isCurrNetworkBalanceLoading } = usePortfolio()
  const { params } = useRoute()
  const navigation = useNavigation()
  const { network }: any = useNetwork()
  const { selectedAcc } = useAccounts()
  const { addRequest } = useRequests()
  const { addToast } = useToast()
  const { isKnownAddress } = useAddressBook()
  const { constants } = useConstants()
  const timer: any = useRef(null)
  const [bigNumberHexAmount, setBigNumberHexAmount] = useState('')
  const [asset, setAsset] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [address, setAddress] = useState('')
  const [uDAddress, setUDAddress] = useState('')
  const [ensAddress, setEnsAddress] = useState('')
  const [disabled, setDisabled] = useState(true)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [sWAddressConfirmed, setSWAddressConfirmed] = useState(false)
  const [validationFormMgs, setValidationFormMgs] = useState<{
    success: {
      amount: boolean
      address: boolean
    }
    messages: {
      amount: string | null
      address: string | null
    }
  }>({
    success: {
      amount: false,
      address: false
    },
    messages: {
      amount: '',
      address: ''
    }
  })
  // <Select items={assetsItems} />
  const assetsItems = useMemo(
    () =>
      tokens.map(({ label, symbol, address, img, tokenImageUrl }: any) => ({
        label: label || symbol,
        value: address,
        icon: () => (
          <TokenIcon
            uri={img || tokenImageUrl}
            networkId={network.id}
            address={selectedAcc}
            withContainer
          />
        )
      })),
    [tokens, selectedAcc, network.id]
  )

  // returns the whole token object of the selected asset
  const selectedAsset = useMemo(
    () => tokens.find(({ address }: any) => address === asset),
    [tokens, asset]
  )

  useEffect(() => {
    if (!selectedAsset && !!tokens && tokens?.[0]?.address !== asset) {
      setAsset(tokens[0]?.address)
    }
  }, [selectedAsset, tokens, asset])

  useEffect(() => {
    if (params?.tokenAddressOrSymbol) {
      const addrOrSymbol = params?.tokenAddressOrSymbol
      const addr = isValidAddress(addrOrSymbol)
        ? addrOrSymbol
        : tokens.find(({ symbol }: any) => symbol === addrOrSymbol)?.address || null
      if (addr) {
        setAsset(addr)
      }

      // Clears the param so that it doesn't get cached (used) again
      navigation.setParams({ tokenAddressOrSymbol: undefined } as any)
    }
  }, [params?.tokenAddressOrSymbol, tokens, navigation])

  const maxAmount = useMemo(() => {
    if (!selectedAsset) return 0
    const { balanceRaw, decimals } = selectedAsset
    return ethers.utils.formatUnits(balanceRaw, decimals)
  }, [selectedAsset])

  const onAmountChange = useCallback(
    (value: any) => {
      if (value) {
        const { decimals } = selectedAsset
        const bigNumberAmount = ethers.utils.parseUnits(value, decimals).toHexString()
        setBigNumberHexAmount(bigNumberAmount)
      }

      setAmount(value)
    },
    [selectedAsset]
  )

  const setMaxAmount = useCallback(() => onAmountChange(maxAmount), [onAmountChange, maxAmount])

  const sendTransaction = useCallback(() => {
    try {
      const recipientAddress = uDAddress || ensAddress || address

      const txn = {
        to: selectedAsset.address,
        value: '0',
        dateAdded: new Date().valueOf(),
        data: ERC20.encodeFunctionData('transfer', [recipientAddress, bigNumberHexAmount])
      }

      if (Number(selectedAsset.address) === 0) {
        txn.to = recipientAddress
        txn.value = bigNumberHexAmount
        txn.data = '0x'
      }

      const req: any = {
        id: `transfer_${Date.now()}`,
        type: 'eth_sendTransaction',
        chainId: network?.chainId,
        account: selectedAcc,
        txn,
        meta: null
      }

      if (uDAddress) {
        req.meta = {
          addressLabel: {
            addressLabel: address,
            address: uDAddress
          }
        }
      } else if (ensAddress) {
        req.meta = {
          addressLabel: {
            addressLabel: address,
            address: ensAddress
          }
        }
      }

      addRequest(req)

      // Timeout of 500ms because of the animated transition between screens (addRequest opens PendingTransactions screen)
      setTimeout(() => {
        setAsset(null)
        setAmount(0)
        setAddress('')
      }, 500)
    } catch (e: any) {
      console.error(e)
      addToast(`Error: ${e.message || e}`, { error: true })
    }
  }, [
    selectedAcc,
    address,
    selectedAsset,
    bigNumberHexAmount,
    network?.chainId,
    uDAddress,
    ensAddress,
    addRequest,
    addToast
  ])

  const unknownWarning = useMemo(() => {
    if (uDAddress || ensAddress) {
      return !isKnownAddress(address)
    }
    return isValidAddress(address) && !isKnownAddress(address)
  }, [address, uDAddress, ensAddress, isKnownAddress])

  const smartContractWarning = useMemo(
    () => isKnownTokenOrContract(constants!.humanizerInfo, address),
    [address, constants]
  )

  const showSWAddressWarning = useMemo(
    () =>
      !!selectedAsset?.address &&
      Number(selectedAsset?.address) === 0 &&
      networks
        .map(({ id }) => id)
        .filter((id) => id !== 'ethereum')
        .includes(network.id),
    [selectedAsset?.address, network]
  )

  useEffect(() => {
    if ((uDAddress || ensAddress) && !unknownWarning && validationFormMgs.messages?.address) {
      setValidationFormMgs((prev) => ({
        success: {
          amount: prev.success.amount,
          address: true
        },
        messages: {
          amount: prev.messages.amount,
          address: null
        }
      }))
      setDisabled(
        !validationFormMgs.success.amount || (showSWAddressWarning && !sWAddressConfirmed)
      )
    }
  }, [
    unknownWarning,
    uDAddress,
    ensAddress,
    validationFormMgs.messages?.address,
    validationFormMgs.success.amount,
    sWAddressConfirmed,
    showSWAddressWarning
  ])

  useEffect(() => {
    if (isFocused) {
      const isValidSendTransferAmount = validateSendTransferAmount(amount, selectedAsset)

      if (address.startsWith('0x') && address.indexOf('.') === -1) {
        if (uDAddress !== '') setUDAddress('')
        if (ensAddress !== '') setEnsAddress('')
        const isValidRecipientAddress = validateSendTransferAddress(
          address,
          selectedAcc,
          addressConfirmed,
          isKnownAddress,
          constants!.humanizerInfo
        )

        setValidationFormMgs({
          success: {
            amount: isValidSendTransferAmount.success,
            address: isValidRecipientAddress.success
          },
          messages: {
            amount: isValidSendTransferAmount.message ? isValidSendTransferAmount.message : '',
            address: isValidRecipientAddress.message ? isValidRecipientAddress.message : ''
          }
        })

        setDisabled(
          !isValidRecipientAddress.success ||
            !isValidSendTransferAmount.success ||
            (showSWAddressWarning && !sWAddressConfirmed)
        )
      } else {
        if (timer.current) {
          clearTimeout(timer.current)
        }

        const validateForm = async () => {
          const UDAddress = await resolveUDomain(
            address,
            selectedAsset ? selectedAsset.symbol : null,
            network.unstoppableDomainsChain
          )
          const bip44Item = getBip44Items(selectedAsset ? selectedAsset.symbol : null)
          const ensAddr = await resolveENSDomain(address, bip44Item)

          timer.current = null
          const isUDAddress = !!UDAddress
          const isEnsAddress = !!ensAddr
          const isValidRecipientAddress = validateSendTransferAddress(
            UDAddress || ensAddr || address,
            selectedAcc,
            addressConfirmed,
            isKnownAddress,
            constants!.humanizerInfo,
            isUDAddress,
            isEnsAddress
          )

          setUDAddress(UDAddress)
          setEnsAddress(ensAddr)
          setValidationFormMgs({
            success: {
              amount: isValidSendTransferAmount.success,
              address: isValidRecipientAddress.success
            },
            messages: {
              amount: isValidSendTransferAmount.message ? isValidSendTransferAmount.message : '',
              address: isValidRecipientAddress.message ? isValidRecipientAddress.message : ''
            }
          })

          setDisabled(
            !isValidRecipientAddress.success ||
              !isValidSendTransferAmount.success ||
              (showSWAddressWarning && !sWAddressConfirmed)
          )
        }

        timer.current = setTimeout(async () => {
          return validateForm().catch(console.error)
        }, 300)
      }
    }
    return () => clearTimeout(timer.current)
  }, [
    address,
    amount,
    selectedAcc,
    selectedAsset,
    addressConfirmed,
    showSWAddressWarning,
    sWAddressConfirmed,
    isKnownAddress,
    addToast,
    network.id,
    uDAddress,
    ensAddress,
    network.unstoppableDomainsChain,
    isFocused
  ])

  useEffect(() => {
    setAmount(0)
    setBigNumberHexAmount('')
  }, [asset])

  return {
    maxAmount,
    setMaxAmount,
    asset,
    selectedAsset,
    amount,
    address,
    setAsset,
    setAmount,
    setAddress,
    assetsItems,
    sendTransaction,
    disabled,
    validationFormMgs,
    addressConfirmed,
    setAddressConfirmed,
    unknownWarning,
    smartContractWarning,
    onAmountChange,
    showSWAddressWarning,
    sWAddressConfirmed,
    setSWAddressConfirmed,
    uDAddress,
    ensAddress,
    isLoading: isCurrNetworkBalanceLoading && !tokens
  }
}
