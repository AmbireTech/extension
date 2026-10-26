import React, { useCallback } from 'react'
import { Control, Controller } from 'react-hook-form'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import AccountKeysBadge from '@common/components/AccountKeysBadge'
import Avatar from '@common/components/Avatar'
import EditableAccountName from '@common/components/EditableAccountName'
import { isMobile, isWeb } from '@common/config/env'
import useAccountKeys from '@common/hooks/useAccountKeys'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
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
  onSaveName: (addr: Account['addr'], name: string) => Promise<void>
}

const AccountPersonalizeCard = ({
  account,
  index,
  control,
  hasBottomSpacing = true,
  disableEdit,
  onSaveName
}: Props) => {
  const { addr: address, preferences } = account
  const reverseLookup = useReverseLookup({ address })
  const accountKeys = useAccountKeys(account)
  const { styles } = useTheme(getStyles)

  const handleSaveName = useCallback(
    (name: string) => onSaveName(address, name),
    [address, onSaveName]
  )

  return (
    <View style={[styles.container, !hasBottomSpacing && spacings.mb0]}>
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
              {/* On mobile the keys badge and the other badges move to the row below the address */}
              {isWeb && <AccountBadges accountData={account} accountKeys={accountKeys} />}
            </View>
            <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
              <AccountAddress
                {...reverseLookup}
                address={address}
                plainAddressMaxLength={18}
                withCopy={false}
              />
            </View>
            {isMobile && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  spacings.mtMi,
                  { columnGap: SPACING_TY }
                ]}
              >
                <AccountKeysBadge account={account} accountKeys={accountKeys} />
                <AccountBadges
                  accountData={account}
                  accountKeys={accountKeys}
                  withSpacing={false}
                  withViewOnly={false}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

export default React.memo(AccountPersonalizeCard)
