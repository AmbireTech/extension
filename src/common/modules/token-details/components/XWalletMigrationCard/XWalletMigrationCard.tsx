import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { getMigrateXWalletCalls } from '@common/modules/explore/components/WalletStaking/calls'
import { isXWalletToken } from '@common/modules/explore/helpers/isXWalletToken'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

import type { TokenResult } from '@ambire-common/libs/portfolio'

// The staking contract only lets the free (non-locked) portion of an xWALLET balance be
// migrated - shares already committed to a pending unstake cannot be moved.
const WALLET_STAKING_LOCKED_SHARES_ABI = 'function lockedShares(address) view returns (uint256)'

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest

const XWalletMigrationCard = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: currentUserRequest, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectCurrentUserRequest
  )
  const { dispatchAndWait: providersDispatchAndWait } = useController('ProvidersController')
  const [lockedShares, setLockedShares] = useState<bigint | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lockedSharesRequestIdRef = useRef(0)
  const hasActiveSubmissionRef = useRef(false)

  const isEligible = isXWalletToken(token)
  const xWalletBalance = useMemo(() => BigInt(token.amount || 0n), [token.amount])
  const migratableShares = useMemo(
    () =>
      lockedShares !== null && xWalletBalance > lockedShares ? xWalletBalance - lockedShares : 0n,
    [lockedShares, xWalletBalance]
  )

  const loadLockedShares = useCallback(async () => {
    const accountAddr = account?.addr
    if (!accountAddr) return

    const requestId = ++lockedSharesRequestIdRef.current
    try {
      const nextLockedShares = await providersDispatchAndWait<'callContractAndSendResToUi', bigint>(
        {
          type: 'method',
          params: {
            method: 'callContractAndSendResToUi',
            args: [
              {
                chainId: ETHEREUM_CHAIN_ID,
                address: WALLET_STAKING_ADDR,
                abi: WALLET_STAKING_LOCKED_SHARES_ABI,
                method: 'lockedShares',
                args: [accountAddr]
              }
            ]
          }
        }
      )

      if (requestId === lockedSharesRequestIdRef.current) setLockedShares(BigInt(nextLockedShares))
    } catch (error) {
      if (requestId !== lockedSharesRequestIdRef.current) return

      console.error('Failed to load the locked xWALLET shares', error)
      captureException(error)
    }
  }, [account?.addr, providersDispatchAndWait])

  useEffect(() => {
    if (!isEligible) return undefined

    const loadTimeout = setTimeout(() => void loadLockedShares(), 0)
    return () => clearTimeout(loadTimeout)
  }, [isEligible, loadLockedShares])

  useEffect(
    () => () => {
      lockedSharesRequestIdRef.current += 1
    },
    []
  )

  useEffect(() => {
    if (!isSubmitting) {
      hasActiveSubmissionRef.current = false
      return
    }

    const isSubmittedRequestActive =
      currentUserRequest?.kind === 'calls' &&
      currentUserRequest.meta.accountAddr === account?.addr &&
      currentUserRequest.meta.chainId === ETHEREUM_CHAIN_ID
    if (isSubmittedRequestActive) {
      hasActiveSubmissionRef.current = true
      return
    }
    if (!hasActiveSubmissionRef.current) return

    hasActiveSubmissionRef.current = false
    setIsSubmitting(false)
  }, [account?.addr, currentUserRequest, isSubmitting])

  const handleMigrate = useCallback(() => {
    if (!account || isSubmitting || migratableShares <= 0n) return

    setIsSubmitting(true)
    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              executionType: 'open-request-window',
              userRequestParams: {
                calls: getMigrateXWalletCalls(migratableShares),
                meta: {
                  accountAddr: account.addr,
                  chainId: ETHEREUM_CHAIN_ID
                }
              }
            }
          }
        ]
      }
    })
  }, [account, isSubmitting, migratableShares, requestsDispatch])

  // Hidden while ineligible, still loading, or when there is nothing free to migrate.
  if (!isEligible || migratableShares <= 0n) return null

  return (
    <View style={[styles.card, spacings.phSm, spacings.pvSm, spacings.mbTy]}>
      <Text appearance="warningText" fontSize={16} weight="semiBold">
        {t('xWALLET is a legacy token')}
      </Text>
      <Text appearance="secondaryText" fontSize={13}>
        {t(
          'xWALLET has been replaced by stkWALLET. Migrate now for a simpler, easier to use token backed by the same $WALLET.'
        )}
      </Text>
      <View style={[styles.actions, spacings.mtSm]}>
        <Button
          text={isSubmitting ? t('Migrating...') : t('Migrate now')}
          size="small"
          onPress={handleMigrate}
          disabled={isSubmitting}
          hasBottomSpacing={false}
          submitOnEnter={false}
          testID="token-details-migrate-x-wallet-button"
        />
      </View>
    </View>
  )
}

export default React.memo(XWalletMigrationCard)
