import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  control: any
  networkFilter: string
  networks: Network[]
  setNetworkFilterValue: (value: SelectValue) => void
}

const ALL_NETWORKS_OPTION = {
  value: 'all',
  label: <Text weight="medium">All Networks</Text>,
  icon: (
    <View style={spacings.phMi}>
      <NetworksIcon width={24} height={24} />
    </View>
  )
}

const Filters: FC<Props> = ({ control, networkFilter, networks, setNetworkFilterValue }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const networkOptions = useMemo(
    () => [
      ALL_NETWORKS_OPTION,
      ...networks.map((network) => ({
        value: network.chainId.toString(),
        label: <Text weight="medium">{network.name}</Text>,
        icon: <NetworkIcon key={network.chainId.toString()} id={network.chainId.toString()} />
      }))
    ],
    [networks]
  )

  return (
    <View
      style={[flexbox.directionRow, flexbox.alignEnd, flexbox.justifySpaceBetween, spacings.mbMd]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Search
          containerStyle={{
            minWidth: 320,
            ...spacings.mrTy
          }}
          placeholder={t('Search by spender, token or network')}
          control={control}
          height={48}
        />
        <Select
          options={networkOptions}
          value={
            networkFilter
              ? networkOptions.find((option) => option.value === networkFilter) ||
                ALL_NETWORKS_OPTION
              : ALL_NETWORKS_OPTION
          }
          selectStyle={{ backgroundColor: theme.secondaryBackground }}
          setValue={setNetworkFilterValue}
          containerStyle={{ width: 260, marginBottom: 0 }}
        />
      </View>
    </View>
  )
}

export default React.memo(Filters)
