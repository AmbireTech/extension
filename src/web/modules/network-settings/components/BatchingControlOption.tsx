import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Button from '@common/components/Button'
import ControlOption from '@common/components/ControlOption'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useProvidersControllerState from '@web/hooks/useProvidersControllerState'

const BatchingControlOption = () => {
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    state: { isBatchingEnabled, statuses }
  } = useProvidersControllerState()
  const isLoading = statuses.toggleBatching === 'LOADING'

  const handleToggleBatching = useCallback(() => {
    dispatch({
      type: 'PROVIDERS_CONTROLLER_TOGGLE_BATCHING'
    })
  }, [dispatch])

  const buttonText = useMemo(() => {
    if (isLoading) {
      return t('Applying...')
    }

    return isBatchingEnabled ? t('Disable') : t('Enable')
  }, [isBatchingEnabled, isLoading, t])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('RPC Batching')}
      description={
        isBatchingEnabled
          ? t('Disable RPC batching on all networks.')
          : t('Enable RPC batching on supported networks.')
      }
      renderIcon={<SettingsIcon color={theme.primaryText} />}
    >
      <Button
        testID="lock-extension-button"
        size="small"
        hasBottomSpacing={false}
        style={{
          width: 80
        }}
        text={buttonText}
        onPress={handleToggleBatching}
        disabled={isLoading}
      />
    </ControlOption>
  )
}

export default React.memo(BatchingControlOption)
