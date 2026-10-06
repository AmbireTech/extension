import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { FEE_ICON_GAP } from './FeeSelectTrigger'

const FEE_PAYER_STRIP_HEIGHT = 44
const FEE_PAYER_AVATAR_SIZE = 28

type Props = {
  address: string
  accountLabel?: string
}

/**
 * Attached below the network fee select when another account pays the fee. It only informs,
 * so it has no arrow and a different fill than the select above it
 */
const FeePayerStrip = ({ address, accountLabel }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        {
          height: FEE_PAYER_STRIP_HEIGHT,
          gap: FEE_ICON_GAP,
          backgroundColor: theme.tertiaryBackground,
          borderBottomLeftRadius: BORDER_RADIUS_PRIMARY,
          borderBottomRightRadius: BORDER_RADIUS_PRIMARY
        }
      ]}
      testID="fee-payer-strip"
    >
      <Avatar
        size={FEE_PAYER_AVATAR_SIZE}
        address={address}
        pfp={address}
        displayTypeBadge={false}
        style={spacings.pr0}
      />
      <View style={[flexbox.flex1, { minWidth: 0 }]}>
        <Text fontSize={12} weight="semiBold" numberOfLines={1}>
          {accountLabel || shortenAddress(address, 13)}
        </Text>
        <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
          {t('is paying the fee')}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(FeePayerStrip)
