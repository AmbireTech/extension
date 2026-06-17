import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { isHeliosProviderAvailable } from '@ambire-common/libs/networks/helios'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import { useTranslation } from '@common/config/localization'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

type Props = {
  network: Network
}

const HeliosControlOption = ({ network }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    state: { statuses },
    dispatch
  } = useController('NetworksController')

  const isAvailable = useMemo(() => isHeliosProviderAvailable(network.chainId), [network.chainId])
  const isLoading = statuses.updateNetwork === 'LOADING'
  const isDisabled = !isAvailable || isLoading

  const handleToggle = useCallback(
    (isOn: boolean) => {
      if (!isAvailable) return

      dispatch({
        type: 'method',
        params: {
          method: 'updateNetwork',
          args: [{ useHeliosProvider: isOn }, network.chainId]
        }
      })
    },
    [dispatch, isAvailable, network.chainId]
  )

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Helios RPC provider')}
      description={t('Use the Helios light client provider for this network.')}
      renderIcon={<SettingsIcon color={theme.primaryText} />}
    >
      <View
        dataSet={
          !isAvailable
            ? createGlobalTooltipDataSet({
                id: `helios-unavailable-${network.chainId.toString()}`,
                content: t('Helios unavailable for {{networkName}}', {
                  networkName: network.name
                })
              })
            : undefined
        }
      >
        <FatToggle
          id={`helios-provider-${network.chainId.toString()}`}
          isOn={!!network.useHeliosProvider && isAvailable}
          onToggle={handleToggle}
          disabled={isDisabled}
        />
      </View>
    </ControlOption>
  )
}

export default React.memo(HeliosControlOption)
