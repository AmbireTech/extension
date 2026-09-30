import React from 'react'
import { View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

interface Props {
  onBuyWalletPress: () => void
}

/** Shown when the account holds neither $WALLET nor stkWALLET, so there is nothing to stake. */
const EmptyState = ({ onBuyWalletPress }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <InfoIcon width={64} height={64} color={theme.infoText} />
      </View>
      <Text fontSize={16} style={styles.emptyText}>
        {t('You don’t have any $WALLET or stkWALLET tokens in your portfolio.')}
      </Text>
      <GlassView borderRadius={32} cssStyle={{ overflow: 'hidden' }}>
        <View style={styles.buyWalletWrapper}>
          <Button
            type="primary"
            text={t('Buy $WALLET')}
            onPress={onBuyWalletPress}
            hasBottomSpacing={false}
            style={styles.buyWalletButton}
            testID="wallet-staking-buy-wallet"
            size="smaller"
          />
        </View>
      </GlassView>
    </View>
  )
}

export default React.memo(EmptyState)
