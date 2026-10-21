import { formatUnits } from 'ethers'
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsRagequitDeposit } from '@ambire-common/interfaces/privacyPools'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'

import RagequitDepositRow, { RagequitAccount, RagequitDepositView } from './RagequitDepositRow'

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
 * came from - the only one that can. Lists the token's deposits, then asks to confirm, as the
 * account is switched to that one and the deposit stops being private.
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
  const [selectedLabel, setSelectedLabel] = useState<bigint | null>(null)
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
    setSelectedLabel(null)
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
  const selectedDeposit = useMemo(
    () => depositViews.find(({ label }) => label === selectedLabel) || null,
    [depositViews, selectedLabel]
  )

  const isSubmitting = ragequitStatus === 'LOADING'
  const handleConfirm = useCallback(() => {
    if (!selectedDeposit || isSubmitting) return

    hasSubmittedRef.current = true
    mainDispatch({
      type: 'method',
      params: {
        method: 'privacyPoolsRagequit',
        args: [{ chainId, label: selectedDeposit.label }]
      }
    })
  }, [chainId, isSubmitting, mainDispatch, selectedDeposit])

  // Handed over for signing: the account is switched and the request opens. A failure stays on
  // the confirmation, with the controller's toast saying why
  useEffect(() => {
    if (ragequitStatus !== 'SUCCESS' || !hasSubmittedRef.current) return

    hasSubmittedRef.current = false
    closeBottomSheet()
  }, [closeBottomSheet, ragequitStatus])

  const goBack = useCallback(() => setSelectedLabel(null), [])

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
        onPress={setSelectedLabel}
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

      {selectedDeposit ? (
        <>
          <Text fontSize={14} appearance="secondaryText" style={spacings.mbSm}>
            {t('{{amount}} goes back to this account:', {
              amount: selectedDeposit.amountFormatted
            })}
          </Text>
          <View style={[spacings.mbMd, flexbox.directionRow]}>
            <RagequitAccount deposit={selectedDeposit} />
          </View>
          <Alert
            type="warning"
            size="sm"
            style={spacings.mbLg}
            title={t('This is public')}
            text={t(
              'Anyone will be able to see that this account took these funds out of Privacy Pools, so they are no longer private. It goes back in full, and this account pays the network fee.'
            )}
          />
          <View style={[flexbox.directionRow, { gap: SPACING_TY }]}>
            <Button
              testID="privacy-pools-ragequit-back"
              type="secondary"
              text={t('Back')}
              onPress={goBack}
              disabled={isSubmitting}
              hasBottomSpacing={false}
              size="smaller"
              style={flexbox.flex1}
            />
            <ButtonWithLoader
              testID="privacy-pools-ragequit-confirm"
              text={isSubmitting ? t('Preparing...') : t('Rage quit')}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleConfirm}
              size="smaller"
              style={flexbox.flex1}
            />
          </View>
        </>
      ) : (
        <>
          <Text fontSize={14} appearance="secondaryText" style={spacings.mbMd}>
            {t(
              'Deposits still being verified can be taken back, in full, to the account they came from. Pick one.'
            )}
          </Text>
          {renderList()}
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsRagequitSheet)
