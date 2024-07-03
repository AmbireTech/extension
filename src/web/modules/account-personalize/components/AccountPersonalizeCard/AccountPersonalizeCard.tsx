import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import Avatar from '@common/components/Avatar'
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
}

const AccountPersonalizeCard = ({ account, index, control, hasBottomSpacing = true }: Props) => {
  const { addr: address, preferences } = account
  const { ens, ud, isLoading } = useReverseLookup({ address })
  const { styles } = useTheme(getStyles)

  return (
    <View style={[styles.container, !hasBottomSpacing && spacings.mb0]}>
      <View style={[flexbox.justifySpaceBetween, flexbox.alignCenter, flexbox.directionRow]}>
        <View testID="personalize-account" style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Avatar ens={ens} ud={ud} pfp={preferences.pfp} />
          <View style={flexbox.flex1}>
            <View style={flexbox.directionRow}>
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
                  />
                )}
              />
              <AccountBadges accountData={account} />
            </View>
            <AccountAddress ens={ens} ud={ud} isLoading={isLoading} address={address} />
          </View>
        </View>
      </View>

      {/* <Text style={[spacings.mbTy]} fontSize={14} appearance="secondaryText">
        {t('Choose an avatar')}
      </Text> */}
      {/* <View style={[flexbox.directionRow]}>
        <Controller
          control={control}
          name={`preferences.${index}.pfp`}
          render={({ field: { onChange, value } }) => (
            <>
              {buildInAvatars.map(({ id, source }) => (
                <AvatarsSelectorItem
                  key={id}
                  id={id}
                  source={source}
                  isSelected={value === id}
                  setSelectedAvatar={onChange}
                />
              ))}
            </>
          )}
        />
      </View> */}
    </View>
  )
}

export default React.memo(AccountPersonalizeCard)
