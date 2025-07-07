import { getAddress } from 'ethers'
import React, { FC, useMemo, useState } from 'react'

import useAddressInput from '@common/hooks/useAddressInput'
import useStandaloneAddressInput from '@common/hooks/useStandaloneAddressInput'
import AddressInput from '@legends/components/AddressInput'
import { ERROR_MESSAGES } from '@legends/constants/errors/messages'
import { BASE_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useToast from '@legends/hooks/useToast'
import { useCardActionContext } from '@legends/modules/legends/components/ActionModal'
import { MAX_INVITATIONS } from '@legends/modules/legends/constants'
import { useInviteCard } from '@legends/modules/legends/hooks'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

import CardActionWrapper from './CardActionWrapper'

type Props = {
  buttonText: string
  alreadyLinkedAccounts: string[]
  alreadyInvitedAccounts: string[]
  usedInvitationSlots: number
  usersInvitationHistory: {
    invitee: string
    date: string
    status: 'pending' | 'expired' | 'accepted'
  }[]
}

const InviteAcc: FC<Props> = ({
  buttonText,
  alreadyLinkedAccounts,
  alreadyInvitedAccounts,
  usedInvitationSlots,
  usersInvitationHistory
}) => {
  const { addToast } = useToast()
  const { onComplete, handleClose } = useCardActionContext()

  const { connectedAccount, allAccounts, v1Account } = useAccountContext()
  const isInvalidAccount = Boolean(!connectedAccount || v1Account)
  const [isInProgress, setIsInProgress] = useState(false)

  const {
    address: v1OrEoaAddress,
    addressState,
    setAddressState,
    handleCacheResolvedDomain,
    setAddressStateKeyValue
  } = useStandaloneAddressInput()

  const overwriteErrorMessage = useMemo(() => {
    if (usersInvitationHistory.some(({ invitee }) => invitee === v1OrEoaAddress))
      return 'You already invited this account once.'

    if (v1OrEoaAddress === connectedAccount) {
      return 'You cannot invite your connected account.'
    }
    if (alreadyLinkedAccounts.includes(v1OrEoaAddress)) {
      return 'This account has already been linked.'
    }

    if (alreadyInvitedAccounts.includes(v1OrEoaAddress)) {
      return 'This account has already been invited.'
    }

    if (usedInvitationSlots >= MAX_INVITATIONS) return 'No more invitations left'

    return ''
  }, [
    connectedAccount,
    v1OrEoaAddress,
    alreadyInvitedAccounts,
    alreadyLinkedAccounts,
    usedInvitationSlots,
    usersInvitationHistory
  ])

  const overwriteSuccessMessage = useMemo(() => {
    let checksummedAddress = ''

    try {
      checksummedAddress = getAddress(v1OrEoaAddress)
    } catch {
      return ''
    }

    if (allAccounts.includes(checksummedAddress)) {
      return "The account you're trying to invite is imported in your wallet. You won't gain any additional XP by inviting it before linking it."
    }

    return ''
  }, [allAccounts, v1OrEoaAddress])

  const { validation } = useAddressInput({
    addressState,
    setAddressState: setAddressStateKeyValue,
    handleCacheResolvedDomain,
    overwriteError: overwriteErrorMessage,
    overwriteValidLabel: overwriteSuccessMessage
  })

  const { inviteEOA, switchNetwork } = useInviteCard({
    address: v1OrEoaAddress,
    setAddress: (address) => setAddressStateKeyValue({ fieldValue: address })
  })

  const onButtonClick = async () => {
    try {
      await switchNetwork(BASE_CHAIN_ID)
      setIsInProgress(true)
      const txnId = await inviteEOA()
      onComplete(txnId)
      handleClose()
    } catch (e: any) {
      const message = humanizeError(e, ERROR_MESSAGES.transactionSigningFailed)

      addToast(message, { type: 'error' })
      console.error(e)
    } finally {
      setIsInProgress(false)
    }
  }

  return (
    <CardActionWrapper
      isLoading={isInProgress}
      loadingText="Signing..."
      buttonText={
        isInvalidAccount
          ? 'Switch to a new account to unlock Rewards quests. Ambire legacy Web accounts (V1) are not supported.'
          : buttonText
      }
      disabled={isInvalidAccount || validation.isError || addressState.isDomainResolving}
      onButtonClick={onButtonClick}
    >
      <AddressInput
        disabled={usedInvitationSlots >= MAX_INVITATIONS}
        addressState={addressState}
        setAddressState={setAddressState}
        validation={validation}
        label="Ambire v1 or EOA account address"
        rightLabel={`Left invitations ${MAX_INVITATIONS - usedInvitationSlots}/2`}
      />
    </CardActionWrapper>
  )
}

export default InviteAcc
