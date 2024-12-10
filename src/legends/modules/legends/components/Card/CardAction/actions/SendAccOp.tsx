import { BrowserProvider } from 'ethers'
import React, { FC, useCallback, useState } from 'react'

import { BASE_CHAIN_ID } from '@legends/constants/network'
import useToast from '@legends/hooks/useToast'
import { CardActionCalls } from '@legends/modules/legends/types'

import CardActionButton from './CardActionButton'

type Props = {
  onComplete: () => void
  action: CardActionCalls
}

const SendAccOp: FC<Props> = ({ onComplete, action }) => {
  const { addToast } = useToast()
  const [isInProgress, setIsInProgress] = useState(false)

  const changeNetworkToBase = useCallback(async () => {
    try {
      await window.ambire.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID }]
      })
    } catch (e) {
      console.error(e)
      addToast('Failed to switch network', 'error')
    }
  }, [addToast])

  const onButtonClick = useCallback(async () => {
    setIsInProgress(true)

    await changeNetworkToBase()

    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()

    const formattedCalls = action.calls.map(([to, value, data]) => {
      return { to, value, data }
    })

    // TODO - Debug why `wallet_sendCalls` Promise doesn't resolve.
    // Because of this, we complete the Step action earlier here, as if we place it after the Promise,
    // completion won't be invoked.
    setIsInProgress(false)
    onComplete()

    try {
      await window.ambire.request({
        method: 'wallet_sendCalls',
        params: [{ calls: formattedCalls, from: await signer.getAddress() }]
      })
    } catch (e) {
      console.error(e)
      addToast('Failed to process the transaction!', 'error')
    }
  }, [changeNetworkToBase, onComplete, action.calls, addToast])

  return (
    <CardActionButton
      isLoading={isInProgress}
      loadingText="Signing..."
      buttonText="Proceed"
      onButtonClick={onButtonClick}
    />
  )
}

export default React.memo(SendAccOp)
