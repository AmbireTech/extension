import React, { FC } from 'react'
import { Pressable, PressableStateCallbackType, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import getAddToAddressBookStyles from '@common/components/AddressSelect/AddToAddressBook/styles'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'

import getStyles from './styles'

/**
 * The Pressable state, with the `hovered` flag that react-native-web adds on web.
 */
type PressableStateWithHover = PressableStateCallbackType & { hovered?: boolean }

type Props = {
  onAddPress: () => void
}

const HOVERED_BUTTON_OPACITY = 0.28

/**
 * Shown on the Private tab of the accounts lists while the user has no Privacy Pools accounts.
 * Its button looks and hovers like the "Add to address book" one in the send form.
 */
const PrivacyPoolsAccountsEmptyState: FC<Props> = ({ onAddPress }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { styles: addToAddressBookStyles } = useTheme(getAddToAddressBookStyles)

  return (
    <View style={styles.container}>
      <Text fontSize={16} weight="medium" appearance="primaryText" style={styles.description}>
        {t('Create a private account and send funds without leaving a trace.')}
      </Text>
      <Pressable
        testID="privacy-pools-accounts-empty-state-add-button"
        onPress={onAddPress}
        style={({ hovered }: PressableStateWithHover) => [
          addToAddressBookStyles.addressBookButton,
          {
            backgroundColor: hovered
              ? hexToRgba(theme.primaryAccent200, HOVERED_BUTTON_OPACITY)
              : theme.primaryAccent100
          }
        ]}
      >
        <AddCircularIcon
          width={16}
          height={16}
          style={spacings.mrMi}
          color={theme.primaryAccent300}
        />
        <Text fontSize={12} weight="medium" color={theme.primaryAccent300}>
          {t('Add a Privacy Pools account')}
        </Text>
      </Pressable>
    </View>
  )
}

export default React.memo(PrivacyPoolsAccountsEmptyState)
