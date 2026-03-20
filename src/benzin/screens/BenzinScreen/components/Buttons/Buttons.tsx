import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings, { SPACING_LG, SPACING_TY } from '@common/styles/spacings'
import { isExtension } from '@web/constants/browserapi'

interface Props {
  handleCopyText: () => void
  handleOpenExplorer: () => void
  style?: ViewStyle
  showCopyBtn: boolean
  showOpenExplorerBtn: boolean
}

const OpenExplorerButton: FC<Pick<Props, 'handleOpenExplorer'>> = ({ handleOpenExplorer }) => {
  const { theme } = useTheme()
  const { maxWidthSize } = useWindowSize()

  return (
    <Button
      type={isExtension || isMobile ? 'ghost' : 'secondary'}
      onPress={handleOpenExplorer}
      text="Open explorer"
      childrenPosition="left"
      hasBottomSpacing={isMobile}
      size={isMobile ? 'regular' : maxWidthSize('s') ? 'large' : 'smaller'}
      style={
        isWeb
          ? {
              width: maxWidthSize('s') ? 170 : 240,
              ...spacings.phTy,
              marginRight: maxWidthSize('s') ? SPACING_LG : 0
            }
          : {}
      }
    >
      <OpenIcon width={24} height={24} color={theme.primaryText} style={spacings.mrMi} />
    </Button>
  )
}

const CopyButton: FC<Pick<Props, 'handleCopyText'>> = ({ handleCopyText }) => {
  const { maxWidthSize } = useWindowSize()
  return (
    <Button
      style={
        isWeb
          ? {
              width: maxWidthSize('s') ? 150 : 240,
              ...spacings.phTy,
              marginTop: maxWidthSize('s') ? 0 : SPACING_TY
            }
          : {}
      }
      onPress={handleCopyText}
      text="Copy link"
      hasBottomSpacing={isMobile}
      type={isExtension || isMobile ? 'secondary' : 'primary'}
      childrenPosition="left"
      size={isMobile ? 'regular' : maxWidthSize('s') ? 'large' : 'smaller'}
    >
      <CopyIcon style={spacings.mrMi} />
    </Button>
  )
}

const Buttons: FC<Props> = ({
  handleCopyText,
  handleOpenExplorer,
  showCopyBtn,
  showOpenExplorerBtn
}) => {
  const { maxWidthSize } = useWindowSize()
  return (
    <FooterGlassView
      absolute={false}
      style={spacings.mb}
      innerContainerStyle={{
        flexDirection: maxWidthSize('s') ? 'row' : 'column'
      }}
    >
      {showOpenExplorerBtn && <OpenExplorerButton handleOpenExplorer={handleOpenExplorer} />}
      {showCopyBtn && <CopyButton handleCopyText={handleCopyText} />}
    </FooterGlassView>
  )
}

export { OpenExplorerButton, CopyButton }

export default Buttons
