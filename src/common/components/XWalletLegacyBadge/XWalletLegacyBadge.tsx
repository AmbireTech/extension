import React from 'react'
import { View } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useXWalletMigration from '@common/modules/wallet-staking/hooks/useXWalletMigration'

import getStyles from './styles'

interface Props {
  address: string
  chainId: bigint
  xWalletAmount: bigint
  tooltipId: string
  testID?: string
}

/**
 * Marks an xWALLET balance the user can still migrate to stkWALLET. It's only a label - the
 * migration starts from `XWalletMigrationBanner` in the token details. Renders nothing for any
 * other token, so it can sit next to a token's symbol without the surrounding screen having to
 * know what the token is.
 */
const XWalletLegacyBadge = ({ address, chainId, xWalletAmount, tooltipId, testID }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { isLegacyXWallet } = useXWalletMigration({ address, chainId, xWalletAmount })
  const tooltipContent = t(
    '$xWALLET was the original staking token for the underlying $WALLET token. It was replaced by $stkWALLET.'
  )

  if (!isLegacyXWallet) return null

  return (
    <View
      style={styles.badge}
      dataSet={createGlobalTooltipDataSet({ id: tooltipId, content: tooltipContent })}
      accessibilityLabel={tooltipContent}
      testID={testID}
    >
      <View style={styles.badgeDot} />
      <Text fontSize={8} weight="medium" appearance="warningText">
        {t('LEGACY')}
      </Text>
    </View>
  )
}

export default React.memo(XWalletLegacyBadge)
