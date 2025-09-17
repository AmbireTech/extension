/* eslint-disable no-console */

import { BrowserProvider, Interface } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'

import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { CardFromResponse } from '@legends/modules/legends/types'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import styles from './Action.module.scss'
import CardActionWrapper from './CardActionWrapper'

const iface = new Interface(['function claimBitrefillCode()'])

interface Props {
  meta: CardFromResponse['meta']
}
const BitrefillClaim = ({ meta }: Props) => {
  const [isInProgress, setIsInProgress] = useState(false)
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const { onComplete } = useCardActionContext()
  const { addToast } = useToast()
  const switchNetwork = useSwitchNetwork()
  const { connectedAccount, v1Account } = useAccountContext()
  const { isCharacterNotMinted } = useCharacterContext()

  const claimCode = useCallback(async () => {
    try {
      if (!connectedAccount) throw new Error('No connected account')
      setIsInProgress(true)
      await switchNetwork(BASE_CHAIN_ID)
      const provider = new BrowserProvider(window.ambire)
      const signer = await provider.getSigner(connectedAccount)

      const useSponsorship = false

      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        [
          {
            to: LEGENDS_CONTRACT_ADDRESS,
            data: iface.encodeFunctionData('claimBitrefillCode', []),
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
  }, [connectedAccount, sendCalls, chainId, getCallsStatus, onComplete, addToast, switchNetwork])

  const btnText = useMemo(() => {
    if (isCharacterNotMinted) return 'Join Rewards to start accumulating XP'
    if (!connectedAccount || v1Account)
      return 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
    return 'Claim code'
  }, [connectedAccount, v1Account, isCharacterNotMinted])

  const isButtonDisabled = useMemo(() => {
    if (!connectedAccount || v1Account || isCharacterNotMinted) return true
    return false
  }, [connectedAccount, v1Account, isCharacterNotMinted])

  if (meta?.code)
    return (
      <div className={styles.bitrefillCode}>
        <p style={{ marginRight: '1rem' }}>Code:</p>
        <p style={{ fontWeight: 'bold' }}>{meta.code}</p>
      </div>
    )
  if (meta?.allCollected) {
    return (
      <div className={styles.bitrefillCode}>
        <p>All codes have already been collected</p>
      </div>
    )
  }
  if (isInProgress)
    return (
      <div className={styles.bitrefillCode}>
        <p>Loading...</p>
      </div>
    )

  return (
    <CardActionWrapper
      onButtonClick={claimCode}
      isLoading={isInProgress}
      loadingText="Signing..."
      disabled={isButtonDisabled}
      buttonText={btnText}
    />
  )
}

export default BitrefillClaim
