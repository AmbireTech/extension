import React, { FC, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import {
  isAmbireV1LinkedAccount as getIsAmbireV1LinkedAccount,
  isSmartAccount as getIsSmartAccount
} from '@ambire-common/libs/account/account'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import BadgeWithPreset from '../BadgeWithPreset'

interface Props {
  accountData: Account
  /** The account's own keystore keys, so a list of rows subscribes to them only once */
  accountKeys: Key[]
  // When false, badges drop their fixed left margin so a parent columnGap can space them
  withSpacing?: boolean
}

const AccountBadges: FC<Props> = ({ accountData, accountKeys, withSpacing = true }) => {
  const { theme } = useTheme()

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
      {!accountKeys.length && !isSafeAccount && (
        <BadgeWithPreset
          preset="view-only"
          style={{
            ...(withSpacing ? spacings.mlTy : {}),
            borderWidth: 1,
            borderColor: theme.neutral600
          }}
        />
      )}

      {isSmartAccount && isAmbireV1LinkedAccount && (
        <BadgeWithPreset preset="ambire-v1" style={withSpacing ? spacings.mlTy : undefined} />
      )}
    </>
  )
}

export default React.memo(AccountBadges)
