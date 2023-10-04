import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { lazy, Suspense, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Outlet, Route, Routes } from 'react-router-dom'

import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { headerBeta as defaultHeaderBeta } from '@common/modules/header/config/headerConfig'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { VAULT_STATUS } from '@common/modules/vault/constants/vaultStatus'
import useVault from '@common/modules/vault/hooks/useVault'
import ResetVaultScreen from '@common/modules/vault/screens/ResetVaultScreen'
import UnlockVaultScreen from '@common/modules/vault/screens/UnlockVaultScreen'
import flexbox from '@common/styles/utils/flexbox'
import useApproval from '@web/hooks/useApproval'
import { HardwareWalletsProvider } from '@web/modules/hardware-wallet/contexts/hardwareWalletsContext'
import SortHat from '@web/modules/router/components/SortHat'

const AsyncMainRoute = lazy(() => import('@web/modules/router/components/MainRoutes'))

const headerBeta = (
  <>
    {defaultHeaderBeta({})}
    <Outlet />
  </>
)

const Router = () => {
  const { hasCheckedForApprovalInitially } = useApproval()
  const { vaultStatus, unlockVault, resetVault, biometricsEnabled } = useVault()
  const { path } = useRoute()
  const { navigate } = useNavigation()
  const { authStatus } = useAuth()
  const prevAuthStatus = usePrevious(authStatus)
  const prevVaultStatus = usePrevious(vaultStatus)

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

  useEffect(() => {
    if (
      path !== '/' &&
      vaultStatus !== prevVaultStatus &&
      vaultStatus !== VAULT_STATUS.LOADING &&
      prevVaultStatus !== VAULT_STATUS.LOADING
    ) {
      navigate('/', { replace: true })
    }
  }, [vaultStatus, navigate, path, prevVaultStatus])

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
        <Route element={headerBeta}>
          <Route
            path={WEB_ROUTES.unlockVault}
            element={
              <UnlockVaultScreen
                unlockVault={unlockVault}
                vaultStatus={vaultStatus}
                biometricsEnabled={biometricsEnabled}
              />
            }
          />
          <Route
            path={WEB_ROUTES.resetVault}
            element={<ResetVaultScreen resetVault={resetVault} vaultStatus={vaultStatus} />}
          />
        </Route>
      </Routes>
      <Suspense fallback={null}>
        <AsyncMainRoute />
      </Suspense>
    </HardwareWalletsProvider>
  )
}

export default Router
