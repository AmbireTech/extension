import React from 'react'
import { View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { ItemPanel } from '@web/components/TransactionsScreen'

type Props = {
  label: string
  disabled?: boolean
  /** Goes back to entering an address. */
  onClear: () => void
}

/**
 * The recipient field once a Privacy Pools account is picked - in place of the address field,
 * since there is no address to show or edit. Laid out like `Recipient`, so the form keeps its shape.
 */
const PrivacyPoolsRecipient = ({ label, disabled, onClear }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <ItemPanel style={{ ...spacings.pbTy, ...spacings.mbTy }}>
      <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbSm}>
        {t('Add recipient')}
      </Text>
      <View
        testID="privacy-pools-recipient"
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.phSm,
          spacings.pvTy,
          spacings.mbTy,
          { borderRadius: BORDER_RADIUS_PRIMARY, backgroundColor: theme.secondaryBackground }
        ]}
      >
        <PrivacyPoolsAccountAvatar size={32} style={spacings.mrTy} />
        <View style={flexbox.flex1}>
          <Text fontSize={14} weight="medium" numberOfLines={1}>
            {label}
          </Text>
          <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
            {t('Privacy Pools account')}
          </Text>
        </View>
        <HoverablePressable
          testID="privacy-pools-recipient-clear"
          onPress={onClear}
          disabled={disabled}
          style={spacings.mlTy}
        >
          <CloseIcon width={14} height={14} color={theme.secondaryText} />
        </HoverablePressable>
      </View>
    </ItemPanel>
  )
}

export default React.memo(PrivacyPoolsRecipient)
