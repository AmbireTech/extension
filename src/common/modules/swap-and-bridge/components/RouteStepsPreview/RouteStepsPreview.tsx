import { formatUnits } from 'ethers'
import React, { Fragment, useId, useMemo } from 'react'
import { View } from 'react-native'

import {
  SwapAndBridgeActiveRoute,
  SwapAndBridgeStep
} from '@ambire-common/interfaces/swapAndBridge'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import BungeeIcon from '@common/assets/svg/BungeeIcon/BungeeIcon'
import CowSwapIcon from '@common/assets/svg/CowSwapIcon'
import LiFiIcon from '@common/assets/svg/LiFiIcon/LiFiIcon'
import SecurityIcon from '@common/assets/svg/SecurityIcon'
import UniswapIcon from '@common/assets/svg/UniswapIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import formatTime from '@common/utils/formatTime'

import RouteStepsArrow from '../RouteStepsArrow'
import { RouteStepsTokenAmount, RouteStepsTokenIcon } from '../RouteStepsToken'
import { getLastRouteStepType } from './helpers'
import styles, { TOKEN_LABEL_RESERVED_HEIGHT } from './styles'

const MAX_AMOUNT_LABEL_LENGTH = 10

/**
 * Formats a step amount precisely enough to tell similar routes apart. When the formatted
 * value doesn't fit the label, it's cut with an ellipsis and `fullAmount` holds the
 * unrounded value, so it can be shown in a tooltip.
 */
const getStepAmountLabel = (
  rawAmount: string,
  decimals: number
): { amount: string; fullAmount?: string } => {
  const fullAmount = formatUnits(rawAmount, decimals)
  const formattedAmount = formatDecimals(Number(fullAmount), 'precise')

  if (formattedAmount.length <= MAX_AMOUNT_LABEL_LENGTH) return { amount: formattedAmount }

  return { amount: `${formattedAmount.slice(0, MAX_AMOUNT_LABEL_LENGTH)}...`, fullAmount }
}

/**
 * A label/value row of the route details shown under the token amounts
 * (network fee, extra bridge fee, arrival time).
 */
const RouteDetailsRow = ({
  label,
  value,
  hasWarning,
  testID
}: {
  label: string
  value: string
  hasWarning?: boolean
  testID?: string
}) => {
  const { theme } = useTheme()

  return (
    <View style={styles.routeDetailsRow} testID={testID}>
      <Text fontSize={12} weight="medium" appearance="secondaryText">
        {label}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        {!!hasWarning && (
          <WarningIcon
            color={theme.warningDecorative}
            width={14}
            height={14}
            style={spacings.mrMi}
            strokeWidth={2.2}
          />
        )}
        <Text
          fontSize={12}
          weight={hasWarning ? 'semiBold' : 'medium'}
          appearance={hasWarning ? 'warningText' : 'primaryText'}
        >
          {value}
        </Text>
      </View>
    </View>
  )
}

/**
 * Icon with its amount/symbol label pinned directly underneath it. The label is
 * absolutely positioned (anchored to this icon's own box) instead of taking part
 * in normal flow, so a long label (e.g. "2,647.71 USDC") never widens this step's
 * layout slot and steals space from the arrow/badge next to it - it just overflows
 * visually while staying centered (or edge-aligned) on the icon that owns it.
 */
const StepToken = ({
  address,
  chainId,
  uri,
  symbol,
  amount,
  fullAmount,
  amountInUsd,
  align = 'center'
}: {
  address: string
  chainId: bigint
  uri?: string
  symbol: string
  amount: string
  fullAmount?: string
  amountInUsd?: number
  align?: 'left' | 'right' | 'center'
}) => (
  <View>
    <RouteStepsTokenIcon address={address} chainId={chainId} uri={uri} />
    <View
      style={[
        styles.labelAnchor,
        align === 'left' && styles.labelAnchorLeft,
        align === 'right' && styles.labelAnchorRight,
        align === 'center' && styles.labelAnchorCenter
      ]}
    >
      <RouteStepsTokenAmount
        symbol={symbol}
        amount={amount}
        fullAmount={fullAmount}
        amountInUsd={amountInUsd}
        align={align}
      />
    </View>
  </View>
)

