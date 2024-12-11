import React, { FC, useMemo, useState } from 'react'

import Input from '@legends/components/Input'
import useToast from '@legends/hooks/useToast'
import { useInviteEOA } from '@legends/modules/legends/hooks'

import CardActionWrapper from './CardActionWrapper'
import { CardProps } from './types'

type Props = CardProps & {
  buttonText: string
}

const SummonAcc: FC<Props> = ({ buttonText, handleClose, onComplete }) => {
  const { addToast } = useToast()
  const {
    inviteEOA,
    switchNetwork,
    eoaAddress,
    setEoaAddress,
    isEOAAddressValid: isValid
  } = useInviteEOA()

  const [isInProgress, setIsInProgress] = useState(false)

  const inputValidation = useMemo(() => {
    if (!eoaAddress) return null

    return {
      isValid,
      message: !isValid ? 'Invalid address' : ''
    }
  }, [eoaAddress, isValid])

  const onButtonClick = async () => {
    try {
      await switchNetwork()
      setIsInProgress(true)
      const txnId = await inviteEOA()
      onComplete(txnId)
      handleClose()
    } catch (e: any) {
      addToast('Failed to invite EOA address', 'error')
      console.error(e)
    } finally {
      setIsInProgress(false)
    }
  }

  return (
    <CardActionWrapper
      isLoading={isInProgress}
      loadingText="Signing..."
      buttonText={buttonText}
      disabled={!isValid}
      onButtonClick={onButtonClick}
    >
      <Input
        label="EOA Address"
        placeholder="Enter EOA Address"
        value={eoaAddress}
        validation={inputValidation}
        onChange={(e) => setEoaAddress(e.target.value)}
      />
    </CardActionWrapper>
  )
}

export default SummonAcc
