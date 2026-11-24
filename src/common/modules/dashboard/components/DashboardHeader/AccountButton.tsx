import React from 'react'

import AccountData from '@common/components/AccountData'
import useNavigation from '@common/hooks/useNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

type Props = Pick<React.ComponentProps<typeof AccountData>, 'height' | 'isExpanded'>

const AccountButton = ({ height, isExpanded }: Props) => {
  const { navigate } = useNavigation()

  return (
    <AccountData
      onPress={() => {
        navigate(WEB_ROUTES.accountSelect)
      }}
      withArrowDownIcon
      // The black of the dashboard's overview card
      backgroundBehindColor="#000000"
      height={height}
      isExpanded={isExpanded}
    />
  )
}

export default React.memo(AccountButton)
