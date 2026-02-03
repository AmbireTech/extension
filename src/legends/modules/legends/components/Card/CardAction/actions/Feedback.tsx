/* eslint-disable no-console */

import { hashMessage, Interface } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { Linking } from 'react-native'

import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useProviderContext from '@legends/hooks/useProviderContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { CardFromResponse } from '@legends/modules/legends/types'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import Input from '../../../../../../components/Input/Input'
import styles from './Action.module.scss'
import CardActionWrapper from './CardActionWrapper'

const iface = new Interface(['function claimXpFromFeedback(string)'])

interface Props {
  meta: CardFromResponse['meta']
}
const Feedback = ({ meta }: Props) => {
  const [isInProgress, setIsInProgress] = useState(false)
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false)
  const [surveyCode, setSurveyCode] = useState<string>('')
  const { sendCalls, getCallsStatus } = useErc5792()
  const { onComplete, handleClose } = useCardActionContext()
  const { addToast } = useToast()
  const switchNetwork = useSwitchNetwork()
  const { browserProvider } = useProviderContext()
  const { connectedAccount, v1Account } = useAccountContext()

  const openForm = useCallback(() => {
    if (!connectedAccount) return addToast('No account connected')

    setIsFeedbackFormOpen(true)
    const queryParam = `${hashMessage(`${connectedAccount}ambire salt`)}`
    const queryParamName = 'ambro'
    Linking.openURL(
      `https://survey.typeform.com/to/eSdGAYPK#${queryParamName}=${queryParam}`
    ).catch(() => {
      addToast('Cannot open survey')
    })
  }, [connectedAccount, addToast])

  const claimXp = useCallback(async () => {
    try {
      if (!browserProvider) throw new Error('No connected wallet')
      if (!connectedAccount) throw new Error('No connected account')
      if (!surveyCode) throw new Error('No survey code')
      setIsInProgress(true)
      await switchNetwork(BASE_CHAIN_ID)
      const signer = await browserProvider.getSigner(connectedAccount)

      const useSponsorship = false

      const sendCallsIdentifier = await sendCalls(
        '0x' + BASE_CHAIN_ID.toString(16),
        await signer.getAddress(),
        [
          {
            to: LEGENDS_CONTRACT_ADDRESS,
            data: iface.encodeFunctionData('claimXpFromFeedback', [surveyCode]),
            value: '0'
          }
        ],
        useSponsorship
      )
      const receipt = await getCallsStatus(sendCallsIdentifier)
      if (!receipt) throw new Error('No receipt found')

      onComplete(receipt.transactionHash)
      handleClose()
    } catch (e: any) {
      const message = humanizeError(e, ERROR_MESSAGES.transactionSigningFailed)

      console.error(e)
      addToast(message || ERROR_MESSAGES.transactionSigningFailed, { type: 'error' })
    } finally {
      setIsInProgress(false)
    }
  }, [
    browserProvider,
    connectedAccount,
    sendCalls,
    surveyCode,
    getCallsStatus,
    onComplete,
    handleClose,
    addToast,
    switchNetwork
  ])

  const onButtonClick = () => {
    if (isFeedbackFormOpen) {
      claimXp()
    } else {
      openForm()
    }
  }

  const btnText = useMemo(() => {
    if (meta?.notMetLvlThreshold) return 'Minimum level 10 threshold not met.'
    if (!connectedAccount || v1Account)
      return 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
    return isFeedbackFormOpen ? 'Claim xp' : 'Open feedback form'
  }, [meta?.notMetLvlThreshold, connectedAccount, v1Account, isFeedbackFormOpen])

  const isButtonDisabled = useMemo(() => {
    if (!connectedAccount || v1Account) return true
    if (meta?.notMetLvlThreshold) return true
    if (isFeedbackFormOpen && !surveyCode) return true
    return false
  }, [meta?.notMetLvlThreshold, connectedAccount, v1Account, isFeedbackFormOpen, surveyCode])
  return (
    <CardActionWrapper
      onButtonClick={onButtonClick}
      isLoading={isInProgress}
      loadingText="Signing..."
      disabled={isButtonDisabled}
      buttonText={btnText}
    >
      <div className={styles.wrapper}>
        {isFeedbackFormOpen && (
          <>
            <Input.Label label="Enter Survey code" />
            <Input.Field
              value={surveyCode || ''}
              label="Enter Survey code"
              placeholder="Survey code"
              onChange={(e) => setSurveyCode(e.target.value)}
              className={styles.input}
            />
          </>
        )}
      </div>
    </CardActionWrapper>
  )
}

export default Feedback
