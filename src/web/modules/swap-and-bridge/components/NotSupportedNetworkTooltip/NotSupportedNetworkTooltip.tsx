import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Network } from '@ambire-common/interfaces/network'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'

interface Props {
  tooltipId: string
  network?: Network
  account?: Account | null
}

const NotSupportedNetworkTooltip: React.FC<Props> = ({ tooltipId, network, account }) => {
  const { t } = useTranslation()

  const networkName = network?.name || t('This')
  const message =
    account &&
    account.creation &&
    network &&
    (!network.areContractsDeployed || (!network.hasRelayer && !network.erc4337.enabled))
      ? t('{{networkName}} does not support smart accounts.', {
          networkName
        })
      : t('{{networkName}} network is not supported by our service provider.', {
          networkName
        })

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
