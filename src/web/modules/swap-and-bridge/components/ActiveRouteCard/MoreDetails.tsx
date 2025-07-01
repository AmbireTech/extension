import { useTranslation } from 'react-i18next'
import { Pressable, StyleProp, View, ViewStyle } from 'react-native'

import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'

const LIFI_EXPLORER_URL = 'https://scan.li.fi'

const MoreDetails = ({
  activeRoute,
  style
}: {
  activeRoute: SwapAndBridgeActiveRoute
  style?: StyleProp<ViewStyle>
}) => {
  const { t } = useTranslation()
  const { themeType, theme } = useTheme()
  const handleOpenExplorer = async (route: SwapAndBridgeActiveRoute) => {
    const link = `${LIFI_EXPLORER_URL}/tx/${route.userTxHash}`
    await openInTab({ url: link })
  }

  return (
    <View style={[flexbox.directionRow, flexbox.justifyEnd, style]}>
      <Pressable onPress={() => handleOpenExplorer(activeRoute)}>
        <Text
          fontSize={12}
          weight="medium"
          color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
        >
          {t('More details')}
        </Text>
      </Pressable>
    </View>
  )
}

export default MoreDetails
