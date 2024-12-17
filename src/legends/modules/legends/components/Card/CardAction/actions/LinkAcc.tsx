/* eslint-disable no-console */
import { BrowserProvider, getAddress, Interface, ZeroAddress } from 'ethers'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { Legends as LEGENDS_CONTRACT_ABI } from '@ambire-common/libs/humanizer/const/abis/Legends'
import useAddressInput from '@common/hooks/useAddressInput'
import useStandaloneAddressInput from '@common/hooks/useStandaloneAddressInput'
import AddressInput from '@legends/components/AddressInput'
import Alert from '@legends/components/Alert'
import Stepper from '@legends/components/Stepper'
import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import useAccountContext from '@legends/hooks/useAccountContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { humanizeLegendsBroadcastError } from '@legends/modules/legends/utils/errors/humanizeBroadcastError'

import styles from './Action.module.scss'
import CardActionWrapper from './CardActionWrapper'
import { CardProps } from './types'

enum STEPS {
  SIGN_MESSAGE,
  SIGN_TRANSACTION
}

const BUTTON_TEXT = {
  [STEPS.SIGN_MESSAGE]: 'Sign message',
  [STEPS.SIGN_TRANSACTION]: 'Sign transaction'
}

const STEPPER_STEPS = [
  'Sign a message with the Basic or v1 account you want to link',
  'Sign a transaction with your v2 account'
]

const LEGENDS_CONTRACT_INTERFACE = new Interface(LEGENDS_CONTRACT_ABI)

const LinkAcc: FC<CardProps> = ({ onComplete, handleClose }) => {
  const { addToast } = useToast()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const switchNetwork = useSwitchNetwork()
  const { connectedAccount, allAccounts, setAllowNonV2Connection } = useAccountContext()

  const [isInProgress, setIsInProgress] = useState(false)
  const [v1OrBasicSignature, setV1OrBasicSignature] = useState('')
  const [messageSignedForV2Account, setMessageSignedForV2Account] = useState('')

  const {
    address: v1OrEoaAddress,
    addressState,
    setAddressState,
    handleCacheResolvedDomain,
    setAddressStateKeyValue
  } = useStandaloneAddressInput()

  const customValidation = useMemo(() => {
    let checksummedAddress = ''

    try {
      checksummedAddress = getAddress(v1OrEoaAddress)
    } catch {
      return 'Invalid address checksum.'
    }

    if (checksummedAddress === connectedAccount) {
      return 'You cannot tame your connected account.'
    }

    if (!allAccounts.includes(checksummedAddress)) {
      return 'You cannot tame an account that is not in your wallet.'
    }

    return ''
  }, [allAccounts, connectedAccount, v1OrEoaAddress])

  const { validation } = useAddressInput({
    addressState,
    setAddressState: setAddressStateKeyValue,
    addToast,
    handleCacheResolvedDomain,
    overwriteError: customValidation
  })

  const activeStep = useMemo(() => {
    if (v1OrBasicSignature) return STEPS.SIGN_TRANSACTION

    return STEPS.SIGN_MESSAGE
  }, [v1OrBasicSignature])

  const isActionEnabled = useMemo(() => {
    if (activeStep === STEPS.SIGN_MESSAGE) {
      return !validation?.isError && !addressState.isDomainResolving
    }

    return messageSignedForV2Account === connectedAccount
  }, [
    activeStep,
    messageSignedForV2Account,
    connectedAccount,
    validation?.isError,
    addressState.isDomainResolving
  ])

  // We don't allow non-v2 accounts to connect to Legends,
  // except when the user needs to link an EOA/v1 account to their main v2 account.
  // Therefore, we add this exception here, setting the `allowNonV2Connection` flag to true.
  // Upon unmounting, we disallow it again.
  useEffect(() => {
    setAllowNonV2Connection(true)

    return () => {
      setAllowNonV2Connection(false)
    }
  }, [setAllowNonV2Connection])

  const signV1OrBasicAccountMessage = useCallback(async () => {
    if (!v1OrEoaAddress) return

    try {
      setIsInProgress(true)
      const signature = await window.ambire.request({
        method: 'personal_sign',
        params: [`Assign ${v1OrEoaAddress} to Ambire Legends ${connectedAccount}`, v1OrEoaAddress]
      })
      setMessageSignedForV2Account(connectedAccount!)

      if (typeof signature !== 'string') throw new Error('Invalid signature')

      setV1OrBasicSignature(signature)
    } catch (e) {
      const message = humanizeLegendsBroadcastError(e)
      console.error(e)
      addToast(message || ERROR_MESSAGES.messageSigningFailed, { type: 'error' })
    } finally {
      setIsInProgress(false)
    }
  }, [addToast, connectedAccount, v1OrEoaAddress])

  const sendV2Transaction = useCallback(async () => {
    try {
      if (!connectedAccount) throw new Error('No connected account')

      setIsInProgress(true)
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner(connectedAccount)

      // no sponsorship for linkAcc
      const useSponsorship = false

      const sendCallsIdentifier = await sendCalls(
        chainId,
        await signer.getAddress(),
        [
          {
            to: LEGENDS_CONTRACT_ADDRESS,
            data: LEGENDS_CONTRACT_INTERFACE.encodeFunctionData('linkAndAcceptInvite', [
              connectedAccount,
              v1OrEoaAddress,
              ZeroAddress,
              v1OrBasicSignature
            ])
          }
        ],
        useSponsorship
      )
      const receipt = await getCallsStatus(sendCallsIdentifier)

      onComplete(receipt.transactionHash)
      handleClose()
    } catch (e: any) {
      const message = humanizeLegendsBroadcastError(e)

      console.error(e)
      addToast(message || ERROR_MESSAGES.transactionSigningFailed, { type: 'error' })

      setAllowNonV2Connection(false)
    } finally {
      setIsInProgress(false)
    }
  }, [
    connectedAccount,
    sendCalls,
    chainId,
    v1OrEoaAddress,
    v1OrBasicSignature,
    getCallsStatus,
    onComplete,
    handleClose,
    addToast,
    setAllowNonV2Connection
  ])

  const onButtonClick = useCallback(async () => {
    await switchNetwork()

    if (activeStep === STEPS.SIGN_MESSAGE) {
      await signV1OrBasicAccountMessage()
    } else if (activeStep === STEPS.SIGN_TRANSACTION) {
      await sendV2Transaction()
    }
  }, [activeStep, switchNetwork, signV1OrBasicAccountMessage, sendV2Transaction])

  return (
    <CardActionWrapper
      isLoading={isInProgress}
      loadingText="Signing..."
      disabled={!isActionEnabled}
      buttonText={BUTTON_TEXT[activeStep]}
      onButtonClick={onButtonClick}
    >
      <Stepper activeStep={activeStep} steps={STEPPER_STEPS} className={styles.stepper} />
      {activeStep === STEPS.SIGN_TRANSACTION && !isActionEnabled && (
        <Alert
          type="warning"
          title="You have connected a wrong account"
          message={`Please connect ${messageSignedForV2Account} to continue`}
        />
      )}

      {activeStep === STEPS.SIGN_MESSAGE && (
        <AddressInput
          addressState={addressState}
          setAddressState={setAddressState}
          validation={validation}
          label="Ambire v1 or Basic Account address"
        />
      )}
    </CardActionWrapper>
  )
}

export default LinkAcc
