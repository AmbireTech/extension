import React, { FC, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import {
  isAmbireV1LinkedAccount as getIsAmbireV1LinkedAccount,
  isSmartAccount as getIsSmartAccount
} from '@ambire-common/libs/account/account'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

import BadgeWithPreset from '../BadgeWithPreset'

interface Props {
  accountData: Account
}

const AccountBadges: FC<Props> = ({ accountData }) => {
  const keystoreCtrl = useController('KeystoreController').state

  const isSmartAccount = useMemo(
    () => getIsSmartAccount(accountData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accountData?.addr]
  )

  const isAmbireV1LinkedAccount = useMemo(() => {
    return getIsAmbireV1LinkedAccount(accountData?.creation?.factoryAddr)
  }, [accountData?.creation?.factoryAddr])

  const isSafeAccount = !!accountData.safeCreation

  return (
    <>
      {keystoreCtrl.keys.every((k) => !accountData?.associatedKeys.includes(k.addr)) &&
        !isSafeAccount && <BadgeWithPreset preset="view-only" style={spacings.mlTy} />}

      {isSmartAccount && isAmbireV1LinkedAccount && (
        <BadgeWithPreset preset="ambire-v1" style={spacings.mlTy} />
      )}
    </>
  )
}

export default React.memo(AccountBadges)
