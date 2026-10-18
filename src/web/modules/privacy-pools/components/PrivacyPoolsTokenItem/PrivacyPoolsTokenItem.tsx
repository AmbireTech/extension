import React, { FC } from 'react'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import type { WalletStateController } from '@common/controllers/wallet-state'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import PendingBadge from '@common/modules/dashboard/components/Tokens/TokenItem/PendingBadge'
import getTokenItemStyles from '@common/modules/dashboard/components/Tokens/TokenItem/styles'
import spacings, { SPACING_2XL, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'
import { PrivacyPoolsBalanceDisplay } from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

const selectIsPrivacyModeEnabled = (state: WalletStateController) => state.isPrivacyModeEnabled

/**
 * A Privacy Pools token, laid out like the regular dashboard's token row. While part of it is
 * still being verified, that part and the part that can already be sent are shown below it.
 */
const PrivacyPoolsTokenItem: FC<{ balance: PrivacyPoolsBalanceDisplay }> = ({ balance }) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getTokenItemStyles)
  const { state: isPrivacyModeEnabled } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )
  const {
    symbol,
    chainId,
    tokenAddress,
    totalAmount,
    approvedAmount,
    pendingAmount,
    pendingAmountRaw,
    value,
    notesSummary
  } = balance

  return (
    <View style={styles.container} testID={`privacy-pools-token-${balance.id}`}>
      <View style={flexbox.flex1}>
        <View style={[flexbox.directionRow, flexbox.flex1]}>
          <View style={[spacings.mrTy, flexbox.justifyCenter]}>
            {/* The network badge identifies the pool, like on the dashboard's token list */}
            <TokenIcon
              withContainer
              withNetworkIcon
              address={tokenAddress}
              chainId={BigInt(chainId)}
              containerHeight={40}
              containerWidth={40}
              width={32}
              height={32}
              networkSize={16}
            />
          </View>
          <View style={[flexbox.flex1, flexbox.justifyCenter, spacings.mr]}>
            <Text fontSize={16} weight="semiBold" numberOfLines={1} style={{ lineHeight: 22 }}>
              {symbol}
            </Text>
            <Text fontSize={12} weight="number_medium" appearance="secondaryText" numberOfLines={1}>
              {privateValue(formatDecimals(Number(totalAmount), 'amount'), isPrivacyModeEnabled)}
              {!!notesSummary && !isPrivacyModeEnabled && ` (${notesSummary})`}
            </Text>
          </View>
          {value !== null && (
            <View style={[flexbox.alignEnd, flexbox.justifyCenter]}>
              <Text fontSize={16} weight="number_bold" style={{ lineHeight: 22 }}>
                {privateValue(formatDecimals(value, 'value'), isPrivacyModeEnabled, 8)}
              </Text>
            </View>
          )}
        </View>

        {!!pendingAmount && (
          <View style={[{ marginLeft: SPACING_2XL + SPACING_TY }, spacings.mtSm]}>
            {/* Privacy Pools checks every transfer into it before the funds can be sent on */}
            <PendingBadge
              amount={pendingAmountRaw}
              amountFormatted={
                privateValue(
                  formatDecimals(Number(pendingAmount), 'amount'),
                  isPrivacyModeEnabled
                ) ?? ''
              }
              label="being verified"
              backgroundColor={theme.infoBackground}
              textColor={theme.infoText}
            />
            <View
              style={[flexbox.directionRow, flexbox.alignCenter, spacings.phSm, { height: 30 }]}
            >
              <Text color={theme.successText} weight="medium" fontSize={12} numberOfLines={1}>
                {privateValue(
                  formatDecimals(Number(approvedAmount), 'amount'),
                  isPrivacyModeEnabled
                )}{' '}
                {t('(ready to send)')}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsTokenItem)
