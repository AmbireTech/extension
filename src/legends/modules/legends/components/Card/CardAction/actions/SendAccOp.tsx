import React, { FC, useCallback, useState } from 'react'

import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useErc5792 from '@legends/hooks/useErc5792'
import useProviderContext from '@legends/hooks/useProviderContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { CardActionCalls } from '@legends/modules/legends/types'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import CardActionButton from './CardActionButton'

type Props = {
  action: CardActionCalls
}

const SendAccOp: FC<Props> = ({ action }) => {
  const { addToast } = useToast()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onComplete, handleClose } = useCardActionContext()
  const [isInProgress, setIsInProgress] = useState(false)
  const switchNetwork = useSwitchNetwork()
  const { browserProvider } = useProviderContext()
  const onButtonClick = useCallback(async () => {
    if (!browserProvider) return

    setIsInProgress(true)
    await switchNetwork(action.chainId || BASE_CHAIN_ID)

    try {
      const signer = await browserProvider.getSigner()

      const formattedCalls = action.calls.map(([to, value, data]) => {
        return { to, value, data }
      })

      setIsInProgress(false)
      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        formattedCalls,
        false
      )
      const receipt = await getCallsStatus(sendCallsIdentifier)

      onComplete(receipt.transactionHash)
      handleClose()
    } catch (e: any) {
      const message = humanizeError(e, ERROR_MESSAGES.transactionProcessingFailed)

      console.error(e)
      addToast(message, { type: 'error' })
    }
  }, [
    browserProvider,
    switchNetwork,
    action.calls,
    action.chainId,
    sendCalls,
    chainId,
    getCallsStatus,
    onComplete,
    handleClose,
    addToast
  ])

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
