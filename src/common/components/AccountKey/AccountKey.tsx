import * as Clipboard from 'expo-clipboard'
import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { Key } from '@ambire-common/interfaces/keystore'
import CopyIcon from '@common/assets/svg/CopyIcon'
import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerIcon from '@common/assets/svg/LedgerIcon'
import PrivateKeyIcon from '@common/assets/svg/PrivateKeyIcon'
import TrezorIcon from '@common/assets/svg/TrezorIcon'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import shortenAddress from '@web/utils/shortenAddress'
import { getUiType } from '@web/utils/uiType'

interface Props {
  address: string
  isLast: boolean
  isImported: boolean
  type?: Key['type']
  label?: string
  style?: ViewStyle
}

const { isPopup } = getUiType()

const KeyTypeIcon: FC<{ type: Key['type'] }> = ({ type }) => {
  if (type === 'lattice') return <LatticeIcon width={24} height="auto" />
  if (type === 'trezor') return <TrezorIcon width={24} height="auto" />
  if (type === 'ledger') return <LedgerIcon width={24} height="auto" />

  return <PrivateKeyIcon width={24} height="auto" />
}

const AccountKey: React.FC<Props> = ({ label, address, isLast, type, isImported, style }) => {
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [bindCopyIconAnim, copyIconAnimStyle] = useHover({
    preset: 'opacityInverted'
  })
  const fontSize = isPopup ? 14 : 16

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(address)
      addToast('Key address copied to clipboard', { type: 'success' })
    } catch {
      addToast('Error copying key address', { type: 'error' })
    }
  }

  return (
    <View
      style={[
        spacings.ph,
        spacings.pvSm,
        flexbox.directionRow,
        flexbox.justifySpaceBetween,
        flexbox.alignCenter,
        {
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: theme.secondaryBorder
        },
        style
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        {!!label && (
          <Text fontSize={fontSize} weight="medium">
            {label}
          </Text>
        )}
        <Text fontSize={fontSize} style={label ? spacings.mlTy : spacings.ml0}>
          {label ? `(${shortenAddress(address, 13)})` : address}
        </Text>
        <AnimatedPressable
          style={[spacings.mlSm, copyIconAnimStyle]}
          onPress={handleCopy}
          {...bindCopyIconAnim}
        >
          <CopyIcon color={theme.secondaryText} />
        </AnimatedPressable>
      </View>
      <View style={spacings.mlXl}>
        {!isImported && <Badge type="warning" text="Not imported" />}
        {isImported && type && <KeyTypeIcon type={type} />}
      </View>
    </View>
  )
}

export default AccountKey
