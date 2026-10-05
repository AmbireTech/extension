import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import SendIcon from '@common/assets/svg/SendIcon'
import { useTranslation } from '@common/config/localization'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import RouteItem from '@common/modules/dashboard/components/Routes/RouteItem'
import { RouteItemType } from '@common/modules/dashboard/components/Routes/RouteItem/RouteItem'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  onSend: () => void
  isSendDisabled: boolean
}

// The dashboard's route buttons. No receive button: funds are sent here from other accounts.
const PrivacyPoolsActions: FC<Props> = ({ onSend, isSendDisabled }) => {
  const { t } = useTranslation()
  const { isNarrowWebLayout } = useCompactActionRequestLayout()

  const routeItems: RouteItemType[] = useMemo(
    () => [
      {
        testID: 'privacy-pools-button-send',
        icon: SendIcon,
        label: t('Send'),
        onPress: onSend,
        disabled: isSendDisabled,
        scale: 1,
        scaleOnHover: 1.08
      }
    ],
    [t, onSend, isSendDisabled]
  )

  return (
    <View style={[flexbox.directionRow, flexbox.justifyCenter]}>
      {routeItems.map((routeItem, index) => (
        <RouteItem
          key={routeItem.label}
          routeItem={routeItem}
          index={index}
          routeItemsLength={routeItems.length}
          isNarrowWebLayout={isNarrowWebLayout}
        />
      ))}
    </View>
  )
}

export default React.memo(PrivacyPoolsActions)
