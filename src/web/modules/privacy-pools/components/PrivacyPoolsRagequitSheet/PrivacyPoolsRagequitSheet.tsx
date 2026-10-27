import { formatUnits } from 'ethers'
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsRagequitDeposit } from '@ambire-common/interfaces/privacyPools'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'

import RagequitDepositRow, { RagequitDepositView } from './RagequitDepositRow'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys
const selectRagequitStatus = (state: AllControllersMappingType['MainController']) =>
  state.statuses.privacyPoolsRagequit
const selectIsPrivacyModeEnabled = (state: AllControllersMappingType['WalletStateController']) =>
  state.isPrivacyModeEnabled

interface Props {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  chainId: string
  tokenAddress: string
  symbol: string
  decimals: number
}

/**
 * Rage quit: takes back one deposit still being verified, publicly and in full, to the account it
 * came from - the only one that can. Lists the token's deposits, each with its own Rage quit, which
 * switches to that account and opens the transaction to sign there.
 *
 * The deposits are asked for each time the sheet opens, as only it needs them.
 */
const PrivacyPoolsRagequitSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  chainId,
  tokenAddress,
  symbol,
  decimals
}) => {
  const { t } = useTranslation()
  const { dispatchAndWait } = useController('PrivacyPoolsController')
  const { state: ragequitStatus, dispatch: mainDispatch } = useController(
    'MainController',
    selectRagequitStatus
  )
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: keys } = useController('KeystoreController', selectKeys)
  const { state: isPrivacyModeEnabled } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )
  const [deposits, setDeposits] = useState<PrivacyPoolsRagequitDeposit[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** The deposit whose rage quit was asked for, so only its button shows it being prepared. */
  const [submittedLabel, setSubmittedLabel] = useState<bigint | null>(null)
  // Only the latest request's answer is shown, and none after the sheet is gone
  const latestRequestRef = useRef(0)
  const hasSubmittedRef = useRef(false)

  useEffect(
    () => () => {
      latestRequestRef.current += 1
    },
    []
  )

  const loadDeposits = useCallback(() => {
    latestRequestRef.current += 1
    const requestNumber = latestRequestRef.current
    setDeposits(null)
    setLoadError(null)

    dispatchAndWait<'getRagequitDepositsAndSendResToUi', PrivacyPoolsRagequitDeposit[]>({
      type: 'method',
      params: { method: 'getRagequitDepositsAndSendResToUi', args: [chainId, tokenAddress] }
    })
      .then((result) => {
        if (requestNumber === latestRequestRef.current) setDeposits(result)
      })
      .catch((error) => {
        // Already reported by the controller, which also shows the toast
        console.error('privacyPools: could not load the deposits to take back', error)
        if (requestNumber === latestRequestRef.current) setLoadError(error.message)
      })
  }, [chainId, dispatchAndWait, tokenAddress])

  const handleClosed = useCallback(() => {
    latestRequestRef.current += 1
    hasSubmittedRef.current = false
    setSubmittedLabel(null)
    setDeposits(null)
    setLoadError(null)
  }, [])

  const depositViews: RagequitDepositView[] = useMemo(
    () =>
      (deposits || []).map((deposit) => {
        const account =
          accounts?.find(
            ({ addr }) => addr.toLowerCase() === deposit.depositorAddr.toLowerCase()
          ) || null

        return {
          ...deposit,
          account,
          isViewOnly: !!account && getIsViewOnly(keys || [], account.associatedKeys),
          amountFormatted: `${
            privateValue(
              formatDecimals(Number(formatUnits(deposit.amount, decimals)), 'amount'),
              isPrivacyModeEnabled
            ) ?? ''
          } ${symbol}`
        }
      }),
    [accounts, decimals, deposits, isPrivacyModeEnabled, keys, symbol]
  )
  const isSubmitting = ragequitStatus === 'LOADING'
  const handleRagequit = useCallback(
    (label: bigint) => {
      if (isSubmitting) return

      hasSubmittedRef.current = true
      setSubmittedLabel(label)
      mainDispatch({
        type: 'method',
        params: { method: 'privacyPoolsRagequit', args: [{ chainId, label }] }
      })
    },
    [chainId, isSubmitting, mainDispatch]
  )

  // Handed over for signing: the account is switched and the request opens. A failure stays on
  // the list, with the controller's toast saying why
  useEffect(() => {
    if (ragequitStatus !== 'SUCCESS' || !hasSubmittedRef.current) return

    hasSubmittedRef.current = false
    closeBottomSheet()
  }, [closeBottomSheet, ragequitStatus])

  const renderList = () => {
    if (loadError)
      return (
        <Alert
          type="error"
          size="sm"
          title={loadError}
          buttonProps={{ text: t('Try again'), onPress: loadDeposits, type: 'secondary' }}
        />
      )

    if (!deposits)
      return (
        <View style={[flexbox.center, spacings.pvLg]}>
          <Spinner style={{ width: 32, height: 32 }} />
        </View>
      )

    if (!depositViews.length)
      return (
        <Text fontSize={14} appearance="secondaryText">
          {t(
            'None of your {{symbol}} deposits are being verified, so there is nothing to take back.',
            {
              symbol
            }
          )}
        </Text>
      )

    return depositViews.map((deposit) => (
      <RagequitDepositRow
        key={deposit.label.toString()}
        deposit={deposit}
        onRagequit={handleRagequit}
        isSubmitting={isSubmitting && deposit.label === submittedLabel}
        isDisabled={isSubmitting}
      />
    ))
  }

  return (
    <BottomSheet
      id="privacy-pools-ragequit"
      sheetRef={sheetRef}
      // Not closable while it is being prepared: the account may be switched any moment
      closeBottomSheet={isSubmitting ? undefined : closeBottomSheet}
      onOpen={loadDeposits}
      onClosed={handleClosed}
      backgroundColor="primaryBackground"
    >
      <Text fontSize={18} weight="semiBold" style={spacings.mbTy}>
        {t('Rage quit')}
      </Text>

      <Text fontSize={14} appearance="secondaryText" style={spacings.mbMd}>
        {t('Cancel a deposit and return the full amount to the account it was sent from.')}
      </Text>
      {renderList()}
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsRagequitSheet)
