import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import useTheme from '@common/hooks/useTheme'
import useManageAsset from '@common/modules/settings/hooks/useManageAsset'
import { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const BUTTON_SIZE = 40
const BUTTON_BORDER_RADIUS = 8
const ICON_SIZE = 24

type Props = {
  address: string
  chainId: bigint
  tokenId: bigint
  handleClose: () => void
}

/** Kept separate, as it relies on the PortfolioController, which the modal doesn't */
const HideCollectibleButton: FC<Props> = ({ address, chainId, tokenId, handleClose }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isHidden, toggleHideAsset } = useManageAsset({
    address,
    chainId,
    standard: 'ERC721',
    tokenId
  })

  const handleHide = useCallback(() => {
    toggleHideAsset()
    handleClose()
  }, [handleClose, toggleHideAsset])

  if (isHidden) return null

  return (
    <View
      style={{
        position: 'absolute',
        top: SPACING_TY,
        right: SPACING_TY,
        zIndex: 3
      }}
    >
      <HoverablePressable
        testID="hide-collectible-button"
        onPress={handleHide}
        dataSet={createGlobalTooltipDataSet({
          id: `hide-collectible-${address}-${tokenId}`,
          content: t('Hide this NFT')
        })}
        style={[
          flexbox.center,
          {
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: BUTTON_BORDER_RADIUS,
            backgroundColor: theme.neutral100
          }
        ]}
      >
        <InvisibilityIcon color={theme.primaryText} width={ICON_SIZE} height={ICON_SIZE} />
      </HoverablePressable>
    </View>
  )
}

export default React.memo(HideCollectibleButton)
