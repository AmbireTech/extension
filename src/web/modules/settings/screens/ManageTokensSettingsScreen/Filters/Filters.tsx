import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { AssetTab } from '@common/modules/settings/components/AssetTabs'
import { ASSET_COPY } from '@common/modules/settings/constants/assetCopy'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

type Props = {
  control: any
  networkFilter: string
  setNetworkFilterValue: (value: SelectValue) => void
  activeTab: AssetTab
  openAddAssetBottomSheet: () => void
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

const Filters: FC<Props> = ({
  control,
  networkFilter,
  setNetworkFilterValue,
  activeTab,
  openAddAssetBottomSheet
}) => {
  const { t } = useTranslation()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { theme } = useTheme()
  const isNftsTab = activeTab === 'nfts'
  const copy = ASSET_COPY[isNftsTab ? 'ERC721' : 'ERC20']
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
          placeholder={t(copy.searchPlaceholder)}
          control={control}
          height={48}
        />
        <Select
          options={networksOptions}
          value={
            networkFilter
              ? networksOptions.filter((opt) => opt.value === networkFilter)[0]
              : ALL_NETWORKS_OPTION
          }
          selectStyle={{ backgroundColor: theme.secondaryBackground }}
          setValue={setNetworkFilterValue}
          containerStyle={{ width: 260, marginBottom: 0, ...spacings.mrTy }}
        />
      </View>
      <Button
        testID={isNftsTab ? 'add-custom-nft-button' : 'add-custom-token-button'}
        childrenPosition="left"
        size="smaller"
        style={[spacings.phSm, { height: 40 }]}
        textStyle={{ fontSize: 12 }}
        text={t(copy.addButton)}
        onPress={openAddAssetBottomSheet}
        hasBottomSpacing={false}
      >
        <AddCircularIcon width={20} height={20} style={spacings.mrMi} />
      </Button>
    </View>
  )
}

export default React.memo(Filters)
