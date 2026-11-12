import React, { useCallback, useMemo } from 'react'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

const alertStyle = { ...spacings.mtSm, ...spacings.mbLg }

/**
 * Shown under the DeFi positions while the "Tokens, NFTs & DeFi positions auto discovery"
 * privacy option is off. Only the protocols the wallet reads on its own (e.g. Aave v3,
 * Uniswap V3) are listed then, so it lets the user know the list can be incomplete and turns
 * auto discovery back on, followed by a manual reload so the missing positions are fetched
 * right away.
 */
const AutoDiscoveryOffAlert = () => {
  const { t } = useTranslation()
  const { dispatch: featureFlagsDispatch } = useController('FeatureFlagsController')
  const { dispatch: mainDispatch } = useController('MainController')

  const handleEnable = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlags',
        args: [{ tokenAndDefiAutoDiscovery: true }]
      }
    })
    // Actions are handled in the order they are dispatched and `setFeatureFlags` updates the
    // flags before its first await, so this reload already runs with auto discovery on
    mainDispatch({
      type: 'method',
      params: {
        method: 'reloadSelectedAccount',
        args: [{ isManualReload: true }]
      }
    })
  }, [featureFlagsDispatch, mainDispatch])

  const buttonProps = useMemo(
    () => ({ text: t('Turn on auto discovery'), onPress: handleEnable }),
    [handleEnable, t]
  )

  return (
    <Alert
      type="info"
      size="sm"
      style={alertStyle}
      title={t('Some positions may be missing')}
      text={t(
        'To protect your privacy, auto discovery is turned off, so the wallet checks only a few popular apps (like Aave and Uniswap) by itself. Turn it on to find your positions in all supported apps. This lets Ambire look up your address with third-party data providers.'
      )}
      buttonProps={buttonProps}
    />
  )
}

export default React.memo(AutoDiscoveryOffAlert)
