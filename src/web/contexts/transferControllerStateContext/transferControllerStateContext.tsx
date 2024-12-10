import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { TransferController } from '@ambire-common/controllers/transfer/transfer'
import { HumanizerMeta } from '@ambire-common/libs/humanizer/interfaces'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import Spinner from '@common/components/Spinner'
import useRoute from '@common/hooks/useRoute'
import flexbox from '@common/styles/utils/flexbox'
import { storage } from '@web/extension-services/background/webapi/storage'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

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
    networkId: params.get('networkId')
  }
}

const TransferControllerStateProvider = ({
  children,
  isTopUp
}: {
  children: any
  isTopUp?: boolean
}) => {
  const { account } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const { contacts } = useAddressBookControllerState()
  const { search } = useRoute()
  const [state, setState] = useState<TransferController>({} as TransferController)

  const { portfolio } = useSelectedAccountControllerState()
  const selectedTokenFromUrl = useMemo(() => getInfoFromSearch(search), [search])
  const transferCtrlRef = useRef<TransferController | null>(null)
  const transferCtrl = transferCtrlRef.current

  const forceUpdate = useCallback(() => setState({} as TransferController), [])

  const tokens = useMemo(
    () =>
      portfolio?.tokens.filter((token) => {
        const hasAmount = Number(getTokenAmount(token)) > 0

        if (isTopUp) {
          const tokenNetwork = networks.find((network) => network.id === token.networkId)

          return (
            hasAmount &&
            tokenNetwork?.hasRelayer &&
            token.flags.canTopUpGasTank &&
            !token.flags.onGasTank
          )
        }

        return hasAmount && !token.flags.onGasTank && !token.flags.rewardsType
      }) || [],
    [portfolio?.tokens, networks, isTopUp]
  )

  useEffect(() => {
    // Don't reinit the controller if it already exists. Only update its properties
    if (transferCtrl || !account) return

    transferCtrlRef.current = new TransferController(
      storage,
      humanizerInfo as HumanizerMeta,
      account,
      networks
    )
    forceUpdate()
  }, [forceUpdate, account, networks, transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.onUpdate(() => {
      setState(transferCtrl.toJSON())
    })
  }, [transferCtrl])

  useEffect(() => {
    if (!account || !transferCtrl) return

    transferCtrl.update({ selectedAccountData: account })
  }, [account, transferCtrl])

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

    let selectedToken

    // If a token is already selected, we should retrieve its latest value from tokens.
    // This is important because the token amount is likely to change,
    // especially when initiating a transfer or adding a new one to the queue.
    // As a result, the token `amountPostSimulation` may differ, and we need to update the available token balance accordingly.
    if (transferCtrl.selectedToken) {
      selectedToken = tokens.find(
        (token) =>
          token.address === transferCtrl.selectedToken?.address &&
          token.networkId === transferCtrl.selectedToken?.networkId
      )
    } else {
      // If no token is selected, we try to select one based on the URL parameters
      selectedToken = tokens.find(
        (token) =>
          token.address === selectedTokenFromUrl?.addr &&
          token.networkId === selectedTokenFromUrl?.networkId
      )
    }

    transferCtrl.update({
      selectedToken
    })
  }, [selectedTokenFromUrl?.addr, selectedTokenFromUrl?.networkId, tokens, transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.update({ isTopUp })
  }, [isTopUp, transferCtrl])

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
