/* eslint-disable no-console */

import { Interface } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
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
  const { browserProvider } = useProviderContext()
  const { connectedAccount, v1Account } = useAccountContext()
  const { t } = useTranslation()

  const claimCode = useCallback(async () => {
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
    if (!connectedAccount || v1Account)
      return 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
    return 'Claim code'
  }, [connectedAccount, v1Account])

  const isButtonDisabled = useMemo(() => {
    if (!connectedAccount || v1Account) return true
    return false
  }, [connectedAccount, v1Account])

  const copyText = useCallback(async () => {
    await navigator.clipboard.writeText(meta?.code || '')
    addToast(t('Code copied to clipboard'))
  }, [meta?.code, addToast, t])

  if (meta?.code)
    return (
      <div className={styles.totalTextContainer}>
        <div className={styles.codeContainer}>
          <p>Code:</p>
          <Pressable onPress={copyText}>
            <div className={styles.bitrefillCode}>
              <p style={{ fontWeight: 'bold' }}>{meta.code}</p>
              <CopyIcon
                color="#7C51FF"
                width="1.5rem"
                height="1.5rem"
                style={{ marginLeft: '1.25rem' }}
              />
            </div>
          </Pressable>
        </div>
      </div>
    )
  if (meta?.allCollected) {
    return (
      <div className={styles.infoText}>
        <p>All codes have already been collected!</p>
      </div>
    )
  }
  if (isInProgress)
    return (
      <div className={styles.infoText}>
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
