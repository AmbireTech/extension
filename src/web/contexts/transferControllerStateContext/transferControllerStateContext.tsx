import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import humanizerInfo from '@ambire-common/consts/humanizer/humanizerInfo.json'
import { TransferController } from '@ambire-common/controllers/transfer/transfer'
import { HumanizerMeta } from '@ambire-common/libs/humanizer/interfaces'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { sortPortfolioTokenList } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import Spinner from '@common/components/Spinner'
import { APP_VERSION } from '@common/config/env'
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
  if (!search) return null

  const params = new URLSearchParams(search)

  return {
    addr: params.get('address'),
    chainId: params.get('chainId')
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
      sortPortfolioTokenList(
        portfolio?.tokens.filter((token) => {
          const hasAmount = Number(getTokenAmount(token)) > 0

          if (isTopUp) {
            const tokenNetwork = networks.find((network) => network.chainId === token.chainId)

            return (
              hasAmount &&
              tokenNetwork?.hasRelayer &&
              token.flags.canTopUpGasTank &&
              !token.flags.onGasTank
            )
          }

          return hasAmount && !token.flags.onGasTank && !token.flags.rewardsType
        }) || []
      ),
    [portfolio?.tokens, networks, isTopUp]
  )

  useEffect(() => {
    // Don't reinit the controller if it already exists. Only update its properties
    if (transferCtrl || !account || !portfolio) return

    transferCtrlRef.current = new TransferController(
      storage,
      humanizerInfo as HumanizerMeta,
      account,
      networks,
      portfolio,
      !isTopUp, // Hydrate and persist in case of Transfer, if it's PopUp don't
      APP_VERSION
    )
    forceUpdate()
  }, [forceUpdate, account, networks, transferCtrl, portfolio, isTopUp])

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
    if (!state.selectedToken?.address || !transferCtrl) return

    // If a token is already selected, we should retrieve its latest value from tokens.
    // This is important because the token amount is likely to change,
    // especially when initiating a transfer or adding a new one to the queue.
    // As a result, the token `amountPostSimulation` may differ, and we need to update the available token balance accordingly.
    const selectedToken = tokens.find(
      (token) =>
        token.address === transferCtrl.selectedToken?.address &&
        token.chainId === transferCtrl.selectedToken?.chainId
    )

    // It has a scenario where no token is provided view URL parameters but only isTopUp and the selectedToken will be undefined
    // In that case we do not update the selected token
    if (selectedToken) {
      transferCtrl.update(
        {
          selectedToken
        },
        { shouldPersist: false }
      )
    }
  }, [selectedTokenFromUrl?.addr, selectedTokenFromUrl?.chainId, tokens, transferCtrl])

  useEffect(() => {
    if (!transferCtrl) return
    transferCtrl.update({ isTopUp })
  }, [isTopUp, transferCtrl])

  // If the user sends the max amount of a token it will disappear from the list of tokens
  // and we need to select another token
  useEffect(() => {
    if (!state.selectedToken?.address || !transferCtrl) return
    const isSelectedTokenNetworkLoading =
      portfolio.pending[state.selectedToken.chainId.toString()]?.isLoading ||
      portfolio.latest[state.selectedToken.chainId.toString()]?.isLoading

    if (isSelectedTokenNetworkLoading) return

    const isSelectedTokenInTokens = tokens.find(
      (token) =>
        token.address === state.selectedToken?.address &&
        token.chainId === state.selectedToken?.chainId &&
        token.flags.rewardsType === state.selectedToken?.flags.rewardsType
    )

    if (isSelectedTokenInTokens) return

    transferCtrl.update(
      {
        selectedToken: tokens[0]
      },
      { shouldPersist: false }
    )
  }, [
    portfolio.latest,
    portfolio.pending,
    state.selectedToken?.address,
    state.selectedToken?.flags.rewardsType,
    state.selectedToken?.chainId,
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
