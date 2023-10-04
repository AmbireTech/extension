import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import DashboardIcon from '@common/assets/svg/DashboardIcon'
import EarnIcon from '@common/assets/svg/EarnIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import TransferIcon from '@common/assets/svg/TransferIcon'
import Text from '@common/components/Text'
import { TAB_BAR_HEIGHT } from '@common/constants/router'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import styles from '@common/modules/router/styles'
import colors from '@common/styles/colors'
import { IS_SCREEN_SIZE_L } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const tabsIconSize = IS_SCREEN_SIZE_L ? 44 : 34

interface ItemProps {
  Icon: React.FC<any>
  title: string
  name: ROUTES
  isActive: boolean
}

let Item: React.FC<ItemProps> = ({ Icon, title, name, isActive }) => {
  const { navigate } = useNavigation()

  const handleOnPress = () => navigate(name)

  return (
    <TouchableOpacity
      style={[
        {
          height: TAB_BAR_HEIGHT,
          flex: 1,
          alignItems: 'center',
          paddingVertical: 15
        },
        isActive && { backgroundColor: colors.howl_65 }
      ]}
      onPress={handleOnPress}
    >
      <Icon
        width={tabsIconSize}
        height={tabsIconSize}
        color={isActive ? colors.heliotrope : colors.titan}
      />
      <Text color={isActive ? colors.heliotrope : colors.titan} fontSize={10}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

Item = React.memo(Item)

const BottomNav = () => {
  const route = useRoute()
  const { pathname } = route

  return (
    <View style={[styles.tabBarContainerWeb]}>
      <View style={[styles.backdropBlurWrapper]}>
        <View style={flexbox.directionRow}>
          <Item
            name={ROUTES.dashboard}
            isActive={pathname === `/${ROUTES.dashboard}`}
            Icon={DashboardIcon}
            title="Dashboard"
          />
          <Item
            name={ROUTES.earn}
            isActive={pathname === `/${ROUTES.earn}`}
            Icon={EarnIcon}
            title="Earn"
          />
          <Item
            name={ROUTES.send}
            isActive={pathname === `/${ROUTES.send}`}
            Icon={SendIcon}
            title="Send"
          />
          <Item
            name={ROUTES.transactions}
            isActive={pathname === `/${ROUTES.transactions}`}
            Icon={TransferIcon}
            title="Transactions"
          />

          <Item
            name={ROUTES.gasTank}
            isActive={pathname === `/${ROUTES.gasTank}`}
            Icon={GasTankIcon}
            title="Gas Tank"
          />
        </View>
      </View>
    </View>
  )
}

export default React.memo(BottomNav)