const RouteStepsPreview = ({
  steps,
  inputValueInUsd,
  outputValueInUsd,
  estimationInSeconds,
  minReceiveLabel,
  networkFeeInToTokenLabel,
  networkFeeInUsd,
  extraBridgeFeeLabel,
  currentStep = 0,
  loadingEnabled,
  isDisabled,
  routeStatus,
  disabledReason = 'Route failed',
  providerId,
  isBridge,
  bottomLeftSlot
}: {
  steps: SwapAndBridgeStep[]
  inputValueInUsd?: number
  outputValueInUsd?: number
  estimationInSeconds?: number
  /** The least the user receives, formatted with the receiving token's symbol */
  minReceiveLabel?: string
  /**
   * The network fee taken from the received tokens (CoW Swap), formatted with the receiving
   * token's symbol. When set, it's shown instead of the "Network fee" row, with
   * `networkFeeInUsd` (the same fee in USD) next to it in brackets
   */
  networkFeeInToTokenLabel?: string
  /** The provider's estimated network fee, shown as a row under the token amounts */
  networkFeeInUsd?: number
  /** The extra fee some bridges charge in the source chain's native token, formatted with its symbol */
  extraBridgeFeeLabel?: string
  currentStep?: number
  loadingEnabled?: boolean
  isDisabled?: boolean
  routeStatus?: SwapAndBridgeActiveRoute['routeStatus']
  disabledReason?: string
  providerId: string
  isBridge: boolean
  /** Rendered on the left of the provider logo row */
  bottomLeftSlot?: React.ReactNode
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const mevProtectedTooltipId = useId()
  const isMevProtected = providerId === 'cowswap'
  const hasRouteDetails =
    !!minReceiveLabel ||
    !!networkFeeInToTokenLabel ||
    !!networkFeeInUsd ||
    !!extraBridgeFeeLabel ||
    (isBridge && !!estimationInSeconds)
  const mevProtectedTooltipText = t(
    'CoW Swap is designed to protect your swap from bots that manipulate the price before it executes.'
  )
  const { maxWidthSize } = useWindowSize()

  // On a narrow window, a multi-hop route already has little room per step (icon +
  // arrow + badge), so the protocol badge gets a tighter cap to avoid crowding/overlap
  const isMultiStep = steps.length > 1
  const badgeStyle = isMultiStep && maxWidthSize('xs') ? { maxWidth: 60 } : undefined

  const shouldWarnForLongEstimation = useMemo(() => {
    if (!estimationInSeconds) return false
    return estimationInSeconds > 3600 // 1 hour in seconds
  }, [estimationInSeconds])

  const fromAmountLabel = useMemo(() => {
    const fromStep = steps?.[0]
    if (!fromStep) return { amount: '' }

    return getStepAmountLabel(fromStep.fromAmount, fromStep.fromAsset.decimals)
  }, [steps])

  const formattedRefundedAmount = useMemo(() => {
    if (!routeStatus || routeStatus !== 'refunded') return ''

    const fromStep = steps?.[0]
    if (!fromStep) return ''

    const toAmount = `${formatDecimals(
      Number(formatUnits(fromStep.toAmount, fromStep.toAsset.decimals)),
      'amount'
    )}`

    return toAmount
  }, [steps, routeStatus])

  const toAmountLabel = useMemo(() => {
    const toStep = steps?.[steps.length - 1]
    if (!toStep) return { amount: '' }

    return getStepAmountLabel(toStep.toAmount, toStep.toAsset.decimals)
  }, [steps])

  const resolvedCurrentStep = currentStep ?? 0

  const getIntermediateStepType = (userTxIndex: number) => {
    if (routeStatus === 'completed') return 'success'
    return userTxIndex < resolvedCurrentStep ? 'success' : 'default'
  }

  const renderStepBadge = (step: SwapAndBridgeStep) => (
    <>
      {step.protocol.name.startsWith('Uniswap') ? (
        <UniswapIcon width={16} height={16} />
      ) : step.protocol.name === 'CoW Swap' ? (
        <CowSwapIcon width={16} height={16} />
      ) : (
        <TokenIcon uri={step.protocol.icon} width={16} height={16} />
      )}
      <Text
        fontSize={12}
        weight="medium"
        appearance="secondaryText"
        numberOfLines={1}
        style={[spacings.mlMi, badgeStyle]}
      >
        {step.protocol.displayName}
      </Text>
    </>
  )

  return (
    <View style={[flexbox.flex1, common.fullWidth]}>
      <View style={[styles.container, spacings.mb, { paddingBottom: TOKEN_LABEL_RESERVED_HEIGHT }]}>
        <View style={styles.iconsRow}>
          {steps.map((step, i) => {
            const isFirst = i === 0
            const isOnlyOneStep = steps.length === 1
            const isLast = i === steps.length - 1
            const userTxIndex = step.userTxIndex ?? 0

            if (isLast) {
              return (
                <Fragment key={`${step.type}-${i}`}>
                  <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
                    <StepToken
                      uri={step.fromAsset.icon}
                      chainId={BigInt(step.fromAsset.chainId)}
                      address={step.fromAsset.address}
                      symbol={step.fromAsset.symbol}
                      amount={isOnlyOneStep ? fromAmountLabel.amount : formattedRefundedAmount}
                      fullAmount={isOnlyOneStep ? fromAmountLabel.fullAmount : undefined}
                      amountInUsd={inputValueInUsd}
                      align={isOnlyOneStep ? 'left' : 'center'}
                    />
                    <RouteStepsArrow
                      containerStyle={flexbox.flex1}
                      type={getLastRouteStepType({
                        routeStatus,
                        userTxIndex,
                        currentStep: resolvedCurrentStep,
                        isOnlyOneStep
                      })}
                      badge={renderStepBadge(step)}
                      isLoading={loadingEnabled && (userTxIndex === currentStep || isOnlyOneStep)}
                      badgePosition="top"
                    />
                  </View>
                  <StepToken
                    address={step.toAsset.address}
                    chainId={BigInt(step.toAsset.chainId)}
                    uri={step.toAsset.icon}
                    symbol={step.toAsset.symbol}
                    amount={toAmountLabel.amount}
                    fullAmount={toAmountLabel.fullAmount}
                    amountInUsd={outputValueInUsd}
                    align="right"
                  />
                </Fragment>
              )
            }

            return (
              <View
                key={`${step.type}-${i}`}
                style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}
              >
                <StepToken
                  address={step.fromAsset.address}
                  chainId={BigInt(step.fromAsset.chainId)}
                  uri={step.fromAsset.icon}
                  symbol={step.fromAsset.symbol}
                  amount={isFirst ? fromAmountLabel.amount : ''}
                  fullAmount={isFirst ? fromAmountLabel.fullAmount : undefined}
                  align={isFirst ? 'left' : 'center'}
                />
                <RouteStepsArrow
                  containerStyle={flexbox.flex1}
                  type={getIntermediateStepType(userTxIndex)}
                  badge={renderStepBadge(step)}
                  isLoading={loadingEnabled && userTxIndex === currentStep}
                  badgePosition="top"
                />
              </View>
            )
          })}
        </View>
      </View>

      {/* The route details and the provider row share one section, separated from the tokens */}
      <View
        style={
          !isDisabled &&
          hasRouteDetails && [
            spacings.ptMi,
            { borderTopWidth: 1, borderTopColor: theme.secondaryBorder }
          ]
        }
      >
        {!isDisabled && (
          <>
            {!!minReceiveLabel && (
              <RouteDetailsRow
                label={t('Min receive')}
                value={minReceiveLabel}
                testID="route-min-receive"
              />
            )}
            {networkFeeInToTokenLabel ? (
              <RouteDetailsRow
                label={t('Fee')}
                value={
                  networkFeeInUsd
                    ? t('~{{amount}} ({{amountInUsd}})', {
                        amount: networkFeeInToTokenLabel,
                        amountInUsd: formatDecimals(networkFeeInUsd, 'price')
                      })
                    : t('~{{amount}}', { amount: networkFeeInToTokenLabel })
                }
                testID="route-fee"
              />
            ) : (
              !!networkFeeInUsd && (
                <RouteDetailsRow
                  label={t('Network fee')}
                  value={t('~{{amount}}', { amount: formatDecimals(networkFeeInUsd, 'price') })}
                  testID="route-network-fee"
                />
              )
            )}
            {!!extraBridgeFeeLabel && (
              <RouteDetailsRow
                label={t('Extra bridge fee')}
                value={extraBridgeFeeLabel}
                testID="route-extra-bridge-fee"
              />
            )}
            {isBridge && !!estimationInSeconds && (
              <RouteDetailsRow
                label={t('Arrives in')}
                value={t('~{{time}}', { time: formatTime(estimationInSeconds) })}
                hasWarning={shouldWarnForLongEstimation}
                testID="route-arrival-time"
              />
            )}
          </>
        )}

        <View
          style={
            !isDisabled && hasRouteDetails
              ? styles.routeDetailsRow
              : [flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]
          }
        >
          {!isDisabled ? (
            <>
              <View
                style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}
              >
                {bottomLeftSlot}
              </View>

              {/* Next to the provider logo, as the protection comes from the provider */}
              {isMevProtected && (
                <View
                  accessible
                  accessibilityLabel={t('MEV protected')}
                  accessibilityHint={mevProtectedTooltipText}
                  dataSet={createGlobalTooltipDataSet({
                    id: mevProtectedTooltipId,
                    content: mevProtectedTooltipText
                  })}
                  testID="mev-protected-badge"
                  style={[flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}
                >
                  <SecurityIcon width={12} height={15} color={theme.primaryAccent} />
                  <Text
                    fontSize={12}
                    weight="medium"
                    color={theme.primaryAccent}
                    style={spacings.mlMi}
                  >
                    {t('MEV protected')}
                  </Text>
                </View>
              )}
              {providerId === 'socket' || providerId === 'socketv3' ? (
                <BungeeIcon width={56.7} height={11.2} />
              ) : providerId === 'uniswap' ? (
                <UniswapIcon width={28} height={28} />
              ) : providerId === 'cowswap' ? (
                <CowSwapIcon width={28} height={28} />
              ) : (
                <LiFiIcon width={39.75} height={14} />
              )}
            </>
          ) : (
            <View style={[flexbox.directionRow, flexbox.alignCenter, { maxWidth: '100%' }]}>
              <Text
                fontSize={12}
                weight="medium"
                color={theme.warningText}
                style={[
                  spacings.phSm,
                  spacings.pvTy,
                  common.borderRadiusSecondary,
                  {
                    backgroundColor: theme.warningBackground
                  }
                ]}
              >
                {disabledReason}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default React.memo(RouteStepsPreview)
