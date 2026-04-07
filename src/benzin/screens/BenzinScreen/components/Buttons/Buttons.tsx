import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import { isBenzin, isMobile, isWeb } from '@common/config/env'
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
  const isMobileInStandaloneBenzin = !maxWidthSize('s') && isBenzin

  return (
    <Button
      type={isExtension ? 'ghost' : 'secondary'}
      onPress={handleOpenExplorer}
      text="Open explorer"
      childrenPosition="left"
      hasBottomSpacing={isMobile}
      size={isMobile ? 'regular' : isMobileInStandaloneBenzin ? 'large' : 'smaller'}
      style={
        isWeb
          ? {
              ...spacings.phTy,
              width: isMobileInStandaloneBenzin ? 240 : 170,
              marginRight: isMobileInStandaloneBenzin ? SPACING_LG : 0
            }
          : { height: 46 }
      }
    >
      <OpenIcon width={24} height={24} color={theme.primaryText} style={spacings.mrMi} />
    </Button>
  )
}

const CopyButton: FC<Pick<Props, 'handleCopyText'>> = ({ handleCopyText }) => {
  const { maxWidthSize } = useWindowSize()
  const isMobileInStandaloneBenzin = !maxWidthSize('s') && isBenzin

  return (
    <Button
      style={
        isWeb
          ? {
              width: isMobileInStandaloneBenzin ? 240 : 150,
              ...spacings.phTy,
              marginTop: isMobileInStandaloneBenzin ? SPACING_TY : 0
            }
          : { height: 46 }
      }
      onPress={handleCopyText}
      text="Copy link"
      hasBottomSpacing={isMobile}
      type={isExtension || isMobile ? 'secondary' : 'primary'}
      childrenPosition="left"
      size={isMobile ? 'regular' : isMobileInStandaloneBenzin ? 'smaller' : 'large'}
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
  const isMobileInStandaloneBenzin = !maxWidthSize('s') && isBenzin

  return (
    <FooterGlassView
      absolute={false}
      style={spacings.mb}
      innerContainerStyle={{
        flexDirection: isMobileInStandaloneBenzin ? 'column' : 'row'
      }}
    >
      {showOpenExplorerBtn && <OpenExplorerButton handleOpenExplorer={handleOpenExplorer} />}
      {showCopyBtn && <CopyButton handleCopyText={handleCopyText} />}
    </FooterGlassView>
  )
}

export { OpenExplorerButton, CopyButton }

export default Buttons
