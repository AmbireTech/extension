import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { DASHBOARD_OVERVIEW_BACKGROUND } from '@common/modules/dashboard/screens/styles'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { getAvatarColors } from '@common/utils/avatars'
import mixHexColors from '@common/utils/mixHexColors'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useWalletStateController from '@web/hooks/useWalletStateController'

import getStyles from './styles'

export type TabType = 'tokens' | 'collectibles' | 'defi' | 'activity'

interface Props {
  openTab: string
  tab: TabType
  tabLabel: string
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  handleChangeQuery: (openTab: TabType) => void
  disabled?: boolean
  testID?: string
  customColors?: [string, string]
  style?: ViewStyle
  children?: ReactNode
}

const Tab = ({
  openTab,
  tab,
  tabLabel,
  setOpenTab,
  handleChangeQuery,
  disabled,
  testID,
  customColors,
  style,
  children
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme, themeType } = useTheme(getStyles)
  const { account } = useSelectedAccountControllerState()
  const { avatarType } = useWalletStateController()
  const avatarColors = getAvatarColors(avatarType, account?.addr || '')

  const isActive = openTab === tab

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (disabled) return
        handleChangeQuery(tab)
        setOpenTab(tab)
      }}
    >
      {({ hovered }: any) => (
        <LinearGradient
          colors={
            customColors ||
            (isActive
              ? themeType === THEME_TYPES.DARK
                ? [
                    `${DASHBOARD_OVERVIEW_BACKGROUND}80`,
                    mixHexColors(`${DASHBOARD_OVERVIEW_BACKGROUND}80`, avatarColors[1], 0.7)
                  ]
                : [
                    DASHBOARD_OVERVIEW_BACKGROUND,
                    mixHexColors(DASHBOARD_OVERVIEW_BACKGROUND, avatarColors[1], 0.8)
                  ]
              : ['transparent', 'transparent'])
          }
          start={{ x: 0.0, y: 1 }}
          end={{ x: 0.2, y: 0 }}
          locations={[0.4, 1]}
          style={[
            styles.toggleItem,
            spacings.phLg,
            {
              opacity: disabled ? 0.4 : 1,
              // @ts-ignore cursor is web only
              cursor: disabled ? 'not-allowed' : 'pointer'
            },
            style
          ]}
        >
          <Text
            weight="medium"
            color={
              isActive
                ? themeType === THEME_TYPES.DARK
                  ? theme.primary
                  : theme.primaryBackground
                : hovered
                  ? theme.primaryText
                  : theme.secondaryText
            }
            fontSize={14}
          >
            {t(tabLabel)}
          </Text>
          {children}
        </LinearGradient>
      )}
    </Pressable>
  )
}

export default Tab
