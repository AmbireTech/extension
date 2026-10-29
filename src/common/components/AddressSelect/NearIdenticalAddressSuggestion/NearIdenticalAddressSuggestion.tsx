import React, { useCallback } from 'react'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import getAddToAddressBookStyles from '@common/components/AddressSelect/AddToAddressBook/styles'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  suggestedAddress: string
  setAddress: (address: string) => void
}

/**
 * Offers to replace a near-identical recipient (a likely typo) with the address the user
 * has sent to before.
 */
const NearIdenticalAddressSuggestion = ({ suggestedAddress, setAddress }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getAddToAddressBookStyles)
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const handlePress = useCallback(
    () => setAddress(suggestedAddress),
    [setAddress, suggestedAddress]
  )

  return (
    <View
      style={[
        ...(isWeb ? [spacings.mb, spacings.mtTy] : [spacings.mtSm]),
        styles.confirmAddressWrapper
      ]}
    >
      {/* On mobile the button spans the whole row */}
      <View style={isWeb ? flexbox.alignEnd : flexbox.flex1}>
        <AnimatedPressable
          style={[styles.addressBookButton, { backgroundColor: theme.primaryAccent100 }, animStyle]}
          onPress={handlePress}
          testID="send-form-use-near-identical-address-button"
          {...bindAnim}
        >
          <Text fontSize={12} weight="medium" color={theme.primaryAccent300}>
            {t('Use {{address}}', { address: shortenAddress(suggestedAddress, 17, 6) })}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  )
}

export default React.memo(NearIdenticalAddressSuggestion)
