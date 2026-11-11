import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { SAFE_NETWORKS } from '@ambire-common/consts/safe'
import { Account } from '@ambire-common/interfaces/account'
import { SafeDeploymentRequestError } from '@ambire-common/interfaces/safe'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import BottomSheetTitle from '@common/components/BottomSheetTitle'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { isSafeDeploymentRequestError } from '@common/hooks/useSafeActivation'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import useSafeActivationProgress from './useSafeActivationProgress'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onClosed?: () => void
  account: Account | null
}

type DeploymentRowState = {
  isLoading: boolean
  error?: SafeDeploymentRequestError
}

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks
const selectAreAccountStatesLoading = (state: AllControllersMappingType['AccountsController']) =>
  state.areAccountStatesLoading

/**
 * Activates (deploys) a Safe account created in the wallet on the networks the user picks,
 * one network at a time. Opened from the dashboard banner and the account settings.
 */
const SafeActivationBottomSheet: FC<Props> = ({
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
  const activationProgress = useSafeActivationProgress(account)
  const accountStateCheckedForRef = useRef<string | null>(null)
  const deploymentRowsInProgressRef = useRef(new Set<string>())
  // The account the sheet is open for, so replies arriving after it was closed (or unmounted)
  // don't bring back rows of a session the user already left
  const openForAccountAddrRef = useRef<string | null>(null)
  const [deploymentRows, setDeploymentRows] = useState<Record<string, DeploymentRowState>>({})
  const deploymentErrorTexts: Record<SafeDeploymentRequestError, string> = useMemo(
    () => ({
      unavailable: t(
        "We can't activate this Safe account on this network. To use it here, activate it in the Safe app first."
      ),
      'preparation-failed': t(
        "We couldn't prepare the activation of your Safe account on this network. Please try again."
      )
    }),
    [t]
  )

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
        const controllerError =
          error instanceof Error && isSafeDeploymentRequestError(error.message)
            ? error.message
            : null

        // Anything else (e.g. no reply in time) is unexpected and not reported yet
        if (!controllerError) {
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
            error: controllerError ?? 'preparation-failed'
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
      id="safe-activation-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
      style={{ maxWidth: 480 }}
    >
      <BottomSheetTitle
        title={t('Activate Safe account')}
        subtitle={t('One-time transaction per network.')}
        onClose={closeBottomSheet}
        closeButtonTestID="safe-activation-close"
      />
      <View
        style={[
          common.borderRadiusPrimary,
          spacings.phSm,
          { backgroundColor: theme.secondaryBackground }
        ]}
      >
        {listedNetworks.map((network, index) => {
          const chainId = network.chainId.toString()
          const state = accountState?.[chainId]
          const rowState = account ? deploymentRows[`${account.addr}-${chainId}`] : undefined
          // Until the state is known the user can't tell if the Safe is already active there
          const isStateLoading = !state && areAccountStatesLoading
          const canActivate = !state?.isDeployed && !isStateLoading
          const progress = activationProgress[chainId]
          const getButtonText = () => {
            if (rowState?.isLoading) return t('Preparing...')
            if (progress === 'signing') return t('Waiting for signature...')
            if (progress === 'activating') return t('Activating...')

            return t('Activate')
          }

          return (
            <View
              key={chainId}
              testID={`safe-activation-network-${chainId}`}
              style={{
                borderBottomWidth: index !== listedNetworks.length - 1 ? 1 : 0,
                borderBottomColor: theme.secondaryBorder
              }}
            >
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
                <NetworkIcon id={chainId} size={36} />
                <Text style={[flexbox.flex1, spacings.mlSm]} fontSize={16} weight="medium">
                  {network.name}
                </Text>
                {state?.isDeployed && <Badge type="success" text={t('Active')} />}
                {isStateLoading && <SkeletonLoader width={88} height={32} />}
                {canActivate && (
                  <Button
                    type="primary"
                    size="tiny"
                    style={[spacings.mb0, { minWidth: 88, height: 32, borderRadius: 16 }]}
                    // While it waits for the signature, pressing it brings the signing window
                    // back (the controller focuses the request it already has)
                    disabled={rowState?.isLoading || progress === 'activating'}
                    onPress={() => deploy(network.chainId)}
                    text={getButtonText()}
                  />
                )}
              </View>
              {!!rowState?.error && !state?.isDeployed && (
                <Text fontSize={12} appearance="errorText" style={spacings.mbSm}>
                  {deploymentErrorTexts[rowState.error]}
                </Text>
              )}
            </View>
          )
        })}
      </View>
    </BottomSheet>
  )
}

export default React.memo(SafeActivationBottomSheet)
