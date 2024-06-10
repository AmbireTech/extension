import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { TransferController } from '@ambire-common/controllers/transfer/transfer'
import { HumanizerMeta } from '@ambire-common/libs/humanizer/interfaces'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import Spinner from '@common/components/Spinner'
import useRoute from '@common/hooks/useRoute'
import { isGasTankTokenOnCustomNetwork } from '@common/modules/dashboard/components/Tokens/Tokens'
import flexbox from '@common/styles/utils/flexbox'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

type ContextReturn = {
  state: TransferController
  transferCtrl: TransferController
  tokens: TokenResult[]
}

const TransferControllerStateContext = createContext<ContextReturn>({} as ContextReturn)

export const getInfoFromSearch = (search: string | undefined) => {
  if (!search || !search?.includes('networkId') || !search?.includes('address')) return null

  const params = new URLSearchParams(search)

  return {
    addr: params.get('address'),
    networkId: params.get('networkId'),
    isTopUp: typeof params.get('isTopUp') === 'string'
  }
}

const TransferControllerStateProvider: React.FC<any> = ({ children }) => {
  const mainState = useMainControllerState()
  const { networks } = useSettingsControllerState()
  const { contacts } = useAddressBookControllerState()
  const { search } = useRoute()
  const [state, setState] = useState<TransferController>({} as TransferController)
  const { accountPortfolio } = usePortfolioControllerState()
  const selectedTokenFromUrl = useMemo(() => getInfoFromSearch(search), [search])
  const transferCtrlRef = useRef<TransferController | null>(null)
  const transferCtrl = transferCtrlRef.current

  const forceUpdate = useCallback(() => setState({} as TransferController), [])

  const tokens = useMemo(
    () =>
      accountPortfolio?.tokens.filter((token) => {
        const hasAmount = Number(getTokenAmount(token)) > 0
        const isTopUp = selectedTokenFromUrl?.isTopUp

        if (
          (isTopUp && !token.flags.canTopUpGasTank) ||
          isGasTankTokenOnCustomNetwork(token, networks)
        )
          return false

        return hasAmount
      }) || [],
    [accountPortfolio?.tokens, networks, selectedTokenFromUrl?.isTopUp]
  )

  useEffect(() => {
    // Don't reinit the controller if it already exists. Only update its properties
    if (transferCtrl) return

    const selectedAccountData = mainState.accounts.find(
      (acc) => acc.addr === mainState.selectedAccount
    )

    if (!selectedAccountData) return

    transferCtrlRef.current = new TransferController(
      humanizerInfo as HumanizerMeta,
      selectedAccountData,
      networks
    )
    forceUpdate()
  }, [forceUpdate, mainState.accounts, mainState.selectedAccount, networks, transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.onUpdate(() => {
      setState(transferCtrl.toJSON())
    })
  }, [transferCtrl])

  useEffect(() => {
    const selectedAccountData = mainState.accounts.find(
      (acc) => acc.addr === mainState.selectedAccount
    )
    if (!selectedAccountData || !transferCtrl) return

    transferCtrl.update({
      selectedAccountData
    })
  }, [mainState.accounts, mainState.selectedAccount, transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.update({
      networks
    })
  }, [transferCtrl, networks])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.update({
      contacts
    })
  }, [contacts, transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.update({
      humanizerInfo: humanizerInfo as HumanizerMeta
    })
  }, [transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    const selectedTokenData = tokens.find(
      (token) =>
        token.address === selectedTokenFromUrl?.addr &&
        token.networkId === selectedTokenFromUrl?.networkId
    )

    transferCtrl.update({
      selectedToken: selectedTokenData
    })
  }, [selectedTokenFromUrl?.addr, selectedTokenFromUrl?.networkId, tokens, transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.update({
      isTopUp: !!selectedTokenFromUrl?.isTopUp
    })
  }, [selectedTokenFromUrl?.isTopUp, transferCtrl])

  // If the user sends the max amount of a token it will disappear from the list of tokens
  // and we need to select another token
  useEffect(() => {
    if (!state.selectedToken?.address || !transferCtrl) return

    const isSelectedTokenInTokens = tokens.find(
      (token) =>
        token.address === state.selectedToken?.address &&
        token.networkId === state.selectedToken?.networkId &&
        token.flags.rewardsType === state.selectedToken?.flags.rewardsType
    )

    if (isSelectedTokenInTokens) return

    transferCtrl.update({
      selectedToken: tokens[0]
    })
  }, [
    state.selectedToken?.address,
    state.selectedToken?.flags.rewardsType,
    state.selectedToken?.networkId,
    tokens,
    transferCtrl
  ])

  return (
    <TransferControllerStateContext.Provider
      value={useMemo(
        // Typecasting to TransferController is safe because children are rendered only when state is not empty
        () => ({ state, transferCtrl: transferCtrl as TransferController, tokens }),
        [state, transferCtrl, tokens]
      )}
    >
      {Object.keys(state).length ? (
        children
      ) : (
        <View style={[flexbox.flex1, flexbox.center]}>
          <Spinner />
        </View>
      )}
    </TransferControllerStateContext.Provider>
  )
}

export { TransferControllerStateProvider, TransferControllerStateContext }
