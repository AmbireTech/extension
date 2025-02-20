import { BrowserProvider } from 'ethers'
import React, { FC, useCallback, useState } from 'react'

import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import useErc5792 from '@legends/hooks/useErc5792'
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

  const onButtonClick = useCallback(async () => {
    setIsInProgress(true)

    await switchNetwork()

    try {
      const provider = new BrowserProvider(window.ambire)
      const signer = await provider.getSigner()

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
    switchNetwork,
    action.calls,
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
