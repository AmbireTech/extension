import React, { FC, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import {
  isAmbireV1LinkedAccount as getIsAmbireV1LinkedAccount,
  isSmartAccount as getIsSmartAccount
} from '@ambire-common/libs/account/account'
import spacings from '@common/styles/spacings'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'

import useDelegationControllerState from '@web/hooks/useDelegationControllerState'
import BadgeWithPreset from '../BadgeWithPreset'

interface Props {
  accountData: Account
}

const AccountBadges: FC<Props> = ({ accountData }) => {
  const keystoreCtrl = useKeystoreControllerState()
  const { accountDelegations } = useDelegationControllerState()

  const isSmartAccount = useMemo(
    () => getIsSmartAccount(accountData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountData?.addr]
  )

  const isAmbireV1LinkedAccount = useMemo(() => {
    return getIsAmbireV1LinkedAccount(accountData?.creation?.factoryAddr)
  }, [accountData?.creation?.factoryAddr])

  const hasMetamaskDelegation = useMemo(() => {
    if (accountData.creation) return false
    const delegations = accountDelegations[accountData.addr]
    if (!delegations) return false

    let delegationFound = false
    Object.keys(delegations).forEach((netKey) => {
      if (delegationFound) return
      delegationFound = !!delegations[netKey].isMetamask
    })
    return delegationFound
  }, [accountData, accountDelegations])

  return (
    <>
      {keystoreCtrl.keys.every((k) => !accountData?.associatedKeys.includes(k.addr)) && (
        <BadgeWithPreset preset="view-only" style={spacings.mlTy} />
      )}
      {isSmartAccount && isAmbireV1LinkedAccount && (
        <BadgeWithPreset preset="ambire-v1" style={spacings.mlTy} />
      )}
      {hasMetamaskDelegation && <BadgeWithPreset preset="metamask" style={spacings.mlTy} />}
    </>
  )
}

export default React.memo(AccountBadges)
