import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import EditIcon from '@common/assets/svg/EditIcon'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

type Props = {
  value: string
  isEditEnabled: boolean
  symbol: string
  info?: any
  disabled?: boolean
  setCustomFee: (val: any) => any
  setEnableEdit: () => void
}

const CustomFee = ({
  setCustomFee,
  value,
  isEditEnabled,
  setEnableEdit,
  symbol,
  info,
  disabled
}: Props) => {
  const { t } = useTranslation()

  const handleEnableEdit = () => {
    !!setEnableEdit && setEnableEdit()
  }

  if (!isEditEnabled || !!disabled) {
    return (
      <TouchableOpacity
        style={[
          spacings.mbSm,
          flexboxStyles.directionRow,
          flexboxStyles.alignCenter,
          !!disabled && { opacity: 0.6 }
        ]}
        onPress={handleEnableEdit}
        disabled={disabled}
      >
        <View style={spacings.mrMi}>
          <EditIcon />
        </View>
        <Text weight="regular">{t('Edit fee')}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.customFeeContainer}>
      <NumberInput
        label={t('Custom fee ({{symbol}})', { symbol })}
        placeholder={t('Enter amount')}
        onChangeText={setCustomFee}
        value={value}
        autoCorrect={false}
        info={info}
        infoTextStyle={{
          opacity: 1
        }}
        containerStyle={spacings.mbMi}
      />
    </View>
  )
}

export default CustomFee
