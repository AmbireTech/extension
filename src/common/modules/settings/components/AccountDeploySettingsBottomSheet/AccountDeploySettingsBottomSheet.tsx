import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import {
  SAFE_DEPLOYMENT_PREPARATION_FAILED_MESSAGE,
  SAFE_DEPLOYMENT_UNAVAILABLE_MESSAGE,
  SAFE_NETWORKS
} from '@ambire-common/consts/safe'
import { Account } from '@ambire-common/interfaces/account'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onClosed?: () => void
  account: Account | null
}

type DeploymentRowState = {
  isLoading: boolean
  errorMessage?: string
}

/**
 * Errors the RequestsController replies with when it can't prepare the activation. They are
 * already reported by the controller and are safe to show to the user as they are.
 */
const SAFE_DEPLOYMENT_CONTROLLER_ERRORS = new Set([
  SAFE_DEPLOYMENT_UNAVAILABLE_MESSAGE,
  SAFE_DEPLOYMENT_PREPARATION_FAILED_MESSAGE
])

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks
const selectAreAccountStatesLoading = (state: AllControllersMappingType['AccountsController']) =>
  state.areAccountStatesLoading

const AccountDeploySettingsBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  onClosed,
  account
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const accountAddr = account?.addr
  const selectAccountState = useCallback(
    (state: AllControllersMappingType['AccountsController']) =>
      accountAddr ? state.accountStates[accountAddr] || null : null,
    [accountAddr]
  )
  const { state: accountState, dispatch: accountsDispatch } = useController(
    'AccountsController',
    selectAccountState
  )
  const { state: areAccountStatesLoading } = useController(
    'AccountsController',
    selectAreAccountStatesLoading
  )
  const { dispatchAndWait: requestsDispatchAndWait } = useController('RequestsController')
  const accountStateCheckedForRef = useRef<string | null>(null)
  const deploymentRowsInProgressRef = useRef(new Set<string>())
  // The account the sheet is open for, so replies arriving after it was closed (or unmounted)
  // don't bring back rows of a session the user already left
  const openForAccountAddrRef = useRef<string | null>(null)
  const [deploymentRows, setDeploymentRows] = useState<Record<string, DeploymentRowState>>({})

  const networkChainIds = useMemo(() => networks.map(({ chainId }) => chainId), [networks])
  const accountStateCheckKey = `${accountAddr}-${networkChainIds.join('-')}`
  // Safe can be activated only on the networks it supports. A network it's already active
  // on is still listed, so the user sees everywhere the account can be used
  const listedNetworks = useMemo(
    () =>
      networks.filter(
        ({ chainId }) =>
          SAFE_NETWORKS.includes(Number(chainId)) ||
          !!accountState?.[chainId.toString()]?.isDeployed
      ),
    [networks, accountState]
  )

  useEffect(() => {
    openForAccountAddrRef.current = accountAddr ?? null
  }, [accountAddr])

  useEffect(() => {
    return () => {
      openForAccountAddrRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!account?.safeCreation || accountStateCheckedForRef.current === accountStateCheckKey) return

    accountStateCheckedForRef.current = accountStateCheckKey
    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [account.addr, 'latest', networkChainIds]
      }
    })
  }, [account, accountStateCheckKey, accountsDispatch, networkChainIds])

  const deploy = useCallback(
    async (chainId: bigint) => {
      if (!account?.safeCreation) return

      const rowId = `${account.addr}-${chainId.toString()}`
      if (deploymentRowsInProgressRef.current.has(rowId)) return

      deploymentRowsInProgressRef.current.add(rowId)
      setDeploymentRows((current) => ({
        ...current,
        [rowId]: { isLoading: true }
      }))

      try {
        await requestsDispatchAndWait(
          {
            type: 'method',
            params: {
              method: 'buildSafeDeploymentRequest',
              args: [account.addr, chainId]
            }
          },
          30_000
        )
        if (openForAccountAddrRef.current !== account.addr) return
        setDeploymentRows((current) => ({
          ...current,
          [rowId]: { isLoading: false }
        }))
      } catch (error) {
        const controllerErrorMessage =
          error instanceof Error && SAFE_DEPLOYMENT_CONTROLLER_ERRORS.has(error.message)
            ? error.message
            : null

        // Anything else (e.g. no reply in time) is unexpected and not reported yet
        if (!controllerErrorMessage) {
          const deploymentError = new Error(
            `Failed to prepare Safe deployment for ${account.addr} on chain ${chainId.toString()}.`,
            { cause: error }
          )
          console.error(deploymentError.message, error)
          captureException(deploymentError)
        }

        if (openForAccountAddrRef.current !== account.addr) return
        setDeploymentRows((current) => ({
          ...current,
          [rowId]: {
            isLoading: false,
            errorMessage: controllerErrorMessage ?? SAFE_DEPLOYMENT_PREPARATION_FAILED_MESSAGE
          }
        }))
      } finally {
        deploymentRowsInProgressRef.current.delete(rowId)
      }
    },
    [account, requestsDispatchAndWait]
  )

  const handleClosed = useCallback(() => {
    // The next time the sheet opens it refreshes the account state and doesn't show
    // the results of this session
    openForAccountAddrRef.current = null
    accountStateCheckedForRef.current = null
    setDeploymentRows({})
    onClosed?.()
  }, [onClosed])

  if (account && !account.safeCreation) return null

  return (
    <BottomSheet
      id="account-deploy-settings-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
      scrollViewProps={{ contentContainerStyle: { flexGrow: 1 } }}
      style={{ maxWidth: 840, ...spacings.pvMd }}
    >
      <>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <PanelBackButton onPress={closeBottomSheet} style={spacings.mrTy} />
          {account ? (
            <PanelTitle
              title={t('{{label}} activation settings', { label: account.preferences.label })}
              style={text.left}
            />
          ) : (
            <SkeletonLoader width={200} height={24} />
          )}
        </View>

        <Text fontSize={14} style={spacings.mbMd} appearance="secondaryText">
          {t(
            'Activate your Safe account on the networks where you want to use it. Activation is a one-time action for each network.'
          )}
        </Text>

        <View
          style={[
            {
              borderBottomWidth: 1,
              borderBottomColor: theme.secondaryBorder
            },
            flexbox.directionRow,
            spacings.pbMi
          ]}
        >
          <View style={flexbox.flex1}>
            <Text fontSize={14} weight="medium">
              {t('Network')}
            </Text>
          </View>
          <View style={[flexbox.flex1, flexbox.alignEnd]}>
            <Text fontSize={14} weight="medium">
              {t('Action')}
            </Text>
          </View>
        </View>

        {listedNetworks.map((network, index) => {
          const chainId = network.chainId.toString()
          const state = accountState?.[chainId]
          const rowState = account ? deploymentRows[`${account.addr}-${chainId}`] : undefined
          // Until the state is known the user can't tell if the Safe is already active there
          const isStateLoading = !state && areAccountStatesLoading
          const canActivate = !state?.isDeployed && !isStateLoading

          return (
            <View
              key={chainId}
              style={{
                borderBottomWidth: index !== listedNetworks.length - 1 ? 1 : 0,
                borderBottomColor: theme.secondaryBorder
              }}
            >
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvTy]}>
                <View style={flexbox.flex1}>
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <NetworkIcon id={chainId} />
                    <Text style={spacings.mlTy} fontSize={14}>
                      {network.name}
                    </Text>
                  </View>
                </View>
                <View style={[flexbox.flex1, flexbox.alignEnd]}>
                  {state?.isDeployed && <Badge type="success" text={t('Active')} />}
                  {isStateLoading && <SkeletonLoader width={78} height={32} />}
                  {canActivate && (
                    <Button
                      type="primary"
                      size="tiny"
                      style={[spacings.mb0, { minWidth: 78, height: 32 }]}
                      disabled={rowState?.isLoading}
                      onPress={() => deploy(network.chainId)}
                      text={rowState?.isLoading ? t('Preparing...') : t('Activate')}
                    />
                  )}
                </View>
              </View>
              {!!rowState?.errorMessage && !state?.isDeployed && (
                <Text fontSize={12} appearance="errorText" style={spacings.mbTy}>
                  {t(rowState.errorMessage)}
                </Text>
              )}
            </View>
          )
        })}
      </>
    </BottomSheet>
  )
}

export default React.memo(AccountDeploySettingsBottomSheet)
