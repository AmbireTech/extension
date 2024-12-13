import { formatUnits } from 'ethers'
import React, { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SocketAPIStep } from '@ambire-common/interfaces/swapAndBridge'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import spacings from '@common/styles/spacings'
import { iconColors } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import formatTime from '@common/utils/formatTime'

import RouteStepsArrow from '../RouteStepsArrow'
import RouteStepsToken from '../RouteStepsToken'
import styles from './styles'

const RouteStepsPreview = ({
  steps,
  totalGasFeesInUsd,
  estimationInSeconds,
  currentStep = 0,
  loadingEnabled
}: {
  steps: SocketAPIStep[]
  totalGasFeesInUsd?: number
  estimationInSeconds?: number
  currentStep?: number
  loadingEnabled?: boolean
}) => {
  const { t } = useTranslation()

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

  const formattedToAmount = useMemo(() => {
    const toStep = steps?.[steps.length - 1]
    if (!toStep) return ''

    const toAmount = `${formatDecimals(
      Number(formatUnits(toStep.toAmount, toStep.toAsset.decimals)),
      'precise'
    )}`

    if (toAmount.length > 10) {
      return `${toAmount.slice(0, 10)}...`
    }

    return toAmount
  }, [steps])

  return (
    <View style={flexbox.flex1}>
      <View style={[styles.container, spacings.mb]}>
        {steps.map((step, i) => {
          const isFirst = i === 0
          const isOnlyOneStep = steps.length === 1
          const isLast = i === steps.length - 1

          if (step.userTxIndex === undefined) {
            // eslint-disable-next-line no-param-reassign
            step.userTxIndex = 0
          }

          if (isLast) {
            return (
              <Fragment key={step.type}>
                <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
                  <RouteStepsToken
                    uri={step.fromAsset.icon}
                    networkIdOrChainId={step.fromAsset.chainId}
                    address={step.fromAsset.address}
                    symbol={step.fromAsset.symbol}
                    amount={isOnlyOneStep ? formattedFromAmount : ''}
                  />
                  <RouteStepsArrow
                    containerStyle={flexbox.flex1}
                    type={step.userTxIndex < currentStep ? 'success' : 'default'}
                    badge={
                      <>
                        <TokenIcon
                          uri={step.protocol.icon}
                          width={16}
                          height={16}
                          containerStyle={spacings.mrMi}
                        />
                        <Text
                          fontSize={12}
                          weight="medium"
                          appearance="secondaryText"
                          numberOfLines={1}
                        >
                          {step.protocol.displayName}
                        </Text>
                      </>
                    }
                    isLoading={loadingEnabled && step.userTxIndex === currentStep}
                    badgePosition="top"
                  />
                </View>
                <RouteStepsToken
                  address={step.toAsset.address}
                  networkIdOrChainId={step.toAsset.chainId}
                  uri={step.toAsset.icon}
                  symbol={step.toAsset.symbol}
                  amount={formattedToAmount}
                  isLast
                />
              </Fragment>
            )
          }

          return (
            <View
              key={step.type}
              style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}
            >
              <RouteStepsToken
                address={step.fromAsset.address}
                networkIdOrChainId={step.fromAsset.chainId}
                uri={step.fromAsset.icon}
                symbol={step.fromAsset.symbol}
                amount={isFirst ? formattedFromAmount : ''}
              />
              <RouteStepsArrow
                containerStyle={flexbox.flex1}
                type={step.userTxIndex < currentStep ? 'success' : 'default'}
                badge={
                  <>
                    <TokenIcon
                      uri={step.protocol.icon}
                      width={16}
                      height={16}
                      containerStyle={spacings.mrMi}
                    />
                    <Text
                      fontSize={12}
                      weight="medium"
                      appearance="secondaryText"
                      numberOfLines={1}
                    >
                      {step.protocol.displayName}
                    </Text>
                  </>
                }
                isLoading={loadingEnabled && step.userTxIndex === currentStep}
                badgePosition="top"
              />
            </View>
          )
        })}
      </View>
      {(!!totalGasFeesInUsd || !!estimationInSeconds) && (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={12} weight="medium">
            {t('Total gas fees: {{fees}}', {
              fees: formatDecimals(totalGasFeesInUsd, 'value')
            })}
          </Text>
          {!!estimationInSeconds && (
            <>
              <Text fontSize={12} weight="medium" appearance="secondaryText">
                {'  |  '}
              </Text>
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                {!!shouldWarnForLongEstimation && (
                  <WarningIcon
                    color={iconColors.warning}
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
                  {t('Estimation: around {{time}}', {
                    time: formatTime(estimationInSeconds)
                  })}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(RouteStepsPreview)
