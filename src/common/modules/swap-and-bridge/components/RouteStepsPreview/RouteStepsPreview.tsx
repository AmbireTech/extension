import { formatUnits } from 'ethers'
import React, { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import {
  SwapAndBridgeActiveRoute,
  SwapAndBridgeStep
} from '@ambire-common/interfaces/swapAndBridge'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import BungeeIcon from '@common/assets/svg/BungeeIcon/BungeeIcon'
import LiFiIcon from '@common/assets/svg/LiFiIcon/LiFiIcon'
import UniswapIcon from '@common/assets/svg/UniswapIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import formatTime from '@common/utils/formatTime'

import RouteStepsArrow from '../RouteStepsArrow'
import { RouteStepsTokenAmount, RouteStepsTokenIcon } from '../RouteStepsToken'
import styles, { TOKEN_LABEL_RESERVED_HEIGHT } from './styles'

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
  amountInUsd,
  align = 'center'
}: {
  address: string
  chainId: bigint
  uri?: string
  symbol: string
  amount: string
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
  currentStep?: number
  loadingEnabled?: boolean
  isDisabled?: boolean
  routeStatus?: SwapAndBridgeActiveRoute['routeStatus']
  disabledReason?: string
  providerId: string
  isBridge: boolean
  /** Rendered on the left of the provider logo row, replacing the estimation text */
  bottomLeftSlot?: React.ReactNode
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { maxWidthSize } = useWindowSize()

  // On a narrow window, a multi-hop route already has little room per step (icon +
  // arrow + badge), so the protocol badge gets a tighter cap to avoid crowding/overlap
  const isMultiStep = steps.length > 1
  const badgeStyle = isMultiStep && maxWidthSize('xs') ? { maxWidth: 60 } : undefined

  const shouldWarnForLongEstimation = useMemo(() => {
    if (!estimationInSeconds) return false
    return estimationInSeconds > 3600 // 1 hour in seconds
  }, [estimationInSeconds])

  const formattedFromAmount = useMemo(() => {
    const fromStep = steps?.[0]
    if (!fromStep) return ''

    const fromAmount = `${formatDecimals(
      Number(formatUnits(fromStep.fromAmount, fromStep.fromAsset.decimals)),
      'precise'
    )}`

    if (fromAmount.length > 10) {
      return `${fromAmount.slice(0, 10)}...`
    }

    return fromAmount
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

  const formattedToAmount = useMemo(() => {
    const toStep = steps?.[steps.length - 1]
    if (!toStep) return ''

    const toAmount = `${formatDecimals(
      Number(formatUnits(toStep.toAmount, toStep.toAsset.decimals)),
      'amount'
    )}`

    if (toAmount.length > 10) {
      return `${toAmount.slice(0, 10)}...`
    }

    return toAmount
  }, [steps])

  const resolvedCurrentStep = currentStep ?? 0

  const getLastStepType = (step: SwapAndBridgeStep) => {
    if (routeStatus === 'completed') return 'success'

    const userTxIndex = step.userTxIndex ?? 0

    if (userTxIndex < resolvedCurrentStep) {
      return routeStatus === 'refunded' ? 'warning' : 'success'
    }

    return 'default'
  }

  const getIntermediateStepType = (userTxIndex: number) => {
    if (routeStatus === 'completed') return 'success'
    return userTxIndex < resolvedCurrentStep ? 'success' : 'default'
  }

  const renderStepBadge = (step: SwapAndBridgeStep) => (
    <>
      {step.protocol.name.startsWith('Uniswap') ? (
        <UniswapIcon width={16} height={16} />
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
                      amount={isOnlyOneStep ? formattedFromAmount : formattedRefundedAmount}
                      amountInUsd={inputValueInUsd}
                      align={isOnlyOneStep ? 'left' : 'center'}
                    />
                    <RouteStepsArrow
                      containerStyle={flexbox.flex1}
                      type={getLastStepType(step)}
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
                    amount={formattedToAmount}
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
                  amount={isFirst ? formattedFromAmount : ''}
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

      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
        {!isDisabled ? (
          <>
            <View>
              {bottomLeftSlot || (
                <>
                  {!!shouldWarnForLongEstimation && (
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
                    weight={shouldWarnForLongEstimation ? 'semiBold' : 'medium'}
                    appearance={shouldWarnForLongEstimation ? 'warningText' : 'primaryText'}
                  >
                    {isBridge && !!estimationInSeconds
                      ? t('Estimation: around {{time}}', {
                          time: formatTime(estimationInSeconds)
                        })
                      : ''}
                  </Text>
                </>
              )}
            </View>

            {providerId === 'socket' || providerId === 'socketv3' ? (
              <BungeeIcon width={56.7} height={11.2} />
            ) : providerId === 'uniswap' ? (
              <UniswapIcon width={28} height={28} />
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
  )
}

export default React.memo(RouteStepsPreview)
