import { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { isBenzin, isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { EXPLORER_LINKS_DISABLED_TOOLTIP } from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/constants'
import spacings, { SPACING_LG, SPACING_TY } from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'
import { isExtension } from '@web/constants/browserapi'

const { isSidePanel } = getUiType()

const useIsCompactBenzinButtonsLayout = () => {
  const { maxWidthSize } = useWindowSize()
  const isNarrowWidth = !maxWidthSize('s')

  return (isBenzin && isNarrowWidth) || (isExtension && isSidePanel && isNarrowWidth)
}

interface Props {
  handleCopyText: () => void
  handleOpenExplorer: () => void
  style?: ViewStyle
  showCopyBtn: boolean
  showOpenExplorerBtn: boolean
  disableOpenExplorerBtn?: boolean
}

const OpenExplorerButton: FC<Pick<Props, 'handleOpenExplorer' | 'disableOpenExplorerBtn'>> = ({
  handleOpenExplorer,
  disableOpenExplorerBtn
}) => {
  const { theme } = useTheme()
  const isCompactLayout = useIsCompactBenzinButtonsLayout()

  const button = (
    <Button
      type={isExtension ? 'outline' : 'secondary'}
      onPress={handleOpenExplorer}
      text="Open explorer"
      childrenPosition="left"
      hasBottomSpacing={isMobile}
      size={isMobile ? 'regular' : isCompactLayout ? 'smaller' : 'large'}
      disabled={disableOpenExplorerBtn}
      style={
        isWeb
          ? {
              ...spacings.phTy,
              ...(isCompactLayout
                ? { flex: 1, minWidth: 0, width: '100%' }
                : { width: 170, marginRight: SPACING_LG }),
              borderWidth: 2
            }
          : { height: 46 }
      }
    >
      <OpenIcon width={24} height={24} color={theme.primaryText} style={spacings.mrMi} />
    </Button>
  )

  if (!disableOpenExplorerBtn || !isWeb) return button

  return (
    <View
      dataSet={createGlobalTooltipDataSet({
        id: 'benzin-open-explorer-disabled',
        content: EXPLORER_LINKS_DISABLED_TOOLTIP
      })}
    >
      {button}
    </View>
  )
}

const CopyButton: FC<Pick<Props, 'handleCopyText'>> = ({ handleCopyText }) => {
  const isCompactLayout = useIsCompactBenzinButtonsLayout()

  return (
    <Button
      style={
        isWeb
          ? {
              ...(isCompactLayout ? { flex: 1, minWidth: 0, width: '100%' } : { width: 150 }),
              ...spacings.phTy,
              marginTop: isCompactLayout && isBenzin ? SPACING_TY : 0
            }
          : { height: 46 }
      }
      onPress={handleCopyText}
      text="Copy link"
      hasBottomSpacing={isMobile}
      type={isExtension || isMobile ? 'secondary' : 'primary'}
      childrenPosition="left"
      size={isMobile ? 'regular' : isCompactLayout ? 'smaller' : 'large'}
    >
      <CopyIcon style={spacings.mrMi} />
    </Button>
  )
}

const Buttons: FC<Props> = ({
  handleCopyText,
  handleOpenExplorer,
  disableOpenExplorerBtn,
  showCopyBtn,
  showOpenExplorerBtn
}) => {
  const isCompactLayout = useIsCompactBenzinButtonsLayout()

  return (
    <FooterGlassView
      absolute={false}
      style={spacings.mb}
      innerContainerStyle={{
        ...(isCompactLayout
          ? { width: '100%', flexDirection: 'column', alignItems: 'stretch' }
          : { flexDirection: 'row' })
      }}
    >
      {showOpenExplorerBtn && (
        <OpenExplorerButton
          handleOpenExplorer={handleOpenExplorer}
          disableOpenExplorerBtn={disableOpenExplorerBtn}
        />
      )}
      {showCopyBtn && <CopyButton handleCopyText={handleCopyText} />}
    </FooterGlassView>
  )
}

export { CopyButton, OpenExplorerButton }

export default Buttons
