import React from 'react'
import { ColorValue, View } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'

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
  isExtended
}: {
  account: AccountInterface
  isExtended: boolean
}) => {
  const { keys } = useKeystoreControllerState()
  const { theme, themeType } = useTheme()
  const associatedKeys = account?.associatedKeys || []
  const importedKeyTypes = Array.from(
    new Set(keys.filter(({ addr }) => associatedKeys.includes(addr)).map((key) => key.type))
  )
  const hasKeys = React.useMemo(() => importedKeyTypes.length > 0, [importedKeyTypes])

  if (account.safeCreation)
    return (
      <AccountKeyIconOrBanner type="safe" isExtended={isExtended} color={theme.primaryBackground} />
    )

  return (
    <View style={[flexbox.directionRow, hasKeys ? spacings.mlTy : spacings.ml0]}>
      {hasKeys ? (
        importedKeyTypes.map((type, index) => {
          return (
            <View
              key={type || 'internal'}
              style={[index !== importedKeyTypes.length - 1 ? spacings.mrTy : spacings.mr0]}
            >
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
