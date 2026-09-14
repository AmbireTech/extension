import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import DepositIcon from '@common/assets/svg/DepositIcon'
import WithdrawIcon from '@common/assets/svg/WithdrawIcon'
import { useTranslation } from '@common/config/localization'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import RouteItem from '@common/modules/dashboard/components/Routes/RouteItem'
import { RouteItemType } from '@common/modules/dashboard/components/Routes/RouteItem/RouteItem'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  onDeposit: () => void
  onWithdraw: () => void
  isDepositDisabled: boolean
  isWithdrawDisabled: boolean
}

// Reuses the dashboard's glass route buttons (Send/Swap/Explore) so the privacy card speaks the
// same visual language as the dashboard overview.
const PrivacyPoolsActions: FC<Props> = ({
  onDeposit,
  onWithdraw,
  isDepositDisabled,
  isWithdrawDisabled
}) => {
  const { t } = useTranslation()
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()

  const routeItems: RouteItemType[] = useMemo(
    () => [
      {
        testID: 'privacy-pools-button-deposit',
        icon: DepositIcon,
        label: t('Deposit'),
        onPress: onDeposit,
        disabled: isDepositDisabled,
        scale: 1,
        scaleOnHover: 1.08
      },
      {
        testID: 'privacy-pools-button-withdraw',
        icon: WithdrawIcon,
        label: t('Withdraw'),
        onPress: onWithdraw,
        disabled: isWithdrawDisabled,
        scale: 1,
        scaleOnHover: 1.08
      }
    ],
    [t, onDeposit, onWithdraw, isDepositDisabled, isWithdrawDisabled]
  )

  return (
    <View style={[flexbox.directionRow, flexbox.justifyCenter]}>
      {routeItems.map((routeItem, index) => (
        <RouteItem
          key={routeItem.label}
          routeItem={routeItem}
          index={index}
          routeItemsLength={routeItems.length}
          isCompactSidePanelLayout={isCompactSidePanelLayout}
        />
      ))}
    </View>
  )
}

export default React.memo(PrivacyPoolsActions)
