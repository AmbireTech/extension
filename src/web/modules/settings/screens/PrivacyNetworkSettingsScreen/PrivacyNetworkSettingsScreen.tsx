import React, { useCallback, useContext, useEffect, useMemo } from 'react'
import { View } from 'react-native'

import GlobeIcon from '@common/assets/svg/GlobeIcon'
import ShieldInvisibilityIcon from '@common/assets/svg/ShieldInvisibilityIcon'
import Button from '@common/components/Button'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import Select from '@common/components/Select'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import type { AnonRpcStatus } from '@web/extension-services/background/controllers/anon-rpc'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const STATUS_LABELS: Record<AnonRpcStatus, string> = {
  off: 'Off',
  connecting: 'Connecting…',
  connected: 'Connected',
  failed: 'Not connected'
}

const PrivacyNetworkSettingsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const {
    state: { isSupported, isEnabled, presets, presetsError, selectedPresetId, status, statusError },
    dispatch
  } = useController('AnonRpcController')

  useEffect(() => {
    setCurrentSettingsPage('privacy-network')
  }, [setCurrentSettingsPage])

  const presetOptions = useMemo(
    () => presets.map((preset) => ({ value: preset.id, label: preset.label })),
    [presets]
  )
  const selectedOption = useMemo(
    () => presetOptions.find((option) => option.value === selectedPresetId) || null,
    [presetOptions, selectedPresetId]
  )

  const statusColor = useMemo(() => {
    if (status === 'connected') return theme.successText
    if (status === 'failed') return theme.errorText
    return theme.secondaryText
  }, [status, theme])

  const handleToggle = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'setEnabled', args: [!isEnabled] } })
  }, [dispatch, isEnabled])

  const handleSelectPreset = useCallback(
    (option: { value: string | number }) => {
      dispatch({ type: 'method', params: { method: 'selectPreset', args: [String(option.value)] } })
    },
    [dispatch]
  )

  const handleRetry = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'retry', args: [] } })
  }, [dispatch])

  return (
    <>
      <SettingsPageHeader title={t('Privacy network')} />
      {!isSupported ? (
        <Text appearance="secondaryText">
          {t('This option is only available in Chrome, Brave and other Chromium-based browsers.')}
        </Text>
      ) : (
        <>
          <ControlOption
            style={spacings.mbTy}
            title={t('Hide your IP address')}
            description={t(
              'Send the wallet’s network requests through a privacy network, so the services that provide balances and blockchain data can’t see your IP address. Loading will be slower. While this is on, the wallet won’t fall back to a direct connection: if the privacy network is unavailable, data stops loading until it’s back or you turn this off.'
            )}
            renderIcon={<ShieldInvisibilityIcon width={24} height={24} />}
          >
            <FatToggle
              isOn={isEnabled}
              onToggle={handleToggle}
              trackStyle={spacings.mr0}
              disabled={!presets.length && !isEnabled}
            />
          </ControlOption>
          <ControlOption
            style={spacings.mbTy}
            title={t('Privacy network')}
            description={t('Which privacy network to use.')}
            renderIcon={<GlobeIcon width={24} height={24} />}
          >
            <Select
              setValue={handleSelectPreset}
              withSearch={false}
              options={presetOptions}
              value={selectedOption}
              disabled={!presetOptions.length}
              containerStyle={{ width: 220, ...spacings.mb0 }}
              size="sm"
            />
          </ControlOption>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtSm]}>
            <Text fontSize={14} weight="medium" style={{ color: statusColor }}>
              {t('Status: {{status}}', { status: t(STATUS_LABELS[status]) })}
            </Text>
            {status === 'failed' && (
              <Button
                type="secondary"
                size="small"
                text={t('Retry')}
                onPress={handleRetry}
                hasBottomSpacing={false}
                style={spacings.mlSm}
              />
            )}
          </View>
          {!!statusError && (
            <Text fontSize={14} style={[spacings.mtTy, { color: theme.errorText }]}>
              {statusError}
            </Text>
          )}
          {!presets.length && (
            <Text fontSize={14} appearance="secondaryText" style={spacings.mtTy}>
              {t('No privacy networks are set up in this build of the extension.')}
            </Text>
          )}
          {!!presetsError && (
            <Text fontSize={12} appearance="secondaryText" style={spacings.mtTy}>
              {presetsError}
            </Text>
          )}
        </>
      )}
    </>
  )
}

export default React.memo(PrivacyNetworkSettingsScreen)
