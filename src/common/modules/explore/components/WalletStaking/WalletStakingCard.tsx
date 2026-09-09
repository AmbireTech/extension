import { LinearGradient } from 'expo-linear-gradient'
import React, { useMemo } from 'react'
import { Image, ImageSourcePropType, View } from 'react-native'

import walletStakingIcon from '@common/assets/images/WalletStakingIcon.png'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

interface Props {
  onPress: () => void
}

const GRADIENT_LOCATIONS = [0, 0.5, 1] as const
const GRADIENT_START = { x: 0, y: 0.5 } as const
const GRADIENT_END = { x: 1, y: 0.5 } as const

const WalletStakingCard = ({ onPress }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const gradientColors = useMemo(
    () =>
      [
        hexToRgba(theme.secondaryAccent300, 0.12),
        hexToRgba(theme.secondaryAccent300, 0),
        hexToRgba(theme.primaryAccent200, 0.16)
      ] as const,
    [theme.primaryAccent200, theme.secondaryAccent300]
  )
  const [bindAnimation, animatedStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })

  return (
    <View style={styles.cardWrapper}>
      <AnimatedPressable
        testID="wallet-staking-card"
        onPress={onPress}
        style={[styles.card, animatedStyle]}
        {...bindAnimation}
      >
        <LinearGradient
          pointerEvents="none"
          colors={gradientColors}
          locations={GRADIENT_LOCATIONS}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.cardGradient}
        />
        <View style={[styles.cardContent, { backgroundColor: 'transparent' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.walletStakingIconWrapper, spacings.mrTy]}>
              <Image
                source={walletStakingIcon as ImageSourcePropType}
                resizeMode="contain"
                style={styles.walletStakingIcon}
              />
            </View>
            <View style={[flexbox.flex1]}>
              <View style={styles.cardTitleWrapper}>
                <Text
                  weight="semiBold"
                  fontSize={14}
                  numberOfLines={1}
                  style={[flexbox.flex1, spacings.mrTy]}
                >
                  {t('$WALLET Staking')}
                </Text>
                <Badge
                  text={t('Integrated')}
                  type="secondaryAccent"
                  style={{ backgroundColor: theme.secondaryAccent200 }}
                  textStyle={{ color: theme.primaryAccent500 }}
                />
              </View>
              <View>
                <Text
                  weight="medium"
                  fontSize={10}
                  appearance="tertiaryText"
                  numberOfLines={1}
                  style={[text.left, spacings.mrTy]}
                >
                  {t('ambire.com/token')}
                </Text>
              </View>
            </View>
          </View>
          <Text appearance="secondaryText" fontSize={12} style={styles.cardDescription}>
            {t('Manage the Ambire $WALLET utility and governance token.')}
          </Text>
        </View>
      </AnimatedPressable>
    </View>
  )
}

export default React.memo(WalletStakingCard)
