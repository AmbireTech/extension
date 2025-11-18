import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getCallsCount } from '@ambire-common/utils/userRequest'
import BatchIcon from '@common/assets/svg/BatchIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import Tooltip from '@common/components/Tooltip'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import ActionsPagination from '@web/modules/action-requests/components/ActionsPagination'

import getStyles from './styles'

type Props = {
  onReject: () => void
  onAddToCart: () => void
  onSign: () => void
  isSignLoading: boolean
  isSignDisabled: boolean
  isAddToCartDisplayed: boolean
  isAddToCartDisabled: boolean
  inProgressButtonText: string
  shouldHoldToProceed: boolean
  buttonText: string
  buttonTooltipText?: string
}

const Footer = ({
  onReject,
  onAddToCart,
  onSign,
  isSignLoading,
  isSignDisabled,
  buttonTooltipText,
  isAddToCartDisplayed,
  isAddToCartDisabled,
  inProgressButtonText,
  buttonText,
  shouldHoldToProceed
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { userRequests } = useRequestsControllerState()
  const { account } = useSelectedAccountControllerState()
  const { accountOp } = useSignAccountOpControllerState() || {}
  const chainId = accountOp?.chainId

  const batchCount = useMemo(() => {
    const requests = userRequests.filter((r) => {
      return (
        r.action.kind === 'calls' &&
        r.meta.accountAddr === account?.addr &&
        r.meta.chainId === chainId
      )
    })

    return getCallsCount(requests)
  }, [account?.addr, userRequests, chainId])

  const startBatchingInfo = useMemo(
    () =>
      t(
        'Start a batch and sign later. This feature allows you to add more actions to this transaction and sign them all together later.'
      ),
    [t]
  )

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: 'transparent',
      to: theme.quaternaryBackground
    }
  })

  return (
    <View style={styles.container}>
      <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
        <Button
          testID="transaction-button-reject"
          type="danger"
          text={t('Reject')}
          onPress={onReject}
          hasBottomSpacing={false}
          size="large"
          disabled={isSignLoading}
          style={{ width: 98 }}
        />
      </View>
      <ActionsPagination />
      <View
        style={[flexbox.directionRow, !isAddToCartDisplayed && flexbox.flex1, flexbox.justifyEnd]}
      >
        {isAddToCartDisplayed && (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Button
              testID="queue-and-sign-later-button"
              type="outline"
              accentColor={theme.primary}
              text={
                batchCount > 1
                  ? t('Add to batch ({{batchCount}})', {
                      batchCount
                    })
                  : t('Start a batch')
              }
              onPress={onAddToCart}
              disabled={isAddToCartDisabled}
              hasBottomSpacing={false}
              style={{ minWidth: 160, ...spacings.ph }}
              size="large"
            >
              <BatchIcon style={spacings.mlTy} />
            </Button>
            {/* @ts-ignore */}
            <View style={spacings.mlMi} dataSet={{ tooltipId: 'start-batch-info-tooltip' }}>
              <AnimatedPressable
                style={[spacings.phTy, spacings.pvTy, { borderRadius: 50 }, animStyle]}
                {...bindAnim}
              >
                <InfoIcon color={theme.tertiaryText} width={20} height={20} />
              </AnimatedPressable>
            </View>
          </View>
        )}
        {/* @ts-ignore */}
        <View dataSet={{ tooltipId: 'sign-button-tooltip' }}>
          {shouldHoldToProceed ? (
            <HoldToProceedButton
              text={t('Hold to sign')}
              disabled={isSignDisabled}
              onHoldComplete={onSign}
              testID="proceed-btn"
            />
          ) : (
            <ButtonWithLoader
              testID="transaction-button-sign"
              type="primary"
              disabled={isSignDisabled}
              isLoading={isSignLoading}
              text={isSignLoading ? inProgressButtonText : buttonText}
              onPress={onSign}
              size="large"
            />
          )}
        </View>
        {!!buttonTooltipText && <Tooltip content={buttonTooltipText} id="sign-button-tooltip" />}
        <Tooltip content={startBatchingInfo} id="start-batch-info-tooltip" />
      </View>
    </View>
  )
}

export default Footer
