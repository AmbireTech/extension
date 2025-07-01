import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import NetworksIcon from '@common/assets/svg/NetworksIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

type Props = {
  control: any
  networkFilter: string
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

const Filters: FC<Props> = ({ control, networkFilter, setNetworkFilterValue }) => {
  const { t } = useTranslation()
  const { networks } = useNetworksControllerState()
  const { themeType, theme } = useTheme()
  const networksOptions: SelectValue[] = useMemo(
    () => [
      ALL_NETWORKS_OPTION,
      ...networks.map((n) => ({
        value: n.name,
        label: <Text weight="medium">{n.name}</Text>,
        icon: <NetworkIcon key={n.chainId.toString()} id={n.chainId.toString()} />
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
            minWidth: 280,
            ...spacings.mrTy
          }}
          placeholder={t('Search tokens')}
          control={control}
          height={50}
        />
        <Select
          options={networksOptions}
          value={
            networkFilter
              ? networksOptions.filter((opt) => opt.value === networkFilter)[0]
              : ALL_NETWORKS_OPTION
          }
          selectStyle={
            themeType === THEME_TYPES.DARK ? { backgroundColor: theme.tertiaryBackground } : {}
          }
          setValue={setNetworkFilterValue}
          containerStyle={{ width: 260, marginBottom: 0, ...spacings.mrTy }}
        />
      </View>
    </View>
  )
}

export default React.memo(Filters)
