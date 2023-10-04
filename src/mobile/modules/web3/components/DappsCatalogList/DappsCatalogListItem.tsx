import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import React, { useCallback } from 'react'
import { Keyboard, TouchableOpacity, View } from 'react-native'

import StarIcon from '@common/assets/svg/StarIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DappIcon from '../DappIcon'
import styles from './styles'

interface Props {
  id: DappManifestData['id']
  name: DappManifestData['name']
  description: DappManifestData['description']
  iconUrl: DappManifestData['iconUrl']
  isFilled: boolean
  isSupported: boolean
  onOpenDapp: (id: DappManifestData['id']) => void
  onToggleFavorite: (id: DappManifestData['id']) => void
  networks: DappManifestData['networks']
  inSearchMode?: boolean
}

const DappCatalogListItem: React.FC<Props> = ({
  id,
  name,
  description,
  iconUrl,
  isFilled,
  isSupported,
  inSearchMode,
  onOpenDapp,
  onToggleFavorite,
  networks = []
}) => {
  const handleOnOpenDapp = useCallback(() => {
    if (!isSupported && !id.includes('search:')) return

    onOpenDapp(id)
    !isWeb && Keyboard.dismiss()
  }, [id, isSupported, onOpenDapp])

  return (
    <TouchableOpacity
      style={[
        styles.catalogItem,
        !isSupported && styles.disabledItem,
        !!inSearchMode && spacings.mbMi
      ]}
      // Do not use disabled prop on TouchableOpacity, because of the built-in
      // behavior that prevents touch events from propagating to its parent
      // components when it is disabled that prevents scrolling on FlatList
      // disabled={!isSupported}
      activeOpacity={isSupported ? 0.8 : 0.2}
      onPress={handleOnOpenDapp}
    >
      <View
        style={[
          flexbox.directionRow,
          !inSearchMode && spacings.mb,
          !!inSearchMode && flexbox.alignCenter
        ]}
      >
        <View style={spacings.mrTy}>
          <DappIcon
            iconUrl={iconUrl}
            size={46}
            isSearchIcon={id.includes('search:')}
            isBrowserIcon={id.includes('search:url-or-hostname')}
          />
        </View>
        <View style={flexbox.flex1}>
          <View style={[flexbox.directionRow, flexbox.justifySpaceBetween]}>
            <Text
              fontSize={inSearchMode ? 14 : 16}
              weight="medium"
              numberOfLines={1}
              color={colors.martinique}
              style={[!!description && spacings.mbMi, flexbox.flex1, spacings.prSm]}
            >
              {name}
            </Text>
            {/* Dapp favorites are temporarily disabled since v3.11.0 */}
            {/* {!inSearchMode && (
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, right: 10, left: 5 }}
                onPress={() => {
                  onToggleFavorite(id)
                  !isWeb && Keyboard.dismiss()
                }}
              >
                <StarIcon isFilled={isFilled} />
              </TouchableOpacity>
            )} */}
          </View>
          {!!description && (
            <Text color={colors.martinique_65} fontSize={12} numberOfLines={inSearchMode ? 1 : 8}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {!inSearchMode && (
        <View style={[flexbox.directionRow, flexbox.alignEnd]}>
          {networks.slice(0, 7).map((n: string, index: number, arr: string | any[]) => {
            return (
              <View
                style={[
                  styles.networkIcon,
                  { marginLeft: index ? -5 : 0, zIndex: arr.length - index }
                ]}
                key={n}
              >
                <NetworkIcon name={n as any} width={22} height={22} />
              </View>
            )
          })}
          {networks.length > 7 && (
            <Text
              style={[spacings.plMi, { height: 6, lineHeight: 14 }]}
              fontSize={28}
              color={colors.martinique}
            >
              ...
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

export default React.memo(DappCatalogListItem)
