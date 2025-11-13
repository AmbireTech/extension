import React, { FC } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { isExtension } from '@web/constants/browserapi'

import getStyles from './styles'

interface Props {
  handleCopyText: () => void
  handleOpenExplorer: () => void
  style?: ViewStyle
  showCopyBtn: boolean
  showOpenExplorerBtn: boolean
}

const OpenExplorerButton: FC<Pick<Props, 'handleOpenExplorer'>> = ({ handleOpenExplorer }) => {
  const { styles, theme, themeType } = useTheme(getStyles)

  return (
    <Pressable style={styles.openExplorer}>
      <OpenIcon
        width={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 20 : 16}
        height={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 20 : 16}
        color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
      />
      <Text
        fontSize={IS_MOBILE_UP_BENZIN_BREAKPOINT ? 16 : 14}
        color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
        weight="medium"
        style={styles.openExplorerText}
        onPress={handleOpenExplorer}
      >
        Open explorer
      </Text>
    </Pressable>
  )
}

const CopyButton: FC<Pick<Props, 'handleCopyText'>> = ({ handleCopyText }) => {
  return (
    <Button
      style={{
        width: isExtension ? 160 : IS_MOBILE_UP_BENZIN_BREAKPOINT ? 200 : '100%',
        ...(IS_MOBILE_UP_BENZIN_BREAKPOINT || isExtension ? spacings.mlLg : {}),
        ...(IS_MOBILE_UP_BENZIN_BREAKPOINT || isExtension ? spacings.mb0 : spacings.mbMd)
      }}
      onPress={handleCopyText}
      text="Copy link"
      type={isExtension ? 'secondary' : 'primary'}
      childrenPosition="left"
    >
      <CopyIcon style={spacings.mrSm} />
    </Button>
  )
}

const Buttons: FC<Props> = ({
  handleCopyText,
  handleOpenExplorer,
  style = {},
  showCopyBtn,
  showOpenExplorerBtn
}) => {
  const { styles } = useTheme(getStyles)

  return (
    <View style={[styles.buttons, style]}>
      {showOpenExplorerBtn && <OpenExplorerButton handleOpenExplorer={handleOpenExplorer} />}
      {showCopyBtn && <CopyButton handleCopyText={handleCopyText} />}
    </View>
  )
}

export { OpenExplorerButton, CopyButton }

export default Buttons
