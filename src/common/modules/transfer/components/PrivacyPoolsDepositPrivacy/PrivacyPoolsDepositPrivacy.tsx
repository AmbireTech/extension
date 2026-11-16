import React, { FC } from 'react'
import { View } from 'react-native'

import { getPrivacyPoolsTokenId } from '@ambire-common/consts/privacyPools'
import { PrivacyPoolsDepositPrivacy as DepositPrivacy } from '@ambire-common/interfaces/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import PrivacyStatus from '@common/components/PrivacyStatus'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { PRIVACY_POOLS_DEPOSIT_FEE_TOOLTIP } from '@common/modules/transfer/hooks/usePrivacyPoolsDepositFee'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { formatPrivacyPoolsAmount } from '@common/utils/privacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectDepositAssetConfigs = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.depositAssetConfigs

/** 10000 basis points make 100% */
const BASIS_POINTS_PER_PERCENT = 100

const FEE_TOOLTIP_ID = 'privacy-pools-deposit-protocol-fee'

type Props = {
  privacy: DepositPrivacy
  token: { chainId: bigint; address: string; symbol: string; decimals: number }
  /** The typed amount in the token's smallest unit, which goes into the pool. */
  amount: bigint
  /** The pool's fee on top of `amount`, or null until it is read. */
  feeAmount: bigint | null
  disabled: boolean
  onSetAmount: (amount: bigint) => void
}

/**
 * One line on a deposit into a Privacy Pools account: how many deposits have the typed amount, and
 * the pool's fee on top of it. Pressing the status opens every problem with its fix. Renders
 * nothing until an amount is typed.
 */
const PrivacyPoolsDepositPrivacy: FC<Props> = ({
  privacy,
  token,
  amount,
  feeAmount,
  disabled,
  onSetAmount
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: depositAssetConfigs } = useController(
    'PrivacyPoolsController',
    selectDepositAssetConfigs
  )
  const vettingFeeBPS =
    depositAssetConfigs?.[getPrivacyPoolsTokenId(token.chainId.toString(), token.address)]
      ?.vettingFeeBPS ?? null

  if (amount <= 0n) return null

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtTy]}>
      <PrivacyStatus
        stage="deposit"
        rating={privacy.rating}
        leaks={privacy.leaks}
        cover={privacy.sameAmount}
        decimals={token.decimals}
        symbol={token.symbol}
        onSetAmount={disabled ? undefined : onSetAmount}
        style={flexbox.flex1}
      />
      {feeAmount !== null && vettingFeeBPS !== null && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlSm]}>
          <Text appearance="secondaryText" fontSize={12} weight="medium">
            {t('Protocol fee')}
          </Text>
          <InfoIcon
            width={12}
            height={12}
            color={theme.secondaryText}
            style={spacings.mlMi}
            dataSet={createGlobalTooltipDataSet({
              id: FEE_TOOLTIP_ID,
              title: t('Protocol fee'),
              content: t(PRIVACY_POOLS_DEPOSIT_FEE_TOOLTIP)
            })}
          />
          <Text appearance="primary" fontSize={12} weight="semiBold" style={spacings.mlMi}>
            {/* Charged on top, so the whole typed amount still goes into the pool */}
            {t('{{amount}} ({{percent}}%)', {
              amount: formatPrivacyPoolsAmount(feeAmount, token.decimals, token.symbol),
              percent: Number(vettingFeeBPS) / BASIS_POINTS_PER_PERCENT
            })}
          </Text>
        </View>
      )}
    </View>
  )
}

export default React.memo(PrivacyPoolsDepositPrivacy)
