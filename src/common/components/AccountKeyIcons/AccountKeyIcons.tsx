import React from 'react'
import { ColorValue, View } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import AccountKeyBanner from '../AccountKeyBanner'
import AccountKeyIcon from '../AccountKeyIcon/AccountKeyIcon'

export type KeyType = Key['type'] | 'none' | 'safe'

const AccountKeyIconOrBanner = ({
  type,
  isExtended,
  color
}: {
  type: KeyType
  isExtended: boolean
  color: string | ColorValue
}) => {
  return isExtended ? (
    <AccountKeyBanner type={type} />
  ) : (
    <AccountKeyIcon type={type} color={color} />
  )
}

const AccountKeyIcons = ({
  account,
  accountKeys,
  isExtended,
  // When false, drops the leading left margin so a parent columnGap can space it
  withContainerSpacing = true
}: {
  account: AccountInterface
  /** The account's own keystore keys, so a list of rows subscribes to them only once */
  accountKeys: Key[]
  isExtended: boolean
  withContainerSpacing?: boolean
}) => {
  const { theme } = useTheme()
  const importedKeyTypes = React.useMemo(
    () => Array.from(new Set(accountKeys.map((key) => key.type))),
    [accountKeys]
  )
  const hasKeys = importedKeyTypes.length > 0

  if (account.safeCreation)
    return (
      <AccountKeyIconOrBanner type="safe" isExtended={isExtended} color={theme.primaryBackground} />
    )

  // In extended (banner) mode a keyless account renders nothing, so avoid an empty
  // wrapper that would still consume a slot in a parent columnGap layout
  if (!hasKeys && isExtended) return null

  return (
    <View
      style={[
        flexbox.directionRow,
        hasKeys && withContainerSpacing ? spacings.mlTy : spacings.ml0,
        { columnGap: SPACING_TY }
      ]}
    >
      {hasKeys ? (
        importedKeyTypes.map((type) => {
          return (
            <View key={type || 'internal'}>
              <AccountKeyIconOrBanner
                type={type || 'internal'}
                isExtended={isExtended}
                color={theme.primaryBackground}
              />
            </View>
          )
        })
      ) : (
        <AccountKeyIconOrBanner
          type={'none'}
          isExtended={isExtended}
          color={theme.primaryBackground}
        />
      )}
    </View>
  )
}

export default React.memo(AccountKeyIcons)
