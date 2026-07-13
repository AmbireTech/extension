import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewProps } from 'react-native'

import { Key } from '@ambire-common/interfaces/keystore'
import CheckIcon from '@common/assets/svg/CheckIcon'
import NoEntryIcon from '@common/assets/svg/NoEntryIcon/NoEntryIcon'
import useTheme from '@common/hooks/useTheme'
import { default as flexbox } from '@common/styles/utils/flexbox'

import ButtonWithLoader from '../ButtonWithLoader/ButtonWithLoader'
import getStyles from './styles'

interface Props {
  children?: any
  style?: ViewProps['style']
  isDisabled?: boolean
  hasSigned?: boolean
  isSignLoading?: boolean
  addr: Key['addr']
  type: Key['type']
  onSign?: (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => void
}

const SafeKeyWrapper = ({
  children,
  style,
  isDisabled,
  hasSigned,
  isSignLoading,
  onSign,
  addr,
  type
}: Props) => {
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()

  return (
    <View
      style={[style, flexbox.directionRow, flexbox.alignCenter, isDisabled && { opacity: 0.6 }]}
    >
      <View style={flexbox.flex1}>{children}</View>
      {hasSigned && (
        <CheckIcon color={theme.success300} style={styles.icon} width={18} height={18} />
      )}
      {!isDisabled && !hasSigned && !!onSign && (
        <ButtonWithLoader
          type="primary"
          isLoading={isSignLoading}
          text={t('Sign')}
          onPress={() => onSign(addr, type)}
          size="tiny"
          style={[styles.icon, { minWidth: 60 }]}
        />
      )}
      {isDisabled && !hasSigned && <NoEntryIcon width={18} height={18} style={styles.icon} />}
    </View>
  )
}

export default React.memo(SafeKeyWrapper)
