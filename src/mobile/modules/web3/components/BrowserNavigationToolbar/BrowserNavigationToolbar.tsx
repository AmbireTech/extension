import React from 'react'
import { TextInputProps, TouchableHighlight, View } from 'react-native'

import Input from '@common/components/Input'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import BrowserBackIcon from '@mobile/modules/web3/components/BrowserBackIcon'
import BrowserForwardIcon from '@mobile/modules/web3/components/BrowserForwardIcon'
import BrowserHomeIcon from '@mobile/modules/web3/components/BrowserHomeIcon'
import BrowserReloadIcon from '@mobile/modules/web3/components/BrowserReloadIcon'

import styles from './styles'

const HIT_SLOP = { bottom: 15, left: 5, right: 5, top: 15 }

interface Props {
  canGoHome?: boolean
  canReload?: boolean
  canGoBack?: boolean
  canGoForward?: boolean
  onGoBack?: () => void
  onGoForward?: () => void
  onGoHome?: () => void
  onReload?: () => void
  addressBarValue?: string
  addressBarPlaceholder?: string
  onChangeAddressBarValue: (value: string) => void
  onSubmitEditingAddressBar: () => void
  addressInputProps?: Partial<TextInputProps>
}

const BrowserNavigationToolbar: React.FC<Props> = ({
  canGoHome = false,
  canReload = false,
  canGoBack = false,
  canGoForward = false,
  onGoHome,
  onGoBack,
  onGoForward,
  onReload,
  addressBarValue,
  addressBarPlaceholder,
  onChangeAddressBarValue,
  onSubmitEditingAddressBar,
  addressInputProps = {}
}) => {
  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.ptTy,
        spacings.pb,
        spacings.pr,
        spacings.plSm
      ]}
    >
      <TouchableHighlight
        hitSlop={HIT_SLOP}
        onPress={onGoHome}
        style={styles.webviewButtonCommon}
        underlayColor={colors.heliotrope}
        disabled={!canGoHome}
      >
        <BrowserHomeIcon color={canGoHome ? colors.white : colors.titan_50} />
      </TouchableHighlight>
      <TouchableHighlight
        hitSlop={HIT_SLOP}
        onPress={onGoBack}
        style={styles.webviewButtonCommon}
        disabled={!canGoBack}
        underlayColor={colors.heliotrope}
      >
        <BrowserBackIcon color={canGoBack ? colors.white : colors.titan_50} />
      </TouchableHighlight>
      <TouchableHighlight
        hitSlop={HIT_SLOP}
        onPress={onGoForward}
        style={styles.webviewButtonCommon}
        disabled={!canGoForward}
        underlayColor={colors.heliotrope}
      >
        <BrowserForwardIcon color={canGoForward ? colors.white : colors.titan_50} />
      </TouchableHighlight>
      <TouchableHighlight
        hitSlop={HIT_SLOP}
        onPress={onReload}
        style={[styles.webviewButtonCommon, styles.reload]}
        underlayColor={colors.heliotrope}
        disabled={!canReload}
      >
        <BrowserReloadIcon color={canReload ? colors.white : colors.titan_50} />
      </TouchableHighlight>
      <Input
        containerStyle={[flexbox.flex1, spacings.mb0]}
        inputStyle={styles.addressInputStyle}
        inputWrapperStyle={styles.addressInputWrapperStyle}
        value={addressBarValue}
        onChangeText={onChangeAddressBarValue}
        onSubmitEditing={onSubmitEditingAddressBar}
        placeholder={addressBarPlaceholder}
        placeholderTextColor={colors.white}
        {...addressInputProps}
      />
    </View>
  )
}

export default BrowserNavigationToolbar
