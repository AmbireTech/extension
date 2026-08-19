import React, { useCallback } from 'react'
import { View } from 'react-native'

import { WALLET_TOKEN } from '@ambire-common/consts/addresses'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import Badge from '@common/components/Badge'
import ManifestImage from '@common/components/ManifestImage'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const WALLET_ICON_URL = `https://cena.ambire.com/iconProxy/ethereum/${WALLET_TOKEN}`

interface Props {
  onPress: () => void
}

const WalletStakingCard = ({ onPress }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const [bindAnimation, animatedStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })

  const renderFallback = useCallback(
    () => (
      <View style={styles.iconFallback}>
        <AmbireLogo width={22} height={34} />
      </View>
    ),
    [styles.iconFallback]
  )

  return (
    <View style={styles.cardWrapper}>
      <AnimatedPressable
        testID="wallet-staking-card"
        onPress={onPress}
        style={[styles.card, animatedStyle]}
        {...bindAnimation}
      >
        <View style={[styles.cardContent, { backgroundColor: 'transparent' }]}>
          <View style={styles.cardHeader}>
            <ManifestImage
              uri={WALLET_ICON_URL}
              size={40}
              fallback={renderFallback}
              containerStyle={[spacings.mrTy, { backgroundColor: theme.primaryBackground }]}
            />
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
