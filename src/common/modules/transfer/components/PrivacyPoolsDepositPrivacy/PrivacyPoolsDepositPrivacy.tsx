import React, { FC, useCallback } from 'react'
import { View } from 'react-native'

import { getPrivacyPoolsTokenId } from '@ambire-common/consts/privacyPools'
import { PrivacyPoolsDepositPrivacy as DepositPrivacy } from '@ambire-common/interfaces/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import PrivacyStatus, {
  PRIVACY_LINE_SKELETON_HEIGHT,
  PRIVACY_LINE_SKELETON_WIDTH
} from '@common/components/PrivacyStatus'
import SkeletonLoader from '@common/components/SkeletonLoader'
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
 * the pool's fee on top of it. Pressing the status opens every problem with its fix, or a retry
 * when the count failed. Renders nothing until an amount is typed.
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
  const { state: depositAssetConfigs, dispatch: privacyPoolsDispatch } = useController(
    'PrivacyPoolsController',
    selectDepositAssetConfigs
  )
  const chainId = token.chainId.toString()
  const retry = useCallback(() => {
    privacyPoolsDispatch({
      type: 'method',
      params: { method: 'readPrivacyData', args: [chainId] }
    })
  }, [chainId, privacyPoolsDispatch])
  const vettingFeeBPS =
    depositAssetConfigs?.[getPrivacyPoolsTokenId(chainId, token.address)]?.vettingFeeBPS ?? null

  if (amount <= 0n) return null

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtTy]}>
      {privacy.isLoading ? (
        <View style={flexbox.flex1}>
          <SkeletonLoader
            width={PRIVACY_LINE_SKELETON_WIDTH}
            height={PRIVACY_LINE_SKELETON_HEIGHT}
          />
        </View>
      ) : (
        <PrivacyStatus
          stage="deposit"
          rating={privacy.rating}
          leaks={privacy.leaks}
          cover={privacy.bigEnough}
          decimals={token.decimals}
          symbol={token.symbol}
          onSetAmount={disabled ? undefined : onSetAmount}
          onRetry={retry}
          style={flexbox.flex1}
        />
      )}
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
