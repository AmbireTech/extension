import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { Image, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import Badge from '@common/components/Badge'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import { buildInAvatars, getAccountPfpSource } from './avatars'
import AvatarsSelectorItem from './AvatarSelectorItem'
import getStyles from './styles'

export type AccountPersonalizeFormValues = {
  preferences: {
    account: Account
    label: string
    pfp: string
  }[]
}

type Props = {
  address: Account['addr']
  isSmartAccount: boolean
  pfp: string
  index: number
  control: Control<AccountPersonalizeFormValues>
  hasBottomSpacing?: boolean
}

const AccountPersonalizeCard = ({
  address,
  isSmartAccount,
  index,
  pfp,
  control,
  hasBottomSpacing = true
}: Props) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const accountPfpSource = getAccountPfpSource(pfp)

  return (
    <View style={[styles.container, !hasBottomSpacing && spacings.mb0]}>
      <View
        style={[
          flexboxStyles.justifySpaceBetween,
          flexboxStyles.alignCenter,
          flexboxStyles.directionRow,
          spacings.mbSm,
          { width: 600 }
        ]}
      >
        <View style={[flexboxStyles.directionRow]}>
          <Image source={accountPfpSource} style={styles.pfp} resizeMode="contain" />
          <View style={{ alignItems: 'flex-start' }}>
            <Text fontSize={16} weight="medium" style={spacings.mb}>
              {address}
            </Text>
            {isSmartAccount ? (
              <Badge withIcon type="success" text={t('Smart Account')} />
            ) : (
              <Badge withIcon type="warning" text={t('Legacy Account')} />
            )}
          </View>
        </View>
      </View>

      <Text style={[spacings.mbTy]} fontSize={14} appearance="secondaryText">
        <Text fontSize={14} appearance="secondaryText">
          {t('Account label')}
        </Text>
        {'  '}
        <Text weight="light" appearance="secondaryText" fontSize={12}>
          {t('(Use up to 40 characters)')}
        </Text>
      </Text>

      <Controller
        control={control}
        name={`preferences.${index}.label`}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            numberOfLines={1}
            maxLength={40}
            containerStyle={[spacings.mbLg, { maxWidth: 320 }]}
          />
        )}
      />

      <Text style={[spacings.mbTy]} fontSize={14} appearance="secondaryText">
        {t('Choose an avatar')}
      </Text>
      <View style={[flexboxStyles.directionRow]}>
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
      </View>
    </View>
  )
}

export default React.memo(AccountPersonalizeCard)
