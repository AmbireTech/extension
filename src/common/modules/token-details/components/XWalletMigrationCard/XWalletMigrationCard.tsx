import React, { useCallback } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { isXWalletToken } from '@common/modules/explore/helpers/isXWalletToken'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

import type { TokenResult } from '@ambire-common/libs/portfolio'

const XWalletMigrationCard = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { navigate } = useNavigation()
  const handleMigrate = useCallback(() => navigate(ROUTES.walletMigration), [navigate])

  if (!isXWalletToken(token)) return null

  return (
    <View style={[styles.card, spacings.phSm, spacings.pvSm, spacings.mbTy]}>
      <Text appearance="warningText" fontSize={16} weight="semiBold">
        {t("You're not earning staking rewards")}
      </Text>
      <Text appearance="secondaryText" fontSize={13}>
        {t(
          'Your xWALLET tokens are not earning staking rewards. Migrate them to stkWALLET now to start earning yield on your underlying $WALLET.'
        )}
      </Text>
      <View style={[styles.actions, spacings.mtSm]}>
        <Button
          text={t('Migrate now')}
          size="small"
          onPress={handleMigrate}
          hasBottomSpacing={false}
          submitOnEnter={false}
          testID="token-details-migrate-x-wallet-button"
        />
      </View>
    </View>
  )
}

export default React.memo(XWalletMigrationCard)
