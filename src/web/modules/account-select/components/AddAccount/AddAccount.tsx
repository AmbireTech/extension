import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Option from '@common/components/Option'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { openInternalPageInTab } from '@web/extension-services/background/webapi/tab'
import useAccountAdderControllerState from '@web/hooks/useAccountAdderControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import { getUiType } from '@web/utils/uiType'

import { useGetAddAccountOptions } from './helpers/useGetAddAccountOptions'

const AddAccount = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const options = useGetAddAccountOptions({ navigate, t })
  const mainControllerState = useMainControllerState()
  const accountAdderControllerState = useAccountAdderControllerState()

  useEffect(() => {
    if (mainControllerState.statuses.onAccountAdderSuccess === 'SUCCESS') {
      getUiType().isTab
        ? navigate(WEB_ROUTES.accountPersonalize)
        : openInternalPageInTab(WEB_ROUTES.accountPersonalize)
    }
  }, [
    mainControllerState.statuses.onAccountAdderSuccess,
    navigate,
    accountAdderControllerState.readyToAddAccounts
  ])

  return (
    <View style={spacings.ptSm}>
      <Text fontSize={16} weight="medium" style={spacings.mbLg}>
        {t('Select one of the following options')}
      </Text>
      {options.map((option) => (
        <Option
          key={option.text}
          text={option.text}
          icon={option.icon}
          onPress={option.onPress}
          hasLargerBottomSpace={option.hasLargerBottomSpace}
          testID={option.testID}
        />
      ))}
    </View>
  )
}

export default React.memo(AddAccount)
