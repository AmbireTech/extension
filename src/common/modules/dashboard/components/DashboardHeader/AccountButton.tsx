import React from 'react'

import AccountData from '@common/components/AccountData'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

const AccountButton = () => {
  const { navigate } = useNavigation()

  return (
    <AccountData
      onPress={() => {
        navigate(WEB_ROUTES.accountSelect)
      }}
      withArrowRightIcon
    />
  )
}

export default React.memo(AccountButton)
