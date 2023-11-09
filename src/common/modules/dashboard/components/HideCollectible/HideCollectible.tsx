import {
  Collectible,
  CollectibleWithIsHiddenFlag,
  UsePortfolioReturnType
} from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutAnimation, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Segments from '@common/components/Segments'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import { MODES } from './constants'
import HideCollectibleList from './HideCollectibleList'
import styles from './styles'

const segments = [{ value: MODES.HIDE_COLLECTIBLE }]

interface Props {
  collectibles: CollectibleWithIsHiddenFlag[]
  hiddenCollectibles: UsePortfolioReturnType['hiddenCollectibles']
  onAddHiddenCollectible: UsePortfolioReturnType['onAddHiddenCollectible']
  onRemoveHiddenCollectible: UsePortfolioReturnType['onRemoveHiddenCollectible']
}

const HideCollectible = ({
  collectibles,
  hiddenCollectibles,
  onAddHiddenCollectible,
  onRemoveHiddenCollectible
}: Props) => {
  const { t } = useTranslation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const collectiblesWithHidden = useMemo(
    () => [...hiddenCollectibles, ...collectibles],
    [hiddenCollectibles, collectibles]
  )
  const [tokenHideChanges, setTokenHideChanges] = useState<CollectibleWithIsHiddenFlag[]>([])
  const [sortedCollectibles, setSortedCollectibles] = useState<Collectible[]>(
    collectiblesWithHidden.sort((a, b) => b.balanceUSD - a.balanceUSD)
  )

  // Tokens and hidden tokens get updated asynchronously, so we need to update
  // the sorted tokens when they change. Track only the length changes, since
  // the tokens attributes that change themselves are not used in the component.
  useEffect(() => {
    setSortedCollectibles(collectiblesWithHidden.sort((a, b) => b.balanceUSD - a.balanceUSD))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectiblesWithHidden.length])

  const [formType, setFormType] = useState<MODES>(MODES.HIDE_COLLECTIBLE)

  const toggleCollectibleHide = useCallback<
    (hiddenCollectible: CollectibleWithIsHiddenFlag, assetId: string) => any
  >((hiddenCollectible, assetId) => {
    const updatedHiddenCollectible = {
      ...hiddenCollectible,
      assets: hiddenCollectible.assets.map(
        (asset: any) =>
          asset.tokenId === assetId.toString() && { ...asset, isHidden: !asset.isHidden }
      )
    }

    setTokenHideChanges((prevChanges) => {
      const hasChange = prevChanges.find(
        (c) =>
          c.address === hiddenCollectible.address &&
          c.assets.map(({ tokenId }: { tokenId: string }) => tokenId === assetId.toString())
      )

      if (hasChange) {
        return prevChanges.filter(
          (c) =>
            c.address !== hiddenCollectible.address &&
            c.assets.find(({ tokenId }: { tokenId: string }) => tokenId !== assetId.toString())
        )
      }

      return [...prevChanges, updatedHiddenCollectible]
    })

    setSortedCollectibles((prevCollectibles: Collectible[]) => {
      return prevCollectibles.map((c) => {
        if (
          c.address === hiddenCollectible.address &&
          c.assets.find(({ tokenId }: { tokenId: string }) => tokenId === assetId.toString())
        ) {
          return updatedHiddenCollectible
        }

        return c
      })
    })
  }, [])

  const handleUpdates = useCallback(() => {
    const hiddenCollectiblesToAdd = tokenHideChanges.filter((token) =>
      token.assets.find((asset) => asset.isHidden)
    )
    const assetsToAdd = hiddenCollectiblesToAdd.flatMap((token) =>
      token.assets.map(({ tokenId }: { tokenId: string }) => tokenId)
    )

    const addressesToRemove = tokenHideChanges
      .filter((token) => token.assets.find((asset) => !asset.isHidden))
      .map((token) => token.address)

    const tokenIdsToRemove = tokenHideChanges
      .filter((token) => token.assets.find((asset) => !asset.isHidden))
      .flatMap((token) => token.assets.map(({ tokenId }: { tokenId: string }) => tokenId))

    if (hiddenCollectiblesToAdd.length) onAddHiddenCollectible(hiddenCollectiblesToAdd, assetsToAdd)
    if (addressesToRemove.length) onRemoveHiddenCollectible(addressesToRemove, tokenIdsToRemove)

    // Reset states of hide changes
    setTokenHideChanges([])
  }, [onAddHiddenCollectible, onRemoveHiddenCollectible, tokenHideChanges])

  return (
    <>
      <TouchableOpacity style={[styles.btnContainer, spacings.mbTy]} onPress={openBottomSheet}>
        <Text fontSize={14} style={{ lineHeight: 24 }}>
          {t('Hide Collectible')}
        </Text>
      </TouchableOpacity>

      <BottomSheet
        id="add-token"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        onClosed={handleUpdates}
        cancelText={t('Close')}
      >
        <Segments
          defaultValue={formType}
          segments={segments}
          onChange={(value: MODES) => {
            setFormType(value)
            triggerLayoutAnimation({
              // Animate only for iOS, because on Android it conflicts with
              // the bottom sheet backdrop animation.
              forceAnimate: false,
              config: LayoutAnimation.create(300, 'linear', 'opacity')
            })
          }}
          fontSize={14}
        />
        <View style={[flexboxStyles.flex1, flexboxStyles.justifyEnd, spacings.mtMd, spacings.mbTy]}>
          {formType === MODES.HIDE_COLLECTIBLE && (
            <HideCollectibleList
              collectibles={sortedCollectibles}
              toggleCollectibleHide={toggleCollectibleHide}
            />
          )}
        </View>
      </BottomSheet>
    </>
  )
}

export default HideCollectible
