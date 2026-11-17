import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import DevIcon from '@common/assets/svg/DevIcon/DevIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Badge from '@common/components/Badge'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import { crashAnalyticsUnavailableReason } from '@common/config/analytics/CrashAnalytics'
import { isMobile } from '@common/config/env'
import { CRASH_ANALYTICS_UNAVAILABLE_REASON } from '@common/constants/crashAnalytics'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
const selectCrashAnalyticsEnabled = (state: AllControllersMappingType['WalletStateController']) =>
  state.crashAnalyticsEnabled
const selectCrashReportId = (state: AllControllersMappingType['WalletStateController']) =>
  state.crashReportId

const CrashAnalyticsControlOption = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { state: crashAnalyticsEnabled, dispatch: walletStateDispatch } = useController(
    'WalletStateController',
    selectCrashAnalyticsEnabled
  )
  const { state: crashReportId } = useController('WalletStateController', selectCrashReportId)

  const handleCopyCrashReportId = useCallback(async () => {
    if (!crashReportId) return

    await setStringAsync(crashReportId)
    addToast(t('Crash report ID copied to clipboard'), { type: 'success' })
  }, [crashReportId, addToast, t])

  const handleToggleCrashAnalytics = useCallback(() => {
    walletStateDispatch({
      type: 'method',
      params: {
        method: 'setCrashAnalytics',
        args: [!crashAnalyticsEnabled]
      }
    })

    if (!isMobile) return

    // Only developers get here, so the toast names what the build is missing
    if (crashAnalyticsUnavailableReason) {
      const unavailableMessage =
        crashAnalyticsUnavailableReason === CRASH_ANALYTICS_UNAVAILABLE_REASON.DEV_BUILD
          ? t('Crash reporting does not start in development builds.')
          : t('Crash reporting cannot start because SENTRY_DSN_MOBILE is not set.')
      addToast(unavailableMessage, { type: 'error' })
      return
    }

    // The mobile crash reporter only starts at launch
    if (!crashAnalyticsEnabled) {
      addToast(t('This setting will be reflected on the next app launch'), {
        type: 'info'
      })
    }
  }, [walletStateDispatch, crashAnalyticsEnabled, addToast, t])

  const crashReportIdAccessory = useMemo(() => {
    if (!crashAnalyticsEnabled || !crashReportId) return null

    return (
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}>
        <HoverablePressable onPress={handleCopyCrashReportId}>
          <Badge text={t('Copy report ID')} type="primaryAccent">
            <CopyIcon style={spacings.mlMi} width={14} height={14} color={theme.primaryAccent300} />
          </Badge>
        </HoverablePressable>
        <InfoIcon
          style={spacings.mlMi}
          width={16}
          height={16}
          color={theme.primaryAccent300}
          dataSet={createGlobalTooltipDataSet({
            id: 'crash-report-id-tooltip',
            content: t(
              "Error reports don't include your wallet addresses. If you contact support about a problem, share this ID so we can find your reports. Turning error reports off and on gives you a new ID.\n\nYour ID: {{crashReportId}}",
              { crashReportId }
            )
          })}
        />
      </View>
    )
  }, [crashAnalyticsEnabled, crashReportId, handleCopyCrashReportId, t, theme.primaryAccent300])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Crash analytics')}
      titleAccessory={crashReportIdAccessory}
      description={t(
        'Help us fix issues faster with anonymous error reports, no personal identifiable info collected.'
      )}
      renderIcon={<DevIcon color={theme.iconPrimary} />}
    >
      <FatToggle
        isOn={crashAnalyticsEnabled}
        onToggle={handleToggleCrashAnalytics}
        trackStyle={spacings.mr0}
      />
    </ControlOption>
  )
}

export default React.memo(CrashAnalyticsControlOption)
