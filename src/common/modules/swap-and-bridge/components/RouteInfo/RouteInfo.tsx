import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeFormStatus } from '@ambire-common/libs/swapAndBridge/constants'
import { getIsBridgeRoute } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatTime from '@common/utils/formatTime'
import RetryButton from '@web/components/RetryButton'

import FeeInfoBottomSheet from '../FeeInfoBottomSheet'
import SelectRoute from './SelectRoute'
import getStyles from './styles'

type Props = {
  isEstimatingRoute: boolean
  shouldEnableRoutesSelection: boolean
  openRoutesModal: () => void
}

const RouteInfo: FC<Props> = ({
  isEstimatingRoute,
  shouldEnableRoutesSelection,
  openRoutesModal
}) => {
  const {
    state: {
      feeExemptionReason,
      feePercent,
      formStatus,
      signAccountOpController,
      quote,
      swapSignErrors
    },
    dispatch: swapAndBridgeDispatch
  } = useController('SwapAndBridgeController')
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const {
    ref: feeInfoSheetRef,
    open: openFeeInfoBottomSheet,
    close: closeFeeInfoBottomSheet
  } = useModalize()
  const [isFeeInfoHovered, setIsFeeInfoHovered] = useState(false)
  const proceededRouteIdRef = useRef<string | null>(null)
  const selectedRouteId = quote?.selectedRoute?.routeId
  const displayedFeePercent =
    feeExemptionReason || (quote?.selectedRoute && !quote.selectedRoute.withConvenienceFee)
      ? 0
      : feePercent
  const isFeeSuccess = displayedFeePercent === 0

  useEffect(() => {
    if (formStatus === SwapAndBridgeFormStatus.Proceeded && selectedRouteId != null) {
      proceededRouteIdRef.current = String(selectedRouteId)
    }

    if (!quote || formStatus === SwapAndBridgeFormStatus.Empty) {
      proceededRouteIdRef.current = null
    }
  }, [formStatus, quote, selectedRouteId])

  const allRoutesFailed = useMemo(() => {
    if (!quote || !quote.routes.length) return false
    return !quote.routes.find((r) => !r.disabled)
  }, [quote])

  const isAutoRouteSelection = !!quote?.selectedRoute && !quote.selectedRoute.isSelectedManually
  const hasProceededWithSelectedRoute =
    selectedRouteId != null && proceededRouteIdRef.current === String(selectedRouteId)

  const hasAvailableAutoRoute =
    !!quote?.selectedRoute?.disabled &&
    isAutoRouteSelection &&
    !!quote.routes.find((r) => !r.disabled)

  const hasEstimationError =
    !hasAvailableAutoRoute &&
    (!isAutoRouteSelection || hasProceededWithSelectedRoute || allRoutesFailed) &&
    (signAccountOpController?.estimation.status === EstimationStatus.Error ||
      formStatus === SwapAndBridgeFormStatus.InvalidRouteSelected)

  const shouldShowRouteInfo =
    swapSignErrors.length === 0 &&
    [
      SwapAndBridgeFormStatus.InvalidRouteSelected,
      SwapAndBridgeFormStatus.ReadyToEstimate,
      SwapAndBridgeFormStatus.ReadyToSubmit,
      SwapAndBridgeFormStatus.Proceeded
    ].includes(formStatus) &&
    (signAccountOpController?.estimation.status === EstimationStatus.Success ||
      hasEstimationError ||
      allRoutesFailed) &&
    !isEstimatingRoute

  const shouldShowSelectRoute =
    shouldShowRouteInfo &&
    signAccountOpController?.estimation.status === EstimationStatus.Success &&
    formStatus !== SwapAndBridgeFormStatus.InvalidRouteSelected

  const updateQuote = useCallback(() => {
    swapAndBridgeDispatch({
      type: 'method',
      params: { method: 'updateQuote', args: [{ skipQuoteUpdateOnSameValues: false }] }
    })
  }, [swapAndBridgeDispatch])
  const handleOpenFeeInfoBottomSheet = useCallback(() => {
    openFeeInfoBottomSheet()
  }, [openFeeInfoBottomSheet])
  const handleFeeInfoHoverIn = useCallback(() => setIsFeeInfoHovered(true), [])
  const handleFeeInfoHoverOut = useCallback(() => setIsFeeInfoHovered(false), [])

  return (
    <View style={[{ minHeight: 20 }, spacings.mtSm]}>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          { width: '100%' }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <HoverablePressable
            onPress={handleOpenFeeInfoBottomSheet}
            onHoverIn={handleFeeInfoHoverIn}
            onHoverOut={handleFeeInfoHoverOut}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('Ambire fee: {{fee}}. Learn more about Swap & Bridge fees', {
              fee: `${displayedFeePercent}%`
            })}
            testID="swap-and-bridge-fee-info-button"
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.phTy,
              spacings.pvMi,
              styles.feeButton,
              isFeeSuccess && styles.feeButtonSuccess
            ]}
          >
            <Text
              appearance={isFeeSuccess ? 'successText' : 'primary'}
              fontSize={12}
              weight="medium"
              underline={isFeeInfoHovered}
            >
              {t('Ambire fee:')}
            </Text>
            <Text
              appearance={isFeeSuccess ? 'successText' : 'primary'}
              fontSize={12}
              weight="semiBold"
              underline={isFeeInfoHovered}
              style={spacings.mlMi}
            >
              {`${displayedFeePercent}%`}
            </Text>
            <InfoIcon
              width={12}
              height={12}
              style={spacings.mlMi}
              color={isFeeSuccess ? theme.successText : theme.primaryAccent}
            />
          </HoverablePressable>

          {shouldShowSelectRoute && quote?.selectedRoute?.serviceTime ? (
            <Text appearance="tertiaryText" fontSize={12} weight="medium" style={spacings.mlLg}>
              {t('Time: {{time}}', {
                time:
                  quote?.selectedRoute && getIsBridgeRoute(quote.selectedRoute)
                    ? `~ ${formatTime(quote.selectedRoute.serviceTime)}`
                    : t('instant')
              })}
            </Text>
          ) : null}
        </View>

        {shouldShowSelectRoute && (
          <SelectRoute
            shouldEnableRoutesSelection={shouldEnableRoutesSelection}
            openRoutesModal={openRoutesModal}
          />
        )}
      </View>

      {swapSignErrors.length > 0 && (
        <View
          style={[flexbox.directionRow, flexbox.alignCenter, { maxWidth: '100%' }, spacings.mtSm]}
        >
          {isWeb && (
            <WarningIcon strokeWidth={2} width={20} height={20} color={theme.warningText} />
          )}
          <Text
            fontSize={isMobile ? 14 : 12}
            weight="medium"
            appearance="warningText"
            style={{ ...(isMobile ? {} : spacings.mlMi), flexShrink: 1 }}
          >
            {swapSignErrors[0]!.title}
          </Text>
        </View>
      )}
      {swapSignErrors.length === 0 && formStatus === SwapAndBridgeFormStatus.NoRoutesFound && (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            { width: '100%' },
            spacings.mtSm
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            {isWeb && (
              <WarningIcon strokeWidth={2} width={20} height={20} color={theme.warningText} />
            )}
            <Text
              fontSize={isMobile ? 14 : 12}
              weight="medium"
              appearance="warningText"
              style={{ ...(isMobile ? {} : spacings.mlMi), flexShrink: 1 }}
            >
              {t('No routes now, but note some markets may change often.')}
            </Text>
          </View>
          <RetryButton onPress={updateQuote} />
        </View>
      )}
      {shouldShowRouteInfo && (
        <>
          {allRoutesFailed && (
            <View
              style={[
                flexbox.directionRow,
                flexbox.justifySpaceBetween,
                { width: '100%' },
                flexbox.flex1,
                spacings.mtSm
              ]}
            >
              <View style={[flexbox.directionRow, { flexShrink: 1 }, spacings.mrTy]}>
                {isWeb && (
                  <WarningIcon strokeWidth={2} width={20} height={20} color={theme.warningText} />
                )}
                <Text
                  fontSize={isMobile ? 14 : 12}
                  weight="medium"
                  appearance="warningText"
                  style={[isMobile ? {} : spacings.mlMi, { flexShrink: 1 }]}
                >
                  {quote?.routes.length === 1
                    ? t("1 route found, but it'd fail onchain.")
                    : t("{{count}} routes found, but they'd all fail onchain.", {
                        count: quote?.routes.length
                      })}{' '}
                  <Text
                    fontSize={isMobile ? 14 : 12}
                    weight="medium"
                    color={theme.warningText}
                    onPress={openRoutesModal as any}
                    style={{
                      ...spacings.mr,
                      textDecorationColor: theme.warningText,
                      textDecorationLine: 'underline'
                    }}
                  >
                    {t('See\u00A0details')}
                  </Text>
                </Text>
              </View>
              <RetryButton onPress={updateQuote} />
            </View>
          )}

          {hasEstimationError && !allRoutesFailed && (
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifySpaceBetween,
                { width: '100%' },
                spacings.mtSm
              ]}
            >
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                {isWeb && (
                  <WarningIcon strokeWidth={2} width={20} height={20} color={theme.warningText} />
                )}
                <Text
                  fontSize={isMobile ? 14 : 12}
                  weight="medium"
                  appearance="warningText"
                  style={{ ...(isMobile ? {} : spacings.mlMi), flexShrink: 1 }}
                >
                  {t('An error occurred. More details:')}
                </Text>
                <InfoIcon
                  width={14}
                  height={14}
                  data-tooltip-id="error-info-icon"
                  style={spacings.mlTy}
                />
                <Tooltip id="error-info-icon" clickable>
                  <View>
                    <Text fontSize={12} appearance="secondaryText" style={spacings.mbMi}>
                      {quote && quote.selectedRoute && quote.selectedRoute.disabled
                        ? quote.selectedRoute.disabledReason
                        : signAccountOpController?.estimation.error?.message}
                    </Text>
                  </View>
                </Tooltip>
              </View>
              <RetryButton onPress={updateQuote} />
            </View>
          )}
        </>
      )}
      <FeeInfoBottomSheet
        sheetRef={feeInfoSheetRef}
        closeBottomSheet={closeFeeInfoBottomSheet}
        feePercent={feePercent}
        feeExemptionReason={feeExemptionReason}
      />
    </View>
  )
}

export default RouteInfo
