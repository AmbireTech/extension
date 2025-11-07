/* eslint-disable no-console */

import { Interface } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { Pressable } from 'react-native'

import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useProviderContext from '@legends/hooks/useProviderContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { CardFromResponse } from '@legends/modules/legends/types'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import styles from './Action.module.scss'
import CardActionWrapper from './CardActionWrapper'

const iface = new Interface(['function revealMascotLetter()'])

interface Props {
  meta: CardFromResponse['meta']
}
const MascotRevealLetter = ({ meta }: Props) => {
  const [isInProgress, setIsInProgress] = useState(false)
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onComplete } = useCardActionContext()
  const { addToast } = useToast()
  const switchNetwork = useSwitchNetwork()
  const { browserProvider } = useProviderContext()
  const { connectedAccount, v1Account } = useAccountContext()
  const { isCharacterNotMinted } = useCharacterContext()

  const revealLetter = useCallback(async () => {
    try {
      if (!browserProvider) throw new Error('No connected wallet')
      if (!connectedAccount) throw new Error('No connected account')
      setIsInProgress(true)
      await switchNetwork(BASE_CHAIN_ID)

      const signer = await browserProvider.getSigner(connectedAccount)

      const useSponsorship = false

      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        [
          {
            to: LEGENDS_CONTRACT_ADDRESS,
            data: iface.encodeFunctionData('revealMascotLetter', []),
            value: '0'
          }
        ],
        useSponsorship
      )
      const receipt = await getCallsStatus(sendCallsIdentifier)
      await onComplete(receipt.transactionHash)
      setIsInProgress(false)
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
    switchNetwork,
    sendCalls,
    chainId,
    getCallsStatus,
    onComplete,
    addToast
  ])

  const btnText = useMemo(() => {
    if (isCharacterNotMinted) return 'Join Rewards to start accumulating XP'
    if (!connectedAccount || v1Account)
      return 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
    return 'Reveal letter'
  }, [connectedAccount, v1Account, isCharacterNotMinted])

  const isButtonDisabled = useMemo(() => {
    if (!connectedAccount || v1Account || isCharacterNotMinted) return true
    return false
  }, [connectedAccount, v1Account, isCharacterNotMinted])

  const infoComponent = useMemo(() => {
    if (meta?.revealedMascotLetter)
      return (
        <div className={styles.totalTextContainer}>
          <div className={styles.mascotLetterContainer}>
            <p>Letter:</p>
            <div className={styles.mascotLetter}>
              <p style={{ fontWeight: 'bold' }}>H</p>
            </div>
          </div>
        </div>
      )

    if (isInProgress)
      return (
        <div className={styles.infoText}>
          <p>Loading...</p>
        </div>
      )

    return (
      <CardActionWrapper
        onButtonClick={revealLetter}
        isLoading={isInProgress}
        loadingText="Signing..."
        disabled={isButtonDisabled}
        buttonText={btnText}
      />
    )
  }, [meta?.revealedMascotLetter, isInProgress, revealLetter, isButtonDisabled, btnText])
  return (
    <>
      <div style={{ textAlign: 'right' }}>
        <p className={styles.link}>
          <Pressable onPress={() => window.open('https://x.com/ambire/status/1982787127105486860')}>
            Discover more about the campaign.
          </Pressable>
        </p>
      </div>
      {infoComponent}
    </>
  )
}

export default MascotRevealLetter
