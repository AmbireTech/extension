import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import Button from '@common/components/Button'
import useTheme from '@common/hooks/useTheme'
import useManageAsset from '@common/modules/settings/hooks/useManageAsset'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  address: string
  chainId: bigint
  tokenId: bigint
  handleClose: () => void
}

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
    <Button
      testID="hide-collectible-button"
      type="secondary"
      size="small"
      text={t('Hide')}
      onPress={handleHide}
      childrenPosition="left"
      hasBottomSpacing={false}
      style={flexbox.flex1}
    >
      <InvisibilityIcon color={theme.primaryText} width={20} height={20} style={spacings.mrMi} />
    </Button>
  )
}

export default React.memo(HideCollectibleButton)
