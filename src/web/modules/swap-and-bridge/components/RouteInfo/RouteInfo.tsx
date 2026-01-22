import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { FEE_PERCENT } from '@ambire-common/services/socket/constants'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatTime from '@common/utils/formatTime'
import RetryButton from '@web/components/RetryButton'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'

import SelectRoute from './SelectRoute'

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
  const { formStatus, signAccountOpController, quote, swapSignErrors } =
    useSwapAndBridgeControllerState()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  const allRoutesFailed = useMemo(() => {
    if (!quote || !quote.routes.length) return false
    return !quote.routes.find((r) => !r.disabled)
  }, [quote])

  const updateQuote = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_QUOTE'
    })
  }, [dispatch])

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.mh,
        { height: 25 }, // Prevents layout shifts,
        spacings.mtTy
      ]}
    >
      {swapSignErrors.length > 0 && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, { maxWidth: '100%' }]}>
          <WarningIcon width={14} height={14} color={theme.warningDecorative} />
          <Text fontSize={14} weight="medium" appearance="warningText" style={spacings.mlMi}>
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
            { width: '100%' }
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <WarningIcon width={14} height={14} color={theme.warningDecorative} />
            <Text fontSize={14} weight="medium" appearance="warningText" style={spacings.mlMi}>
              {t('No routes now, but note some markets may change often.')}
            </Text>
          </View>
          <RetryButton onPress={updateQuote} />
        </View>
      )}
      {swapSignErrors.length === 0 &&
        [
          SwapAndBridgeFormStatus.InvalidRouteSelected,
          SwapAndBridgeFormStatus.ReadyToEstimate,
          SwapAndBridgeFormStatus.ReadyToSubmit,
          SwapAndBridgeFormStatus.Proceeded
        ].includes(formStatus) &&
        (signAccountOpController?.estimation.status === EstimationStatus.Success ||
          ((signAccountOpController?.estimation.status === EstimationStatus.Error ||
            formStatus === SwapAndBridgeFormStatus.InvalidRouteSelected) &&
            (allRoutesFailed || quote?.selectedRoute?.isSelectedManually))) &&
        !isEstimatingRoute && (
          <>
            {signAccountOpController?.estimation.status === EstimationStatus.Success &&
              formStatus !== SwapAndBridgeFormStatus.InvalidRouteSelected && (
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifySpaceBetween,
                    { width: '100%' }
                  ]}
                >
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <Text
                        appearance={
                          quote?.selectedRoute?.withConvenienceFee ? 'tertiaryText' : 'primary'
                        }
                        fontSize={14}
                        weight="medium"
                      >
                        {t('Ambire fee: {{fee}}', {
                          fee: `${quote?.selectedRoute?.withConvenienceFee ? FEE_PERCENT : 0}%`
                        })}
                      </Text>
                      {!quote?.selectedRoute?.withConvenienceFee && (
                        <>
                          <InfoIcon
                            width={16}
                            height={16}
                            data-tooltip-id="no-convenience-fee"
                            style={spacings.mlTy}
                            color={theme.primary}
                          />

                          <Tooltip
                            content={t(
                              'Ambire charges a small convenience fee on some transactions to support ongoing development and operations. This transaction is exempt from that fee.'
                            )}
                            id="no-convenience-fee"
                          />
                        </>
                      )}
                    </View>
                    {quote?.selectedRoute?.serviceTime ? (
                      <Text
                        appearance="tertiaryText"
                        fontSize={14}
                        weight="medium"
                        style={spacings.mlLg}
                      >
                        {t('Time: {{time}}', {
                          time:
                            quote?.selectedRoute.fromChainId !== quote?.selectedRoute.toChainId
                              ? `~ ${formatTime(quote?.selectedRoute?.serviceTime)}`
                              : 'instant'
                        })}
                      </Text>
                    ) : null}
                  </View>

                  <SelectRoute
                    shouldEnableRoutesSelection={shouldEnableRoutesSelection}
                    openRoutesModal={openRoutesModal}
                  />
                </View>
              )}
            {allRoutesFailed && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifySpaceBetween,
                  { width: '100%' }
                ]}
              >
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <WarningIcon width={14} height={14} color={theme.warningDecorative} />
                  <Text
                    fontSize={14}
                    weight="medium"
                    appearance="warningText"
                    style={spacings.mlMi}
                  >
                    {quote?.routes.length === 1
                      ? t("1 route found, but it'd fail onchain.")
                      : t("{{count}} routes found, but they'd all fail onchain.", {
                          count: quote?.routes.length
                        })}
                  </Text>
                  <Pressable
                    style={{
                      paddingVertical: 2,
                      ...spacings.phTy,
                      ...flexbox.directionRow,
                      ...flexbox.alignCenter,
                      opacity: 1
                    }}
                    onPress={openRoutesModal as any}
                  >
                    <Text
                      fontSize={14}
                      weight="medium"
                      color={theme.warningText}
                      style={{
                        ...spacings.mr,
                        textDecorationColor: theme.warningText,
                        textDecorationLine: 'underline'
                      }}
                    >
                      {t('See details')}
                    </Text>
                  </Pressable>
                </View>
                <RetryButton onPress={updateQuote} />
              </View>
            )}

            {(signAccountOpController?.estimation.status === EstimationStatus.Error ||
              formStatus === SwapAndBridgeFormStatus.InvalidRouteSelected) &&
              !allRoutesFailed && (
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifySpaceBetween,
                    { width: '100%' }
                  ]}
                >
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <WarningIcon width={14} height={14} color={theme.warningDecorative} />
                    <Text
                      fontSize={14}
                      weight="medium"
                      appearance="warningText"
                      style={spacings.mlMi}
                    >
                      {t('An error occurred. More details:')}
                    </Text>
                    <InfoIcon
                      width={16}
                      height={16}
                      data-tooltip-id="error-info-icon"
                      style={spacings.mlTy}
                    />
                    <Tooltip id="error-info-icon" clickable>
                      <View>
                        <Text fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
                          {quote && quote.selectedRoute && quote.selectedRoute.disabled
                            ? quote.selectedRoute.disabledReason
                            : signAccountOpController?.estimation.error?.message}
                        </Text>
                      </View>
                    </Tooltip>
                  </View>

                  <SelectRoute
                    shouldEnableRoutesSelection={shouldEnableRoutesSelection}
                    openRoutesModal={openRoutesModal}
                  />
                </View>
              )}
          </>
        )}
    </View>
  )
}

export default RouteInfo
