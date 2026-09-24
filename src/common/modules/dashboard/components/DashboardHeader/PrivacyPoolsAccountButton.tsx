import React from 'react'
import { Animated, View } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import getAccountDataStyles from '@common/components/AccountData/styles'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

const { isPopup } = getUiType()

/**
 * The header's account button while a Privacy Pools account is selected - the counterpart of
 * `AccountButton`. It names the account by its recovery phrase, since there is no address to
 * show or copy.
 */
const PrivacyPoolsAccountButton = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getAccountDataStyles)
  const { navigate } = useNavigation()
  const { selectedAccount } = usePrivacyPoolsAccounts()
  const [bindAccountBtnAnim, accountBtnAnimStyle] = useCustomHover({
    property: isWeb ? 'left' : 'opacity',
    values: isWeb ? { from: 0, to: 2 } : { from: 1, to: 1 },
    duration: 50
  })

  return (
    <View
      style={{
        overflow: 'hidden',
        flexShrink: 1,
        borderTopRightRadius: 50,
        borderBottomRightRadius: 50
      }}
    >
      <AnimatedPressable
        testID="privacy-pools-account-select-btn"
        style={[styles.accountButton, { backgroundColor: '#000000A3', flexShrink: 1 }]}
        onPress={() => navigate(WEB_ROUTES.accountSelect)}
        {...bindAccountBtnAnim}
      >
        <PrivacyPoolsAccountAvatar size={32} style={spacings.mrTy} />
        <Text
          numberOfLines={1}
          weight="semiBold"
          style={[spacings.mrMi, { maxWidth: isPopup ? 112 : 160, flexShrink: 1, minWidth: 0 }]}
          color="#FFFFFF"
          fontSize={14}
        >
          {selectedAccount?.label || t('Privacy Pools account')}
        </Text>
        <Text color="#B9BFC9" fontSize={12} numberOfLines={1}>
          {t('(Privacy Pools)')}
        </Text>
        <Animated.View style={accountBtnAnimStyle}>
          <RightArrowIcon
            style={[styles.accountButtonRightIcon, spacings.mlTy]}
            width={12}
            color="#E3E6EB"
          />
        </Animated.View>
      </AnimatedPressable>
    </View>
  )
}

export default React.memo(PrivacyPoolsAccountButton)
