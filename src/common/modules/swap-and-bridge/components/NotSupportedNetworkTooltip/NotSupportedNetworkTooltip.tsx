import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Network } from '@ambire-common/interfaces/network'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useController from '@common/hooks/useController'

interface Props {
  tooltipId: string
  network?: Network
  account?: Account | null
}

const NotSupportedNetworkTooltip: React.FC<Props> = ({ tooltipId, network, account }) => {
  const { t } = useTranslation()
  const { state } = useController('AccountsController')
  const { accountStates } = state

  const networkName = network?.name || t('This')

  const message = useMemo(() => {
    if (account?.safeCreation && network) {
      const isDeployed = accountStates[account.addr]?.[network.chainId.toString()]?.isDeployed
      if (!isDeployed)
        return t(`Safe not activated on ${networkName}. Please activated it from Safe global`)
    }

    return account &&
      account.creation &&
      network &&
      (!network.areContractsDeployed || (!network.hasRelayer && !network.erc4337.enabled))
      ? t('{{networkName}} does not support smart accounts.', {
          networkName
        })
      : t('{{networkName}} network is not supported by our service provider.', {
          networkName
        })
  }, [account, network, networkName, accountStates, t])

  return (
    <Tooltip id={tooltipId}>
      <View>
        <Text fontSize={14} appearance="secondaryText">
          {message}
        </Text>
      </View>
    </Tooltip>
  )
}

export default React.memo(NotSupportedNetworkTooltip)
