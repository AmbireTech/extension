import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type TabType = 'tokens' | 'collectibles' | 'defi' | 'activity'

interface Props {
  openTab: string
  tab: TabType
  tabLabel: string
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  handleChangeQuery: (openTab: TabType) => void
  disabled?: boolean
  testID?: string
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
  style,
  children
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const isActive = openTab === tab

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (disabled) return
        handleChangeQuery(tab)
        setOpenTab(tab)
      }}
      style={[
        spacings.mr,
        {
          borderBottomColor: isActive ? theme.primaryText : 'transparent',
          borderBottomWidth: 2
        }
      ]}
    >
      {({ hovered }: any) => (
        <View style={[flexbox.directionRow, style]}>
          <Text
            weight="medium"
            color={isActive || hovered ? theme.primaryText : theme.tertiaryText}
            fontSize={16}
          >
            {t(tabLabel)}
          </Text>
          {children}
        </View>
      )}
    </Pressable>
  )
}

export default Tab
