import React, { FC } from 'react'
import { View } from 'react-native'

import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import { CollectionResult, TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import { ManagedAsset } from '@common/modules/settings/hooks/useManageAssets/composeAssetLists'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import shortenCollectibleId from '@common/utils/shortenCollectibleId'
import Button from '@common/components/Button'
import CollectionThumbnail from '@common/components/CollectionThumbnail'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useManageAsset from '@common/modules/settings/hooks/useManageAsset'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

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

  const networkName =
    networks.find(({ chainId: nChainId }) => nChainId === chainId)?.name || t('Unknown network')
  // The portfolio has no name for assets it can't discover
  const name = (isCollection ? asset.name : symbol) || shortenAddress(address, 13)
  const label =
    isCollection && typeof tokenId === 'bigint' ? `${name} #${shortenCollectibleId(tokenId)}` : name

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        common.borderRadiusPrimary,
        spacings.phTy,
        spacings.pvTy,
        spacings.mbTy,
        { backgroundColor: theme.secondaryBackground }
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, spacings.mrTy]}>
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
            // The network is already displayed below the symbol
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
        <View style={[flexbox.flex1, spacings.mlTy]}>
          <Text
            testID={isCollection ? 'hidden-nft-name' : 'hidden-token-name'}
            fontSize={14}
            weight="medium"
            numberOfLines={1}
          >
            {label}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <NetworkIcon size={16} id={chainId.toString()} style={spacings.mrMi} />
            <Text
              testID={isCollection ? 'hidden-nft-network' : 'hidden-token-network'}
              fontSize={12}
              appearance="secondaryText"
              numberOfLines={1}
            >
              {networkName}
            </Text>
          </View>
        </View>
      </View>
      <Button
        testID={isHidden ? 'unhide-button' : 'remove-button'}
        type="secondary"
        size="small"
        // The button sits on the row's secondaryBackground, so it needs the
        // background the web button gets on hover to stand out
        style={{ width: 88, backgroundColor: theme.tertiaryBackground }}
        text={isHidden ? t('Unhide') : t('Remove')}
        onPress={isHidden ? toggleHideAsset : removeCustomAsset}
        hasBottomSpacing={false}
      />
    </View>
  )
}

export default React.memo(AssetRow)
