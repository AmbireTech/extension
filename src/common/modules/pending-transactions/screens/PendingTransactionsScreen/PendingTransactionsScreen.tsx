import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import CONFIG from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useGasTank from '@common/hooks/useGasTank'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import useRequests from '@common/hooks/useRequests'
import FeeSelector from '@common/modules/pending-transactions/components/FeeSelector'
import SignActions from '@common/modules/pending-transactions/components/SignActions'
import SigningWithAccount from '@common/modules/pending-transactions/components/SigningWithAccount'
import TransactionSummary from '@common/modules/pending-transactions/components/TransactionSummary'
import useSendTransaction from '@common/modules/pending-transactions/hooks/useSendTransaction'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import isInt from '@common/utils/isInt'
import HardwareWalletSelectConnection from '@mobile/modules/hardware-wallet/components/HardwareWalletSelectConnection'
import { getUiType } from '@web/utils/uiType'

const relayerURL = CONFIG.RELAYER_URL

const PendingTransactionsScreen = ({
  isInBottomSheet,
  closeBottomSheet
}: {
  isInBottomSheet?: boolean
  closeBottomSheet?: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}) => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { setSendTxnState, sendTxnState, resolveMany, everythingToSign } = useRequests()
  const { account } = useAccounts()
  const { network } = useNetwork()
  const { currentAccGasTankState } = useGasTank()
  const preventNavToDashboard = useRef(false)
  const {
    ref: hardwareWalletSheetRef,
    open: hardwareWalletOpenBottomSheet,
    close: hardwareWalletCloseBottomSheet
  } = useModalize()
  const {
    ref: rejectTxnSheetRef,
    open: rejectTxnOpenBottomSheet,
    close: rejectTxnCloseBottomSheet
  } = useModalize()

  if (getUiType().isNotification) {
    navigation.navigate = () => null
    navigation.goBack = () => null
  }

  const {
    bundle,
    signingStatus,
    estimation,
    feeSpeed,
    rejectTxn,
    canProceed,
    replaceTx,
    mustReplaceNonce,
    setEstimation,
    setFeeSpeed,
    approveTxn,
    rejectTxnReplace,
    setSigningStatus,
    setReplaceTx
  } = useSendTransaction({
    hardwareWalletOpenBottomSheet
  })

  const prevBundle: any = usePrevious(bundle)

  useLayoutEffect(() => {
    if (!isInBottomSheet) {
      navigation?.setOptions({
        headerTitle: t('Pending Transactions: {{numTxns}}', { numTxns: bundle?.txns?.length }),
        withHeaderRight: true,
        hideHeaderLeft: true,
        onRightHeaderPress: rejectTxnOpenBottomSheet
      })
    }
  }, [navigation, bundle?.txns?.length, t, isInBottomSheet, rejectTxnOpenBottomSheet])

  useEffect(() => {
    return () => {
      if (sendTxnState.showing) {
        setSendTxnState({ showing: false })
      }
      if (everythingToSign.length) {
        resolveMany([everythingToSign[0].id], {
          message: t('Ambire user rejected the signature request')
        })
      }
    }
  }, [everythingToSign, resolveMany, sendTxnState.showing, setSendTxnState, t])

  useEffect(() => {
    if (prevBundle?.txns?.length && !bundle?.txns?.length) {
      if (isInBottomSheet) {
        if (sendTxnState.showing) {
          setSendTxnState({ showing: false })
        }
        if (everythingToSign.length) {
          resolveMany([everythingToSign[0].id], {
            message: t('Ambire user rejected the signature request')
          })
        }
        !!closeBottomSheet && closeBottomSheet()
      } else if (!preventNavToDashboard.current) {
        navigation.navigate(ROUTES.dashboard)
      } else {
        navigation.goBack()
      }
    }
  })

  if (!account || !bundle?.txns?.length)
    return (
      <GradientBackgroundWrapper>
        <Wrapper>
          <Text style={{ color: 'red' }}>
            {t('SendTransactions: No account or no requests: should never happen.')}
          </Text>
        </Wrapper>
      </GradientBackgroundWrapper>
    )

  const GradientWrapper = isInBottomSheet ? React.Fragment : GradientBackgroundWrapper

  return (
    <GradientWrapper>
      <Wrapper
        type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
        extraHeight={190}
        style={isInBottomSheet && spacings.ph0}
      >
        {isInBottomSheet && (
          <Title style={text.center}>
            {t('Pending Transactions: {{numTxns}}', { numTxns: bundle?.txns?.length })}
          </Title>
        )}
        <SigningWithAccount />
        <TransactionSummary bundle={bundle} estimation={estimation} />
        {!!canProceed && (
          <FeeSelector
            disabled={
              signingStatus && signingStatus.finalBundle && !(estimation && !estimation.success)
            }
            signer={bundle.signer}
            estimation={estimation}
            setEstimation={setEstimation}
            feeSpeed={feeSpeed}
            setFeeSpeed={setFeeSpeed}
            network={network}
            isGasTankEnabled={currentAccGasTankState.isEnabled && !!relayerURL}
          />
        )}
        {isInt(mustReplaceNonce) && (
          <>
            {(!!canProceed || canProceed === null) && (
              <Text style={[spacings.mbTy, spacings.phSm]} fontSize={12}>
                {t('This transaction will replace the current pending transaction.')}
              </Text>
            )}

            {canProceed === null && (
              <View style={flexboxStyles.alignCenter}>
                <Spinner />
              </View>
            )}

            {canProceed === false && (
              <View>
                <View>
                  <Text style={[spacings.mbSm, spacings.phSm]} fontSize={12}>
                    {t("The transaction you're trying to replace has already been confirmed.")}
                  </Text>
                </View>

                <Button type="danger" text={t('Close')} onPress={rejectTxnReplace} />
              </View>
            )}
          </>
        )}
        {!!canProceed && (
          // eslint-disable-next-line react/jsx-no-useless-fragment
          <>
            {!!bundle?.signer?.quickAccManager && !CONFIG.RELAYER_URL ? (
              <Text fontSize={16} appearance="danger">
                {t(
                  'Signing transactions with an email/password account without being connected to the relayer is unsupported.'
                )}
              </Text>
            ) : (
              <SignActions
                bundle={bundle}
                mustReplaceNonce={mustReplaceNonce}
                setSigningStatus={setSigningStatus}
                replaceTx={replaceTx}
                setReplaceTx={setReplaceTx}
                estimation={estimation}
                approveTxn={approveTxn}
                rejectTxn={rejectTxn}
                signingStatus={signingStatus}
                feeSpeed={feeSpeed}
                isGasTankEnabled={currentAccGasTankState.isEnabled && !!relayerURL}
                network={network}
              />
            )}
          </>
        )}
        <BottomSheet
          id="pending-transactions-hardware-wallet"
          sheetRef={hardwareWalletSheetRef}
          closeBottomSheet={() => {
            hardwareWalletCloseBottomSheet()
          }}
        >
          <HardwareWalletSelectConnection
            onSelectDevice={(device: any) => {
              approveTxn({ device })
              hardwareWalletCloseBottomSheet()
            }}
            shouldWrap={false}
          />
        </BottomSheet>
        <BottomSheet
          id="close-txn-bottom-sheet"
          sheetRef={rejectTxnSheetRef}
          closeBottomSheet={() => {
            rejectTxnCloseBottomSheet()
          }}
          cancelText={t('Reject')}
          cancelTextStyles={{
            textDecorationLine: 'underline',
            color: colors.pink
          }}
          cancelOnPress={() => {
            preventNavToDashboard.current = true
            rejectTxn()
          }}
        >
          <Text style={spacings.pv} fontSize={16} weight="regular">
            {t(
              'You can add more transactions to your cart and sign them all together (thus saving on network fees).'
            )}
          </Text>
          <Text fontSize={16} weight="regular" style={[spacings.pbTy, spacings.mbLg]}>
            {t('Alternatively, you can reject transaction.')}
          </Text>
          <Button text={t('Add to cart')} type="outline" onPress={() => navigation.goBack()} />
        </BottomSheet>
      </Wrapper>
    </GradientWrapper>
  )
}

export default PendingTransactionsScreen
