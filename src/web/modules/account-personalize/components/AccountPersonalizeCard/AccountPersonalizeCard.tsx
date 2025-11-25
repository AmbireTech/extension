import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import Avatar from '@common/components/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import Editable from '@common/components/Editable'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  account: Account
  index: number
  control: Control<{
    accounts: Account[]
  }>
  hasBottomSpacing?: boolean
  disableEdit?: boolean
  onSave: (value: string) => void
}

const AccountPersonalizeCard = ({
  account,
  index,
  control,
  hasBottomSpacing = true,
  disableEdit,
  onSave
}: Props) => {
  const { addr: address, preferences } = account
  const { ens, isLoading } = useReverseLookup({ address })
  const { styles } = useTheme(getStyles)

  return (
    <View style={[styles.container, !hasBottomSpacing && spacings.mb0]}>
      <View
        style={[
          flexbox.flex1,
          flexbox.justifySpaceBetween,
          flexbox.alignCenter,
          flexbox.directionRow
        ]}
      >
        <View
          testID="personalize-account"
          style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}
        >
          <Avatar address={account.addr} isSmart={isSmartAccount(account)} pfp={preferences.pfp} />
          <View style={flexbox.flex1}>
            <View style={[flexbox.directionRow, flexbox.flex1]}>
              <Controller
                control={control}
                name={`accounts.${index}.preferences.label`}
                render={({ field: { onChange, value } }) => (
                  <Editable
                    setCustomValue={onChange}
                    customValue={value}
                    initialValue={preferences.label}
                    testID={`edit-name-field-${index}`}
                    height={24}
                    textProps={{ weight: 'medium' }}
                    disabled={disableEdit}
                    onSave={onSave}
                  />
                )}
              />
              <AccountBadges accountData={account} />
            </View>
            <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
              <DomainBadge ens={ens} />
              <AccountAddress
                ens={ens}
                isLoading={isLoading}
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
