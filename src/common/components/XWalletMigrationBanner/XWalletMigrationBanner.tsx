import React from 'react'
import { ViewStyle } from 'react-native'

import Banner from '@common/components/Banner'
import { useTranslation } from '@common/config/localization'
import useXWalletMigration from '@common/modules/wallet-staking/hooks/useXWalletMigration'

interface Props {
  address: string
  chainId: bigint
  xWalletAmount: bigint
  style?: ViewStyle
}

/**
 * Explains that xWALLET was replaced by stkWALLET and lets the user migrate their balance.
 * Renders nothing for any other token or when there's nothing left to migrate.
 */
const XWalletMigrationBanner = ({ address, chainId, xWalletAmount, style }: Props) => {
  const { t } = useTranslation()
  const { isLegacyXWallet, hasLockedShares, migrateXWallet } = useXWalletMigration({
    address,
    chainId,
    xWalletAmount
  })

  if (!isLegacyXWallet) return null

  const text = hasLockedShares
    ? t(
        '$xWALLET was the original staking token for $WALLET. Move your balance to $stkWALLET, the token that replaced it. The part of your balance that is waiting to be unstaked will stay as it is.'
      )
    : t(
        '$xWALLET was the original staking token for $WALLET. Move your balance to $stkWALLET, the token that replaced it.'
      )

  return (
    <Banner
      type="warning"
      title={t('$xWALLET was replaced by $stkWALLET')}
      text={text}
      buttonText={t('Migrate to $stkWALLET')}
      onPress={migrateXWallet}
      style={style}
    />
  )
}

export default React.memo(XWalletMigrationBanner)
