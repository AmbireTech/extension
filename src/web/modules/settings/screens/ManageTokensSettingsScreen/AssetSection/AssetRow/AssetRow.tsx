import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import { CollectionResult, TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import { ManagedAsset } from '@common/modules/settings/hooks/useManageAssets/composeAssetLists'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import shortenCollectibleId from '@common/utils/shortenCollectibleId'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import CollectionThumbnail from '@common/components/CollectionThumbnail'
import Dropdown from '@common/components/Dropdown'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useManageAsset from '@common/modules/settings/hooks/useManageAsset'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

const ICON_SIZE = 32

type Props = {
  asset: ManagedAsset<TokenResult | CollectionResult>
  standard: CustomToken['standard']
  onAssetPreferenceChange: () => void
}

const AssetRow: FC<Props> = ({ asset, standard, onAssetPreferenceChange }) => {
  const { address, chainId, flags, symbol, tokenId } = asset
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks } = useController('NetworksController').state
  const { isHidden, toggleHideAsset, removeCustomAsset } = useManageAsset({
    address,
    chainId,
    standard,
    tokenId,
    onAssetPreferenceChange
  })
  const isCollection = standard === 'ERC721'

  const dropdownOptions = useMemo(() => {
    return [
      {
        label: 'View on block explorer',
        value: 'explorer'
      }
    ]
  }, [])

  const onDropdownSelect = useCallback(
    async ({ value }: { value: string }) => {
      if (value !== 'explorer') return

      const network = networks.find(({ chainId: nChainId }) => nChainId === chainId)
      if (!network) return

      await openInTab({ url: `${network.explorerUrl}/token/${address}` })
    },
    [address, chainId, networks]
  )

  // The portfolio has no name for assets it can't discover
  const name = (isCollection ? asset.name : symbol) || shortenAddress(address, 13)
  const label =
    isCollection && typeof tokenId === 'bigint' ? `${name} #${shortenCollectibleId(tokenId)}` : name

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        common.borderRadiusPrimary,
        flexbox.flex1,
        spacings.mbTy,
        spacings.pvTy,
        {
          backgroundColor: theme.secondaryBackground
        }
      ]}
    >
      <View style={[{ flex: 1.25 }, flexbox.directionRow, flexbox.alignCenter, spacings.plSm]}>
        {isCollection ? (
          <CollectionThumbnail
            address={address}
            chainId={chainId}
            collectibleId={tokenId ?? (asset as CollectionResult).collectibles[0]}
            size={ICON_SIZE}
            networks={networks}
          />
        ) : (
          <TokenIcon
            withContainer
            // The network is already displayed in its own column
            withNetworkIcon={false}
            address={address}
            chainId={chainId}
            onGasTank={flags.onGasTank}
            containerHeight={ICON_SIZE}
            containerWidth={ICON_SIZE}
            width={28}
            height={28}
          />
        )}
        <Text
          testID={isCollection ? 'hidden-nft-name' : 'hidden-token-name'}
          weight="medium"
          selectable
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[spacings.mlTy, flexbox.flex1]}
        >
          {label}
        </Text>
        {flags.isCustom && <Badge text={t('Custom')} />}
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, { flex: 1.5 }]}>
        <NetworkIcon id={chainId.toString()} style={spacings.mrTy} />
        <Text testID={isCollection ? 'hidden-nft-network' : 'hidden-token-network'}>
          {networks.find(({ chainId: nChainId }) => nChainId === chainId)?.name ||
            'Unknown Network'}
        </Text>
      </View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.prSm,
          { flex: 0.4 }
        ]}
      >
        <Button
          testID={isHidden ? 'unhide-button' : 'remove-button'}
          type="secondary"
          size="small"
          style={{ width: 80 }}
          text={isHidden ? t('Unhide') : t('Remove')}
          onPress={isHidden ? toggleHideAsset : removeCustomAsset}
          hasBottomSpacing={false}
        />
        <Dropdown data={dropdownOptions} onSelect={onDropdownSelect} />
      </View>
    </View>
  )
}

export default React.memo(AssetRow)
