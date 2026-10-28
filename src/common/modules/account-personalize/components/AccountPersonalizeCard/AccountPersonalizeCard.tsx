import React, { useCallback } from 'react'
import { Control, Controller } from 'react-hook-form'
import { View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import AccountAddress from '@common/components/AccountAddress'
import Avatar from '@common/components/Avatar'
import EditableAccountName from '@common/components/EditableAccountName'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const NAME_TEXT_PROPS = { weight: 'medium' } as const

type Props = {
  account: Account
  index: number
  control: Control<{
    accounts: Account[]
  }>
  hasBottomSpacing?: boolean
  disableEdit?: boolean
  // The name lives in the form until the accounts are added, so this only updates the form
  onSaveName: (addr: Account['addr'], name: string) => Promise<void>
  style?: ViewStyle
}

const AccountPersonalizeCard = ({
  account,
  index,
  control,
  hasBottomSpacing = true,
  disableEdit,
  onSaveName,
  style
}: Props) => {
  const { addr: address, preferences } = account
  const reverseLookup = useReverseLookup({ address })
  const { styles } = useTheme(getStyles)

  const handleSaveName = useCallback(
    (name: string) => onSaveName(address, name),
    [address, onSaveName]
  )

  return (
    <View style={[styles.container, !hasBottomSpacing && spacings.mb0, style]}>
      <View style={[flexbox.justifySpaceBetween, flexbox.alignCenter, flexbox.directionRow]}>
        <View
          testID="personalize-account"
          style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}
        >
          <Avatar
            address={account.addr}
            smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
            pfp={preferences.pfp}
          />
          <View style={flexbox.flex1}>
            <View style={[flexbox.directionRow, flexbox.flex1]}>
              <Controller
                control={control}
                name={`accounts.${index}.preferences.label`}
                render={() => (
                  <EditableAccountName
                    account={account}
                    name={account.preferences.label}
                    onSave={handleSaveName}
                    testID={`edit-name-field-${index}`}
                    textProps={NAME_TEXT_PROPS}
                    disabled={disableEdit}
                  />
                )}
              />
            </View>
            <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
              <AccountAddress
                {...reverseLookup}
                address={address}
                plainAddressMaxLength={18}
                withCopy={false}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default React.memo(AccountPersonalizeCard)
