import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextInputProps, TouchableHighlight, View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Input from '@common/components/Input'
import Spinner from '@common/components/Spinner'
import Wrapper from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useWeb3 from '@mobile/modules/web3/hooks/useWeb3'
import useGetProviderInjection from '@mobile/modules/web3/services/webview-inpage/injection-script'

import styles from '../../screens/Web3BrowserScreen/styles'
import BrowserBackIcon from '../BrowserBackIcon'
import BrowserForwardIcon from '../BrowserForwardIcon'
import BrowserHomeIcon from '../BrowserHomeIcon'
import BrowserReloadIcon from '../BrowserReloadIcon'

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
  onChangeAddressBarValue,
  onSubmitEditingAddressBar,
  addressInputProps = {}
}) => {
  const { t } = useTranslation()

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
        placeholder={t('Search or type URL')}
        placeholderTextColor={colors.white}
        {...addressInputProps}
      />
    </View>
  )
}

export default BrowserNavigationToolbar
