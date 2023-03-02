import React from 'react'
import { Outlet } from 'react-router-dom'

import useRoute from '@modules/common/hooks/useRoute'
import { openInternalPageInTab } from '@web/background/webapi/tab'
import { getUiType } from '@web/utils/uiType'

const TabOnlyRoute = () => {
  const isTab = getUiType().isTab
  const { path } = useRoute()

  if (!isTab) {
    openInternalPageInTab(path?.substring(1))
    return <></>
  }

  return <Outlet />
}

export default TabOnlyRoute
