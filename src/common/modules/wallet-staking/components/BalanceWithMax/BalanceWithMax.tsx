import React from 'react'
import { Pressable, View } from 'react-native'

import WalletIcon from '@common/assets/svg/WalletIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  balanceLabel: string
  tokenSymbol: string
  disabled: boolean
  onMaxPress: () => void
  testID: string
}

const BalanceWithMax = ({ balanceLabel, tokenSymbol, disabled, onMaxPress, testID }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, styles.balanceWithMax]}>
      <WalletIcon width={20} height={20} color={theme.tertiaryText} />
      <Text
        numberOfLines={1}
        fontSize={12}
        weight="medium"
        appearance="tertiaryText"
        ellipsizeMode="tail"
        style={spacings.mlMi}
      >
        {balanceLabel} {tokenSymbol}
      </Text>
      <Pressable
        style={({ hovered }: any) => [
          styles.maxButton,
          {
            backgroundColor:
              hovered && !disabled
                ? hexToRgba(theme.primaryAccent200, 0.16)
                : theme.primaryAccent100
          },
          disabled && styles.maxButtonDisabled
        ]}
        onPress={onMaxPress}
        disabled={disabled}
      >
        <Text fontSize={12} weight="medium" appearance="primary" testID={testID}>
          {t('Max')}
        </Text>
      </Pressable>
    </View>
  )
}

export default React.memo(BalanceWithMax)
