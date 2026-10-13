import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import GlobeIcon from '@common/assets/svg/GlobeIcon'
import PrivacyNetworkIcon from '@common/assets/svg/PrivacyNetworkIcon'
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
import type {
  AnonRpcPreset,
  AnonRpcStatus
} from '@web/extension-services/background/controllers/anon-rpc'
import {
  CUSTOM_NETWORK_ID,
  formatNetworkConfig
} from '@web/extension-services/background/controllers/anon-rpc/customNetwork'
import CustomNetworkForm from '@web/modules/settings/components/PrivacyNetwork/CustomNetworkForm'
import NetworkDetails from '@web/modules/settings/components/PrivacyNetwork/NetworkDetails'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const STATUS_LABELS: Record<AnonRpcStatus, string> = {
  off: 'Off',
  connecting: 'Connecting…',
  connected: 'Connected',
  failed: 'Not connected'
}

type CustomNetworkDraft = {
  specifier: string
  configText: string
  /** Changes whenever the draft is replaced, to remount the form with it */
  version: number
}

const PrivacyNetworkSettingsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const {
    state: {
      isSupported,
      isEnabled,
      presets,
      presetsError,
      selectedPresetId,
      customNetwork,
      status,
      statusError
    },
    dispatch
  } = useController('AnonRpcController')
  // Which network's details are shown below the picker. Follows the network in use,
  // except while the user is looking at (or preparing) a custom network not saved yet.
  const [viewedNetworkOverride, setViewedNetworkOverride] = useState<string | null>(null)
  const [customDraft, setCustomDraft] = useState<CustomNetworkDraft | null>(null)
  const viewedNetworkId = viewedNetworkOverride ?? selectedPresetId

  useEffect(() => {
    setCurrentSettingsPage('privacy-network')
  }, [setCurrentSettingsPage])

  const networkOptions = useMemo(
    () => [
      ...presets.map((preset) => ({ value: preset.id, label: preset.label })),
      { value: CUSTOM_NETWORK_ID, label: t('Custom network') }
    ],
    [presets, t]
  )
  const selectedOption = useMemo(
    () => networkOptions.find((option) => option.value === viewedNetworkId) || null,
    [networkOptions, viewedNetworkId]
  )
  const viewedPreset = useMemo(
    () => presets.find((preset) => preset.id === viewedNetworkId) || null,
    [presets, viewedNetworkId]
  )
  const inUseLabel = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId)?.label || null,
    [presets, selectedPresetId]
  )
  const customFormValues = useMemo(
    () =>
      customDraft || {
        specifier: customNetwork?.specifier || '',
        configText: customNetwork?.configText ?? formatNetworkConfig(customNetwork?.config),
        version: 0
      },
    [customDraft, customNetwork]
  )

  const statusColor = useMemo(() => {
    if (status === 'connected') return theme.successText
    if (status === 'failed') return theme.errorText
    return theme.secondaryText
  }, [status, theme])

  const handleToggle = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'setEnabled', args: [!isEnabled] } })
  }, [dispatch, isEnabled])

  const handleSelectNetwork = useCallback(
    (option: { value: string | number }) => {
      const networkId = String(option.value)
      // A custom network that was never saved can't be used yet: show its form instead
      if (networkId === CUSTOM_NETWORK_ID && !customNetwork) {
        setViewedNetworkOverride(CUSTOM_NETWORK_ID)
        return
      }
      setViewedNetworkOverride(null)
      dispatch({ type: 'method', params: { method: 'selectPreset', args: [networkId] } })
    },
    [customNetwork, dispatch]
  )

  const handleCopyToCustom = useCallback((preset: AnonRpcPreset) => {
    setCustomDraft((prev) => ({
      specifier: preset.specifier,
      configText: formatNetworkConfig(preset.config),
      version: (prev?.version ?? 0) + 1
    }))
    setViewedNetworkOverride(CUSTOM_NETWORK_ID)
  }, [])

  const handleSaveCustomNetwork = useCallback(
    (specifier: string, configText: string) => {
      dispatch({
        type: 'method',
        params: { method: 'setCustomNetwork', args: [specifier, configText] }
      })
      // The controller selects the custom network, so the view can follow it again
      setViewedNetworkOverride(null)
      setCustomDraft(null)
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
          {t(
            'This option is available in Chrome, Brave and other Chromium-based browsers, and in Firefox 140 or newer.'
          )}
        </Text>
      ) : (
        <>
          <ControlOption
            style={spacings.mbTy}
            title={t('Hide your IP address')}
            description={t(
              'Send the wallet’s network requests through a privacy network, so the services that provide balances and blockchain data can’t see your IP address. Loading will be slower. While this is on, the wallet won’t fall back to a direct connection: if the privacy network is unavailable, data stops loading until it’s back or you turn this off.'
            )}
            renderIcon={<PrivacyNetworkIcon />}
          >
            <FatToggle
              isOn={isEnabled}
              onToggle={handleToggle}
              trackStyle={spacings.mr0}
              disabled={!presets.length && !customNetwork && !isEnabled}
            />
          </ControlOption>
          <ControlOption
            style={spacings.mbTy}
            title={t('Privacy network')}
            description={t('Which privacy network to use.')}
            renderIcon={<GlobeIcon width={24} height={24} />}
          >
            <Select
              setValue={handleSelectNetwork}
              withSearch={false}
              options={networkOptions}
              value={selectedOption}
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
          {viewedNetworkId === CUSTOM_NETWORK_ID ? (
            <CustomNetworkForm
              key={customFormValues.version}
              initialSpecifier={customFormValues.specifier}
              initialConfigText={customFormValues.configText}
              isInUse={selectedPresetId === CUSTOM_NETWORK_ID}
              inUseLabel={inUseLabel}
              onSave={handleSaveCustomNetwork}
            />
          ) : (
            !!viewedPreset && (
              <NetworkDetails network={viewedPreset} onCopyToCustom={handleCopyToCustom} />
            )
          )}
          {!presets.length && (
            <Text fontSize={14} appearance="secondaryText" style={spacings.mtTy}>
              {t(
                'This build of the extension has no preset privacy networks. You can still set up your own as a custom network.'
              )}
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
