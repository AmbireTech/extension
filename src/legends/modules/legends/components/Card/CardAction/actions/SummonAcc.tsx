import React, { FC, useMemo, useState } from 'react'

import CopyIcon from '@common/assets/svg/CopyIcon'
import Input from '@legends/components/Input'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import useToast from '@legends/hooks/useToast'
import { useInviteEOA } from '@legends/modules/legends/hooks'
import { CardFromResponse } from '@legends/modules/legends/types'

import styles from './Action.module.scss'
import CardActionWrapper from './CardActionWrapper'

type Props = {
  buttonText: string
  onComplete: () => void
}

const SummonAcc: FC<Props> = ({ buttonText, onComplete }) => {
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
      await inviteEOA()
      addToast('Successfully invited EOA address', 'success')
      onComplete()
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
