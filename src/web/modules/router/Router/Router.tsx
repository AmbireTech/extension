import React, { lazy, Suspense, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Route, Routes } from 'react-router-dom'

import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import flexbox from '@common/styles/utils/flexbox'
import useApproval from '@web/hooks/useApproval'
import { HardwareWalletsProvider } from '@web/modules/hardware-wallet/contexts/hardwareWalletsContext'
import SortHat from '@web/modules/router/components/SortHat'

const AsyncMainRoute = lazy(() => import('@web/modules/router/components/MainRoutes'))

const Router = () => {
  const { hasCheckedForApprovalInitially } = useApproval()
  const { path } = useRoute()
  const { navigate } = useNavigation()
  const { authStatus } = useAuth()
  const prevAuthStatus = usePrevious(authStatus)

  useEffect(() => {
    if (
      path !== '/' &&
      authStatus !== prevAuthStatus &&
      authStatus !== AUTH_STATUS.LOADING &&
      prevAuthStatus !== AUTH_STATUS.LOADING
    ) {
      navigate('/', { replace: true })
    }
  }, [authStatus, navigate, path, prevAuthStatus])

  if (!hasCheckedForApprovalInitially) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>
        <Spinner />
      </View>
    )
  }

  return (
    <HardwareWalletsProvider>
      <Routes>
        <Route path="/" element={<SortHat />} />
      </Routes>
      <Suspense fallback={null}>
        <AsyncMainRoute />
      </Suspense>
    </HardwareWalletsProvider>
  )
}

export default Router
